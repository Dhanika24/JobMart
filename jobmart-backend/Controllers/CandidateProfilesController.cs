using System.Security.Claims;
using jobmart.Data;
using jobmart.DTOs;
using jobmart.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace jobmart.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Candidate")]
    public class CandidateProfilesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CandidateProfilesController(
            ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: /api/CandidateProfiles/me
        [HttpGet("me")]
        public async Task<IActionResult> GetMyProfile()
        {
            int? userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized(new
                {
                    message = "Invalid user token."
                });
            }

            var user = await _context.Users
                .FirstOrDefaultAsync(
                    u => u.UserId == userId.Value
                );

            if (user == null)
            {
                return NotFound(new
                {
                    message = "User not found."
                });
            }

            var profile = await _context.CandidateProfiles
                .FirstOrDefaultAsync(
                    p => p.UserId == userId.Value
                );

            // Create an empty profile when one does not exist.
            if (profile == null)
            {
                profile = new CandidateProfile
                {
                    UserId = userId.Value,
                    ExperienceYears = 0,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.CandidateProfiles.Add(profile);
                await _context.SaveChangesAsync();
            }

            return Ok(new
            {
                profile.CandidateProfileId,
                profile.UserId,
                user.FullName,
                user.Email,
                user.Role,
                profile.Phone,
                profile.Bio,
                profile.ExperienceYears,
                profile.Education,
                profile.Skills,
                profile.CurrentJobTitle,
                profile.LinkedInUrl,
                profile.PortfolioUrl,
                profile.Address,
                profile.UpdatedAt
            });
        }

        // PUT: /api/CandidateProfiles/me
        [HttpPut("me")]
        public async Task<IActionResult> UpdateMyProfile(
            UpdateCandidateProfileDto request)
        {
            int? userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized(new
                {
                    message = "Invalid user token."
                });
            }

            var profile = await _context.CandidateProfiles
                .FirstOrDefaultAsync(
                    p => p.UserId == userId.Value
                );

            if (profile == null)
            {
                profile = new CandidateProfile
                {
                    UserId = userId.Value
                };

                _context.CandidateProfiles.Add(profile);
            }

            profile.Phone = request.Phone?.Trim();
            profile.Bio = request.Bio?.Trim();
            profile.ExperienceYears = request.ExperienceYears;
            profile.Education = request.Education?.Trim();
            profile.Skills = request.Skills?.Trim();
            profile.CurrentJobTitle =
                request.CurrentJobTitle?.Trim();
            profile.LinkedInUrl =
                request.LinkedInUrl?.Trim();
            profile.PortfolioUrl =
                request.PortfolioUrl?.Trim();
            profile.Address = request.Address?.Trim();
            profile.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Candidate profile updated successfully.",

                profile = new
                {
                    profile.CandidateProfileId,
                    profile.UserId,
                    profile.Phone,
                    profile.Bio,
                    profile.ExperienceYears,
                    profile.Education,
                    profile.Skills,
                    profile.CurrentJobTitle,
                    profile.LinkedInUrl,
                    profile.PortfolioUrl,
                    profile.Address,
                    profile.UpdatedAt
                }
            });
        }

        private int? GetCurrentUserId()
        {
            string? userIdValue = User.FindFirstValue(
                ClaimTypes.NameIdentifier
            );

            if (int.TryParse(userIdValue, out int userId))
            {
                return userId;
            }

            return null;
        }
    }
}