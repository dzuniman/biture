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
    [ApiController]
    [Route("api/[controller]")]
    public class CostsController : ControllerBase
    {
        private readonly Quote2CashDbContext _context;

        public CostsController(Quote2CashDbContext context)
        {
            _context = context;
        }

        // GET: api/costs
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetCosts()
        {
            var costs = await _context.Costs.AsNoTracking()
                .Include(c => c.Items)
                .OrderByDescending(c => c.Date)
                .ToListAsync();

            return Ok(costs.Select(c => new
            {
                c.Id,
                c.Description,
                c.Margin,
                c.Date,
                ItemCount = c.Items.Count,
                TotalQuoteAmount = c.Items.Sum(i => i.UnitPrice * i.Quantity)
            }));
        }

        // GET: api/costs/{id}
        [HttpGet("{id}")]
        public async Task<ActionResult<Cost>> GetCost(Guid id)
        {
            var cost = await _context.Costs
                .Include(c => c.Items)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (cost == null)
            {
                return NotFound();
            }

            // Ensure items are ordered by ItemNumber
            cost.Items = cost.Items.OrderBy(i => i.ItemNumber).ToList();

            return Ok(cost);
        }

        // POST: api/costs
        [HttpPost]
        public async Task<ActionResult<Cost>> CreateCost([FromBody] Cost request)
        {
            request.Id = Guid.NewGuid();
            request.Date = request.Date == default ? DateTime.UtcNow : request.Date;

            foreach (var item in request.Items)
            {
                item.Id = Guid.NewGuid();
                item.CostId = request.Id;
            }

            _context.Costs.Add(request);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetCost), new { id = request.Id }, request);
        }

        // PUT: api/costs/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCost(Guid id, [FromBody] Cost request)
        {
            var cost = await _context.Costs
                .Include(c => c.Items)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (cost == null)
            {
                return NotFound();
            }

            cost.Description = request.Description;
            cost.Margin = request.Margin;
            cost.Date = request.Date == default ? DateTime.UtcNow : request.Date;

            // Replace items: Delete old ones and add new ones to avoid EF tracking key conflicts
            _context.CostQuoteItems.RemoveRange(cost.Items);
            cost.Items.Clear();

            foreach (var item in request.Items)
            {
                item.Id = Guid.NewGuid();
                item.CostId = id;
                cost.Items.Add(item);
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // POST: api/costs/{id}/duplicate
        [HttpPost("{id}/duplicate")]
        public async Task<ActionResult<Cost>> DuplicateCost(Guid id)
        {
            var cost = await _context.Costs
                .Include(c => c.Items)
                .AsNoTracking()
                .FirstOrDefaultAsync(c => c.Id == id);

            if (cost == null)
            {
                return NotFound();
            }

            var duplicatedCost = new Cost
            {
                Id = Guid.NewGuid(),
                Description = $"{cost.Description} - Copy",
                Margin = cost.Margin,
                Date = DateTime.UtcNow
            };

            foreach (var item in cost.Items)
            {
                duplicatedCost.Items.Add(new CostQuoteItem
                {
                    Id = Guid.NewGuid(),
                    CostId = duplicatedCost.Id,
                    ItemNumber = item.ItemNumber,
                    Quantity = item.Quantity,
                    Uom = item.Uom,
                    Description = item.Description,
                    UnitPrice = item.UnitPrice,
                    SupplierName = item.SupplierName,
                    SupplierDescription = item.SupplierDescription,
                    SupplierCost = item.SupplierCost,
                    OtherName = item.OtherName,
                    OtherDescription = item.OtherDescription,
                    OtherCost = item.OtherCost
                });
            }

            _context.Costs.Add(duplicatedCost);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetCost), new { id = duplicatedCost.Id }, duplicatedCost);
        }

        // DELETE: api/costs/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCost(Guid id)
        {
            var cost = await _context.Costs.FindAsync(id);
            if (cost == null)
            {
                return NotFound();
            }

            _context.Costs.Remove(cost);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
