using System.ComponentModel.DataAnnotations;

namespace jobmart.Models
{
    public class AuditLog
    {
        [Key]
        public int AuditLogId { get; set; }

        // Nullable because some actions, such as failed
        // login attempts, may not have a valid user.
        public int? UserId { get; set; }

        [MaxLength(100)]
        public string? UserName { get; set; }

        [MaxLength(30)]
        public string? Role { get; set; }

        [Required]
        [MaxLength(100)]
        public string Action { get; set; } =
            string.Empty;

        [Required]
        [MaxLength(100)]
        public string EntityType { get; set; } =
            string.Empty;

        [MaxLength(100)]
        public string? EntityId { get; set; }

        [Required]
        [MaxLength(1000)]
        public string Details { get; set; } =
            string.Empty;

        [MaxLength(100)]
        public string? IpAddress { get; set; }

        public DateTime CreatedAt { get; set; } =
            DateTime.UtcNow;

        public User? User { get; set; }
    }
}