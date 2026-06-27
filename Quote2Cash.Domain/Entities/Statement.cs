using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace Quote2Cash.Domain.Entities
{
    public class Statement
    {
        public Guid Id { get; set; }
        public string StatementNumber { get; set; } = string.Empty;
        public int DueDays { get; set; } = 30;
        public Guid ClientId { get; set; }
        
        [ForeignKey("ClientId")]
        public Client? Client { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public List<StatementItem> Items { get; set; } = new();
    }
}