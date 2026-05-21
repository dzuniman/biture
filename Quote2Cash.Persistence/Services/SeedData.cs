using Npgsql;
using Microsoft.EntityFrameworkCore;
using Quote2Cash.Domain.Entities;
using Quote2Cash.Persistence.Data;

namespace Quote2Cash.Persistence.Services
{
    public static class SeedData
    {
        public static async Task EnsureSeedDataAsync(Quote2CashDbContext context)
        {
            var connectionString = context.Database.GetConnectionString();
            await using var connection = new NpgsqlConnection(connectionString);
            await connection.OpenAsync();

            await using (var createTableCommand = connection.CreateCommand())
            {
                createTableCommand.CommandText = @"CREATE TABLE IF NOT EXISTS ""SeedHistory"" (""Id"" uuid PRIMARY KEY, ""SeededAt"" timestamp with time zone NOT NULL);";
                await createTableCommand.ExecuteNonQueryAsync();
            }

            await using (var checkCommand = connection.CreateCommand())
            {
                checkCommand.CommandText = @"SELECT 1 FROM ""SeedHistory"" LIMIT 1;";
                var result = await checkCommand.ExecuteScalarAsync();
                if (result != null)
                {
                    return;
                }
            }

            context.QuoteItems.RemoveRange(context.QuoteItems);
            context.Invoices.RemoveRange(context.Invoices);
            context.Costs.RemoveRange(context.Costs);
            context.Statements.RemoveRange(context.Statements);
            context.JobCards.RemoveRange(context.JobCards);
            context.Quotes.RemoveRange(context.Quotes);
            context.Clients.RemoveRange(context.Clients);
            await context.SaveChangesAsync();

            var clients = new List<Client>
            {
                new Client
                {
                    Id = Guid.NewGuid(),
                    Name = "UNISA",
                    AddressLine1 = "1 University Avenue",
                    AddressLine2 = "Campus Central",
                    AddressLine3 = "Pretoria",
                    AddressLine4 = "South Africa",
                    RepresentativeName = "Finance Team",
                    RepresentativeNumber = "+27 12 123 4567"
                },
                new Client
                {
                    Id = Guid.NewGuid(),
                    Name = "Acme Holdings",
                    AddressLine1 = "42 Industrial Park",
                    AddressLine2 = "Suite 14B",
                    AddressLine3 = "Johannesburg",
                    AddressLine4 = "South Africa",
                    RepresentativeName = "Riaan van der Merwe",
                    RepresentativeNumber = "+27 11 987 6543"
                },
                new Client
                {
                    Id = Guid.NewGuid(),
                    Name = "South African Railways",
                    AddressLine1 = "12 Network Drive",
                    AddressLine2 = "Dispatch Building",
                    AddressLine3 = "Cape Town",
                    AddressLine4 = "South Africa",
                    RepresentativeName = "Nokuthula Ndlovu",
                    RepresentativeNumber = "+27 21 555 7890"
                }
            };

            var quotes = new List<Quote>
            {
                new Quote
                {
                    Id = Guid.NewGuid(),
                    QuoteNumber = 1001,
                    Reference = "Q-1001-UNISA",
                    Date = DateTime.UtcNow.AddDays(-8),
                    ValidityDays = 30,
                    VendorNumber = "VN-1001",
                    ClientId = clients[0].Id,
                    Items = new List<QuoteItem>
                    {
                        new QuoteItem
                        {
                            Id = Guid.NewGuid(),
                            ItemNumber = 1,
                            Quantity = 12,
                            Uom = "Hours",
                            Description = "Systems integration assessment",
                            UnitPrice = 350m,
                            TotalPrice = 4200m
                        },
                        new QuoteItem
                        {
                            Id = Guid.NewGuid(),
                            ItemNumber = 2,
                            Quantity = 25,
                            Uom = "pcs",
                            Description = "Custom reporting licenses",
                            UnitPrice = 120m,
                            TotalPrice = 3000m
                        }
                    }
                },
                new Quote
                {
                    Id = Guid.NewGuid(),
                    QuoteNumber = 1002,
                    Reference = "Q-1002-ACME",
                    Date = DateTime.UtcNow.AddDays(-14),
                    ValidityDays = 45,
                    VendorNumber = "VN-2002",
                    ClientId = clients[1].Id,
                    Items = new List<QuoteItem>
                    {
                        new QuoteItem
                        {
                            Id = Guid.NewGuid(),
                            ItemNumber = 1,
                            Quantity = 8,
                            Uom = "Days",
                            Description = "Implementation and handover",
                            UnitPrice = 650m,
                            TotalPrice = 5200m
                        },
                        new QuoteItem
                        {
                            Id = Guid.NewGuid(),
                            ItemNumber = 2,
                            Quantity = 50,
                            Uom = "pcs",
                            Description = "Support tablets",
                            UnitPrice = 78m,
                            TotalPrice = 3900m
                        }
                    }
                },
                new Quote
                {
                    Id = Guid.NewGuid(),
                    QuoteNumber = 1003,
                    Reference = "Q-1003-SAR",
                    Date = DateTime.UtcNow.AddDays(-3),
                    ValidityDays = 21,
                    VendorNumber = "VN-3003",
                    ClientId = clients[2].Id,
                    Items = new List<QuoteItem>
                    {
                        new QuoteItem
                        {
                            Id = Guid.NewGuid(),
                            ItemNumber = 1,
                            Quantity = 18,
                            Uom = "Hours",
                            Description = "Railway schedule optimization",
                            UnitPrice = 415m,
                            TotalPrice = 7470m
                        },
                        new QuoteItem
                        {
                            Id = Guid.NewGuid(),
                            ItemNumber = 2,
                            Quantity = 5,
                            Uom = "pcs",
                            Description = "Hardware installation kits",
                            UnitPrice = 980m,
                            TotalPrice = 4900m
                        }
                    }
                }
            };

            await context.Clients.AddRangeAsync(clients);
            await context.Quotes.AddRangeAsync(quotes);
            await context.SaveChangesAsync();

            await context.Database.ExecuteSqlInterpolatedAsync($@"INSERT INTO ""SeedHistory"" (""Id"", ""SeededAt"") VALUES ({Guid.NewGuid()}, {DateTime.UtcNow});");
        }
    }
}
