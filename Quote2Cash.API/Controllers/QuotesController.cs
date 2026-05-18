using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Quote2Cash.Domain.Entities;
using Quote2Cash.Persistence.Data;

namespace Quote2Cash.API.Controllers
{
    public record QuoteCreateDto(Guid? ClientId, string Reference, string CustomerName, string Description, decimal Amount, string Status, DateTime? DueDate);

    [ApiController]
    [Route("api/[controller]")]
    public class QuotesController : ControllerBase
    {
        private readonly Quote2CashDbContext _context;

        public QuotesController(Quote2CashDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetQuotes()
        {
            var invoiceSummaries = await _context.Invoices.AsNoTracking()
                .Where(i => i.QuoteId != null)
                .GroupBy(i => i.QuoteId)
                .Select(g => new
                {
                    QuoteId = g.Key!.Value,
                    Count = g.Count(),
                    Total = g.Sum(i => i.Amount)
                })
                .ToListAsync();

            var invoiceLookup = invoiceSummaries.ToDictionary(x => x.QuoteId, x => x);
            var quotes = await _context.Quotes.AsNoTracking().Include(q => q.Client).OrderByDescending(q => q.CreatedAt).ToListAsync();

            return Ok(quotes.Select(q =>
            {
                invoiceLookup.TryGetValue(q.Id, out var summary);
                return new
                {
                    q.Id,
                    q.Reference,
                    q.CustomerName,
                    q.Description,
                    q.Amount,
                    q.Status,
                    q.CreatedAt,
                    q.DueDate,
                    InvoiceCount = summary?.Count ?? 0,
                    InvoiceTotal = summary?.Total ?? 0m,
                    Client = q.Client != null ? new { q.Client.Id, q.Client.Name } : null
                };
            }));
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetQuote(Guid id)
        {
            var quote = await _context.Quotes.AsNoTracking().Include(q => q.Client).FirstOrDefaultAsync(q => q.Id == id);
            if (quote == null)
            {
                return NotFound();
            }

            return Ok(new
            {
                quote.Id,
                quote.Reference,
                quote.CustomerName,
                quote.Description,
                quote.Amount,
                quote.Status,
                quote.CreatedAt,
                quote.DueDate,
                Client = quote.Client != null ? new { quote.Client.Id, quote.Client.Name } : null
            });
        }

        [HttpPost]
        public async Task<ActionResult<Quote>> CreateQuote([FromBody] QuoteCreateDto request)
        {
            var quote = new Quote
            {
                Id = Guid.NewGuid(),
                ClientId = request.ClientId,
                Reference = request.Reference,
                CustomerName = request.CustomerName,
                Description = request.Description,
                Amount = request.Amount,
                Status = request.Status,
                CreatedAt = DateTime.UtcNow,
                DueDate = request.DueDate
            };

            _context.Quotes.Add(quote);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetQuote), new { id = quote.Id }, quote);
        }
    }
}
