using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Quote2Cash.Domain.Entities;
using Quote2Cash.Persistence.Data;

namespace Quote2Cash.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CostsController : ControllerBase
    {
        private readonly Quote2CashDbContext _context;

        public CostsController(Quote2CashDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetCosts()
        {
            var costs = await _context.Costs.AsNoTracking()
                .Include(c => c.Client)
                .Include(c => c.JobCard)
                .ToListAsync();

            return Ok(costs.Select(c => new
            {
                c.Id,
                c.Category,
                c.Description,
                c.Amount,
                c.Status,
                c.IncurredAt,
                Client = c.Client != null ? new { c.Client.Id, c.Client.Name } : null,
                JobCard = c.JobCard != null ? new { c.JobCard.Id, JobNumber = c.JobCard.JobCardNumber } : null
            }));
        }

        [HttpPost]
        public async Task<ActionResult<Cost>> CreateCost([FromBody] Cost request)
        {
            request.Id = Guid.NewGuid();
            request.IncurredAt = request.IncurredAt == default ? DateTime.UtcNow : request.IncurredAt;
            _context.Costs.Add(request);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetCosts), new { id = request.Id }, request);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCost(Guid id, [FromBody] Cost request)
        {
            var cost = await _context.Costs.FindAsync(id);
            if (cost == null)
            {
                return NotFound();
            }

            cost.ClientId = request.ClientId;
            cost.JobCardId = request.JobCardId;
            cost.Category = request.Category;
            cost.Description = request.Description;
            cost.Amount = request.Amount;
            cost.Status = request.Status;
            cost.IncurredAt = request.IncurredAt == default ? DateTime.UtcNow : request.IncurredAt;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCost(Guid id)
        {
            var cost = await _context.Costs.FindAsync(id);
            if (cost == null)
            {
                return NotFound();
            }

            _context.Costs.Remove(cost);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
