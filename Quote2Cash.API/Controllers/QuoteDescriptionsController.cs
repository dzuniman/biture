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
            var descriptions = await _context.QuoteDescriptions.AsNoTracking().OrderBy(d => d.Code).ToListAsync();
            return Ok(descriptions);
        }

        [HttpPost]
        public async Task<ActionResult<QuoteDescription>> CreateQuoteDescription([FromBody] QuoteDescription request)
        {
            if (string.IsNullOrWhiteSpace(request.Code))
            {
                return BadRequest(new { message = "Code is required." });
            }
            if (string.IsNullOrWhiteSpace(request.Uom))
            {
                return BadRequest(new { message = "UOM is required." });
            }
            if (string.IsNullOrWhiteSpace(request.Description))
            {
                return BadRequest(new { message = "Description is required." });
            }

            var code = request.Code.Trim();
            if (await _context.QuoteDescriptions.AnyAsync(d => d.Code == code))
            {
                return Conflict(new { message = "The code already exists." });
            }

            request.Id = Guid.NewGuid();
            request.Code = code;
            request.Uom = request.Uom.Trim();
            request.Description = request.Description.Trim();
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

            if (string.IsNullOrWhiteSpace(request.Code))
            {
                return BadRequest(new { message = "Code is required." });
            }
            if (string.IsNullOrWhiteSpace(request.Uom))
            {
                return BadRequest(new { message = "UOM is required." });
            }
            if (string.IsNullOrWhiteSpace(request.Description))
            {
                return BadRequest(new { message = "Description is required." });
            }

            var code = request.Code.Trim();
            if (await _context.QuoteDescriptions.AnyAsync(d => d.Id != id && d.Code == code))
            {
                return Conflict(new { message = "Another code with this value already exists." });
            }

            existing.Code = code;
            existing.Uom = request.Uom.Trim();
            existing.Description = request.Description.Trim();
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
