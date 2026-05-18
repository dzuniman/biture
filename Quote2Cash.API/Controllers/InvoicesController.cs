using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Quote2Cash.Domain.Entities;
using Quote2Cash.Persistence.Data;

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
                Client = i.Client != null ? new { i.Client.Id, i.Client.Name } : null,
                Quote = i.Quote != null ? new { i.Quote.Id, i.Quote.Reference } : null
            }));
        }

        [HttpPost]
        public async Task<ActionResult<Invoice>> CreateInvoice([FromBody] Invoice request)
        {
            request.Id = Guid.NewGuid();
            request.CreatedAt = DateTime.UtcNow;
            _context.Invoices.Add(request);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetInvoices), new { id = request.Id }, request);
        }
    }
}
