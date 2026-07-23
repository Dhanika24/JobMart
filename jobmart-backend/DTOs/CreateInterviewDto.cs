using System.ComponentModel.DataAnnotations;

namespace jobmart.DTOs
{
    public class CreateInterviewDto
    {
        [Required]
        public int JobApplicationId { get; set; }

        [Required]
        public DateTime ScheduledDateTime { get; set; }

        [Required]
        [MaxLength(50)]
        public string InterviewType { get; set; } = "Online";

        [MaxLength(500)]
        public string? MeetingLinkOrLocation { get; set; }

        [MaxLength(1000)]
        public string? Notes { get; set; }
    }
}