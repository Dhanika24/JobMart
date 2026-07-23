namespace jobmart.DTOs
{
    public class SystemErrorDto
    {
        public int AuditLogId { get; set; }

        public int? UserId { get; set; }

        public string UserName { get; set; } = string.Empty;

        public string Action { get; set; } = string.Empty;

        public string EntityType { get; set; } = string.Empty;

        public string Details { get; set; } = string.Empty;

        public string IpAddress { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; }
    }
}