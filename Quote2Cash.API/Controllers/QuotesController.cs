using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Quote2Cash.Domain.Entities;
using Quote2Cash.Persistence.Data;
using System.IO;

namespace Quote2Cash.API.Controllers
{
    public class QuoteItemDto
    {
        public int ItemNumber { get; set; }
        public decimal Quantity { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Uom { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal UnitPrice { get; set; }
        public decimal TotalPrice { get; set; }
        public string? ImagePath { get; set; }
    }

    public class QuoteCreateDto
    {
        public Guid? ClientId { get; set; }
        public string QuoteNumber { get; set; } = string.Empty;
        public string Reference { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public int ValidityDays { get; set; }
        public QuoteItemDto[] Items { get; set; } = Array.Empty<QuoteItemDto>();
        public string? PONumber { get; set; }
        public decimal Margin { get; set; }
    }

    [ApiController]
    [Route("api/[controller]")]
    public class QuotesController : ControllerBase
    {
        private readonly Quote2CashDbContext _context;
        private readonly IWebHostEnvironment _env;

        public QuotesController(Quote2CashDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        [HttpGet("next-number")]
        public async Task<ActionResult<object>> GetNextQuoteNumber()
        {
            var prefix = $"Q{DateTime.UtcNow:yyyyMM}";
            var latestQuoteNumber = await _context.Quotes.AsNoTracking()
                .Where(q => q.QuoteNumber.StartsWith(prefix))
                .OrderByDescending(q => q.QuoteNumber)
                .Select(q => q.QuoteNumber)
                .FirstOrDefaultAsync();

            var nextSequence = 0;
            if (!string.IsNullOrWhiteSpace(latestQuoteNumber) && latestQuoteNumber.Length >= prefix.Length + 4)
            {
                var suffix = latestQuoteNumber[prefix.Length..];
                if (int.TryParse(suffix, out var lastSequence))
                {
                    nextSequence = lastSequence + 1;
                }
            }

            var nextQuoteNumber = prefix + nextSequence.ToString("D4");
            return Ok(new { nextQuoteNumber });
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetQuotes()
        {
            var quotes = await _context.Quotes.AsNoTracking()
                .Include(q => q.Client)
                .Include(q => q.Items)
                .OrderByDescending(q => q.Date)
                .ToListAsync();

            return Ok(quotes.Select(q => new
            {
                q.Id,
                q.QuoteNumber,
                q.Reference,
                q.Date,
                q.ValidityDays,
                VendorNumber = q.Client?.VendorNumber ?? string.Empty,
                q.ClientId,
                q.PONumber,
                q.Margin,
                Client = q.Client != null ? new { q.Client.Id, q.Client.Name, q.Client.VatNumber } : null,
                SubTotal = q.SubTotal,
                Vat = q.Vat,
                Total = q.Total,
                ItemCount = q.Items.Count
            }));
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetQuote(Guid id)
        {
            var quote = await _context.Quotes.AsNoTracking()
                .Include(q => q.Client)
                .Include(q => q.Items)
                .FirstOrDefaultAsync(q => q.Id == id);

            if (quote == null)
            {
                return NotFound();
            }

            return Ok(new
            {
                quote.Id,
                quote.QuoteNumber,
                quote.Reference,
                quote.Date,
                quote.ValidityDays,
                VendorNumber = quote.Client?.VendorNumber ?? string.Empty,
                quote.ClientId,
                quote.PONumber,
                quote.Margin,
                Client = quote.Client != null ? new { quote.Client.Id, quote.Client.Name, quote.Client.AddressLine1, quote.Client.AddressLine2, quote.Client.AddressLine3, quote.Client.AddressLine4, quote.Client.RepresentativeName, quote.Client.RepresentativeNumber, quote.Client.VendorNumber, quote.Client.VatNumber } : null,
                Items = quote.Items.Select(item => new
                {
                    item.Id,
                    item.ItemNumber,
                    item.Quantity,
                    item.Code,
                    item.Uom,
                    item.Description,
                    item.UnitPrice,
                    item.TotalPrice,
                    item.ImagePath
                }),
                quote.SubTotal,
                quote.Vat,
                quote.Total
            });
        }

        [HttpPost]
        public async Task<ActionResult<object>> CreateQuote([FromBody] QuoteCreateDto request)
        {
            var quoteDate = DateTime.SpecifyKind(request.Date, DateTimeKind.Utc);
            var quoteItems = new List<QuoteItem>();
            foreach (var item in request.Items)
            {
                var product = await GetOrAddProductFromQuoteItemAsync(item);
                if (product != null)
                {
                    item.Uom = string.IsNullOrWhiteSpace(item.Uom) ? product.Uom : item.Uom;
                    item.Description = string.IsNullOrWhiteSpace(item.Description) ? product.Description : item.Description;
                    item.UnitPrice = item.UnitPrice == 0 ? product.Price : item.UnitPrice;
                    item.ImagePath = string.IsNullOrWhiteSpace(item.ImagePath) ? product.Image : item.ImagePath;
                }

                quoteItems.Add(new QuoteItem
                {
                    Id = Guid.NewGuid(),
                    ItemNumber = item.ItemNumber,
                    Quantity = item.Quantity,
                    Code = item.Code,
                    Uom = item.Uom,
                    Description = item.Description,
                    UnitPrice = item.UnitPrice,
                    TotalPrice = item.TotalPrice,
                    ImagePath = item.ImagePath,
                    ProductId = product?.Id
                });
            }

            var quote = new Quote
            {
                Id = Guid.NewGuid(),
                ClientId = request.ClientId,
                QuoteNumber = request.QuoteNumber,
                Reference = request.Reference,
                Date = quoteDate,
                ValidityDays = request.ValidityDays,
                PONumber = request.PONumber,
                Margin = request.Margin,
                Items = quoteItems
            };

            _context.Quotes.Add(quote);
            await _context.SaveChangesAsync();

            // Rename temp images
            RenameTempImages(quoteItems);
            await _context.SaveChangesAsync();

            var result = new
            {
                quote.Id,
                quote.QuoteNumber,
                quote.Reference,
                quote.Date,
                quote.ValidityDays,
                VendorNumber = quote.Client?.VendorNumber ?? string.Empty,
                quote.ClientId,
                quote.PONumber,
                quote.Margin,
                Client = (object?)null,
                Items = quote.Items.Select(item => new
                {
                    item.Id,
                    item.ItemNumber,
                    item.Quantity,
                    item.Code,
                    item.Uom,
                    item.Description,
                    item.UnitPrice,
                    item.TotalPrice,
                    item.ImagePath
                }).ToList(),
                quote.SubTotal,
                quote.Vat,
                quote.Total
            };

            return CreatedAtAction(nameof(GetQuote), new { id = quote.Id }, result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateQuote(Guid id, [FromBody] QuoteCreateDto request)
        {
            var quote = await _context.Quotes.Include(q => q.Items).FirstOrDefaultAsync(q => q.Id == id);
            if (quote == null)
            {
                return NotFound();
            }

            quote.ClientId = request.ClientId;
            quote.QuoteNumber = request.QuoteNumber;
            quote.Reference = request.Reference;
            quote.Date = DateTime.SpecifyKind(request.Date, DateTimeKind.Utc);
            quote.ValidityDays = request.ValidityDays;
            quote.PONumber = request.PONumber;
            quote.Margin = request.Margin;

            var existingItems = quote.Items.ToList();
            if (existingItems.Any())
            {
                _context.QuoteItems.RemoveRange(existingItems);
                await _context.SaveChangesAsync();
            }

            var newItems = new List<QuoteItem>();
            foreach (var item in request.Items)
            {
                var product = await GetOrAddProductFromQuoteItemAsync(item);
                if (product != null)
                {
                    item.Uom = string.IsNullOrWhiteSpace(item.Uom) ? product.Uom : item.Uom;
                    item.Description = string.IsNullOrWhiteSpace(item.Description) ? product.Description : item.Description;
                    item.UnitPrice = item.UnitPrice == 0 ? product.Price : item.UnitPrice;
                    item.ImagePath = string.IsNullOrWhiteSpace(item.ImagePath) ? product.Image : item.ImagePath;
                }

                newItems.Add(new QuoteItem
                {
                    Id = Guid.NewGuid(),
                    QuoteId = quote.Id,
                    ItemNumber = item.ItemNumber,
                    Quantity = item.Quantity,
                    Code = item.Code,
                    Uom = item.Uom,
                    Description = item.Description,
                    UnitPrice = item.UnitPrice,
                    TotalPrice = item.TotalPrice,
                    ImagePath = item.ImagePath,
                    ProductId = product?.Id
                });
            }

            if (newItems.Any())
            {
                _context.QuoteItems.AddRange(newItems);
                await _context.SaveChangesAsync();

                // Rename temp images and clean up old ones
                RenameTempImages(newItems);
                await _context.SaveChangesAsync();
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteQuote(Guid id)
        {
            var quote = await _context.Quotes.FindAsync(id);
            if (quote == null)
            {
                return NotFound();
            }

            _context.Quotes.Remove(quote);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        private void RenameTempImages(IEnumerable<QuoteItem> quoteItems)
        {
            var storagePath = Path.Combine(_env.ContentRootPath, "quote_items");
            var productsStorage = Path.Combine(_env.ContentRootPath, "products");
            if (!Directory.Exists(storagePath))
            {
                Directory.CreateDirectory(storagePath);
            }

            foreach (var item in quoteItems)
            {
                if (string.IsNullOrWhiteSpace(item.ImagePath))
                {
                    continue;
                }

                // If the image is already a temporary quote image, rename it to the quote item's final filename.
                if (item.ImagePath.StartsWith("temp_"))
                {
                    var extension = Path.GetExtension(item.ImagePath);
                    var newFileName = $"{item.Id}{extension}";
                    var oldFilePath = Path.Combine(storagePath, item.ImagePath);
                    var newFilePath = Path.Combine(storagePath, newFileName);

                    if (System.IO.File.Exists(oldFilePath))
                    {
                        if (System.IO.File.Exists(newFilePath))
                        {
                            System.IO.File.Delete(newFilePath);
                        }
                        System.IO.File.Move(oldFilePath, newFilePath);
                        item.ImagePath = newFileName;
                    }

                    continue;
                }

                // If a product image path was used, copy it from products into quote_items.
                var currentQuoteImagePath = Path.Combine(storagePath, item.ImagePath);
                if (!System.IO.File.Exists(currentQuoteImagePath))
                {
                    var sourceFile = Path.Combine(productsStorage, item.ImagePath);
                    if (System.IO.File.Exists(sourceFile))
                    {
                        var extension = Path.GetExtension(item.ImagePath);
                        var newFileName = $"{item.Id}{extension}";
                        var newFilePath = Path.Combine(storagePath, newFileName);

                        System.IO.File.Copy(sourceFile, newFilePath, overwrite: true);
                        item.ImagePath = newFileName;
                    }
                }
            }
        }

        private async Task<Product?> GetOrAddProductFromQuoteItemAsync(QuoteItemDto item)
        {
            if (string.IsNullOrWhiteSpace(item.Code))
            {
                return null;
            }

            var code = item.Code.Trim();
            var product = await _context.Products.FirstOrDefaultAsync(p => p.Code == code);
            if (product != null)
            {
                return product;
            }

            var name = string.IsNullOrWhiteSpace(item.Description) ? code : item.Description.Trim();
            var productImage = item.ImagePath?.Trim();
            if (!string.IsNullOrWhiteSpace(productImage))
            {
                var sourcePaths = new[]
                {
                    Path.Combine(_env.ContentRootPath, "quote_items", productImage),
                    Path.Combine(_env.ContentRootPath, "products", productImage),
                    productImage
                };

                var sourceFile = sourcePaths.FirstOrDefault(path => System.IO.File.Exists(path));
                if (!string.IsNullOrWhiteSpace(sourceFile))
                {
                    var extension = Path.GetExtension(sourceFile);
                    var savedFileName = $"product_{Guid.NewGuid()}{extension}";
                    var destinationPath = Path.Combine(_env.ContentRootPath, "products", savedFileName);
                    System.IO.File.Copy(sourceFile, destinationPath, overwrite: true);
                    productImage = savedFileName;
                }
            }

            product = new Product
            {
                Id = Guid.NewGuid(),
                Code = code,
                Name = name,
                Uom = item.Uom ?? string.Empty,
                Description = item.Description,
                Price = item.UnitPrice,
                Image = productImage
            };

            _context.Products.Add(product);
            await _context.SaveChangesAsync();
            return product;
        }
    }
}
