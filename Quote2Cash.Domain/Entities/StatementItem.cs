using System;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Quote2Cash.Domain.Entities
{
    public class StatementItem
    {
        public Guid Id { get; set; }
        public Guid StatementId { get; set; }
        public Guid InvoiceId { get; set; }
        public decimal PaymentAmount { get; set; }
        public string Description { get; set; } = string.Empty;
        public DateTime PaymentDate { get; set; }

        [JsonIgnore]
        [ForeignKey("StatementId")]
        public Statement? Statement { get; set; }
        
        // Linked invoice for navigation and data integrity
        [ForeignKey("InvoiceId")]
        public Invoice? Invoice { get; set; }
    }
}