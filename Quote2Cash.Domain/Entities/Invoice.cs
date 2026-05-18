using System;

namespace Quote2Cash.Domain.Entities
{
    public class Invoice
    {
        public Guid Id { get; set; }
        public Guid? ClientId { get; set; }
        public Client? Client { get; set; }
        public string InvoiceNumber { get; set; } = string.Empty;
        public Guid? QuoteId { get; set; }
        public Quote? Quote { get; set; }
        public decimal Amount { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime DueDate { get; set; }
    }
}
