using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Quote2Cash.Domain.Entities;
using Quote2Cash.Persistence.Data;
using System.Linq;
using System.Collections.Generic;
using System.Threading.Tasks;
namespace Quote2Cash.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class InvoicesController : ControllerBase
    {
        private readonly Quote2CashDbContext _context;

        public InvoicesController(Quote2CashDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetInvoices()
        {
            var invoices = await _context.Invoices.AsNoTracking()
                .Include(i => i.Client)
                .Include(i => i.Quote)
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
                Client = i.Client != null ? new { i.Client.Id, i.Client.Name, i.Client.VendorNumber, i.Client.VatNumber, i.Client.Email } : null, // Include VatNumber and Email
                Quote = i.Quote != null ? new { i.Quote.Id, i.Quote.QuoteNumber, i.Quote.Reference } : null
            }));
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetInvoice(Guid id)
        {
            var invoice = await _context.Invoices
                .AsNoTracking()
                .Include(i => i.Client) // Include invoice client details
                .Include(i => i.Quote)
                    .ThenInclude(q => q.Client) // Include quote's client details
                .Include(i => i.Quote)
                    .ThenInclude(q => q.Items) // Include quote's items
                .FirstOrDefaultAsync(i => i.Id == id);
            if (invoice == null)
            {
                return NotFound();
            }

            List<object> quoteItemsResponse = new List<object>();
            object? quoteResponse = null;

            var quote = invoice.Quote;
            if (quote != null)
            {
                quoteItemsResponse = quote.Items?.Select(item => new
                {
                    item.Id,
                    item.ItemNumber,
                    item.Quantity,
                    item.Code,
                    item.Uom,
                    item.Description,
                    item.UnitPrice,
                    item.TotalPrice
                }).ToList<object>() ?? new List<object>();

                quoteResponse = new
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
                        quote.Client.AddressLine1,
                        quote.Client.AddressLine2,
                        quote.Client.AddressLine3,
                        quote.Client.AddressLine4,
                        quote.Client.RepresentativeName,
                        quote.Client.RepresentativeNumber,
                        quote.Client.VatNumber,
                        quote.Client.Email
                    } : null,
                    Items = quoteItemsResponse
                };
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
                Client = invoice.Client != null ? new { invoice.Client.Id, invoice.Client.Name, invoice.Client.VendorNumber, invoice.Client.VatNumber, invoice.Client.Email } : null, // Include VatNumber and Email
                Quote = quoteResponse
            });
        }

        [HttpPost]
        public async Task<ActionResult<Invoice>> CreateInvoice([FromBody] InvoiceCreateRequest request)
        {
            // Basic validation if needed
            if (request.QuoteId == Guid.Empty) return BadRequest("Quote is required.");
            var invoice = new Invoice
            {
                Id = Guid.NewGuid(),
                QuoteId = request.QuoteId,
                ClientId = request.ClientId, // Assuming this can be set directly or derived from quote
                InvoiceNumber = request.InvoiceNumber,
                Description = request.Description,
                Status = request.Status,
                CreatedAt = DateTime.UtcNow,
                DueDate = request.DueDate
            };

            if (request.Amount == 0 && request.QuoteId != Guid.Empty)
            {
                var quote = await _context.Quotes
                                .Include(q => q.Items)
                                .FirstOrDefaultAsync(q => q.Id == request.QuoteId);
                if (quote != null)
                {
                    var quoteTotal = quote.Items.Sum(item => item.TotalPrice);
                    invoice.Amount = quoteTotal;
                }
            }
            else
            {
                invoice.Amount = request.Amount;
            }

            _context.Invoices.Add(invoice);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetInvoice), new { id = invoice.Id }, invoice);
        }


        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateInvoice(Guid id, [FromBody] InvoiceCreateRequest request)
        {
            var invoice = await _context.Invoices.FindAsync(id);
            if (invoice == null)
            {
                return NotFound();
            }

            invoice.QuoteId = request.QuoteId;
            invoice.ClientId = request.ClientId;
            invoice.InvoiceNumber = request.InvoiceNumber;
            invoice.Description = request.Description;
            invoice.Status = request.Status;
            invoice.DueDate = request.DueDate;
            invoice.Amount = request.Amount;

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

        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateInvoiceStatus(Guid id, [FromBody] string status)
        {
            var invoice = await _context.Invoices.FindAsync(id);
            if (invoice == null)
            {
                return NotFound();
            }

            invoice.Status = status;
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }

    public class InvoiceCreateRequest
    {
        public Guid QuoteId { get; set; }
        public Guid? ClientId { get; set; }
        public string InvoiceNumber { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime DueDate { get; set; }
        public decimal Amount { get; set; }
    }
}
