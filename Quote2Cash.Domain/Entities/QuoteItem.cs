using System;

namespace Quote2Cash.Domain.Entities
{
    public class QuoteItem
    {
        public Guid Id { get; set; }
        public Guid QuoteId { get; set; }
        public Quote? Quote { get; set; }

        public int ItemNumber { get; set; }
        public decimal Quantity { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Uom { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal UnitPrice { get; set; }
        public decimal TotalPrice { get; set; }
    }
}
