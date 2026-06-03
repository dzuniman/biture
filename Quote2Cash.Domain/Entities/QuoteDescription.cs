using System;

namespace Quote2Cash.Domain.Entities
{
    public class QuoteDescription
    {
        public Guid Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Uom { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }
}
