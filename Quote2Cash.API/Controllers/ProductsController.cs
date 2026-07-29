using Microsoft.AspNetCore.Authorization;
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
using OfficeOpenXml;
using System.Net.Http;

namespace Quote2Cash.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductsController : ControllerBase
    {
        private readonly Quote2CashDbContext _context;
        private readonly string _storagePath;
        private readonly IHttpClientFactory _httpClientFactory;

        public ProductsController(Quote2CashDbContext context, IWebHostEnvironment env, IHttpClientFactory httpClientFactory)
        {
            _context = context;
            _storagePath = Path.Combine(env.ContentRootPath, "products");
            if (!Directory.Exists(_storagePath))
            {
                Directory.CreateDirectory(_storagePath);
            }
            _httpClientFactory = httpClientFactory;
        }

        [AllowAnonymous]
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Product>>> GetProducts()
        {
            var products = await _context.Products.AsNoTracking().OrderBy(p => p.Code).ToListAsync();
            return Ok(products);
        }

        [AllowAnonymous]
        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<Product>>> SearchProducts([FromQuery] string? query)
        {
            var productsQuery = _context.Products.AsNoTracking().OrderBy(p => p.Code).AsQueryable();
            if (!string.IsNullOrWhiteSpace(query))
            {
                var trimmed = query.Trim();
                productsQuery = productsQuery.Where(p => p.Code.Contains(trimmed) || p.Name.Contains(trimmed));
            }

            var products = await productsQuery.ToListAsync();
            return Ok(products);
        }

        [AllowAnonymous]
        [HttpGet("by-code/{code}")]
        public async Task<ActionResult<Product>> GetProductByCode(string code)
        {
            if (string.IsNullOrWhiteSpace(code))
            {
                return BadRequest(new { message = "Code is required." });
            }

            var product = await _context.Products.AsNoTracking().FirstOrDefaultAsync(p => p.Code == code.Trim());
            if (product == null)
            {
                return NotFound();
            }

            return Ok(product);
        }

        [AllowAnonymous]
        [HttpGet("{id}")]
        public async Task<ActionResult<Product>> GetProduct(Guid id)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null)
            {
                return NotFound();
            }
            return Ok(product);
        }

        [HttpPost]
        public async Task<ActionResult<Product>> CreateProduct([FromBody] Product request)
        {
            if (string.IsNullOrWhiteSpace(request.Code))
            {
                return BadRequest(new { message = "Code is required." });
            }
            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return BadRequest(new { message = "Name is required." });
            }

            request.Id = Guid.NewGuid();
            request.Code = request.Code.Trim();
            request.Name = request.Name.Trim();
            if (!string.IsNullOrWhiteSpace(request.Description))
            {
                request.Description = request.Description.Trim();
            }

            _context.Products.Add(request);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetProduct), new { id = request.Id }, request);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateProduct(Guid id, [FromBody] Product request)
        {
            var existing = await _context.Products.FindAsync(id);
            if (existing == null)
            {
                return NotFound();
            }

            if (string.IsNullOrWhiteSpace(request.Code))
            {
                return BadRequest(new { message = "Code is required." });
            }
            if (string.IsNullOrWhiteSpace(request.Name))
            {
                return BadRequest(new { message = "Name is required." });
            }

            existing.Code = request.Code.Trim();
            existing.Name = request.Name.Trim();
            existing.Uom = request.Uom;
            existing.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
            existing.Price = request.Price;
            existing.Image = string.IsNullOrWhiteSpace(request.Image) ? null : request.Image.Trim();

            await _context.SaveChangesAsync();
            return Ok(existing);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProduct(Guid id)
        {
            var existing = await _context.Products.FindAsync(id);
            if (existing == null)
            {
                return NotFound();
            }

            _context.Products.Remove(existing);
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
            var tempFileName = $"product_{Guid.NewGuid()}{extension}";
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

        [HttpGet("template")]
        public IActionResult DownloadTemplate()
        {
            using (var package = new ExcelPackage())
            {
                var worksheet = package.Workbook.Worksheets.Add("Products");
                worksheet.Cells[1, 1].Value = "Code";
                worksheet.Cells[1, 2].Value = "Name";
                worksheet.Cells[1, 3].Value = "UOM";
                worksheet.Cells[1, 4].Value = "Description";
                worksheet.Cells[1, 5].Value = "Price";
                worksheet.Cells[1, 6].Value = "Image";

                var stream = new MemoryStream();
                package.SaveAs(stream);
                stream.Position = 0;

                return File(stream, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "products_template.xlsx");
            }
        }

        [HttpPost("upload-excel")]
        public async Task<IActionResult> UploadExcel(IFormFile file)
        {
            if (file == null || file.Length == 0)
            {
                return BadRequest("File is empty.");
            }

            var products = new List<Product>();
            using (var stream = new MemoryStream())
            {
                await file.CopyToAsync(stream);
                using (var package = new ExcelPackage(stream))
                {
                    var worksheet = package.Workbook.Worksheets.FirstOrDefault();
                    if (worksheet == null)
                    {
                        return BadRequest("Empty Excel file.");
                    }

                    var rowCount = worksheet.Dimension.Rows;
                    for (int row = 2; row <= rowCount; row++)
                    {
                        var product = new Product
                        {
                            Id = Guid.NewGuid(),
                            Code = worksheet.Cells[row, 1].Value?.ToString()?.Trim(),
                            Name = worksheet.Cells[row, 2].Value?.ToString()?.Trim(),
                            Uom = worksheet.Cells[row, 3].Value?.ToString()?.Trim(),
                            Description = worksheet.Cells[row, 4].Value?.ToString()?.Trim(),
                            Price = decimal.TryParse(worksheet.Cells[row, 5].Value?.ToString(), out var price) ? price : 0,
                            Image = worksheet.Cells[row, 6].Value?.ToString()?.Trim()
                        };

                        if (!string.IsNullOrWhiteSpace(product.Image) && Uri.IsWellFormedUriString(product.Image, UriKind.Absolute))
                        {
                            var client = _httpClientFactory.CreateClient();
                            try
                            {
                                var response = await client.GetAsync(product.Image);
                                if (response.IsSuccessStatusCode)
                                {
                                    var imageBytes = await response.Content.ReadAsByteArrayAsync();
                                    var extension = Path.GetExtension(new Uri(product.Image).AbsolutePath);
                                    var newFileName = $"product_{Guid.NewGuid()}{extension}";
                                    var fullPath = Path.Combine(_storagePath, newFileName);
                                    await System.IO.File.WriteAllBytesAsync(fullPath, imageBytes);
                                    product.Image = newFileName;
                                }
                                else
                                {
                                    // Log the error or handle it as needed
                                    product.Image = null;
                                }
                            }
                            catch (Exception)
                            {
                                // Log the error or handle it as needed
                                product.Image = null;
                            }
                        }
                        else if (!string.IsNullOrWhiteSpace(product.Image))
                        {
                            // If it's not a URL, it might be a local file path which we can't access.
                            // For now, we will just save the name and assume the file will be uploaded separately.
                        }


                        products.Add(product);
                    }
                }
            }

            if (products.Any())
            {
                _context.Products.AddRange(products);
                await _context.SaveChangesAsync();
            }

            return Ok(new { message = $"{products.Count} products imported successfully." });
        }
    }
}
