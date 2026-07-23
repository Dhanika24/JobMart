namespace jobmart.DTOs
{
    public class JobRecommendationResultDto
    {
        public int JobId { get; set; }

        public string Title { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public string Requirements { get; set; } = string.Empty;

        public string Location { get; set; } = string.Empty;

        public string EmploymentType { get; set; } = string.Empty;

        public decimal? SalaryMin { get; set; }

        public decimal? SalaryMax { get; set; }

        public DateTime Deadline { get; set; }

        public string Status { get; set; } = string.Empty;

        public double SkillsScore { get; set; }

        public double ExperienceScore { get; set; }

        public double EducationScore { get; set; }

        public double TotalScore { get; set; }

        public string MatchLevel { get; set; } = string.Empty;

        public List<string> MatchedSkills { get; set; } = new();

        public List<string> MissingSkills { get; set; } = new();

        public bool HasApplied { get; set; }

        public int? ApplicationId { get; set; }

        public string? ApplicationStatus { get; set; }
    }
}