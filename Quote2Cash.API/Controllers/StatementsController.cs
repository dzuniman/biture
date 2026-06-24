using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Quote2Cash.Domain.Entities;
using Quote2Cash.Persistence.Data;

namespace Quote2Cash.API.Controllers
{
    public record StatementItemDto(Guid InvoiceId, decimal PaymentAmount, string Description, DateTime PaymentDate);
    public record StatementRequestDto(string StatementNumber, Guid ClientId, StatementItemDto[] Items);

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
            var statements = await _context.Statements.AsNoTracking()
                .Include(s => s.Client)
                .Include(s => s.Items)
                    .ThenInclude(i => i.Invoice)
                .ToListAsync();

            return Ok(statements.Select(s => new
            {
                s.Id,
                s.StatementNumber,
                s.ClientId,
                s.CreatedAt,
                Client = s.Client != null ? new { 
                    s.Client.Id, 
                    s.Client.Name,
                    s.Client.AddressLine1,
                    s.Client.AddressLine2,
                    s.Client.AddressLine3,
                    s.Client.AddressLine4,
                    s.Client.VatNumber,
                    s.Client.Email,
                    s.Client.RepresentativeName,
                    s.Client.RepresentativeNumber,
                    s.Client.VendorNumber
                } : null,
                Items = s.Items.Select(item => new {
                    item.Id,
                    item.InvoiceId,
                    InvoiceNumber = item.Invoice?.InvoiceNumber ?? "N/A",
                    item.PaymentAmount,
                    item.Description,
                    item.PaymentDate
                })
            }));
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetStatement(Guid id)
        {
            var s = await _context.Statements.AsNoTracking()
                .Include(s => s.Client)
                .Include(s => s.Items).ThenInclude(i => i.Invoice)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (s == null) return NotFound();

            return Ok(new {
                s.Id,
                s.StatementNumber,
                s.ClientId,
                s.CreatedAt,
                Client = s.Client,
                Items = s.Items.Select(item => new {
                    item.Id,
                    item.InvoiceId,
                    InvoiceNumber = item.Invoice?.InvoiceNumber ?? "N/A",
                    item.PaymentAmount,
                    item.Description,
                    item.PaymentDate
                })
            });
        }

        [HttpGet("nextNumber")]
        public async Task<ActionResult<string>> GetNextStatementNumber()
        {
            var prefix = $"ST{DateTime.UtcNow:yyyyMM}";
            var lastStatement = await _context.Statements
                .Where(s => s.StatementNumber.StartsWith(prefix))
                .OrderByDescending(s => s.StatementNumber)
                .Select(s => s.StatementNumber)
                .FirstOrDefaultAsync();

            int nextSequence = 1;
            if (lastStatement != null && lastStatement.Length >= prefix.Length)
            {
                var seqStr = lastStatement.Substring(prefix.Length);
                if (int.TryParse(seqStr, out int lastSequence))
                {
                    nextSequence = lastSequence + 1;
                }
            }

            return Ok($"{prefix}{nextSequence:D4}");
        }

        [HttpPost]
        public async Task<ActionResult<Statement>> CreateStatement([FromBody] StatementRequestDto request)
        {
            try
            {
                var statement = new Statement
                {
                    Id = Guid.NewGuid(),
                    StatementNumber = request.StatementNumber,
                    ClientId = request.ClientId,
                    CreatedAt = DateTime.UtcNow,
                    Items = request.Items.Select(item => new StatementItem
                    {
                        Id = Guid.NewGuid(),
                        InvoiceId = item.InvoiceId,
                        PaymentAmount = item.PaymentAmount,
                        Description = item.Description,
                        PaymentDate = DateTime.SpecifyKind(item.PaymentDate, DateTimeKind.Utc)
                    }).ToList()
                };

                _context.Statements.Add(statement);
                await _context.SaveChangesAsync();
                return CreatedAtAction(nameof(GetStatement), new { id = statement.Id }, statement);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Failed to create statement: " + (ex.InnerException?.Message ?? ex.Message) });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateStatement(Guid id, [FromBody] StatementRequestDto request)
        {
            try
            {
                var existing = await _context.Statements.Include(s => s.Items).FirstOrDefaultAsync(s => s.Id == id);
                if (existing == null) return NotFound();

                existing.StatementNumber = request.StatementNumber;
                existing.ClientId = request.ClientId;

                var existingItems = existing.Items.ToList();
                if (existingItems.Any())
                {
                    _context.StatementItems.RemoveRange(existingItems);
                    await _context.SaveChangesAsync();
                }

                var newItems = request.Items.Select(item => new StatementItem
                {
                    Id = Guid.NewGuid(),
                    StatementId = id,
                    InvoiceId = item.InvoiceId,
                    PaymentAmount = item.PaymentAmount,
                    Description = item.Description,
                    PaymentDate = DateTime.SpecifyKind(item.PaymentDate, DateTimeKind.Utc)
                }).ToList();

                if (newItems.Any())
                {
                    _context.StatementItems.AddRange(newItems);
                    await _context.SaveChangesAsync();
                }
                else
                {
                    // Ensure any parent statement changes are saved if there were no items to process
                    await _context.SaveChangesAsync();
                }

                return NoContent();
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Failed to update statement: " + (ex.InnerException?.Message ?? ex.Message) });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteStatement(Guid id)
        {
            var statement = await _context.Statements.FindAsync(id);
            if (statement == null) return NotFound();
            _context.Statements.Remove(statement);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
