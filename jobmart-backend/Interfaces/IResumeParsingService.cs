namespace jobmart.Interfaces
{
    public interface IResumeParsingService
    {
        Task<ResumeParsingResult>
            ParseResumeAsync(
                string fullFilePath);

        List<string> ExtractSkills(
            string resumeText);

        string? ExtractEducation(
            string resumeText);

        string? ExtractExperience(
            string resumeText);
    }

    public class ResumeParsingResult
    {
        public bool Success { get; set; }

        public string ExtractedText { get; set; } =
            string.Empty;

        public List<string> Skills { get; set; } =
            new List<string>();

        public string? Education { get; set; }

        public string? Experience { get; set; }

        public string? ErrorMessage { get; set; }
    }
}