using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Quote2Cash.Domain.Entities;
using Quote2Cash.Persistence.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace Quote2Cash.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ToolsController : ControllerBase
    {
        private readonly Quote2CashDbContext _context;
        private readonly string _storagePath;

        public ToolsController(Quote2CashDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _storagePath = Path.Combine(env.ContentRootPath, "tools");
            if (!Directory.Exists(_storagePath))
            {
                Directory.CreateDirectory(_storagePath);
            }
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Tool>>> GetTools()
        {
            var tools = await _context.Tools.AsNoTracking().OrderBy(t => t.Code).ToListAsync();
            return Ok(tools);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Tool>> GetTool(Guid id)
        {
            var tool = await _context.Tools.FindAsync(id);
            if (tool == null)
            {
                return NotFound();
            }
            return Ok(tool);
        }

        [HttpPost]
        public async Task<ActionResult<Tool>> CreateTool([FromBody] Tool request)
        {
            if (string.IsNullOrWhiteSpace(request.Code))
            {
                return BadRequest(new { message = "Code is required." });
            }
            if (string.IsNullOrWhiteSpace(request.Description))
            {
                return BadRequest(new { message = "Description is required." });
            }

            request.Id = Guid.NewGuid();
            request.Code = request.Code.Trim();
            request.Description = request.Description.Trim();
            if (!string.IsNullOrWhiteSpace(request.Location))
            {
                request.Location = request.Location.Trim();
            }

            _context.Tools.Add(request);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetTool), new { id = request.Id }, request);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTool(Guid id, [FromBody] Tool request)
        {
            var existing = await _context.Tools.FindAsync(id);
            if (existing == null)
            {
                return NotFound();
            }

            if (string.IsNullOrWhiteSpace(request.Code))
            {
                return BadRequest(new { message = "Code is required." });
            }
            if (string.IsNullOrWhiteSpace(request.Description))
            {
                return BadRequest(new { message = "Description is required." });
            }

            existing.Code = request.Code.Trim();
            existing.Description = request.Description.Trim();
            existing.Quantity = request.Quantity;
            existing.Location = string.IsNullOrWhiteSpace(request.Location) ? null : request.Location.Trim();
            existing.ImagePath = string.IsNullOrWhiteSpace(request.ImagePath) ? null : request.ImagePath.Trim();
            existing.Value = request.Value;
            existing.InspectionDate = request.InspectionDate;

            await _context.SaveChangesAsync();
            return Ok(existing);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTool(Guid id)
        {
            var existing = await _context.Tools.FindAsync(id);
            if (existing == null)
            {
                return NotFound();
            }

            _context.Tools.Remove(existing);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpPost("upload-image")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UploadImage(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { message = "File is empty." });
            }

            var extension = Path.GetExtension(file.FileName);
            var tempFileName = $"tool_{Guid.NewGuid()}{extension}";
            var fullPath = Path.Combine(_storagePath, tempFileName);

            using (var stream = new FileStream(fullPath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            return Ok(new { imagePath = tempFileName });
        }

        [HttpGet("images/{fileName}")]
        public IActionResult GetImage(string fileName)
        {
            var fullPath = Path.Combine(_storagePath, fileName);
            if (!System.IO.File.Exists(fullPath))
            {
                return NotFound();
            }

            var provider = new Microsoft.AspNetCore.StaticFiles.FileExtensionContentTypeProvider();
            if (!provider.TryGetContentType(fileName, out var contentType))
            {
                contentType = "application/octet-stream";
            }

            return PhysicalFile(fullPath, contentType);
        }
    }
}
