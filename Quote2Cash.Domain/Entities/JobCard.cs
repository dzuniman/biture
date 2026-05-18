using System;
using System.Collections.Generic;

namespace Quote2Cash.Domain.Entities
{
    public class JobCard
    {
        public Guid Id { get; set; }
        public Guid? ClientId { get; set; }
        public Client? Client { get; set; }
        public string JobNumber { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public decimal TotalCost { get; set; }

        public ICollection<Cost> Costs { get; set; } = new List<Cost>();
    }
}
