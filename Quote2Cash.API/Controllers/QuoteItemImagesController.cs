using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using System.IO;
using System.Threading.Tasks;
using System;
using Microsoft.AspNetCore.Hosting;

namespace Quote2Cash.API.Controllers
{
    [ApiController]
    [Route("api/quotes/items/images")]
    public class QuoteItemImagesController : ControllerBase
    {
        private readonly string _storagePath;

        public QuoteItemImagesController(IWebHostEnvironment env)
        {
            _storagePath = Path.Combine(env.ContentRootPath, "quote_items");
            if (!Directory.Exists(_storagePath))
            {
                Directory.CreateDirectory(_storagePath);
            }
        }

        [HttpPost("upload")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UploadImage(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest("File is empty.");
            }

            var extension = Path.GetExtension(file.FileName);
            var tempFileName = $"temp_{Guid.NewGuid()}{extension}";
            var fullPath = Path.Combine(_storagePath, tempFileName);

            using (var stream = new FileStream(fullPath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Return the temporary filename
            return Ok(new { ImagePath = tempFileName });
        }

        [HttpGet("{fileName}")]
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
