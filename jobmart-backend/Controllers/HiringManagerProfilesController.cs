using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using jobmart.Data;
using jobmart.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace jobmart.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "HiringManager,Admin")]
    public class HiringManagerProfilesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public HiringManagerProfilesController(
            ApplicationDbContext context)
        {
            _context = context;
        }

        // --------------------------------------------------
        // ADMIN VIEWS ALL HIRING MANAGER PROFILES
        // GET: /api/HiringManagerProfiles
        // --------------------------------------------------
        [Authorize(Roles = "Admin")]
        [HttpGet]
        public async Task<IActionResult>
            GetHiringManagerProfiles()
        {
            var profiles =
                await _context.HiringManagerProfiles
                    .OrderBy(profile =>
                        profile.User!.FullName)
                    .Select(profile => new
                    {
                        profile.HiringManagerProfileId,
                        profile.UserId,

                        fullName =
                            profile.User != null
                                ? profile.User.FullName
                                : "Unknown Hiring Manager",

                        email =
                            profile.User != null
                                ? profile.User.Email
                                : string.Empty,

                        accountIsActive =
                            profile.User != null &&
                            profile.User.IsActive,

                        profile.OrganizationId,

                        organizationName =
                            profile.Organization != null
                                ? profile.Organization.Name
                                : "Not Assigned",

                        organizationIsActive =
                            profile.Organization != null &&
                            profile.Organization.IsActive,

                        profile.DepartmentId,

                        departmentName =
                            profile.Department != null
                                ? profile.Department.Name
                                : "Not Assigned",

                        departmentIsActive =
                            profile.Department != null &&
                            profile.Department.IsActive,

                        profile.JobTitle,
                        profile.PhoneNumber,
                        profile.ProfessionalSummary,
                        profile.LinkedInUrl,
                        profile.CreatedAt,
                        profile.UpdatedAt
                    })
                    .ToListAsync();

            return Ok(new
            {
                totalHiringManagerProfiles =
                    profiles.Count,

                assignedProfiles =
                    profiles.Count(profile =>
                        profile.OrganizationId != null &&
                        profile.DepartmentId != null),

                unassignedProfiles =
                    profiles.Count(profile =>
                        profile.OrganizationId == null ||
                        profile.DepartmentId == null),

                profiles
            });
        }

        // --------------------------------------------------
        // CURRENT HIRING MANAGER VIEWS OWN PROFILE
        // GET: /api/HiringManagerProfiles/my
        // --------------------------------------------------
        [Authorize(Roles = "HiringManager")]
        [HttpGet("my")]
        public async Task<IActionResult>
            GetMyHiringManagerProfile()
        {
            int? userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized(new
                {
                    message = "Invalid user token."
                });
            }

            var profile =
                await GetProfileResponse(
                    userId.Value);

            if (profile != null)
            {
                return Ok(profile);
            }

            var user =
                await _context.Users
                    .FirstOrDefaultAsync(item =>
                        item.UserId == userId.Value &&
                        item.Role == "HiringManager");

            if (user == null)
            {
                return NotFound(new
                {
                    message =
                        "Hiring Manager account not found."
                });
            }

            var newProfile =
                new HiringManagerProfile
                {
                    UserId = user.UserId,
                    CreatedAt = DateTime.UtcNow
                };

            _context.HiringManagerProfiles.Add(
                newProfile);

            await _context.SaveChangesAsync();

            profile =
                await GetProfileResponse(
                    user.UserId);

            return Ok(profile);
        }

        // --------------------------------------------------
        // ADMIN VIEWS ONE HIRING MANAGER PROFILE
        // GET: /api/HiringManagerProfiles/user/6
        // --------------------------------------------------
        [Authorize(Roles = "Admin")]
        [HttpGet("user/{userId}")]
        public async Task<IActionResult>
            GetHiringManagerProfileByUser(
                int userId)
        {
            var user =
                await _context.Users
                    .FirstOrDefaultAsync(item =>
                        item.UserId == userId);

            if (user == null)
            {
                return NotFound(new
                {
                    message =
                        "User account not found."
                });
            }

            if (user.Role != "HiringManager")
            {
                return BadRequest(new
                {
                    message =
                        "The selected user is not a Hiring Manager."
                });
            }

            var profile =
                await GetProfileResponse(userId);

            if (profile == null)
            {
                return NotFound(new
                {
                    message =
                        "Hiring Manager profile not found."
                });
            }

            return Ok(profile);
        }

        // --------------------------------------------------
        // CURRENT HIRING MANAGER UPDATES OWN PROFILE
        // PUT: /api/HiringManagerProfiles/my
        // --------------------------------------------------
        [Authorize(Roles = "HiringManager")]
        [HttpPut("my")]
        public async Task<IActionResult>
            UpdateMyHiringManagerProfile(
                UpdateHiringManagerProfileDto request)
        {
            int? userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized(new
                {
                    message = "Invalid user token."
                });
            }

            return await UpdateProfile(
                userId.Value,
                request,
                false);
        }

        // --------------------------------------------------
        // ADMIN UPDATES A HIRING MANAGER PROFILE
        // PUT: /api/HiringManagerProfiles/user/6
        // --------------------------------------------------
        [Authorize(Roles = "Admin")]
        [HttpPut("user/{userId}")]
        public async Task<IActionResult>
            UpdateHiringManagerProfileByAdmin(
                int userId,
                UpdateHiringManagerProfileDto request)
        {
            return await UpdateProfile(
                userId,
                request,
                true);
        }

        // --------------------------------------------------
        // ADMIN ASSIGNS ORGANIZATION AND DEPARTMENT
        // PUT: /api/HiringManagerProfiles/user/6/assignment
        // --------------------------------------------------
        [Authorize(Roles = "Admin")]
        [HttpPut("user/{userId}/assignment")]
        public async Task<IActionResult>
            AssignHiringManagerOrganization(
                int userId,
                AssignHiringManagerDto request)
        {
            var validationResult =
                await ValidateAssignment(
                    request.OrganizationId,
                    request.DepartmentId);

            if (validationResult.ErrorMessage != null)
            {
                return BadRequest(new
                {
                    message =
                        validationResult.ErrorMessage
                });
            }

            var user =
                await _context.Users
                    .FirstOrDefaultAsync(item =>
                        item.UserId == userId);

            if (user == null)
            {
                return NotFound(new
                {
                    message =
                        "User account not found."
                });
            }

            if (user.Role != "HiringManager")
            {
                return BadRequest(new
                {
                    message =
                        "Only Hiring Manager accounts can receive this profile assignment."
                });
            }

            var profile =
                await _context.HiringManagerProfiles
                    .FirstOrDefaultAsync(item =>
                        item.UserId == userId);

            if (profile == null)
            {
                profile =
                    new HiringManagerProfile
                    {
                        UserId = userId,
                        CreatedAt = DateTime.UtcNow
                    };

                _context.HiringManagerProfiles.Add(
                    profile);
            }

            profile.OrganizationId =
                request.OrganizationId;

            profile.DepartmentId =
                request.DepartmentId;

            profile.UpdatedAt =
                DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Hiring Manager organization and department assigned successfully.",

                profile.HiringManagerProfileId,
                profile.UserId,
                user.FullName,
                user.Email,
                profile.OrganizationId,

                organizationName =
                    validationResult.OrganizationName,

                profile.DepartmentId,

                departmentName =
                    validationResult.DepartmentName,

                profile.UpdatedAt
            });
        }

        // --------------------------------------------------
        // ADMIN REMOVES ORGANIZATION ASSIGNMENT
        // PUT: /api/HiringManagerProfiles/user/6/remove-assignment
        // --------------------------------------------------
        [Authorize(Roles = "Admin")]
        [HttpPut(
            "user/{userId}/remove-assignment")]
        public async Task<IActionResult>
            RemoveHiringManagerAssignment(
                int userId)
        {
            var profile =
                await _context.HiringManagerProfiles
                    .Include(item => item.User)
                    .FirstOrDefaultAsync(item =>
                        item.UserId == userId);

            if (profile == null)
            {
                return NotFound(new
                {
                    message =
                        "Hiring Manager profile not found."
                });
            }

            profile.OrganizationId = null;
            profile.DepartmentId = null;
            profile.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Hiring Manager organization assignment removed successfully.",

                profile.HiringManagerProfileId,
                profile.UserId,

                fullName =
                    profile.User?.FullName,

                profile.OrganizationId,
                profile.DepartmentId,
                profile.UpdatedAt
            });
        }

        private async Task<IActionResult>
            UpdateProfile(
                int userId,
                UpdateHiringManagerProfileDto request,
                bool isAdmin)
        {
            var user =
                await _context.Users
                    .FirstOrDefaultAsync(item =>
                        item.UserId == userId);

            if (user == null)
            {
                return NotFound(new
                {
                    message =
                        "User account not found."
                });
            }

            if (user.Role != "HiringManager")
            {
                return BadRequest(new
                {
                    message =
                        "The selected user is not a Hiring Manager."
                });
            }

            if (request.OrganizationId.HasValue ||
                request.DepartmentId.HasValue)
            {
                if (!request.OrganizationId.HasValue ||
                    !request.DepartmentId.HasValue)
                {
                    return BadRequest(new
                    {
                        message =
                            "Both organization and department must be selected together."
                    });
                }

                var validationResult =
                    await ValidateAssignment(
                        request.OrganizationId.Value,
                        request.DepartmentId.Value);

                if (validationResult.ErrorMessage != null)
                {
                    return BadRequest(new
                    {
                        message =
                            validationResult.ErrorMessage
                    });
                }
            }

            var profile =
                await _context.HiringManagerProfiles
                    .FirstOrDefaultAsync(item =>
                        item.UserId == userId);

            if (profile == null)
            {
                profile =
                    new HiringManagerProfile
                    {
                        UserId = userId,
                        CreatedAt = DateTime.UtcNow
                    };

                _context.HiringManagerProfiles.Add(
                    profile);
            }

            profile.JobTitle =
                CleanOptionalText(
                    request.JobTitle);

            profile.PhoneNumber =
                CleanOptionalText(
                    request.PhoneNumber);

            profile.ProfessionalSummary =
                CleanOptionalText(
                    request.ProfessionalSummary);

            profile.LinkedInUrl =
                CleanOptionalText(
                    request.LinkedInUrl);

            if (isAdmin ||
                request.OrganizationId.HasValue)
            {
                profile.OrganizationId =
                    request.OrganizationId;

                profile.DepartmentId =
                    request.DepartmentId;
            }

            profile.UpdatedAt =
                DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var updatedProfile =
                await GetProfileResponse(userId);

            return Ok(new
            {
                message =
                    "Hiring Manager profile updated successfully.",

                profile = updatedProfile
            });
        }

        private async Task<dynamic?>
            GetProfileResponse(int userId)
        {
            return await _context.HiringManagerProfiles
                .Where(profile =>
                    profile.UserId == userId)
                .Select(profile => new
                {
                    profile.HiringManagerProfileId,
                    profile.UserId,

                    fullName =
                        profile.User != null
                            ? profile.User.FullName
                            : "Unknown Hiring Manager",

                    email =
                        profile.User != null
                            ? profile.User.Email
                            : string.Empty,

                    accountIsActive =
                        profile.User != null &&
                        profile.User.IsActive,

                    profile.OrganizationId,

                    organizationName =
                        profile.Organization != null
                            ? profile.Organization.Name
                            : "Not Assigned",

                    organizationIsActive =
                        profile.Organization != null &&
                        profile.Organization.IsActive,

                    profile.DepartmentId,

                    departmentName =
                        profile.Department != null
                            ? profile.Department.Name
                            : "Not Assigned",

                    departmentIsActive =
                        profile.Department != null &&
                        profile.Department.IsActive,

                    profile.JobTitle,
                    profile.PhoneNumber,
                    profile.ProfessionalSummary,
                    profile.LinkedInUrl,
                    profile.CreatedAt,
                    profile.UpdatedAt
                })
                .FirstOrDefaultAsync();
        }

        private async Task<AssignmentValidationResult>
            ValidateAssignment(
                int organizationId,
                int departmentId)
        {
            var organization =
                await _context.Organizations
                    .FirstOrDefaultAsync(item =>
                        item.OrganizationId ==
                        organizationId);

            if (organization == null)
            {
                return new AssignmentValidationResult
                {
                    ErrorMessage =
                        "The selected organization does not exist."
                };
            }

            if (!organization.IsActive)
            {
                return new AssignmentValidationResult
                {
                    ErrorMessage =
                        "The selected organization is inactive."
                };
            }

            var department =
                await _context.Departments
                    .FirstOrDefaultAsync(item =>
                        item.DepartmentId ==
                        departmentId);

            if (department == null)
            {
                return new AssignmentValidationResult
                {
                    ErrorMessage =
                        "The selected department does not exist."
                };
            }

            if (!department.IsActive)
            {
                return new AssignmentValidationResult
                {
                    ErrorMessage =
                        "The selected department is inactive."
                };
            }

            if (department.OrganizationId !=
                organizationId)
            {
                return new AssignmentValidationResult
                {
                    ErrorMessage =
                        "The selected department does not belong to the selected organization."
                };
            }

            return new AssignmentValidationResult
            {
                OrganizationName =
                    organization.Name,

                DepartmentName =
                    department.Name
            };
        }

        private int? GetCurrentUserId()
        {
            string? userIdValue =
                User.FindFirstValue(
                    ClaimTypes.NameIdentifier);

            if (int.TryParse(
                    userIdValue,
                    out int userId))
            {
                return userId;
            }

            return null;
        }

        private static string?
            CleanOptionalText(string? value)
        {
            return string.IsNullOrWhiteSpace(value)
                ? null
                : value.Trim();
        }

        private class AssignmentValidationResult
        {
            public string? ErrorMessage { get; set; }

            public string? OrganizationName { get; set; }

            public string? DepartmentName { get; set; }
        }
    }

    public class UpdateHiringManagerProfileDto
    {
        public int? OrganizationId { get; set; }

        public int? DepartmentId { get; set; }

        [MaxLength(120)]
        public string? JobTitle { get; set; }

        [MaxLength(30)]
        public string? PhoneNumber { get; set; }

        [MaxLength(500)]
        public string? ProfessionalSummary { get; set; }

        [MaxLength(200)]
        public string? LinkedInUrl { get; set; }
    }

    public class AssignHiringManagerDto
    {
        [Required]
        public int OrganizationId { get; set; }

        [Required]
        public int DepartmentId { get; set; }
    }
}