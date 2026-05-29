using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Quote2Cash.Domain.Entities;
using Quote2Cash.Persistence.Data;

namespace Quote2Cash.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class QuoteDescriptionsController : ControllerBase
    {
        private readonly Quote2CashDbContext _context;

        public QuoteDescriptionsController(Quote2CashDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<QuoteDescription>>> GetQuoteDescriptions()
        {
            var descriptions = await _context.QuoteDescriptions.AsNoTracking().OrderBy(d => d.Value).ToListAsync();
            return Ok(descriptions);
        }

        [HttpPost]
        public async Task<ActionResult<QuoteDescription>> CreateQuoteDescription([FromBody] QuoteDescription request)
        {
            if (string.IsNullOrWhiteSpace(request.Value))
            {
                return BadRequest(new { message = "Value is required." });
            }

            var normalized = request.Value.Trim();
            if (await _context.QuoteDescriptions.AnyAsync(d => d.Value == normalized))
            {
                return Conflict(new { message = "The description already exists." });
            }

            request.Id = Guid.NewGuid();
            request.Value = normalized;
            _context.QuoteDescriptions.Add(request);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetQuoteDescriptions), new { id = request.Id }, request);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateQuoteDescription(Guid id, [FromBody] QuoteDescription request)
        {
            var existing = await _context.QuoteDescriptions.FindAsync(id);
            if (existing == null)
            {
                return NotFound();
            }

            var normalized = request.Value.Trim();
            if (await _context.QuoteDescriptions.AnyAsync(d => d.Id != id && d.Value == normalized))
            {
                return Conflict(new { message = "Another description with this value already exists." });
            }

            existing.Value = normalized;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteQuoteDescription(Guid id)
        {
            var existing = await _context.QuoteDescriptions.FindAsync(id);
            if (existing == null)
            {
                return NotFound();
            }

            _context.QuoteDescriptions.Remove(existing);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
