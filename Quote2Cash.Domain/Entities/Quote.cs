using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;

namespace Quote2Cash.Domain.Entities
{
    public class Quote
    {
        public Guid Id { get; set; }
        public int QuoteNumber { get; set; }
        public string Reference { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public int ValidityDays { get; set; }
        public string VendorNumber { get; set; } = string.Empty;
        public Guid? ClientId { get; set; }
        public Client? Client { get; set; }

        public ICollection<QuoteItem> Items { get; set; } = new List<QuoteItem>();

        [NotMapped]
        public decimal SubTotal => Items.Sum(item => item.TotalPrice);

        [NotMapped]
        public decimal Vat => Math.Round(SubTotal * 0.15m, 2);

        [NotMapped]
        public decimal Total => SubTotal + Vat;

        public string Description { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? DueDate { get; set; }
    }
}
