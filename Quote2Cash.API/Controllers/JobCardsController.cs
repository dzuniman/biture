using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Quote2Cash.Domain.Entities;
using Quote2Cash.Persistence.Data;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Quote2Cash.API.Controllers
{
    public record JobCardCreateDto(string QuoteNumber, string Reference, string Description, string? JobCardNumber = null);
    public record JobCardUpdateDto(string Reference, string Description, string? JobCardNumber = null);

    [ApiController]
    [Route("api/[controller]")]
    public class JobCardsController : ControllerBase
    {
        private readonly Quote2CashDbContext _context;

        public JobCardsController(Quote2CashDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetJobCards()
        {
            var jobCards = await _context.JobCards.AsNoTracking()
                .OrderByDescending(j => j.CreatedAt)
                .ToListAsync();

            var quoteNumbers = jobCards.Select(j => j.QuoteNumber).Distinct().ToList();
            var quotes = await _context.Quotes.AsNoTracking()
                .Include(q => q.Client)
                .Where(q => quoteNumbers.Contains(q.QuoteNumber))
                .ToDictionaryAsync(q => q.QuoteNumber, q => q);

            return Ok(jobCards.Select(j =>
            {
                quotes.TryGetValue(j.QuoteNumber, out var quote);
                return new
                {
                    j.Id,
                    j.JobCardNumber,
                    j.Reference,
                    j.QuoteNumber,
                    j.Description,
                    j.CreatedAt,
                    Client = quote?.Client != null ? new { quote.Client.Id, quote.Client.Name } : null
                };
            }));
        }

        [HttpGet("nextNumber")]
        public async Task<ActionResult<string>> GetNextJobCardNumber()
        {
            var prefix = $"JC{DateTime.UtcNow:yyyyMM}";
            var lastJobCard = await _context.JobCards
                .Where(j => j.JobCardNumber.StartsWith(prefix))
                .OrderByDescending(j => j.JobCardNumber)
                .Select(j => j.JobCardNumber)
                .FirstOrDefaultAsync();

            int nextSequence = 1;
            if (lastJobCard != null && lastJobCard.Length >= prefix.Length)
            {
                var seqStr = lastJobCard.Substring(prefix.Length);
                if (int.TryParse(seqStr, out int lastSequence))
                {
                    nextSequence = lastSequence + 1;
                }
            }

            return Ok($"{prefix}{nextSequence:D4}");
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetJobCard(Guid id)
        {
            var jobCard = await _context.JobCards.FindAsync(id);
            if (jobCard == null)
            {
                return NotFound();
            }

            var quote = await _context.Quotes.AsNoTracking()
                .Include(q => q.Client)
                .Include(q => q.Items)
                .FirstOrDefaultAsync(q => q.QuoteNumber == jobCard.QuoteNumber);

            return Ok(new
            {
                jobCard.Id,
                jobCard.JobCardNumber,
                jobCard.Reference,
                jobCard.QuoteNumber,
                jobCard.Description,
                jobCard.CreatedAt,
                Quote = quote != null ? new
                {
                    quote.Id,
                    quote.QuoteNumber,
                    quote.Reference,
                    quote.Date,
                    quote.ValidityDays,
                    quote.SubTotal,
                    quote.Vat,
                    quote.Total,
                    Client = quote.Client != null ? new
                    {
                        quote.Client.Id,
                        quote.Client.Name,
                        quote.Client.VendorNumber,
                        quote.Client.VatNumber,
                        quote.Client.Email,
                        quote.Client.AddressLine1,
                        quote.Client.AddressLine2,
                        quote.Client.AddressLine3,
                        quote.Client.AddressLine4,
                        quote.Client.RepresentativeName,
                        quote.Client.RepresentativeNumber
                    } : null,
                    Items = quote.Items.Select(item => new
                    {
                        item.Id,
                        item.ItemNumber,
                        item.Quantity,
                        item.Code,
                        item.Uom,
                        item.Description,
                        item.UnitPrice,
                        item.TotalPrice
                    }).ToList()
                } : null
            });
        }

        [HttpPost]
        public async Task<ActionResult<JobCard>> CreateJobCard([FromBody] JobCardCreateDto request)
        {
            string jobCardNumber;
            if (!string.IsNullOrWhiteSpace(request.JobCardNumber))
            {
                // Use the user-provided number (validate uniqueness)
                var exists = await _context.JobCards.AnyAsync(j => j.JobCardNumber == request.JobCardNumber);
                if (exists)
                    return Conflict($"A job card with number '{request.JobCardNumber}' already exists.");
                jobCardNumber = request.JobCardNumber.Trim();
            }
            else
            {
                // Auto-generate
                var prefix = $"JC{DateTime.UtcNow:yyyyMM}";
                var lastJobCard = await _context.JobCards
                    .Where(j => j.JobCardNumber.StartsWith(prefix))
                    .OrderByDescending(j => j.JobCardNumber)
                    .Select(j => j.JobCardNumber)
                    .FirstOrDefaultAsync();

                int nextSequence = 1;
                if (lastJobCard != null && lastJobCard.Length >= prefix.Length)
                {
                    var seqStr = lastJobCard.Substring(prefix.Length);
                    if (int.TryParse(seqStr, out int lastSequence))
                        nextSequence = lastSequence + 1;
                }
                jobCardNumber = $"{prefix}{nextSequence:D4}";
            }

            var jobCard = new JobCard
            {
                Id = Guid.NewGuid(),
                JobCardNumber = jobCardNumber,
                Reference = request.Reference,
                QuoteNumber = request.QuoteNumber,
                Description = request.Description,
                CreatedAt = DateTime.UtcNow
            };

            _context.JobCards.Add(jobCard);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetJobCard), new { id = jobCard.Id }, jobCard);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateJobCard(Guid id, [FromBody] JobCardUpdateDto request)
        {
            var jobCard = await _context.JobCards.FindAsync(id);
            if (jobCard == null)
            {
                return NotFound();
            }

            // Allow overriding JobCardNumber if provided
            if (!string.IsNullOrWhiteSpace(request.JobCardNumber) && request.JobCardNumber != jobCard.JobCardNumber)
            {
                var exists = await _context.JobCards.AnyAsync(j => j.JobCardNumber == request.JobCardNumber && j.Id != id);
                if (exists)
                    return Conflict($"A job card with number '{request.JobCardNumber}' already exists.");
                jobCard.JobCardNumber = request.JobCardNumber.Trim();
            }

            jobCard.Reference = request.Reference;
            jobCard.Description = request.Description;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteJobCard(Guid id)
        {
            var jobCard = await _context.JobCards.FindAsync(id);
            if (jobCard == null)
            {
                return NotFound();
            }

            _context.JobCards.Remove(jobCard);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
