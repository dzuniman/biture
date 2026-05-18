using System;

namespace Quote2Cash.Domain.Entities
{
    public class Cost
    {
        public Guid Id { get; set; }
        public Guid? ClientId { get; set; }
        public Client? Client { get; set; }
        public Guid? JobCardId { get; set; }
        public JobCard? JobCard { get; set; }
        public string Category { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime IncurredAt { get; set; }
    }
}
