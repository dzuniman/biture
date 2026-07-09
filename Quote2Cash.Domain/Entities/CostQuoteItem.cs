using System;

namespace Quote2Cash.Domain.Entities
{
    public class CostQuoteItem
    {
        public Guid Id { get; set; }
        public Guid CostId { get; set; }
        public Cost? Cost { get; set; }
        public int ItemNumber { get; set; }
        public decimal Quantity { get; set; }
        public string Uom { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal UnitPrice { get; set; }
        public string SupplierName { get; set; } = string.Empty;
        public string SupplierDescription { get; set; } = string.Empty;
        public decimal SupplierCost { get; set; }
        public string OtherName { get; set; } = string.Empty;
        public string OtherDescription { get; set; } = string.Empty;
        public decimal OtherCost { get; set; }
    }
}
