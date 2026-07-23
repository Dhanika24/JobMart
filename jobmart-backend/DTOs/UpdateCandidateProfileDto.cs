using System.ComponentModel.DataAnnotations;

namespace jobmart.DTOs
{
    public class UpdateCandidateProfileDto
    {
        [MaxLength(20)]
        public string? Phone { get; set; }

        [MaxLength(1000)]
        public string? Bio { get; set; }

        [Range(0, 60)]
        public int ExperienceYears { get; set; }

        [MaxLength(500)]
        public string? Education { get; set; }

        [MaxLength(1000)]
        public string? Skills { get; set; }

        [MaxLength(150)]
        public string? CurrentJobTitle { get; set; }

        [Url]
        [MaxLength(500)]
        public string? LinkedInUrl { get; set; }

        [Url]
        [MaxLength(500)]
        public string? PortfolioUrl { get; set; }

        [MaxLength(500)]
        public string? Address { get; set; }
    }
}