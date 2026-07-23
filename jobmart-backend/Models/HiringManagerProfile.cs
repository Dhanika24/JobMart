using System.ComponentModel.DataAnnotations;

namespace jobmart.Models
{
    public class HiringManagerProfile
    {
        [Key]
        public int HiringManagerProfileId
        {
            get;
            set;
        }

        [Required]
        public int UserId { get; set; }

        public User? User { get; set; }

        public int? OrganizationId { get; set; }

        public Organization? Organization
        {
            get;
            set;
        }

        public int? DepartmentId { get; set; }

        public Department? Department
        {
            get;
            set;
        }

        [MaxLength(120)]
        public string? JobTitle { get; set; }

        [MaxLength(30)]
        public string? PhoneNumber { get; set; }

        [MaxLength(500)]
        public string? ProfessionalSummary
        {
            get;
            set;
        }

        [MaxLength(200)]
        public string? LinkedInUrl { get; set; }

        public DateTime CreatedAt { get; set; } =
            DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }
    }
}