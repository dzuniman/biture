using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace Quote2Cash.Domain.Entities
{
    public class CreditNote
    {
        public Guid Id { get; set; }
        public Guid ClientId { get; set; }
        
        [ForeignKey("ClientId")]
        public Client? Client { get; set; }
        
        public string CreditNoteNumber { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
