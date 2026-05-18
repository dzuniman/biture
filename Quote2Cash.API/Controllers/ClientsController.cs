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
            var clients = await _context.Clients.AsNoTracking().ToListAsync();
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
    }
}
