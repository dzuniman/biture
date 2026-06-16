// c:\Staff\Documents\Other\Vutivi\Quote2Cash\Code\Quote2Cash\Quote2Cash.API\Controllers\DocumentsController.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Quote2Cash.Domain.Entities;
using Quote2Cash.Persistence.Data;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Hosting;
using System.Linq;
using System.Collections.Generic;

namespace Quote2Cash.API.Controllers
{
    // DTOs for better Swagger documentation and reliable serialization
    public record DocumentUploadRequest(string DocumentName, string? Description, IFormFile File);
    public record DocumentUpdateRequest(string DocumentName, string? Description);
    public record DocumentResponse(Guid Id, string DocumentName, string? Description, string FileName, string ContentType, DateTime UploadedAt);

    [ApiController]
    [Route("api/[controller]")]
    public class DocumentsController : ControllerBase
    {
        private readonly Quote2CashDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly IWebHostEnvironment _env;
        private readonly string _documentStoragePath;

        public DocumentsController(Quote2CashDbContext context, IConfiguration configuration, IWebHostEnvironment env)
        {
            _context = context;
            _configuration = configuration;
            _env = env;
            // Reads the document storage path from appsettings.json, defaults to "Documents" if not found
            _documentStoragePath = Path.Combine(_env.ContentRootPath, _configuration["DocumentStoragePath"] ?? "Documents");
            
            // Ensure the physical directory for storing documents exists
            if (!Directory.Exists(_documentStoragePath))
            {
                Directory.CreateDirectory(_documentStoragePath);
            }
        }

        /// <summary>
        /// Retrieves a list of all documents.
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<DocumentResponse>>> GetDocuments()
        {
            var documents = await _context.Documents
                .AsNoTracking()
                .Select(d => new DocumentResponse(d.Id, d.DocumentName, d.Description, d.FileName, d.ContentType, d.UploadedAt))
                .ToListAsync();
            return Ok(documents);
        }

        /// <summary>
        /// Retrieves a specific document's metadata by ID.
        /// </summary>
        /// <param name="id">The ID of the document.</param>
        [HttpGet("{id}")]
        public async Task<ActionResult<DocumentResponse>> GetDocument(Guid id)
        {
            var document = await _context.Documents
                .AsNoTracking()
                .Where(d => d.Id == id)
                .Select(d => new DocumentResponse(d.Id, d.DocumentName, d.Description, d.FileName, d.ContentType, d.UploadedAt))
                .FirstOrDefaultAsync();

            if (document == null)
            {
                return NotFound();
            }
            return Ok(document);
        }

        /// <summary>
        /// Downloads a specific document by ID.
        /// </summary>
        /// <param name="id">The ID of the document to download.</param>
        [HttpGet("{id}/download")]
        public async Task<IActionResult> DownloadDocument(Guid id)
        {
            var document = await _context.Documents.FindAsync(id);
            if (document == null)
            {
                return NotFound();
            }

            var filePath = document.FilePath;
            if (!System.IO.File.Exists(filePath))
            {
                return NotFound("File not found on server.");
            }

            var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);
            return File(fileBytes, document.ContentType, document.DocumentName);
        }

        /// <summary>
        /// Uploads a new document to the server and saves its metadata to the database.
        /// </summary>
        /// <param name="request">The document upload request containing name, description, and the file.</param>
        [HttpPost]
        [Consumes("multipart/form-data")]
        public async Task<ActionResult<DocumentResponse>> UploadDocument([FromForm] DocumentUploadRequest request)
        {
            if (request.File == null || request.File.Length == 0)
            {
                return BadRequest("File is required.");
            }

            if (string.IsNullOrWhiteSpace(request.DocumentName))
            {
                return BadRequest("Document Name is required.");
            }

            // Check for duplicate DocumentName to ensure uniqueness
            if (await _context.Documents.AnyAsync(d => d.DocumentName == request.DocumentName))
            {
                return Conflict($"A document with the name '{request.DocumentName}' already exists.");
            }

            // Generate a unique file name to prevent collisions on the file system
            var uniqueFileName = Guid.NewGuid().ToString() + Path.GetExtension(request.File.FileName);
            var fullPath = Path.Combine(_documentStoragePath, uniqueFileName);

            // Save the file to the server
            using (var stream = new FileStream(fullPath, FileMode.Create))
            {
                await request.File.CopyToAsync(stream);
            }

            // Create and save the document metadata to the database
            var document = new Document
            {
                Id = Guid.NewGuid(),
                DocumentName = request.DocumentName,
                Description = request.Description,
                FileName = uniqueFileName,
                FilePath = fullPath,
                ContentType = request.File.ContentType,
                UploadedAt = DateTime.UtcNow
            };

            _context.Documents.Add(document);
            await _context.SaveChangesAsync();

            var response = new DocumentResponse(document.Id, document.DocumentName, document.Description, document.FileName, document.ContentType, document.UploadedAt);
            return CreatedAtAction(nameof(GetDocument), new { id = document.Id }, response);
        }

        /// <summary>
        /// Updates the metadata (name and description) of an existing document.
        /// </summary>
        /// <param name="id">The ID of the document to update.</param>
        /// <param name="request">The update request containing the new name and description.</param>
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateDocument(Guid id, [FromBody] DocumentUpdateRequest request)
        {
            var document = await _context.Documents.FindAsync(id);
            if (document == null)
            {
                return NotFound();
            }

            if (string.IsNullOrWhiteSpace(request.DocumentName))
            {
                return BadRequest("Document Name is required.");
            }

            // Check for duplicate DocumentName, excluding the current document being updated
            if (await _context.Documents.AnyAsync(d => d.DocumentName == request.DocumentName && d.Id != id))
            {
                return Conflict($"A document with the name '{request.DocumentName}' already exists.");
            }

            document.DocumentName = request.DocumentName;
            document.Description = request.Description;
            // The physical file itself is not updated via this endpoint.

            await _context.SaveChangesAsync();
            return NoContent();
        }

        /// <summary>
        /// Deletes a document by ID, removing both its database entry and the physical file from the server.
        /// </summary>
        /// <param name="id">The ID of the document to delete.</param>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDocument(Guid id)
        {
            var document = await _context.Documents.FindAsync(id);
            if (document == null)
            {
                return NotFound();
            }

            // Delete the physical file from the server
            if (System.IO.File.Exists(document.FilePath))
            {
                System.IO.File.Delete(document.FilePath);
            }

            // Remove the document entry from the database
            _context.Documents.Remove(document);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
