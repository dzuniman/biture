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
    public record DeliveryNoteCreateDto(string QuoteNumber, string Reference, string Description, string? DeliveryNoteNumber = null);
    public record DeliveryNoteUpdateDto(string Reference, string Description, string? DeliveryNoteNumber = null);

    [ApiController]
    [Route("api/[controller]")]
    public class DeliveryNotesController : ControllerBase
    {
        private readonly Quote2CashDbContext _context;

        public DeliveryNotesController(Quote2CashDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetDeliveryNotes()
        {
            var deliveryNotes = await _context.DeliveryNotes.AsNoTracking()
                .OrderByDescending(d => d.CreatedAt)
                .ToListAsync();

            var quoteNumbers = deliveryNotes.Select(d => d.QuoteNumber).Distinct().ToList();
            var quotes = await _context.Quotes.AsNoTracking()
                .Include(q => q.Client)
                .Where(q => quoteNumbers.Contains(q.QuoteNumber))
                .ToDictionaryAsync(q => q.QuoteNumber, q => q);

            return Ok(deliveryNotes.Select(d =>
            {
                quotes.TryGetValue(d.QuoteNumber, out var quote);
                return new
                {
                    d.Id,
                    d.DeliveryNoteNumber,
                    d.Reference,
                    d.QuoteNumber,
                    d.Description,
                    d.CreatedAt,
                    Client = quote?.Client != null ? new { quote.Client.Id, quote.Client.Name } : null
                };
            }));
        }

        [HttpGet("nextNumber")]
        public async Task<ActionResult<string>> GetNextDeliveryNoteNumber()
        {
            var prefix = $"DN{DateTime.UtcNow:yyyyMM}";
            var lastDeliveryNote = await _context.DeliveryNotes
                .Where(d => d.DeliveryNoteNumber.StartsWith(prefix))
                .OrderByDescending(d => d.DeliveryNoteNumber)
                .Select(d => d.DeliveryNoteNumber)
                .FirstOrDefaultAsync();

            int nextSequence = 1;
            if (lastDeliveryNote != null && lastDeliveryNote.Length >= prefix.Length)
            {
                var seqStr = lastDeliveryNote.Substring(prefix.Length);
                if (int.TryParse(seqStr, out int lastSequence))
                {
                    nextSequence = lastSequence + 1;
                }
            }

            return Ok($"{prefix}{nextSequence:D4}");
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetDeliveryNote(Guid id)
        {
            var deliveryNote = await _context.DeliveryNotes.FindAsync(id);
            if (deliveryNote == null)
            {
                return NotFound();
            }

            var quote = await _context.Quotes.AsNoTracking()
                .Include(q => q.Client)
                .Include(q => q.Items)
                .FirstOrDefaultAsync(q => q.QuoteNumber == deliveryNote.QuoteNumber);

            return Ok(new
            {
                deliveryNote.Id,
                deliveryNote.DeliveryNoteNumber,
                deliveryNote.Reference,
                deliveryNote.QuoteNumber,
                deliveryNote.Description,
                deliveryNote.CreatedAt,
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
                    quote.PONumber,
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
        public async Task<ActionResult<DeliveryNote>> CreateDeliveryNote([FromBody] DeliveryNoteCreateDto request)
        {
            string deliveryNoteNumber;
            if (!string.IsNullOrWhiteSpace(request.DeliveryNoteNumber))
            {
                var exists = await _context.DeliveryNotes.AnyAsync(d => d.DeliveryNoteNumber == request.DeliveryNoteNumber);
                if (exists)
                    return Conflict($"A delivery note with number '{request.DeliveryNoteNumber}' already exists.");
                deliveryNoteNumber = request.DeliveryNoteNumber.Trim();
            }
            else
            {
                var prefix = $"DN{DateTime.UtcNow:yyyyMM}";
                var lastDeliveryNote = await _context.DeliveryNotes
                    .Where(d => d.DeliveryNoteNumber.StartsWith(prefix))
                    .OrderByDescending(d => d.DeliveryNoteNumber)
                    .Select(d => d.DeliveryNoteNumber)
                    .FirstOrDefaultAsync();

                int nextSequence = 1;
                if (lastDeliveryNote != null && lastDeliveryNote.Length >= prefix.Length)
                {
                    var seqStr = lastDeliveryNote.Substring(prefix.Length);
                    if (int.TryParse(seqStr, out int lastSequence))
                        nextSequence = lastSequence + 1;
                }
                deliveryNoteNumber = $"{prefix}{nextSequence:D4}";
            }

            var deliveryNote = new DeliveryNote
            {
                Id = Guid.NewGuid(),
                DeliveryNoteNumber = deliveryNoteNumber,
                Reference = request.Reference,
                QuoteNumber = request.QuoteNumber,
                Description = request.Description,
                CreatedAt = DateTime.UtcNow
            };

            _context.DeliveryNotes.Add(deliveryNote);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetDeliveryNote), new { id = deliveryNote.Id }, deliveryNote);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateDeliveryNote(Guid id, [FromBody] DeliveryNoteUpdateDto request)
        {
            var deliveryNote = await _context.DeliveryNotes.FindAsync(id);
            if (deliveryNote == null)
            {
                return NotFound();
            }

            if (!string.IsNullOrWhiteSpace(request.DeliveryNoteNumber) && request.DeliveryNoteNumber != deliveryNote.DeliveryNoteNumber)
            {
                var exists = await _context.DeliveryNotes.AnyAsync(d => d.DeliveryNoteNumber == request.DeliveryNoteNumber && d.Id != id);
                if (exists)
                    return Conflict($"A delivery note with number '{request.DeliveryNoteNumber}' already exists.");
                deliveryNote.DeliveryNoteNumber = request.DeliveryNoteNumber.Trim();
            }

            deliveryNote.Reference = request.Reference;
            deliveryNote.Description = request.Description;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDeliveryNote(Guid id)
        {
            var deliveryNote = await _context.DeliveryNotes.FindAsync(id);
            if (deliveryNote == null)
            {
                return NotFound();
            }

            _context.DeliveryNotes.Remove(deliveryNote);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
