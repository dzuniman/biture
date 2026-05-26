using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Security.Cryptography;

namespace Quote2Cash.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly Quote2Cash.Persistence.Data.Quote2CashDbContext _context;

        public AuthController(IConfiguration configuration, Quote2Cash.Persistence.Data.Quote2CashDbContext context)
        {
            _configuration = configuration;
            _context = context;
        }

        public class LoginRequest
        {
            public string Username { get; set; } = string.Empty;
            public string Password { get; set; } = string.Empty;
        }

        public class UserDto
        {
            public string Id { get; set; } = string.Empty;
            public string Username { get; set; } = string.Empty;
            public string Role { get; set; } = string.Empty;
        }

        public class AuthResponse
        {
            public string Token { get; set; } = string.Empty;
            public UserDto User { get; set; } = new UserDto();
        }

        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            // Validate user from the database
            var username = request.Username?.Trim();
            if (string.IsNullOrEmpty(username)) return BadRequest(new { message = "Username is required" });

            var dbUser = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Username.ToLower() == username.ToLower());
            if (dbUser == null)
            {
                return Unauthorized(new { message = "Invalid username or password" });
            }

            bool VerifyPassword(string stored, string password)
            {
                try
                {
                    var parts = stored.Split('.', 3);
                    if (parts.Length != 3) return false;
                    var iter = int.Parse(parts[0]);
                    var salt = Convert.FromBase64String(parts[1]);
                    var hash = Convert.FromBase64String(parts[2]);
                    using var pbkdf2 = new System.Security.Cryptography.Rfc2898DeriveBytes(password, salt, iter, System.Security.Cryptography.HashAlgorithmName.SHA256);
                    var computed = pbkdf2.GetBytes(hash.Length);
                    return CryptographicOperations.FixedTimeEquals(computed, hash);
                }
                catch
                {
                    return false;
                }
            }

            if (!VerifyPassword(dbUser.PasswordHash, request.Password))
            {
                return Unauthorized(new { message = "Invalid username or password" });
            }

            var role = dbUser.Role;
            var userId = dbUser.Id.ToString();

            var jwtSection = _configuration.GetSection("Jwt");
            var key = jwtSection.GetValue<string>("Key");
            var issuer = jwtSection.GetValue<string>("Issuer");
            var audience = jwtSection.GetValue<string>("Audience");
            var expireMinutes = jwtSection.GetValue<int?>("ExpireMinutes") ?? 60;

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, request.Username),
                new Claim(ClaimTypes.Name, request.Username),
                new Claim(ClaimTypes.NameIdentifier, userId),
                new Claim(ClaimTypes.Role, role)
            };

            var keyBytes = Encoding.UTF8.GetBytes(key);
            var signingKey = new SymmetricSecurityKey(keyBytes);
            var creds = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(expireMinutes),
                signingCredentials: creds
            );

            var tokenString = new JwtSecurityTokenHandler().WriteToken(token);


            var userDto = new UserDto { Id = userId, Username = request.Username, Role = role };

            var response = new AuthResponse { Token = tokenString, User = userDto };

            return Ok(response);
        }
    }
}
