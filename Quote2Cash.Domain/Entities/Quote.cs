using System;

namespace Quote2Cash.Domain.Entities
{
    public class Quote
    {
        public Guid Id { get; set; }
        public Guid? ClientId { get; set; }
        public Client? Client { get; set; }
        public string Reference { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? DueDate { get; set; }
    }
}
