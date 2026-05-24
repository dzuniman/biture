using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Quote2Cash.Domain.Entities;
using Quote2Cash.Persistence.Data;

namespace Quote2Cash.API.Controllers
{
    public record QuoteItemDto(int ItemNumber, decimal Quantity, string Uom, string Description, decimal UnitPrice, decimal TotalPrice);
    public record QuoteCreateDto(Guid? ClientId, int QuoteNumber, string Reference, DateTime Date, int ValidityDays, string VendorNumber, QuoteItemDto[] Items);

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
            var quotes = await _context.Quotes.AsNoTracking()
                .Include(q => q.Client)
                .Include(q => q.Items)
                .OrderByDescending(q => q.Date)
                .ToListAsync();

            return Ok(quotes.Select(q => new
            {
                q.Id,
                q.QuoteNumber,
                q.Reference,
                q.Date,
                q.ValidityDays,
                q.VendorNumber,
                q.ClientId,
                Client = q.Client != null ? new { q.Client.Id, q.Client.Name } : null,
                SubTotal = q.SubTotal,
                Vat = q.Vat,
                Total = q.Total,
                ItemCount = q.Items.Count
            }));
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetQuote(Guid id)
        {
            var quote = await _context.Quotes.AsNoTracking()
                .Include(q => q.Client)
                .Include(q => q.Items)
                .FirstOrDefaultAsync(q => q.Id == id);

            if (quote == null)
            {
                return NotFound();
            }

            return Ok(new
            {
                quote.Id,
                quote.QuoteNumber,
                quote.Reference,
                quote.Date,
                quote.ValidityDays,
                quote.VendorNumber,
                quote.ClientId,
                Client = quote.Client != null ? new { quote.Client.Id, quote.Client.Name, quote.Client.AddressLine1, quote.Client.AddressLine2, quote.Client.AddressLine3, quote.Client.AddressLine4, quote.Client.RepresentativeName, quote.Client.RepresentativeNumber } : null,
                Items = quote.Items.Select(item => new
                {
                    item.Id,
                    item.ItemNumber,
                    item.Quantity,
                    item.Uom,
                    item.Description,
                    item.UnitPrice,
                    item.TotalPrice
                }),
                quote.SubTotal,
                quote.Vat,
                quote.Total
            });
        }

        [HttpPost]
        public async Task<ActionResult<object>> CreateQuote([FromBody] QuoteCreateDto request)
        {
            var quoteDate = DateTime.SpecifyKind(request.Date, DateTimeKind.Utc);
            var quote = new Quote
            {
                Id = Guid.NewGuid(),
                ClientId = request.ClientId,
                QuoteNumber = request.QuoteNumber,
                Reference = request.Reference,
                Date = quoteDate,
                ValidityDays = request.ValidityDays,
                VendorNumber = request.VendorNumber,
                Items = request.Items.Select(item => new QuoteItem
                {
                    Id = Guid.NewGuid(),
                    ItemNumber = item.ItemNumber,
                    Quantity = item.Quantity,
                    Uom = item.Uom,
                    Description = item.Description,
                    UnitPrice = item.UnitPrice,
                    TotalPrice = item.TotalPrice
                }).ToList()
            };

            _context.Quotes.Add(quote);
            await _context.SaveChangesAsync();

            var result = new
            {
                quote.Id,
                quote.QuoteNumber,
                quote.Reference,
                quote.Date,
                quote.ValidityDays,
                quote.VendorNumber,
                quote.ClientId,
                Client = (object?)null,
                Items = quote.Items.Select(item => new
                {
                    item.Id,
                    item.ItemNumber,
                    item.Quantity,
                    item.Uom,
                    item.Description,
                    item.UnitPrice,
                    item.TotalPrice
                }).ToList(),
                quote.SubTotal,
                quote.Vat,
                quote.Total
            };

            return CreatedAtAction(nameof(GetQuote), new { id = quote.Id }, result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateQuote(Guid id, [FromBody] QuoteCreateDto request)
        {
            var quote = await _context.Quotes.Include(q => q.Items).FirstOrDefaultAsync(q => q.Id == id);
            if (quote == null)
            {
                return NotFound();
            }

            quote.ClientId = request.ClientId;
            quote.QuoteNumber = request.QuoteNumber;
            quote.Reference = request.Reference;
            quote.Date = DateTime.SpecifyKind(request.Date, DateTimeKind.Utc);
            quote.ValidityDays = request.ValidityDays;
            quote.VendorNumber = request.VendorNumber;

            // Remove existing items and persist before adding new ones to avoid concurrency issues
            var existingItems = quote.Items.ToList();
            if (existingItems.Any())
            {
                _context.QuoteItems.RemoveRange(existingItems);
                await _context.SaveChangesAsync();
            }

            var newItems = request.Items.Select(item => new QuoteItem
            {
                Id = Guid.NewGuid(),
                QuoteId = quote.Id,
                ItemNumber = item.ItemNumber,
                Quantity = item.Quantity,
                Uom = item.Uom,
                Description = item.Description,
                UnitPrice = item.UnitPrice,
                TotalPrice = item.TotalPrice
            }).ToList();

            if (newItems.Any())
            {
                _context.QuoteItems.AddRange(newItems);
                await _context.SaveChangesAsync();
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteQuote(Guid id)
        {
            var quote = await _context.Quotes.FindAsync(id);
            if (quote == null)
            {
                return NotFound();
            }

            _context.Quotes.Remove(quote);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
