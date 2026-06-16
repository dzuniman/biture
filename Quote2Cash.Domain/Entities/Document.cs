// c:\Staff\Documents\Other\Vutivi\Quote2Cash\Code\Quote2Cash\Quote2Cash.Domain\Entities\Document.cs
using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Quote2Cash.Domain.Entities
{
    public class Document
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        [MaxLength(250)]
        public string DocumentName { get; set; } // User-friendly name for the document

        [MaxLength(1000)]
        public string? Description { get; set; }

        [Required]
        [MaxLength(500)]
        public string FileName { get; set; } // Actual file name on disk (e.g., with GUID to prevent collisions)

        [Required]
        [MaxLength(1000)]
        public string FilePath { get; set; } // Full path to the file on the server

        [Required]
        [MaxLength(100)]
        public string ContentType { get; set; } // MIME type of the file

        public DateTime UploadedAt { get; set; }
    }
}
