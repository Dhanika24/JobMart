using System.ComponentModel.DataAnnotations;

namespace jobmart.DTOs
{
    public class SendCandidateNotificationDto
    {
        [Required]
        public int JobApplicationId { get; set; }

        [Required]
        [StringLength(150)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [StringLength(2000)]
        public string Message { get; set; } = string.Empty;

        [StringLength(50)]
        public string Type { get; set; } =
            "RecruiterMessage";
    }
}