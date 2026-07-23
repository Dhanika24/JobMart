namespace jobmart.DTOs
{
    public class CandidateDocumentResponseDto
    {
        public int CandidateDocumentId { get; set; }

        public string DocumentType { get; set; } =
            string.Empty;

        public string OriginalFileName { get; set; } =
            string.Empty;

        public string ContentType { get; set; } =
            string.Empty;

        public long FileSize { get; set; }

        public string? Description { get; set; }

        public DateTime UploadedAt { get; set; }

        public string DownloadUrl { get; set; } =
            string.Empty;
    }
}