using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Quote2Cash.Domain.Entities;
using Quote2Cash.Persistence.Data;

namespace Quote2Cash.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StatementsController : ControllerBase
    {
        private readonly Quote2CashDbContext _context;

        public StatementsController(Quote2CashDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetStatements()
        {
            var invoiceSummaries = await _context.Invoices.AsNoTracking()
                .Where(i => i.ClientId != null)
                .GroupBy(i => i.ClientId)
                .Select(g => new
                {
                    ClientId = g.Key!.Value,
                    Total = g.Sum(i => i.Amount),
                    Unpaid = g.Where(i => i.Status != "Paid").Sum(i => i.Amount)
                })
                .ToListAsync();

            var invoiceLookup = invoiceSummaries.ToDictionary(x => x.ClientId, x => x);
            var statements = await _context.Statements.AsNoTracking().Include(s => s.Client).ToListAsync();

            return Ok(statements.Select(s =>
            {
                if (s.ClientId.HasValue && invoiceLookup.TryGetValue(s.ClientId.Value, out var summary))
                {
                    return new
                    {
                        s.Id,
                        s.Period,
                        s.Balance,
                        s.Status,
                        s.CreatedAt,
                        InvoiceTotal = summary.Total,
                        UnpaidAmount = summary.Unpaid,
                        Client = s.Client != null ? new { s.Client.Id, s.Client.Name } : null
                    };
                }

                return new
                {
                    s.Id,
                    s.Period,
                    s.Balance,
                    s.Status,
                    s.CreatedAt,
                    InvoiceTotal = 0m,
                    UnpaidAmount = 0m,
                    Client = s.Client != null ? new { s.Client.Id, s.Client.Name } : null
                };
            }));
        }

        [HttpPost]
        public async Task<ActionResult<Statement>> CreateStatement([FromBody] Statement request)
        {
            request.Id = Guid.NewGuid();
            request.CreatedAt = DateTime.UtcNow;
            _context.Statements.Add(request);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetStatements), new { id = request.Id }, request);
        }
    }
}
