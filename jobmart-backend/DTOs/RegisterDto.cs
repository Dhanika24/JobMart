using System.ComponentModel.DataAnnotations;

namespace jobmart.DTOs
{
    public class RegisterDto
    {
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
        [MinLength(
            8,
            ErrorMessage =
                "Password must contain at least 8 characters."
        )]
        [MaxLength(100)]
        public string Password { get; set; } =
            string.Empty;

        [Required]
        [Compare(
            nameof(Password),
            ErrorMessage =
                "Password and confirmation password do not match."
        )]
        public string ConfirmPassword { get; set; } =
            string.Empty;

        [Required]
        public string Role { get; set; } =
            "Candidate";
    }
}