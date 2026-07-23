namespace jobmart.DTOs
{
    public class ResumeResponseDto
    {
        public int ResumeId { get; set; }

        public string OriginalFileName { get; set; } =
            string.Empty;

        public string ContentType { get; set; } =
            string.Empty;

        public long FileSize { get; set; }

        public bool IsPrimary { get; set; }

        public string ParsingStatus { get; set; } =
            "Pending";

        public string? ExtractedSkills { get; set; }

        public string? ExtractedEducation { get; set; }

        public string? ExtractedExperience { get; set; }

        public string? ParsingError { get; set; }

        public DateTime UploadedAt { get; set; }

        public DateTime? ParsedAt { get; set; }

        public string DownloadUrl { get; set; } =
            string.Empty;
    }
}