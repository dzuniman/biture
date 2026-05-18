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
        public async Task<ActionResult<IEnumerable<JobCard>>> GetJobCards()
        {
            var jobCards = await _context.JobCards.AsNoTracking().Include(j => j.Client).ToListAsync();
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
    }
}
