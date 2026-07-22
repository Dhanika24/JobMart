using System.ComponentModel.DataAnnotations;

namespace jobmart.DTOs
{
    public class CreateEvaluationDto
    {
        [Required]
        public int JobApplicationId { get; set; }

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

        [MaxLength(2000)]
        public string? Feedback { get; set; }

        [Required]
        [MaxLength(50)]
        public string Recommendation { get; set; } = "Consider";
    }
}