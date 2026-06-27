using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Quote2Cash.Domain.Entities;
using Quote2Cash.Persistence.Data;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Quote2Cash.API.Controllers
{
    public record CreditNoteCreateDto(Guid ClientId, string Description, decimal Amount, string? CreditNoteNumber = null);
    public record CreditNoteUpdateDto(string Description, decimal Amount, string? CreditNoteNumber = null);

    [ApiController]
    [Route("api/[controller]")]
    public class CreditNotesController : ControllerBase
    {
        private readonly Quote2CashDbContext _context;

        public CreditNotesController(Quote2CashDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetCreditNotes()
        {
            var creditNotes = await _context.CreditNotes.AsNoTracking()
                .Include(c => c.Client)
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();

            return Ok(creditNotes.Select(c => new
            {
                c.Id,
                c.ClientId,
                c.CreditNoteNumber,
                c.Description,
                c.Amount,
                c.CreatedAt,
                Client = c.Client != null ? new { c.Client.Id, c.Client.Name } : null
            }));
        }

        [HttpGet("nextNumber")]
        public async Task<ActionResult<string>> GetNextCreditNoteNumber()
        {
            var prefix = $"CRN{DateTime.UtcNow:yyyyMM}";
            var lastCreditNote = await _context.CreditNotes
                .Where(c => c.CreditNoteNumber.StartsWith(prefix))
                .OrderByDescending(c => c.CreditNoteNumber)
                .Select(c => c.CreditNoteNumber)
                .FirstOrDefaultAsync();

            int nextSequence = 1;
            if (lastCreditNote != null && lastCreditNote.Length >= prefix.Length)
            {
                var seqStr = lastCreditNote.Substring(prefix.Length);
                if (int.TryParse(seqStr, out int lastSequence))
                {
                    nextSequence = lastSequence + 1;
                }
            }

            return Ok($"{prefix}{nextSequence:D4}");
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetCreditNote(Guid id)
        {
            var creditNote = await _context.CreditNotes.AsNoTracking()
                .Include(c => c.Client)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (creditNote == null)
            {
                return NotFound();
            }

            return Ok(new
            {
                creditNote.Id,
                creditNote.ClientId,
                creditNote.CreditNoteNumber,
                creditNote.Description,
                creditNote.Amount,
                creditNote.CreatedAt,
                Client = creditNote.Client != null ? new
                {
                    creditNote.Client.Id,
                    creditNote.Client.Name,
                    creditNote.Client.VendorNumber,
                    creditNote.Client.VatNumber,
                    creditNote.Client.Email,
                    creditNote.Client.AddressLine1,
                    creditNote.Client.AddressLine2,
                    creditNote.Client.AddressLine3,
                    creditNote.Client.AddressLine4,
                    creditNote.Client.RepresentativeName,
                    creditNote.Client.RepresentativeNumber
                } : null
            });
        }

        [HttpPost]
        public async Task<ActionResult<CreditNote>> CreateCreditNote([FromBody] CreditNoteCreateDto request)
        {
            string creditNoteNumber;
            if (!string.IsNullOrWhiteSpace(request.CreditNoteNumber))
            {
                var exists = await _context.CreditNotes.AnyAsync(c => c.CreditNoteNumber == request.CreditNoteNumber);
                if (exists)
                    return Conflict($"A credit note with number '{request.CreditNoteNumber}' already exists.");
                creditNoteNumber = request.CreditNoteNumber.Trim();
            }
            else
            {
                var prefix = $"CRN{DateTime.UtcNow:yyyyMM}";
                var lastCreditNote = await _context.CreditNotes
                    .Where(c => c.CreditNoteNumber.StartsWith(prefix))
                    .OrderByDescending(c => c.CreditNoteNumber)
                    .Select(c => c.CreditNoteNumber)
                    .FirstOrDefaultAsync();

                int nextSequence = 1;
                if (lastCreditNote != null && lastCreditNote.Length >= prefix.Length)
                {
                    var seqStr = lastCreditNote.Substring(prefix.Length);
                    if (int.TryParse(seqStr, out int lastSequence))
                        nextSequence = lastSequence + 1;
                }
                creditNoteNumber = $"{prefix}{nextSequence:D4}";
            }

            var creditNote = new CreditNote
            {
                Id = Guid.NewGuid(),
                ClientId = request.ClientId,
                CreditNoteNumber = creditNoteNumber,
                Description = request.Description,
                Amount = request.Amount,
                CreatedAt = DateTime.UtcNow
            };

            _context.CreditNotes.Add(creditNote);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetCreditNote), new { id = creditNote.Id }, creditNote);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCreditNote(Guid id, [FromBody] CreditNoteUpdateDto request)
        {
            var creditNote = await _context.CreditNotes.FindAsync(id);
            if (creditNote == null)
            {
                return NotFound();
            }

            if (!string.IsNullOrWhiteSpace(request.CreditNoteNumber) && request.CreditNoteNumber != creditNote.CreditNoteNumber)
            {
                var exists = await _context.CreditNotes.AnyAsync(c => c.CreditNoteNumber == request.CreditNoteNumber && c.Id != id);
                if (exists)
                    return Conflict($"A credit note with number '{request.CreditNoteNumber}' already exists.");
                creditNote.CreditNoteNumber = request.CreditNoteNumber.Trim();
            }

            creditNote.Description = request.Description;
            creditNote.Amount = request.Amount;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCreditNote(Guid id)
        {
            var creditNote = await _context.CreditNotes.FindAsync(id);
            if (creditNote == null)
            {
                return NotFound();
            }

            _context.CreditNotes.Remove(creditNote);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
