// Quote2Cash.Domain/Entities/Client.cs
using System;
using System.Collections.Generic;

namespace Quote2Cash.Domain.Entities
{
    public class Client
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? VendorNumber { get; set; }
        public string? AddressLine1 { get; set; }
        public string? AddressLine2 { get; set; }
        public string? AddressLine3 { get; set; }
        public string? AddressLine4 { get; set; }
        public string? RepresentativeName { get; set; }
        public string? RepresentativeNumber { get; set; }
        // New properties
        public string? VatNumber { get; set; }
        public string? Email { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        public ICollection<Quote> Quotes { get; set; } = new List<Quote>();
        public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
        public ICollection<Statement> Statements { get; set; } = new List<Statement>();
        public ICollection<Cost> Costs { get; set; } = new List<Cost>();
    }
}