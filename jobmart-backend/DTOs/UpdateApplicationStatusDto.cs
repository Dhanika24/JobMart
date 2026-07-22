using System.ComponentModel.DataAnnotations;

namespace jobmart.DTOs
{
    public class UpdateApplicationStatusDto
    {
        [Required]
        public string Status { get; set; } = string.Empty;
    }
}