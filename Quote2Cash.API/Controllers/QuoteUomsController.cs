using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Quote2Cash.Domain.Entities;
using Quote2Cash.Persistence.Data;

namespace Quote2Cash.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class QuoteUomsController : ControllerBase
    {
        private readonly Quote2CashDbContext _context;

        public QuoteUomsController(Quote2CashDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<QuoteUom>>> GetQuoteUoms()
        {
            var uoms = await _context.QuoteUoms.AsNoTracking().OrderBy(u => u.Value).ToListAsync();
            return Ok(uoms);
        }

        [HttpPost]
        public async Task<ActionResult<QuoteUom>> CreateQuoteUom([FromBody] QuoteUom request)
        {
            if (string.IsNullOrWhiteSpace(request.Value))
            {
                return BadRequest(new { message = "Value is required." });
            }

            var normalized = request.Value.Trim();
            if (await _context.QuoteUoms.AnyAsync(u => u.Value == normalized))
            {
                return Conflict(new { message = "The UOM already exists." });
            }

            request.Id = Guid.NewGuid();
            request.Value = normalized;
            _context.QuoteUoms.Add(request);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetQuoteUoms), new { id = request.Id }, request);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateQuoteUom(Guid id, [FromBody] QuoteUom request)
        {
            var existing = await _context.QuoteUoms.FindAsync(id);
            if (existing == null)
            {
                return NotFound();
            }

            var normalized = request.Value.Trim();
            if (await _context.QuoteUoms.AnyAsync(u => u.Id != id && u.Value == normalized))
            {
                return Conflict(new { message = "Another UOM with this value already exists." });
            }

            existing.Value = normalized;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteQuoteUom(Guid id)
        {
            var existing = await _context.QuoteUoms.FindAsync(id);
            if (existing == null)
            {
                return NotFound();
            }

            _context.QuoteUoms.Remove(existing);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
