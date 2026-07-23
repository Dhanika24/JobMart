namespace jobmart.DTOs
{
    public class SystemHealthDto
    {
        public string Status { get; set; } = string.Empty;

        public string ApiStatus { get; set; } = string.Empty;

        public string DatabaseStatus { get; set; } = string.Empty;

        public DateTime CheckedAtUtc { get; set; }

        public long ResponseTimeMilliseconds { get; set; }

        public string Environment { get; set; } = string.Empty;

        public string ApplicationVersion { get; set; } = string.Empty;
    }
}