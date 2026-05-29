using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Quote2Cash.Domain.Entities;
using Quote2Cash.Persistence.Data;

namespace Quote2Cash.API.Controllers
{
    public record UserReadDto(string Id, string Username, string Role, DateTime CreatedAt);
    public record UserCreateDto(string Username, string Password, string Role);
    public record UserUpdateDto(string Username, string? Password, string Role);

    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class UsersController : ControllerBase
    {
        private readonly Quote2CashDbContext _context;

        public UsersController(Quote2CashDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<UserReadDto>>> GetUsers()
        {
            var users = await _context.Users.AsNoTracking().OrderBy(u => u.Username).ToListAsync();
            return Ok(users.Select(u => new UserReadDto(u.Id.ToString(), u.Username, u.Role, u.CreatedAt)));
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<UserReadDto>> GetUser(Guid id)
        {
            var user = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == id);
            if (user == null) return NotFound();
            return Ok(new UserReadDto(user.Id.ToString(), user.Username, user.Role, user.CreatedAt));
        }

        [HttpPost]
        public async Task<ActionResult<UserReadDto>> CreateUser([FromBody] UserCreateDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password) || string.IsNullOrWhiteSpace(request.Role))
            {
                return BadRequest(new { message = "Username, password, and role are required." });
            }

            if (await _context.Users.AnyAsync(u => u.Username == request.Username))
            {
                return Conflict(new { message = "A user with that username already exists." });
            }

            var user = new User
            {
                Id = Guid.NewGuid(),
                Username = request.Username.Trim(),
                PasswordHash = HashPassword(request.Password.Trim()),
                Role = request.Role.Trim(),
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetUser), new { id = user.Id }, new UserReadDto(user.Id.ToString(), user.Username, user.Role, user.CreatedAt));
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(Guid id, [FromBody] UserUpdateDto request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id);
            if (user == null) return NotFound();

            if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Role))
            {
                return BadRequest(new { message = "Username and role are required." });
            }

            if (await _context.Users.AnyAsync(u => u.Id != id && u.Username == request.Username.Trim()))
            {
                return Conflict(new { message = "A different user with that username already exists." });
            }

            user.Username = request.Username.Trim();
            user.Role = request.Role.Trim();
            if (!string.IsNullOrWhiteSpace(request.Password))
            {
                user.PasswordHash = HashPassword(request.Password.Trim());
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(Guid id)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id);
            if (user == null) return NotFound();

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        private static string HashPassword(string password)
        {
            using var rng = RandomNumberGenerator.Create();
            var salt = new byte[16];
            rng.GetBytes(salt);
            const int iterations = 100_000;
            using var pbkdf2 = new Rfc2898DeriveBytes(password, salt, iterations, HashAlgorithmName.SHA256);
            var hash = pbkdf2.GetBytes(32);
            return $"{iterations}.{Convert.ToBase64String(salt)}.{Convert.ToBase64String(hash)}";
        }
    }
}
