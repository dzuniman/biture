using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
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
        public DbSet<User> Users { get; set; } = null!;
        public DbSet<Quote> Quotes { get; set; } = null!;
        public DbSet<QuoteItem> QuoteItems { get; set; } = null!;
        public DbSet<QuoteDescription> QuoteDescriptions { get; set; } = null!;
        public DbSet<JobCard> JobCards { get; set; } = null!;
        public DbSet<Cost> Costs { get; set; } = null!;
        public DbSet<Invoice> Invoices { get; set; } = null!;
        public DbSet<Statement> Statements { get; set; } = null!;
        public DbSet<StatementItem> StatementItems { get; set; } = null!;

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            // Suppress the exception for pending model changes (EF Core 9 feature)
            optionsBuilder.ConfigureWarnings(w => w.Ignore(RelationalEventId.PendingModelChangesWarning));
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Client>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
                entity.Property(e => e.VendorNumber).HasMaxLength(150);
                entity.Property(e => e.AddressLine1).HasMaxLength(300);
                entity.Property(e => e.AddressLine2).HasMaxLength(300);
                entity.Property(e => e.AddressLine3).HasMaxLength(300);
                entity.Property(e => e.AddressLine4).HasMaxLength(300);
                entity.Property(e => e.RepresentativeName).HasMaxLength(200);
                entity.Property(e => e.RepresentativeNumber).HasMaxLength(100);
                // New properties configuration
                entity.Property(e => e.VatNumber).HasMaxLength(50);
                entity.Property(e => e.Email).HasMaxLength(200);
                // ... other configurations
            });

            modelBuilder.Entity<Quote>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.QuoteNumber).IsRequired().HasMaxLength(32);
                entity.Property(e => e.Reference).HasMaxLength(100);
                entity.Property(e => e.Date).IsRequired();
                entity.Property(e => e.ValidityDays).IsRequired();
                entity.Property(e => e.Description).HasMaxLength(2000);
                entity.HasOne(e => e.Client).WithMany(c => c.Quotes).HasForeignKey(e => e.ClientId);
            });

            modelBuilder.Entity<QuoteItem>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.ItemNumber).IsRequired();
                entity.Property(e => e.Quantity).HasPrecision(18, 2);
                entity.Property(e => e.Code).HasMaxLength(150);
                entity.Property(e => e.Uom).HasMaxLength(80);
                entity.Property(e => e.Description).HasMaxLength(1000);
                entity.Property(e => e.UnitPrice).HasPrecision(18, 2);
                entity.Property(e => e.TotalPrice).HasPrecision(18, 2);
                entity.HasOne(e => e.Quote).WithMany(q => q.Items).HasForeignKey(e => e.QuoteId).OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<QuoteDescription>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Code).IsRequired().HasMaxLength(150);
                entity.Property(e => e.Uom).IsRequired().HasMaxLength(150);
                entity.Property(e => e.Description).IsRequired().HasMaxLength(1000);
                entity.HasIndex(e => e.Code).IsUnique();
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
                entity.Property(e => e.StatementNumber).IsRequired().HasMaxLength(100);
                entity.Property(e => e.CreatedAt).IsRequired();

                entity.HasOne(e => e.Client)
                      .WithMany(c => c.Statements)
                      .HasForeignKey(e => e.ClientId)
                      .OnDelete(DeleteBehavior.Restrict);

                entity.HasMany(e => e.Items)
                      .WithOne(i => i.Statement)
                      .HasForeignKey(i => i.StatementId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<StatementItem>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.PaymentAmount).HasPrecision(18, 2);
                entity.Property(e => e.Description).HasMaxLength(1000);
                entity.Property(e => e.PaymentDate).IsRequired();

                entity.HasOne(e => e.Invoice)
                      .WithMany()
                      .HasForeignKey(e => e.InvoiceId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Username).IsRequired().HasMaxLength(200);
                entity.HasIndex(e => e.Username).IsUnique();
                entity.Property(e => e.PasswordHash).IsRequired();
                entity.Property(e => e.Role).IsRequired().HasMaxLength(100);
                entity.Property(e => e.CreatedAt).IsRequired();
            });
        }
    }
}
