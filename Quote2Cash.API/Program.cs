using Microsoft.EntityFrameworkCore;
using Quote2Cash.Persistence.Data;
using Quote2Cash.Persistence.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
builder.Services.AddPersistenceServices(builder.Configuration);
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowLocalhost", policy =>
    {
        policy
            .AllowAnyOrigin()
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (args.Contains("--seed-data", StringComparer.OrdinalIgnoreCase))
{
    using var scope = app.Services.CreateScope();
    var context = scope.ServiceProvider.GetRequiredService<Quote2CashDbContext>();
    await SeedData.EnsureSeedDataAsync(context);
    return;
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("AllowLocalhost");

app.UseAuthorization();

app.MapControllers();

app.Run();
