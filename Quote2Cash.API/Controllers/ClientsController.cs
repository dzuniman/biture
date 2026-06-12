using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Quote2Cash.Domain.Entities;
using Quote2Cash.Persistence.Data;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

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
        public async Task<ActionResult<IEnumerable<object>>> GetClients()
        {
            var clients = await _context.Clients.AsNoTracking()
                .Include(c => c.Quotes) // Include if needed for other functionalities
                .Include(c => c.Invoices) // Include if needed
                .ToListAsync();
            return Ok(clients.Select(c => new
            {
                c.Id,
                c.Name,
                c.VendorNumber,
                c.AddressLine1,
                c.AddressLine2,
                c.AddressLine3,
                c.AddressLine4,
                c.RepresentativeName,
                c.RepresentativeNumber,
                // Include new properties
                c.VatNumber,
                c.Email
            }));
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetClient(Guid id)
        {
            var client = await _context.Clients
                .AsNoTracking()
                .Include(c => c.Quotes) // Include if needed
                .Include(c => c.Invoices) // Include if needed
                .FirstOrDefaultAsync(c => c.Id == id);
            if (client == null)
            {
                return NotFound();
            }

            return Ok(new
            {
                client.Id,
                client.Name,
                client.VendorNumber,
                client.AddressLine1,
                client.AddressLine2,
                client.AddressLine3,
                client.AddressLine4,
                client.RepresentativeName,
                client.RepresentativeNumber,
                // Include new properties
                client.VatNumber,
                client.Email
            });
        }

        [HttpPost]
        public async Task<ActionResult<Client>> CreateClient([FromBody] ClientCreateRequest request)
        {
            var client = new Client
            {
                Id = Guid.NewGuid(),
                Name = request.Name,
                VendorNumber = request.VendorNumber,
                AddressLine1 = request.AddressLine1,
                AddressLine2 = request.AddressLine2,
                AddressLine3 = request.AddressLine3,
                AddressLine4 = request.AddressLine4,
                RepresentativeName = request.RepresentativeName,
                RepresentativeNumber = request.RepresentativeNumber,
                // Assign new properties
                VatNumber = request.VatNumber,
                Email = request.Email,
                CreatedAt = DateTime.UtcNow
            };

            _context.Clients.Add(client);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetClient), new { id = client.Id }, new
            {
                client.Id,
                client.Name,
                client.VendorNumber,
                client.AddressLine1,
                client.AddressLine2,
                client.AddressLine3,
                client.AddressLine4,
                client.RepresentativeName,
                client.RepresentativeNumber,
                client.VatNumber, // Include new properties
                client.Email      // Include new properties
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateClient(Guid id, [FromBody] ClientCreateRequest request)
        {
            var client = await _context.Clients.FindAsync(id);
            if (client == null)
            {
                return NotFound();
            }

            client.Name = request.Name;
            client.VendorNumber = request.VendorNumber;
            client.AddressLine1 = request.AddressLine1;
            client.AddressLine2 = request.AddressLine2;
            client.AddressLine3 = request.AddressLine3;
            client.AddressLine4 = request.AddressLine4;
            client.RepresentativeName = request.RepresentativeName;
            client.RepresentativeNumber = request.RepresentativeNumber;
            // Update new properties
            client.VatNumber = request.VatNumber;
            client.Email = request.Email;
            client.UpdatedAt = DateTime.UtcNow;

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

    public class ClientCreateRequest
    {
        public string Name { get; set; } = string.Empty;
        public string? VendorNumber { get; set; }
        public string? AddressLine1 { get; set; }
        public string? AddressLine2 { get; set; }
        public string? AddressLine3 { get; set; }
        public string? AddressLine4 { get; set; }
        public string? RepresentativeName { get; set; }
        public string? RepresentativeNumber { get; set; }
        public string? VatNumber { get; set; }
        public string? Email { get; set; }
    }
}
