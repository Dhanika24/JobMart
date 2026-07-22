using System.ComponentModel.DataAnnotations;

namespace jobmart.DTOs
{
    public class HiringDecisionDto
    {
        [Required]
        public string Decision { get; set; } = string.Empty;
    }
}