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
            var statements = await _context.Statements.AsNoTracking().Include(s => s.Client).ToListAsync();
            return Ok(statements.Select(s => new
            {
                s.Id,
                s.Period,
                s.Balance,
                s.Status,
                s.CreatedAt,
                Client = s.Client != null ? new { s.Client.Id, s.Client.Name } : null
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
