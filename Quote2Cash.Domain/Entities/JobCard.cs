using System;

namespace Quote2Cash.Domain.Entities
{
    public class JobCard
    {
        public Guid Id { get; set; }
        public string JobCardNumber { get; set; } = string.Empty;
        public string Reference { get; set; } = string.Empty;
        public string QuoteNumber { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
