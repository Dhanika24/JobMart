using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace jobmart.Models
{
    public class JobApplication
    {
        [Key]
        public int JobApplicationId { get; set; }

        [Required]
        public int JobId { get; set; }

        [ForeignKey(nameof(JobId))]
        public JobPosting? JobPosting { get; set; }

        [Required]
        public int CandidateProfileId { get; set; }

        [ForeignKey(nameof(CandidateProfileId))]
        public CandidateProfile? CandidateProfile { get; set; }

        [MaxLength(2000)]
        public string? CoverLetter { get; set; }

        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "Pending";

        // AI-generated candidate matching score from 0 to 100
        [Range(0, 100)]
        public double AIScore { get; set; } = 0;

        public DateTime AppliedAt { get; set; } = DateTime.UtcNow;
    }
}