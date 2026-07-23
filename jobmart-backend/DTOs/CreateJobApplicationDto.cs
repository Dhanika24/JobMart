using System.ComponentModel.DataAnnotations;

namespace jobmart.DTOs
{
    public class CreateJobApplicationDto
    {
        [Required]
        public int JobId { get; set; }

        [MaxLength(2000)]
        public string? CoverLetter { get; set; }
    }
}