using System;

namespace Quote2Cash.Domain.Entities
{
    public class Statement
    {
        public Guid Id { get; set; }
        public Guid? ClientId { get; set; }
        public Client? Client { get; set; }
        public string Period { get; set; } = string.Empty;
        public decimal Balance { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
}
