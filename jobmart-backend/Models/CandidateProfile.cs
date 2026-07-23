using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace jobmart.Models
{
    public class CandidateProfile
    {
        [Key]
        public int CandidateProfileId { get; set; }

        [Required]
        public int UserId { get; set; }

        [ForeignKey(nameof(UserId))]
        public User? User { get; set; }

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

        [MaxLength(500)]
        public string? LinkedInUrl { get; set; }

        [MaxLength(500)]
        public string? PortfolioUrl { get; set; }

        [MaxLength(500)]
        public string? Address { get; set; }

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}