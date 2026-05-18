using Microsoft.EntityFrameworkCore;
using Quote2Cash.Domain.Entities;
using Quote2Cash.Persistence.Data;

namespace Quote2Cash.Persistence.Services
{
    public static class SeedData
    {
        public static async Task EnsureSeedDataAsync(Quote2CashDbContext context)
        {
            if (await context.Clients.AnyAsync())
            {
                return;
            }

            var clients = new List<Client>
            {
                new Client
                {
                    Id = Guid.NewGuid(),
                    Name = "UNISA",
                    AccountNumber = "UNISA-001",
                    Industry = "Education",
                    ContactName = "Finance Team",
                    Email = "finance@unisa.ac.za"
                },
                new Client
                {
                    Id = Guid.NewGuid(),
                    Name = "Acme Holdings",
                    AccountNumber = "ACME-002",
                    Industry = "Manufacturing",
                    ContactName = "Riaan van der Merwe",
                    Email = "riaan@acme.example.com"
                },
                new Client
                {
                    Id = Guid.NewGuid(),
                    Name = "South African Railways",
                    AccountNumber = "SAR-003",
                    Industry = "Transport",
                    ContactName = "Nokuthula Ndlovu",
                    Email = "nokuthula@sar.example.com"
                }
            };

            var statuses = new[] { "Draft", "Submitted", "Approved", "Rejected" };
            var now = DateTime.UtcNow;

            var quotes = clients.SelectMany((client, index) =>
                Enumerable.Range(1, 5).Select(i => new Quote
                {
                    Id = Guid.NewGuid(),
                    ClientId = client.Id,
                    Reference = $"Q-{index + 1:00}{i:000}",
                    CustomerName = client.Name,
                    Description = $"Quote for {client.Name} project {i}",
                    Amount = Math.Round((decimal)(1500 + Random.Shared.NextDouble() * 12500), 2),
                    Status = statuses[Random.Shared.Next(statuses.Length)],
                    CreatedAt = now.AddDays(-Random.Shared.Next(0, 120)),
                    DueDate = now.AddDays(Random.Shared.Next(15, 45))
                })).ToList();

            var jobCards = clients.SelectMany((client, index) =>
                Enumerable.Range(1, 3).Select(i => new JobCard
                {
                    Id = Guid.NewGuid(),
                    ClientId = client.Id,
                    JobNumber = $"JC-{index + 1:00}{i:000}",
                    Description = $"Job card for {client.Name} task {i}",
                    Status = statuses[Random.Shared.Next(statuses.Length)],
                    CreatedAt = now.AddDays(-Random.Shared.Next(0, 150)),
                    StartDate = now.AddDays(-Random.Shared.Next(100, 150)),
                    EndDate = now.AddDays(-Random.Shared.Next(1, 30)),
                    TotalCost = Math.Round((decimal)(2000 + Random.Shared.NextDouble() * 15000), 2)
                })).ToList();

            var costs = jobCards.SelectMany(job =>
                Enumerable.Range(1, 4).Select(i => new Cost
                {
                    Id = Guid.NewGuid(),
                    ClientId = job.ClientId,
                    JobCardId = job.Id,
                    Category = i % 2 == 0 ? "Material" : "Labour",
                    Description = $"Cost line {i} for {job.JobNumber}",
                    Amount = Math.Round((decimal)(200 + Random.Shared.NextDouble() * 2200), 2),
                    Status = statuses[Random.Shared.Next(statuses.Length)],
                    IncurredAt = job.CreatedAt.AddDays(i * 3)
                })).ToList();

            var quotesByClient = quotes
                .GroupBy(q => q.ClientId)
                .Where(g => g.Key.HasValue)
                .ToDictionary(g => g.Key!.Value, g => g.ToList());

            var invoices = clients.SelectMany((client, index) =>
                Enumerable.Range(1, 2).Select(i =>
                {
                    var clientQuotes = quotesByClient.GetValueOrDefault(client.Id) ?? new List<Quote>();
                    var attachedQuote = clientQuotes.Count > 0 ? clientQuotes[Random.Shared.Next(clientQuotes.Count)] : null;
                    var amount = attachedQuote != null
                        ? Math.Round(attachedQuote.Amount * (decimal)(0.75 + Random.Shared.NextDouble() * 0.5), 2)
                        : Math.Round((decimal)(3500 + Random.Shared.NextDouble() * 18000), 2);

                    return new Invoice
                    {
                        Id = Guid.NewGuid(),
                        ClientId = client.Id,
                        QuoteId = attachedQuote?.Id,
                        InvoiceNumber = $"INV-{index + 1:00}{i:000}",
                        Amount = amount,
                        Status = i % 2 == 0 ? "Paid" : "Unpaid",
                        CreatedAt = now.AddDays(-Random.Shared.Next(15, 90)),
                        DueDate = now.AddDays(Random.Shared.Next(15, 60))
                    };
                })).ToList();

            foreach (var job in jobCards)
            {
                job.TotalCost = costs.Where(c => c.JobCardId == job.Id).Sum(c => c.Amount);
            }

            var statements = clients.Select(client =>
            {
                var clientInvoices = invoices.Where(i => i.ClientId == client.Id).ToList();
                var unpaidInvoiceAmount = clientInvoices.Where(i => i.Status != "Paid").Sum(i => i.Amount);
                var clientCostAmount = costs.Where(c => c.ClientId == client.Id).Sum(c => c.Amount);
                var balance = Math.Round(unpaidInvoiceAmount + clientCostAmount * 0.15m, 2);

                return new Statement
                {
                    Id = Guid.NewGuid(),
                    ClientId = client.Id,
                    Period = "2026-Q2",
                    Balance = Math.Max(balance, 0),
                    Status = "Open",
                    CreatedAt = now.AddDays(-Random.Shared.Next(1, 20))
                };
            }).ToList();

            await context.Clients.AddRangeAsync(clients);
            await context.Quotes.AddRangeAsync(quotes);
            await context.JobCards.AddRangeAsync(jobCards);
            await context.Costs.AddRangeAsync(costs);
            await context.Invoices.AddRangeAsync(invoices);
            await context.Statements.AddRangeAsync(statements);
            await context.SaveChangesAsync();
        }
    }
}
