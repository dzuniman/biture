using System.Text.Json.Serialization;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc.Authorization;
using Quote2Cash.Persistence.Data;
using Quote2Cash.Persistence.Services;

var builder = WebApplication.CreateBuilder(args);

// Controllers with default authorization
builder.Services.AddControllers(options =>
{
    options.Filters.Add(new AuthorizeFilter());
})
.AddJsonOptions(options =>
{
    options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
    options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
});

// JWT authentication
var jwtSection = builder.Configuration.GetSection("Jwt");
var jwtKey = jwtSection.GetValue<string>("Key");
var jwtIssuer = jwtSection.GetValue<string>("Issuer");
var jwtAudience = jwtSection.GetValue<string>("Audience");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ValidateLifetime = true
    };
});

builder.Services.AddAuthorization();
builder.Services.AddPersistenceServices(builder.Configuration);

// ✅ Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
            "https://quote2cash.onrender.com",
            "https://quote2cash-api.onrender.com",
            "https://biture-api.onrender.com",
            "https://biture.onrender.com",
            "https://erp.biture.co.za",
            "http://localhost:4173",
            "http://localhost:5227"
        )
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials();
    });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Apply migrations and seed data
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<Quote2CashDbContext>();
    await context.Database.MigrateAsync();
    await SeedData.EnsureSeedDataAsync(context);
}

// Middleware order matters
app.UseSwagger();
app.UseSwaggerUI();

app.UseStaticFiles();

app.UseRouting();

// ✅ Handle OPTIONS preflight requests explicitly
/*app.Use(async (context, next) =>
{
    if (context.Request.Method == HttpMethods.Options)
    {
        context.Response.StatusCode = StatusCodes.Status200OK;
        context.Response.Headers.Add("Access-Control-Allow-Origin", "https://biture.onrender.com");
        context.Response.Headers.Add("Access-Control-Allow-Headers", "Content-Type, Authorization");
        context.Response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        await context.Response.CompleteAsync();
        return;
    }
    await next();
});*/

// ✅ Ensure CORS headers are applied globally
app.UseCors("AllowFrontend");

// ✅ Ensure errors also return CORS headers
/*app.Use(async (context, next) =>
{
    try
    {
        await next();
    }
    catch (Exception ex)
    {
        context.Response.StatusCode = StatusCodes.Status500InternalServerError;
        context.Response.Headers.Add("Access-Control-Allow-Origin", "https://biture.onrender.com");
        context.Response.Headers.Add("Access-Control-Allow-Headers", "Content-Type, Authorization");
        context.Response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        await context.Response.WriteAsync($"Server error: {ex.Message}");
    }
});*/

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
