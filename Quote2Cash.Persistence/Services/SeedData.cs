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

            // Create Users table if it doesn't exist
            await using (var createUsersTable = connection.CreateCommand())
            {
                createUsersTable.CommandText = @"CREATE TABLE IF NOT EXISTS ""Users"" (""Id"" uuid PRIMARY KEY, ""Username"" varchar(200) NOT NULL UNIQUE, ""PasswordHash"" text NOT NULL, ""Role"" varchar(100) NOT NULL, ""CreatedAt"" timestamp with time zone NOT NULL);";
                await createUsersTable.ExecuteNonQueryAsync();
            }

            await using (var createQuoteUomsTable = connection.CreateCommand())
            {
                createQuoteUomsTable.CommandText = @"CREATE TABLE IF NOT EXISTS ""QuoteUoms"" (""Id"" uuid PRIMARY KEY, ""Value"" varchar(150) NOT NULL UNIQUE);";
                await createQuoteUomsTable.ExecuteNonQueryAsync();
            }

            await using (var createQuoteDescriptionsTable = connection.CreateCommand())
            {
                createQuoteDescriptionsTable.CommandText = @"CREATE TABLE IF NOT EXISTS ""QuoteDescriptions"" (""Id"" uuid PRIMARY KEY, ""Value"" varchar(1000) NOT NULL UNIQUE);";
                await createQuoteDescriptionsTable.ExecuteNonQueryAsync();
            }

            // Ensure seed users exist even when the rest of the data has already been seeded
            await using (var ensureUsers = connection.CreateCommand())
            {
                ensureUsers.CommandText = @"SELECT 1 FROM ""Users"" LIMIT 1;";
                var usersExist = await ensureUsers.ExecuteScalarAsync();
                if (usersExist == null)
                {
                    string HashPassword(string password)
                    {
                        using var rng = System.Security.Cryptography.RandomNumberGenerator.Create();
                        var salt = new byte[16];
                        rng.GetBytes(salt);
                        const int iter = 100_000;
                        using var pbkdf2 = new System.Security.Cryptography.Rfc2898DeriveBytes(password, salt, iter, System.Security.Cryptography.HashAlgorithmName.SHA256);
                        var hash = pbkdf2.GetBytes(32);
                        return $"{iter}.{Convert.ToBase64String(salt)}.{Convert.ToBase64String(hash)}";
                    }

                    var adminHash = HashPassword("adminpass");
                    var userHash = HashPassword("userpass");

                    await using var insertCmd = connection.CreateCommand();
                    insertCmd.CommandText = @"INSERT INTO ""Users"" (""Id"", ""Username"", ""PasswordHash"", ""Role"", ""CreatedAt"") VALUES (@id1, @u1, @p1, @r1, @c1), (@id2, @u2, @p2, @r2, @c2);";
                    var id1 = Guid.NewGuid();
                    var id2 = Guid.NewGuid();
                    insertCmd.Parameters.AddWithValue("@id1", NpgsqlTypes.NpgsqlDbType.Uuid, id1);
                    insertCmd.Parameters.AddWithValue("@u1", NpgsqlTypes.NpgsqlDbType.Varchar, "admin");
                    insertCmd.Parameters.AddWithValue("@p1", NpgsqlTypes.NpgsqlDbType.Text, adminHash);
                    insertCmd.Parameters.AddWithValue("@r1", NpgsqlTypes.NpgsqlDbType.Varchar, "Admin");
                    insertCmd.Parameters.AddWithValue("@c1", NpgsqlTypes.NpgsqlDbType.TimestampTz, DateTime.UtcNow);

                    insertCmd.Parameters.AddWithValue("@id2", NpgsqlTypes.NpgsqlDbType.Uuid, id2);
                    insertCmd.Parameters.AddWithValue("@u2", NpgsqlTypes.NpgsqlDbType.Varchar, "user");
                    insertCmd.Parameters.AddWithValue("@p2", NpgsqlTypes.NpgsqlDbType.Text, userHash);
                    insertCmd.Parameters.AddWithValue("@r2", NpgsqlTypes.NpgsqlDbType.Varchar, "User");
                    insertCmd.Parameters.AddWithValue("@c2", NpgsqlTypes.NpgsqlDbType.TimestampTz, DateTime.UtcNow);

                    await insertCmd.ExecuteNonQueryAsync();
                }
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
                    VendorNumber = "VN-1001",
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
                    VendorNumber = "VN-2002",
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
                    VendorNumber = "VN-3003",
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
                    QuoteNumber = "Q2026050000",
                    Reference = "Q-1001-UNISA",
                    Date = DateTime.UtcNow.AddDays(-8),
                    ValidityDays = 30,
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
                    QuoteNumber = "Q2026050001",
                    Reference = "Q-1002-ACME",
                    Date = DateTime.UtcNow.AddDays(-14),
                    ValidityDays = 45,
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
                    QuoteNumber = "Q2026050002",
                    Reference = "Q-1003-SAR",
                    Date = DateTime.UtcNow.AddDays(-3),
                    ValidityDays = 21,
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

            var quoteUoms = quotes
                .SelectMany(q => q.Items.Select(item => item.Uom.Trim()))
                .Where(value => !string.IsNullOrWhiteSpace(value))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .Select(value => new QuoteUom { Id = Guid.NewGuid(), Value = value })
                .ToList();

            var quoteDescriptions = quotes
                .SelectMany(q => q.Items.Select(item => item.Description.Trim()))
                .Where(value => !string.IsNullOrWhiteSpace(value))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .Select(value => new QuoteDescription { Id = Guid.NewGuid(), Value = value })
                .ToList();

            await context.QuoteUoms.AddRangeAsync(quoteUoms);
            await context.QuoteDescriptions.AddRangeAsync(quoteDescriptions);
            await context.SaveChangesAsync();

            await context.Database.ExecuteSqlInterpolatedAsync($@"INSERT INTO ""SeedHistory"" (""Id"", ""SeededAt"") VALUES ({Guid.NewGuid()}, {DateTime.UtcNow});");
        }
    }
}
