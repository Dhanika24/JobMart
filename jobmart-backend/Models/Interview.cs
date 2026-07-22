using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace jobmart.Models
{
    public class Interview
    {
        [Key]
        public int InterviewId { get; set; }

        [Required]
        public int JobApplicationId { get; set; }

        [ForeignKey(nameof(JobApplicationId))]
        public JobApplication? JobApplication { get; set; }

        [Required]
        public DateTime ScheduledDateTime { get; set; }

        [Required]
        [MaxLength(50)]
        public string InterviewType { get; set; } = "Online";

        [MaxLength(500)]
        public string? MeetingLinkOrLocation { get; set; }

        [MaxLength(1000)]
        public string? Notes { get; set; }

        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "Scheduled";

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}