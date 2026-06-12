using System;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Tokens;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Quote2Cash.Domain.Entities;
using Quote2Cash.Persistence.Data;

namespace Quote2Cash.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly Quote2CashDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(Quote2CashDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(new { message = "Username and password are required" });
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == request.Username);
            if (user == null || !VerifyPassword(request.Password, user.PasswordHash))
            {
                return Unauthorized(new { message = "Invalid username or password" });
            }

            var token = GenerateJwtToken(user);

            return Ok(new AuthResponse
            {
                Token = token,
                User = new UserDto
                {
                    Id = user.Id.ToString(),
                    Username = user.Username,
                    Role = user.Role
                }
            });
        }

        private bool VerifyPassword(string password, string hash)
        {
            try
            {
                var parts = hash.Split('.');
                if (parts.Length != 3)
                    return false;

                var iterations = int.Parse(parts[0]);
                var salt = Convert.FromBase64String(parts[1]);
                var storedHash = Convert.FromBase64String(parts[2]);

                using var pbkdf2 = new System.Security.Cryptography.Rfc2898DeriveBytes(
                    password,
                    salt,
                    iterations,
                    System.Security.Cryptography.HashAlgorithmName.SHA256);

                var computedHash = pbkdf2.GetBytes(32);
                return computedHash.SequenceEqual(storedHash);
            }
            catch
            {
                return false;
            }
        }

        private string GenerateJwtToken(User user)
        {
            var jwtKey = _configuration.GetValue<string>("Jwt:Key");
            var jwtIssuer = _configuration.GetValue<string>("Jwt:Issuer");
            var jwtAudience = _configuration.GetValue<string>("Jwt:Audience");
            var expireMinutes = _configuration.GetValue<int>("Jwt:ExpireMinutes");

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey ?? throw new InvalidOperationException("Jwt:Key not configured")));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Role, user.Role)
            };

            var token = new JwtSecurityToken(
                issuer: jwtIssuer,
                audience: jwtAudience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(expireMinutes),
                signingCredentials: creds);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }

    public class LoginRequest
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class AuthResponse
    {
        public string Token { get; set; } = string.Empty;
        public UserDto User { get; set; } = new();
    }

    public class UserDto
    {
        public string Id { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
    }
}
