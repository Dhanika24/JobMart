using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace jobmart.Models
{
    public class Resume
    {
        [Key]
        public int ResumeId { get; set; }

        [Required]
        public int CandidateProfileId { get; set; }

        [ForeignKey(nameof(CandidateProfileId))]
        public CandidateProfile? CandidateProfile
        {
            get;
            set;
        }

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

        public bool IsPrimary { get; set; } =
            false;

        // Full text extracted from the uploaded CV.
        public string? ExtractedText { get; set; }

        // Comma-separated skills detected from the CV.
        public string? ExtractedSkills { get; set; }

        // Education information detected from the CV.
        public string? ExtractedEducation { get; set; }

        // Work experience information detected from the CV.
        public string? ExtractedExperience { get; set; }

        [Required]
        [MaxLength(30)]
        public string ParsingStatus { get; set; } =
            "Pending";

        [MaxLength(1000)]
        public string? ParsingError { get; set; }

        public DateTime UploadedAt { get; set; } =
            DateTime.UtcNow;

        public DateTime? ParsedAt { get; set; }
    }
}