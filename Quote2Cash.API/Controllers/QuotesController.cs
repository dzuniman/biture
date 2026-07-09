using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Quote2Cash.Domain.Entities;
using Quote2Cash.Persistence.Data;

namespace Quote2Cash.API.Controllers
{
    public record QuoteItemDto(int ItemNumber, decimal Quantity, string Code, string Uom, string Description, decimal UnitPrice, decimal TotalPrice);
    public record QuoteCreateDto(Guid? ClientId, string QuoteNumber, string Reference, DateTime Date, int ValidityDays, QuoteItemDto[] Items, string? PONumber, decimal Margin = 0);

    [ApiController]
    [Route("api/[controller]")]
    public class QuotesController : ControllerBase
    {
        private readonly Quote2CashDbContext _context;

        public QuotesController(Quote2CashDbContext context)
        {
            _context = context;
        }

        [HttpGet("next-number")]
        public async Task<ActionResult<object>> GetNextQuoteNumber()
        {
            var prefix = $"Q{DateTime.UtcNow:yyyyMM}";
            var latestQuoteNumber = await _context.Quotes.AsNoTracking()
                .Where(q => q.QuoteNumber.StartsWith(prefix))
                .OrderByDescending(q => q.QuoteNumber)
                .Select(q => q.QuoteNumber)
                .FirstOrDefaultAsync();

            var nextSequence = 0;
            if (!string.IsNullOrWhiteSpace(latestQuoteNumber) && latestQuoteNumber.Length >= prefix.Length + 4)
            {
                var suffix = latestQuoteNumber[prefix.Length..];
                if (int.TryParse(suffix, out var lastSequence))
                {
                    nextSequence = lastSequence + 1;
                }
            }

            var nextQuoteNumber = prefix + nextSequence.ToString("D4");
            return Ok(new { nextQuoteNumber });
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
                VendorNumber = q.Client?.VendorNumber ?? string.Empty,
                q.ClientId,
                q.PONumber,
                q.Margin,
                Client = q.Client != null ? new { q.Client.Id, q.Client.Name, q.Client.VatNumber } : null,
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
                VendorNumber = quote.Client?.VendorNumber ?? string.Empty,
                quote.ClientId,
                quote.PONumber,
                quote.Margin,
                Client = quote.Client != null ? new { quote.Client.Id, quote.Client.Name, quote.Client.AddressLine1, quote.Client.AddressLine2, quote.Client.AddressLine3, quote.Client.AddressLine4, quote.Client.RepresentativeName, quote.Client.RepresentativeNumber, quote.Client.VendorNumber, quote.Client.VatNumber } : null,
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
                }),
                quote.SubTotal,
                quote.Vat,
                quote.Total
            });
        }

        [HttpPost]
        public async Task<ActionResult<object>> CreateQuote([FromBody] QuoteCreateDto request)
        {
            await EnsureQuoteItemDimensionsAsync(request.Items);

            var quoteDate = DateTime.SpecifyKind(request.Date, DateTimeKind.Utc);
            var quote = new Quote
            {
                Id = Guid.NewGuid(),
                ClientId = request.ClientId,
                QuoteNumber = request.QuoteNumber,
                Reference = request.Reference,
                Date = quoteDate,
                ValidityDays = request.ValidityDays,
                PONumber = request.PONumber,
                Margin = request.Margin,
                Items = request.Items.Select(item => new QuoteItem
                {
                    Id = Guid.NewGuid(),
                    ItemNumber = item.ItemNumber,
                    Quantity = item.Quantity,
                    Code = item.Code,
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
                VendorNumber = quote.Client?.VendorNumber ?? string.Empty,
                quote.ClientId,
                quote.PONumber,
                quote.Margin,
                Client = (object?)null,
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

            await EnsureQuoteItemDimensionsAsync(request.Items);

            quote.ClientId = request.ClientId;
            quote.QuoteNumber = request.QuoteNumber;
            quote.Reference = request.Reference;
            quote.Date = DateTime.SpecifyKind(request.Date, DateTimeKind.Utc);
            quote.ValidityDays = request.ValidityDays;
            quote.PONumber = request.PONumber;
            quote.Margin = request.Margin;

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
                Code = item.Code,
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

        private async Task EnsureQuoteItemDimensionsAsync(IEnumerable<QuoteItemDto> items)
        {
            var itemCodes = items.Select(i => i.Code.Trim()).Where(v => !string.IsNullOrWhiteSpace(v)).Distinct(StringComparer.OrdinalIgnoreCase).ToArray();
            if (!itemCodes.Any())
            {
                return;
            }

            var existingDescriptions = await _context.QuoteDescriptions.AsNoTracking()
                .Where(d => itemCodes.Contains(d.Code))
                .Select(d => d.Code)
                .ToListAsync();

            var newCodes = itemCodes.Except(existingDescriptions, StringComparer.OrdinalIgnoreCase).ToArray();
            var newDescriptions = items
                .Where(i => newCodes.Contains(i.Code.Trim(), StringComparer.OrdinalIgnoreCase))
                .GroupBy(i => i.Code.Trim(), StringComparer.OrdinalIgnoreCase)
                .Select(group => group.First())
                .Select(item => new QuoteDescription
                {
                    Id = Guid.NewGuid(),
                    Code = item.Code.Trim(),
                    Uom = item.Uom.Trim(),
                    Description = item.Description.Trim()
                })
                .ToList();

            if (newDescriptions.Any())
            {
                _context.QuoteDescriptions.AddRange(newDescriptions);
                await _context.SaveChangesAsync();
            }
        }
    }
}
