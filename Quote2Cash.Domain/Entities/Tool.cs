using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Quote2Cash.Domain.Entities
{
    public class Tool
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Code { get; set; } = string.Empty;

        [Required]
        [MaxLength(1000)]
        public string Description { get; set; } = string.Empty;

        [Column(TypeName = "decimal(18, 2)")]
        public decimal Quantity { get; set; }

        [MaxLength(250)]
        public string? Location { get; set; }

        [MaxLength(500)]
        public string? ImagePath { get; set; }

        [Column(TypeName = "decimal(18, 2)")]
        public decimal Value { get; set; }

        public DateTime? InspectionDate { get; set; }
    }
}
