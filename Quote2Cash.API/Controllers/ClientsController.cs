using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Quote2Cash.Domain.Entities;
using Quote2Cash.Persistence.Data;

namespace Quote2Cash.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ClientsController : ControllerBase
    {
        private readonly Quote2CashDbContext _context;

        public ClientsController(Quote2CashDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Client>>> GetClients()
        {
            var clients = await _context.Clients.AsNoTracking().OrderBy(c => c.Name).ToListAsync();
            return Ok(clients);
        }

        [HttpPost]
        public async Task<ActionResult<Client>> CreateClient([FromBody] Client request)
        {
            request.Id = Guid.NewGuid();
            _context.Clients.Add(request);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetClients), new { id = request.Id }, request);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateClient(Guid id, [FromBody] Client request)
        {
            var client = await _context.Clients.FindAsync(id);
            if (client == null)
            {
                return NotFound();
            }

            client.Name = request.Name;
            client.AddressLine1 = request.AddressLine1;
            client.AddressLine2 = request.AddressLine2;
            client.AddressLine3 = request.AddressLine3;
            client.AddressLine4 = request.AddressLine4;
            client.RepresentativeName = request.RepresentativeName;
            client.RepresentativeNumber = request.RepresentativeNumber;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteClient(Guid id)
        {
            var client = await _context.Clients.FindAsync(id);
            if (client == null)
            {
                return NotFound();
            }

            _context.Clients.Remove(client);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
