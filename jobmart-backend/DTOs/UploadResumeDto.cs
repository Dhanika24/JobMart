using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace jobmart.DTOs
{
    public class UploadResumeDto
    {
        [Required]
        public IFormFile File { get; set; } = null!;

        public bool IsPrimary { get; set; }
    }
}