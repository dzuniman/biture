using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Quote2Cash.Domain.Entities;
using Quote2Cash.Persistence.Data;

namespace Quote2Cash.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class JobCardsController : ControllerBase
    {
        private readonly Quote2CashDbContext _context;

        public JobCardsController(Quote2CashDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetJobCards()
        {
            var jobCards = await _context.JobCards.AsNoTracking()
                .Include(j => j.Client)
                .Include(j => j.Costs)
                .ToListAsync();

            return Ok(jobCards.Select(j => new
            {
                j.Id,
                j.JobNumber,
                j.Description,
                j.Status,
                j.CreatedAt,
                j.StartDate,
                j.EndDate,
                j.TotalCost,
                CostCount = j.Costs.Count,
                CostTotal = j.Costs.Sum(c => c.Amount),
                Client = j.Client != null ? new { j.Client.Id, j.Client.Name } : null
            }));
        }

        [HttpPost]
        public async Task<ActionResult<JobCard>> CreateJobCard([FromBody] JobCard request)
        {
            request.Id = Guid.NewGuid();
            request.CreatedAt = DateTime.UtcNow;
            _context.JobCards.Add(request);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetJobCards), new { id = request.Id }, request);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateJobCard(Guid id, [FromBody] JobCard request)
        {
            var jobCard = await _context.JobCards.FindAsync(id);
            if (jobCard == null)
            {
                return NotFound();
            }

            jobCard.ClientId = request.ClientId;
            jobCard.JobNumber = request.JobNumber;
            jobCard.Description = request.Description;
            jobCard.Status = request.Status;
            jobCard.StartDate = request.StartDate;
            jobCard.EndDate = request.EndDate;
            jobCard.TotalCost = request.TotalCost;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteJobCard(Guid id)
        {
            var jobCard = await _context.JobCards.FindAsync(id);
            if (jobCard == null)
            {
                return NotFound();
            }

            _context.JobCards.Remove(jobCard);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
