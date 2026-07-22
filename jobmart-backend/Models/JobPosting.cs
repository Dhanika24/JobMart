using System.ComponentModel.DataAnnotations;

namespace jobmart.Models
{
    public class JobPosting
    {
        [Key]
        public int JobId { get; set; }

        [Required]
        [MaxLength(150)]
        public string Title { get; set; } =
            string.Empty;

        [Required]
        public string Description { get; set; } =
            string.Empty;

        public string? Requirements { get; set; }

        [MaxLength(150)]
        public string? Location { get; set; }

        [MaxLength(50)]
        public string? EmploymentType { get; set; }

        public decimal? SalaryMin { get; set; }

        public decimal? SalaryMax { get; set; }

        public DateTime Deadline { get; set; }

        [Required]
        [MaxLength(30)]
        public string Status { get; set; } =
            "Open";

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

        public int? RecruiterId { get; set; }

        public User? Recruiter { get; set; }

        public DateTime CreatedAt { get; set; } =
            DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }
    }
}