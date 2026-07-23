using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace jobmart.Models
{
    public class CandidateDocument
    {
        [Key]
        public int CandidateDocumentId { get; set; }

        [Required]
        public int CandidateProfileId { get; set; }

        [ForeignKey(nameof(CandidateProfileId))]
        public CandidateProfile? CandidateProfile
        {
            get;
            set;
        }

        [Required]
        [MaxLength(50)]
        public string DocumentType { get; set; } =
            "Other";

        [Required]
        [MaxLength(255)]
        public string OriginalFileName { get; set; } =
            string.Empty;

        [Required]
        [MaxLength(255)]
        public string StoredFileName { get; set; } =
            string.Empty;

        [Required]
        [MaxLength(500)]
        public string FilePath { get; set; } =
            string.Empty;

        [Required]
        [MaxLength(100)]
        public string ContentType { get; set; } =
            string.Empty;

        public long FileSize { get; set; }

        [MaxLength(500)]
        public string? Description { get; set; }

        public DateTime UploadedAt { get; set; } =
            DateTime.UtcNow;
    }
}