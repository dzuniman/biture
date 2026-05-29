using System;

namespace Quote2Cash.Domain.Entities
{
    public class QuoteDescription
    {
        public Guid Id { get; set; }
        public string Value { get; set; } = string.Empty;
    }
}
