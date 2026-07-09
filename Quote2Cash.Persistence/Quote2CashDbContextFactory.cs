using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Quote2Cash.Persistence.Data;

public class Quote2CashDbContextFactory : IDesignTimeDbContextFactory<Quote2CashDbContext>
{
    public Quote2CashDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<Quote2CashDbContext>();

        // Use your local dev connection string here
        optionsBuilder.UseNpgsql("Host=localhost;Port=5432;Database=Biture;Username=postgres;Password=password");

        return new Quote2CashDbContext(optionsBuilder.Options);
    }
}
