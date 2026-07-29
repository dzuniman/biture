using Microsoft.AspNetCore.Mvc;
using Quote2Cash.Domain.Entities;
using Quote2Cash.Persistence.Data;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;

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
            return await _context.QuoteDescriptions.ToListAsync();
        }
    }
}
