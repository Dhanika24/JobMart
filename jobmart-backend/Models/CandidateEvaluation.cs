using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace jobmart.Models
{
    public class CandidateEvaluation
    {
        [Key]
        public int EvaluationId { get; set; }

        [Required]
        public int JobApplicationId { get; set; }

        [ForeignKey(nameof(JobApplicationId))]
        public JobApplication? JobApplication { get; set; }

        [Required]
        public int HiringManagerId { get; set; }

        [ForeignKey(nameof(HiringManagerId))]
        public User? HiringManager { get; set; }

        [Range(0, 10)]
        public int TechnicalScore { get; set; }

        [Range(0, 10)]
        public int CommunicationScore { get; set; }

        [Range(0, 10)]
        public int ExperienceScore { get; set; }

        [Range(0, 10)]
        public int ProblemSolvingScore { get; set; }

        [Range(0, 10)]
        public int CultureFitScore { get; set; }

        public decimal OverallScore { get; set; }

        [MaxLength(2000)]
        public string? Feedback { get; set; }

        [Required]
        [MaxLength(50)]
        public string Recommendation { get; set; } = "Consider";

        [MaxLength(50)]
        public string Decision { get; set; } = "Pending";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}