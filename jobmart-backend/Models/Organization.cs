using System.ComponentModel.DataAnnotations;

namespace jobmart.Models
{
    public class Organization
    {
        [Key]
        public int OrganizationId { get; set; }

        [Required]
        [MaxLength(150)]
        public string Name { get; set; } =
            string.Empty;

        [MaxLength(500)]
        public string? Description { get; set; }

        [MaxLength(250)]
        public string? Address { get; set; }

        [MaxLength(30)]
        public string? PhoneNumber { get; set; }

        [EmailAddress]
        [MaxLength(150)]
        public string? Email { get; set; }

        [MaxLength(200)]
        public string? Website { get; set; }

        public bool IsActive { get; set; } =
            true;

        public DateTime CreatedAt { get; set; } =
            DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        public ICollection<Department>
            Departments
        { get; set; } =
            new List<Department>();

        public ICollection<RecruiterProfile>
            RecruiterProfiles
        { get; set; } =
            new List<RecruiterProfile>();

        public ICollection<HiringManagerProfile>
            HiringManagerProfiles
        { get; set; } =
            new List<HiringManagerProfile>();

        public ICollection<JobPosting>
            JobPostings
        { get; set; } =
            new List<JobPosting>();
    }
}