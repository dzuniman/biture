using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Quote2Cash.Domain.Entities;
using Quote2Cash.Persistence.Data;
using System.Linq; // Required for Select and ToList

namespace Quote2Cash.API.Controllers
{
    // DTOs for better Swagger documentation and reliable serialization
    public record NextNumberResponse(string NextInvoiceNumber);
    public record InvoiceStatusUpdate(string Status);

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
                .Include(i => i.Quote).ThenInclude(q => q.Items) // Include Quote and Items for total calculation
                .ToListAsync();

            return Ok(invoices.Select(i => new
            {
                i.Id,
                i.InvoiceNumber,
                Amount = i.Quote != null ? (i.Quote.SubTotal + i.Quote.Vat) : i.Amount, // Calculate dynamic total from Quote components
                i.Status,
                i.CreatedAt,
                i.DueDate,
                IsOverdue = i.Status != "Paid" && i.DueDate < DateTime.UtcNow,
                Client = i.Client != null ? new { 
                    i.Client.Id, 
                    i.Client.Name,
                    i.Client.VendorNumber,
                    i.Client.VatNumber,
                    i.Client.Email,
                    i.Client.AddressLine1,
                    i.Client.AddressLine2,
                    i.Client.AddressLine3,
                    i.Client.AddressLine4,
                    i.Client.RepresentativeName,
                    i.Client.RepresentativeNumber
                } : null,
                Quote = i.Quote != null ? new { i.Quote.Id, i.Quote.QuoteNumber, i.Quote.Reference } : null // Ensure QuoteNumber is included here
            }));
        }

        [HttpGet("next-number")]
        public async Task<ActionResult<NextNumberResponse>> GetNextInvoiceNumber([FromQuery] string? prefix)
        {
            if (string.IsNullOrEmpty(prefix))
            {
                return BadRequest(new { message = "Prefix is required." });
            }

            // Fetch existing invoice numbers starting with the prefix to find gaps or the next sequence
            var existingNumbers = await _context.Invoices
                .AsNoTracking()
                .Where(i => i.InvoiceNumber.StartsWith(prefix))
                .Select(i => i.InvoiceNumber)
                .ToListAsync();

            var suffixes = existingNumbers
                .Select(n => n.Length > prefix.Length ? n.Substring(prefix.Length) : "")
                .Select(s => int.TryParse(s, out int val) ? (int?)val : null)
                .Where(v => v.HasValue)
                .Select(v => v!.Value)
                .ToHashSet();

            int nextSuffix = 0;
            while (suffixes.Contains(nextSuffix)) nextSuffix++;

            return Ok(new NextNumberResponse($"{prefix}{nextSuffix:D4}"));
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

            // Define the structure for quote items explicitly to satisfy the compiler
            // Use anonymous types and then cast to List<object>
            var quoteItemsResponse = invoice.Quote?.Items?.Select(item => new
            {
                item.Id,
                item.ItemNumber,
                item.Quantity,
                item.Code,
                item.Uom,
                item.Description,
                item.UnitPrice,
                item.TotalPrice
            }).ToList<object>() ?? new List<object>(); // Provide a default empty list if null

            // Construct the response object, ensuring all nested objects are correctly formed
            var quoteResponse = invoice.Quote != null ? new
            {
                invoice.Quote.Id,
                invoice.Quote.QuoteNumber,
                invoice.Quote.Reference,
                invoice.Quote.Date,
                invoice.Quote.ValidityDays,
                invoice.Quote.SubTotal,
                invoice.Quote.Vat,
                invoice.Quote.Total,
                Client = invoice.Quote.Client != null ? new
                {
                    invoice.Quote.Client.Id,
                    invoice.Quote.Client.Name,
                    invoice.Quote.Client.VendorNumber,
                    invoice.Quote.Client.VatNumber,
                    invoice.Quote.Client.Email,
                    invoice.Quote.Client.AddressLine1,
                    invoice.Quote.Client.AddressLine2,
                    invoice.Quote.Client.AddressLine3,
                    invoice.Quote.Client.AddressLine4,
                    invoice.Quote.Client.RepresentativeName,
                    invoice.Quote.Client.RepresentativeNumber
                } : null,
                Items = quoteItemsResponse // Use the correctly typed list
            } : null;

            return Ok(new
            {
                invoice.Id,
                invoice.InvoiceNumber,
                Amount = invoice.Quote != null ? (invoice.Quote.SubTotal + invoice.Quote.Vat) : invoice.Amount, // Dynamic total from quote items
                invoice.Status,
                invoice.CreatedAt,
                invoice.DueDate,
                invoice.Description,
                IsOverdue = invoice.Status != "Paid" && invoice.DueDate < DateTime.UtcNow,
                Client = invoice.Client != null ? new { 
                    invoice.Client.Id, 
                    invoice.Client.Name, 
                    invoice.Client.VendorNumber,
                    invoice.Client.VatNumber,
                    invoice.Client.Email,
                    invoice.Client.AddressLine1,
                    invoice.Client.AddressLine2,
                    invoice.Client.AddressLine3,
                    invoice.Client.AddressLine4,
                    invoice.Client.RepresentativeName,
                    invoice.Client.RepresentativeNumber
                } : null,
                Quote = quoteResponse
            });
        }

        [HttpPost]
        public async Task<ActionResult<Invoice>> CreateInvoice([FromBody] Invoice request)
        {
            request.Id = Guid.NewGuid();
            request.CreatedAt = DateTime.UtcNow;
            _context.Invoices.Add(request);
            await _context.SaveChangesAsync();
            // Return the created invoice details
            return CreatedAtAction(nameof(GetInvoice), new { id = request.Id }, request);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateInvoice(Guid id, [FromBody] Invoice request)
        {
            var invoice = await _context.Invoices.FindAsync(id);
            if (invoice == null)
            {
                return NotFound();
            }

            invoice.ClientId = request.ClientId;
            invoice.QuoteId = request.QuoteId;
            invoice.InvoiceNumber = request.InvoiceNumber;
            invoice.Amount = request.Amount;
            invoice.Status = request.Status;
            invoice.DueDate = request.DueDate;
            // Consider adding Description if it's part of the updateable fields

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
        public async Task<IActionResult> UpdateInvoiceStatus(Guid id, [FromBody] InvoiceStatusUpdate request)
        {
            var invoice = await _context.Invoices.FindAsync(id);
            if (invoice == null)
            {
                return NotFound();
            }

            invoice.Status = request.Status;
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}