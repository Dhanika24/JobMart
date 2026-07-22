using System.ComponentModel.DataAnnotations;

namespace jobmart.Models
{
    public class User
    {
        [Key]
        public int UserId { get; set; }

        [Required]
        [MaxLength(100)]
        public string FullName { get; set; } =
            string.Empty;

        [Required]
        [EmailAddress]
        [MaxLength(150)]
        public string Email { get; set; } =
            string.Empty;

        [Required]
        public string PasswordHash { get; set; } =
            string.Empty;

        [Required]
        [MaxLength(30)]
        public string Role { get; set; } =
            "Candidate";

        public bool IsActive { get; set; } =
            true;

        public DateTime CreatedAt { get; set; } =
            DateTime.UtcNow;

        public CandidateProfile? CandidateProfile
        {
            get;
            set;
        }

        public RecruiterProfile? RecruiterProfile
        {
            get;
            set;
        }

        public HiringManagerProfile?
            HiringManagerProfile
        {
            get;
            set;
        }

        public ICollection<JobPosting>
            CreatedJobPostings
        { get; set; } =
            new List<JobPosting>();
    }
}