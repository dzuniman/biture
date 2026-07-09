using System;
using System.Collections.Generic;

namespace Quote2Cash.Domain.Entities
{
    public class Cost
    {
        public Guid Id { get; set; }
        public string Description { get; set; } = string.Empty;
        public decimal Margin { get; set; }
        public DateTime Date { get; set; }
        public ICollection<CostQuoteItem> Items { get; set; } = new List<CostQuoteItem>();
    }
}
