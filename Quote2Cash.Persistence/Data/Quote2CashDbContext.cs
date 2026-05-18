using Microsoft.EntityFrameworkCore;
using Quote2Cash.Domain.Entities;

namespace Quote2Cash.Persistence.Data
{
    public class Quote2CashDbContext : DbContext
    {
        public Quote2CashDbContext(DbContextOptions<Quote2CashDbContext> options)
            : base(options)
        {
        }

        public DbSet<Client> Clients { get; set; } = null!;
        public DbSet<Quote> Quotes { get; set; } = null!;
        public DbSet<JobCard> JobCards { get; set; } = null!;
        public DbSet<Cost> Costs { get; set; } = null!;
        public DbSet<Invoice> Invoices { get; set; } = null!;
        public DbSet<Statement> Statements { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Client>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
                entity.Property(e => e.AccountNumber).HasMaxLength(100);
                entity.Property(e => e.Industry).HasMaxLength(150);
                entity.Property(e => e.ContactName).HasMaxLength(200);
                entity.Property(e => e.Email).HasMaxLength(200);
            });

            modelBuilder.Entity<Quote>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Reference).HasMaxLength(100);
                entity.Property(e => e.CustomerName).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Description).HasMaxLength(1000);
                entity.Property(e => e.Amount).HasPrecision(18, 2);
                entity.Property(e => e.Status).IsRequired().HasMaxLength(100);
                entity.Property(e => e.CreatedAt).IsRequired();
                entity.Property(e => e.DueDate);
                entity.HasOne(e => e.Client).WithMany(c => c.Quotes).HasForeignKey(e => e.ClientId);
            });

            modelBuilder.Entity<JobCard>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.JobNumber).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Description).HasMaxLength(1000);
                entity.Property(e => e.Status).IsRequired().HasMaxLength(100);
                entity.Property(e => e.TotalCost).HasPrecision(18, 2);
                entity.Property(e => e.CreatedAt).IsRequired();
                entity.HasOne(e => e.Client).WithMany(c => c.JobCards).HasForeignKey(e => e.ClientId);
            });

            modelBuilder.Entity<Cost>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Category).IsRequired().HasMaxLength(150);
                entity.Property(e => e.Description).HasMaxLength(1000);
                entity.Property(e => e.Amount).HasPrecision(18, 2);
                entity.Property(e => e.Status).IsRequired().HasMaxLength(100);
                entity.Property(e => e.IncurredAt).IsRequired();
                entity.HasOne(e => e.Client).WithMany(c => c.Costs).HasForeignKey(e => e.ClientId);
                entity.HasOne(e => e.JobCard).WithMany(j => j.Costs).HasForeignKey(e => e.JobCardId);
            });

            modelBuilder.Entity<Invoice>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.InvoiceNumber).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Amount).HasPrecision(18, 2);
                entity.Property(e => e.Status).IsRequired().HasMaxLength(100);
                entity.Property(e => e.CreatedAt).IsRequired();
                entity.Property(e => e.DueDate).IsRequired();
                entity.HasOne(e => e.Client).WithMany(c => c.Invoices).HasForeignKey(e => e.ClientId);
                entity.HasOne(e => e.Quote).WithMany().HasForeignKey(e => e.QuoteId);
            });

            modelBuilder.Entity<Statement>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Period).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Balance).HasPrecision(18, 2);
                entity.Property(e => e.Status).IsRequired().HasMaxLength(100);
                entity.Property(e => e.CreatedAt).IsRequired();
                entity.HasOne(e => e.Client).WithMany(c => c.Statements).HasForeignKey(e => e.ClientId);
            });
        }
    }
}
