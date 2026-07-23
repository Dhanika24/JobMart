using System.ComponentModel.DataAnnotations;

namespace jobmart.Models
{
    public class Department
    {
        [Key]
        public int DepartmentId { get; set; }

        [Required]
        [MaxLength(120)]
        public string Name { get; set; } =
            string.Empty;

        [MaxLength(500)]
        public string? Description { get; set; }

        public bool IsActive { get; set; } =
            true;

        public DateTime CreatedAt { get; set; } =
            DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        [Required]
        public int OrganizationId { get; set; }

        public Organization? Organization
        {
            get;
            set;
        }

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