using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Quote2Cash.Domain.Entities;
using Quote2Cash.Persistence.Data;

namespace Quote2Cash.API.Controllers
{
    public record InvoiceCreateDto(Guid QuoteId, string InvoiceNumber, string Description, string Status, DateTime Date);
    public record InvoiceUpdateDto(Guid QuoteId, string InvoiceNumber, string Description, string Status, DateTime Date);
    public record InvoiceStatusDto(string Status);

    [ApiController]
    [Route("api/[controller]")]
    public class InvoicesController : ControllerBase
    {
        private readonly Quote2CashDbContext _context;

        public InvoicesController(Quote2CashDbContext context)
        {
            _context = context;
        }

        [HttpGet("next-number")]
        public async Task<ActionResult<object>> GetNextInvoiceNumber()
        {
            var prefix = $"INV{DateTime.UtcNow:yyyyMM}";
            var latestInvoiceNumber = await _context.Invoices.AsNoTracking()
                .Where(i => i.InvoiceNumber.StartsWith(prefix))
                .OrderByDescending(i => i.InvoiceNumber)
                .Select(i => i.InvoiceNumber)
                .FirstOrDefaultAsync();

            var nextSequence = 0;
            if (!string.IsNullOrWhiteSpace(latestInvoiceNumber) && latestInvoiceNumber.Length >= prefix.Length + 4)
            {
                var suffix = latestInvoiceNumber[prefix.Length..];
                if (int.TryParse(suffix, out var lastSequence))
                {
                    nextSequence = lastSequence + 1;
                }
            }

            var nextInvoiceNumber = prefix + nextSequence.ToString("D4");
            return Ok(new { nextInvoiceNumber });
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetInvoices()
        {
            var invoices = await _context.Invoices.AsNoTracking()
                .Include(i => i.Client)
                .Include(i => i.Quote)
                .OrderByDescending(i => i.CreatedAt)
                .ToListAsync();

            return Ok(invoices.Select(i => new
            {
                i.Id,
                i.InvoiceNumber,
                i.Amount,
                i.Status,
                i.CreatedAt,
                i.DueDate,
                IsOverdue = i.Status != "Paid" && i.DueDate < DateTime.UtcNow,
                Description = i.Description,
                Client = i.Client != null ? new { i.Client.Id, i.Client.Name } : null,
                Quote = i.Quote != null ? new { i.Quote.Id, i.Quote.QuoteNumber, i.Quote.Reference } : null
            }));
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetInvoice(Guid id)
        {
            var invoice = await _context.Invoices.AsNoTracking()
                .Include(i => i.Client)
                .Include(i => i.Quote)
                    .ThenInclude(q => q.Items)
                .Include(i => i.Quote)
                    .ThenInclude(q => q.Client)
                .FirstOrDefaultAsync(i => i.Id == id);

            if (invoice == null)
            {
                return NotFound();
            }

            return Ok(new
            {
                invoice.Id,
                invoice.InvoiceNumber,
                invoice.Amount,
                invoice.Status,
                invoice.CreatedAt,
                invoice.DueDate,
                invoice.Description,
                IsOverdue = invoice.Status != "Paid" && invoice.DueDate < DateTime.UtcNow,
                Client = invoice.Client != null ? new
                {
                    invoice.Client.Id,
                    invoice.Client.Name,
                    invoice.Client.VendorNumber,
                    invoice.Client.AddressLine1,
                    invoice.Client.AddressLine2,
                    invoice.Client.AddressLine3,
                    invoice.Client.AddressLine4,
                    invoice.Client.RepresentativeName,
                    invoice.Client.RepresentativeNumber
                } : null,
                Quote = invoice.Quote != null ? new
                {
                    invoice.Quote.Id,
                    invoice.Quote.QuoteNumber,
                    invoice.Quote.Reference,
                    invoice.Quote.Date,
                    invoice.Quote.ValidityDays,
                    invoice.Quote.ClientId,
                    Client = invoice.Quote.Client != null ? new
                    {
                        invoice.Quote.Client.Id,
                        invoice.Quote.Client.Name,
                        invoice.Quote.Client.VendorNumber,
                        invoice.Quote.Client.AddressLine1,
                        invoice.Quote.Client.AddressLine2,
                        invoice.Quote.Client.AddressLine3,
                        invoice.Quote.Client.AddressLine4,
                        invoice.Quote.Client.RepresentativeName,
                        invoice.Quote.Client.RepresentativeNumber
                    } : null,
                    Items = invoice.Quote.Items.Select(item => new
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
                    invoice.Quote.SubTotal,
                    invoice.Quote.Vat,
                    invoice.Quote.Total
                } : null
            });
        }

        [HttpPost]
        public async Task<ActionResult<object>> CreateInvoice([FromBody] InvoiceCreateDto request)
        {
            var quote = await _context.Quotes.AsNoTracking().Include(q => q.Items).FirstOrDefaultAsync(q => q.Id == request.QuoteId);
            if (quote == null)
            {
                return BadRequest("Quote must be provided for an invoice.");
            }

            var amount = quote.Items.Sum(item => item.TotalPrice);
            var dueDate = request.Date.Date.AddDays(30);

            var invoiceNumber = string.IsNullOrWhiteSpace(request.InvoiceNumber)
                ? await GenerateNextInvoiceNumberAsync()
                : request.InvoiceNumber.Trim();

            var invoice = new Invoice
            {
                Id = Guid.NewGuid(),
                QuoteId = request.QuoteId,
                ClientId = quote.ClientId,
                InvoiceNumber = invoiceNumber,
                Description = request.Description,
                Amount = amount,
                Status = request.Status,
                CreatedAt = DateTime.SpecifyKind(request.Date, DateTimeKind.Utc),
                DueDate = DateTime.SpecifyKind(dueDate, DateTimeKind.Utc)
            };

            _context.Invoices.Add(invoice);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetInvoice), new { id = invoice.Id }, invoice);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateInvoice(Guid id, [FromBody] InvoiceUpdateDto request)
        {
            var invoice = await _context.Invoices.FindAsync(id);
            if (invoice == null)
            {
                return NotFound();
            }

            var quote = await _context.Quotes.AsNoTracking().Include(q => q.Items).FirstOrDefaultAsync(q => q.Id == request.QuoteId);
            if (quote == null)
            {
                return BadRequest("Quote must be provided for an invoice.");
            }

            invoice.ClientId = quote.ClientId;
            invoice.QuoteId = request.QuoteId;
            invoice.InvoiceNumber = request.InvoiceNumber;
            invoice.Description = request.Description;
            invoice.Amount = quote.Items.Sum(item => item.TotalPrice);
            invoice.Status = request.Status;
            invoice.CreatedAt = DateTime.SpecifyKind(request.Date, DateTimeKind.Utc);
            invoice.DueDate = DateTime.SpecifyKind(request.Date.AddDays(30), DateTimeKind.Utc);

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateInvoiceStatus(Guid id, [FromBody] InvoiceStatusDto request)
        {
            var invoice = await _context.Invoices.FindAsync(id);
            if (invoice == null)
            {
                return NotFound();
            }

            if (string.IsNullOrWhiteSpace(request.Status))
            {
                return BadRequest("Status is required.");
            }

            invoice.Status = request.Status;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteInvoice(Guid id)
        {
            var invoice = await _context.Invoices.FindAsync(id);
            if (invoice == null)
            {
                return NotFound();
            }

            _context.Invoices.Remove(invoice);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        private async Task<string> GenerateNextInvoiceNumberAsync()
        {
            var prefix = $"INV{DateTime.UtcNow:yyyyMM}";
            var latestInvoiceNumber = await _context.Invoices.AsNoTracking()
                .Where(i => i.InvoiceNumber.StartsWith(prefix))
                .OrderByDescending(i => i.InvoiceNumber)
                .Select(i => i.InvoiceNumber)
                .FirstOrDefaultAsync();

            var nextSequence = 0;
            if (!string.IsNullOrWhiteSpace(latestInvoiceNumber) && latestInvoiceNumber.Length >= prefix.Length + 4)
            {
                var suffix = latestInvoiceNumber[prefix.Length..];
                if (int.TryParse(suffix, out var lastSequence))
                {
                    nextSequence = lastSequence + 1;
                }
            }

            return prefix + nextSequence.ToString("D4");
        }
    }
}
