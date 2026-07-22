namespace jobmart.DTOs
{
    public class CandidateRankingResultDto
    {
        public int ApplicationId { get; set; }

        public int CandidateProfileId { get; set; }

        public string CandidateName { get; set; } = string.Empty;

        public string CandidateEmail { get; set; } = string.Empty;

        public string JobTitle { get; set; } = string.Empty;

        public double SkillsScore { get; set; }

        public double ExperienceScore { get; set; }

        public double EducationScore { get; set; }

        public double TotalScore { get; set; }

        public string MatchLevel { get; set; } = string.Empty;

        public string ApplicationStatus { get; set; } = string.Empty;
    }
}