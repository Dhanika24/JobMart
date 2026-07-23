using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using jobmart.Data;
using jobmart.Interfaces;
using jobmart.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace jobmart.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AdminUsersController :
        ControllerBase
    {
        private readonly ApplicationDbContext
            _context;

        private readonly IAuditLogService
            _auditLogService;

        public AdminUsersController(
            ApplicationDbContext context,
            IAuditLogService auditLogService)
        {
            _context = context;

            _auditLogService =
                auditLogService;
        }

        // --------------------------------------------------
        // ADMIN VIEWS ALL USERS
        // GET: /api/AdminUsers
        // --------------------------------------------------
        [HttpGet]
        public async Task<IActionResult>
            GetAllUsers()
        {
            var users =
                await _context.Users
                    .OrderByDescending(user =>
                        user.CreatedAt)
                    .Select(user => new
                    {
                        userId =
                            user.UserId,

                        user.FullName,
                        user.Email,
                        user.Role,
                        user.IsActive,
                        user.CreatedAt,

                        hasCandidateProfile =
                            user.CandidateProfile !=
                            null,

                        hasRecruiterProfile =
                            user.RecruiterProfile !=
                            null,

                        hasHiringManagerProfile =
                            user
                                .HiringManagerProfile !=
                            null
                    })
                    .ToListAsync();

            return Ok(new
            {
                totalUsers =
                    users.Count,

                activeUsers =
                    users.Count(user =>
                        user.IsActive),

                inactiveUsers =
                    users.Count(user =>
                        !user.IsActive),

                users
            });
        }

        // --------------------------------------------------
        // ADMIN VIEWS PENDING RECRUITERS
        // GET: /api/AdminUsers/pending-recruiters
        // --------------------------------------------------
        [HttpGet("pending-recruiters")]
        public async Task<IActionResult>
            GetPendingRecruiters()
        {
            var recruiters =
                await _context.Users
                    .Where(user =>
                        user.Role ==
                            "Recruiter" &&
                        !user.IsActive)
                    .OrderBy(user =>
                        user.CreatedAt)
                    .Select(user => new
                    {
                        userId =
                            user.UserId,

                        user.FullName,
                        user.Email,
                        user.Role,
                        user.IsActive,
                        user.CreatedAt,

                        hasRecruiterProfile =
                            user.RecruiterProfile !=
                            null
                    })
                    .ToListAsync();

            return Ok(new
            {
                totalPendingRecruiters =
                    recruiters.Count,

                recruiters
            });
        }

        // --------------------------------------------------
        // ADMIN APPROVES A RECRUITER
        // PUT: /api/AdminUsers/5/approve
        // --------------------------------------------------
        [HttpPut("{userId}/approve")]
        public async Task<IActionResult>
            ApproveRecruiter(int userId)
        {
            var user =
                await _context.Users
                    .Include(item =>
                        item.RecruiterProfile)
                    .FirstOrDefaultAsync(item =>
                        item.UserId ==
                        userId);

            if (user == null)
            {
                return NotFound(new
                {
                    message =
                        "User account not found."
                });
            }

            if (user.Role != "Recruiter")
            {
                return BadRequest(new
                {
                    message =
                        "Only Recruiter accounts can be approved using this endpoint."
                });
            }

            if (user.IsActive)
            {
                return BadRequest(new
                {
                    message =
                        "This Recruiter account is already active."
                });
            }

            bool profileCreated =
                false;

            await using var transaction =
                await _context.Database
                    .BeginTransactionAsync();

            try
            {
                // Create a profile for older Recruiter
                // accounts that do not already have one.
                if (user.RecruiterProfile == null)
                {
                    var recruiterProfile =
                        new RecruiterProfile
                        {
                            UserId =
                                user.UserId,

                            OrganizationId =
                                null,

                            DepartmentId =
                                null,

                            CreatedAt =
                                DateTime.UtcNow
                        };

                    _context.RecruiterProfiles.Add(
                        recruiterProfile);

                    profileCreated =
                        true;
                }

                user.IsActive =
                    true;

                await _context.SaveChangesAsync();

                await transaction.CommitAsync();
            }
            catch
            {
                await transaction.RollbackAsync();

                return StatusCode(
                    StatusCodes
                        .Status500InternalServerError,
                    new
                    {
                        message =
                            "Unable to approve the Recruiter account."
                    });
            }

            await SafeAuditLogAsync(
                action:
                    "Recruiter Approved",

                entityType:
                    "User",

                entityId:
                    user.UserId.ToString(),

                details:
                    $"Recruiter account {user.Email} was approved and activated. Profile created: {profileCreated}.");

            return Ok(new
            {
                message =
                    "Recruiter account approved successfully.",

                profileCreated,

                user = new
                {
                    userId =
                        user.UserId,

                    user.FullName,
                    user.Email,
                    user.Role,
                    user.IsActive
                }
            });
        }

        // --------------------------------------------------
        // ADMIN ACTIVATES A USER
        // PUT: /api/AdminUsers/5/activate
        // --------------------------------------------------
        [HttpPut("{userId}/activate")]
        public async Task<IActionResult>
            ActivateUser(int userId)
        {
            var user =
                await _context.Users
                    .Include(item =>
                        item.CandidateProfile)
                    .Include(item =>
                        item.RecruiterProfile)
                    .Include(item =>
                        item
                            .HiringManagerProfile)
                    .FirstOrDefaultAsync(item =>
                        item.UserId ==
                        userId);

            if (user == null)
            {
                return NotFound(new
                {
                    message =
                        "User account not found."
                });
            }

            if (user.IsActive)
            {
                return BadRequest(new
                {
                    message =
                        "This account is already active."
                });
            }

            bool profileCreated =
                false;

            await using var transaction =
                await _context.Database
                    .BeginTransactionAsync();

            try
            {
                if (user.Role == "Candidate" &&
                    user.CandidateProfile == null)
                {
                    var profile =
                        new CandidateProfile
                        {
                            UserId =
                                user.UserId,

                            ExperienceYears =
                                0,

                            UpdatedAt =
                                DateTime.UtcNow
                        };

                    _context.CandidateProfiles.Add(
                        profile);

                    profileCreated =
                        true;
                }

                if (user.Role == "Recruiter" &&
                    user.RecruiterProfile == null)
                {
                    var profile =
                        new RecruiterProfile
                        {
                            UserId =
                                user.UserId,

                            OrganizationId =
                                null,

                            DepartmentId =
                                null,

                            CreatedAt =
                                DateTime.UtcNow
                        };

                    _context.RecruiterProfiles.Add(
                        profile);

                    profileCreated =
                        true;
                }

                if (user.Role ==
                        "HiringManager" &&
                    user.HiringManagerProfile ==
                        null)
                {
                    var profile =
                        new HiringManagerProfile
                        {
                            UserId =
                                user.UserId,

                            OrganizationId =
                                null,

                            DepartmentId =
                                null,

                            CreatedAt =
                                DateTime.UtcNow
                        };

                    _context
                        .HiringManagerProfiles
                        .Add(profile);

                    profileCreated =
                        true;
                }

                user.IsActive =
                    true;

                await _context.SaveChangesAsync();

                await transaction.CommitAsync();
            }
            catch
            {
                await transaction.RollbackAsync();

                return StatusCode(
                    StatusCodes
                        .Status500InternalServerError,
                    new
                    {
                        message =
                            "Unable to activate the user account."
                    });
            }

            await SafeAuditLogAsync(
                action:
                    "User Activated",

                entityType:
                    "User",

                entityId:
                    user.UserId.ToString(),

                details:
                    $"{user.Role} account {user.Email} was activated. Profile created: {profileCreated}.");

            return Ok(new
            {
                message =
                    "User account activated successfully.",

                userId =
                    user.UserId,

                user.IsActive,

                profileCreated
            });
        }

        // --------------------------------------------------
        // ADMIN DEACTIVATES A USER
        // PUT: /api/AdminUsers/5/deactivate
        // --------------------------------------------------
        [HttpPut("{userId}/deactivate")]
        public async Task<IActionResult>
            DeactivateUser(int userId)
        {
            var user =
                await _context.Users
                    .FirstOrDefaultAsync(item =>
                        item.UserId ==
                        userId);

            if (user == null)
            {
                return NotFound(new
                {
                    message =
                        "User account not found."
                });
            }

            int? currentAdminId =
                GetCurrentUserId();

            if (currentAdminId.HasValue &&
                currentAdminId.Value ==
                    user.UserId)
            {
                return BadRequest(new
                {
                    message =
                        "You cannot deactivate your own currently signed-in Admin account."
                });
            }

            if (user.Role == "Admin" &&
                user.IsActive)
            {
                int activeAdminCount =
                    await _context.Users
                        .CountAsync(item =>
                            item.Role ==
                                "Admin" &&
                            item.IsActive);

                if (activeAdminCount <= 1)
                {
                    return BadRequest(new
                    {
                        message =
                            "The final active Admin account cannot be deactivated."
                    });
                }
            }

            if (!user.IsActive)
            {
                return BadRequest(new
                {
                    message =
                        "This account is already inactive."
                });
            }

            user.IsActive =
                false;

            await _context.SaveChangesAsync();

            await SafeAuditLogAsync(
                action:
                    "User Deactivated",

                entityType:
                    "User",

                entityId:
                    user.UserId.ToString(),

                details:
                    $"{user.Role} account {user.Email} was deactivated.");

            return Ok(new
            {
                message =
                    "User account deactivated successfully.",

                userId =
                    user.UserId,

                user.IsActive
            });
        }

        // --------------------------------------------------
        // ADMIN CREATES HIRING MANAGER OR ADMIN ACCOUNT
        // POST: /api/AdminUsers/create-privileged
        // --------------------------------------------------
        [HttpPost("create-privileged")]
        public async Task<IActionResult>
            CreatePrivilegedUser(
                CreatePrivilegedUserDto request)
        {
            string fullName =
                request.FullName?.Trim()
                ?? string.Empty;

            string normalizedEmail =
                request.Email?.Trim()
                    .ToLowerInvariant()
                ?? string.Empty;

            string? normalizedRole =
                NormalizePrivilegedRole(
                    request.Role);

            if (string.IsNullOrWhiteSpace(
                    fullName))
            {
                return BadRequest(new
                {
                    message =
                        "Full name is required."
                });
            }

            if (string.IsNullOrWhiteSpace(
                    normalizedEmail))
            {
                return BadRequest(new
                {
                    message =
                        "Email address is required."
                });
            }

            if (normalizedRole == null)
            {
                return BadRequest(new
                {
                    message =
                        "Only HiringManager and Admin accounts can be created using this endpoint.",

                    allowedRoles =
                        new[]
                        {
                            "HiringManager",
                            "Admin"
                        }
                });
            }

            bool emailExists =
                await _context.Users
                    .AnyAsync(user =>
                        user.Email ==
                        normalizedEmail);

            if (emailExists)
            {
                return BadRequest(new
                {
                    message =
                        "An account with this email already exists."
                });
            }

            string passwordHash =
                BCrypt.Net.BCrypt.HashPassword(
                    request.Password);

            var user =
                new User
                {
                    FullName =
                        fullName,

                    Email =
                        normalizedEmail,

                    PasswordHash =
                        passwordHash,

                    Role =
                        normalizedRole,

                    IsActive =
                        true,

                    CreatedAt =
                        DateTime.UtcNow
                };

            bool profileCreated =
                false;

            await using var transaction =
                await _context.Database
                    .BeginTransactionAsync();

            try
            {
                _context.Users.Add(user);

                await _context.SaveChangesAsync();

                // Hiring Managers automatically receive
                // an empty HiringManagerProfile.
                // Admin users do not require a staff profile.
                if (normalizedRole ==
                    "HiringManager")
                {
                    var hiringManagerProfile =
                        new HiringManagerProfile
                        {
                            UserId =
                                user.UserId,

                            OrganizationId =
                                null,

                            DepartmentId =
                                null,

                            CreatedAt =
                                DateTime.UtcNow
                        };

                    _context
                        .HiringManagerProfiles
                        .Add(
                            hiringManagerProfile);

                    await _context.SaveChangesAsync();

                    profileCreated =
                        true;
                }

                await transaction.CommitAsync();
            }
            catch
            {
                await transaction.RollbackAsync();

                return StatusCode(
                    StatusCodes
                        .Status500InternalServerError,
                    new
                    {
                        message =
                            "Unable to create the account. Please try again."
                    });
            }

            await SafeAuditLogAsync(
                action:
                    "Privileged User Created",

                entityType:
                    "User",

                entityId:
                    user.UserId.ToString(),

                details:
                    $"{normalizedRole} account {user.Email} was created. Profile created: {profileCreated}.");

            return Ok(new
            {
                message =
                    $"{normalizedRole} account created successfully.",

                profileCreated,

                user = new
                {
                    userId =
                        user.UserId,

                    user.FullName,
                    user.Email,
                    user.Role,
                    user.IsActive,
                    user.CreatedAt
                }
            });
        }

        // --------------------------------------------------
        // SAFE AUDIT LOGGING
        // Admin action should remain successful even if
        // audit logging fails unexpectedly.
        // --------------------------------------------------
        private async Task SafeAuditLogAsync(
            string action,
            string entityType,
            string? entityId,
            string details)
        {
            try
            {
                int? adminId =
                    GetCurrentUserId();

                string? adminName =
                    User.FindFirstValue(
                        ClaimTypes.Name);

                string? adminEmail =
                    User.FindFirstValue(
                        ClaimTypes.Email);

                string? adminRole =
                    User.FindFirstValue(
                        ClaimTypes.Role);

                string actorName =
                    !string.IsNullOrWhiteSpace(
                        adminName)
                        ? adminName
                        : !string.IsNullOrWhiteSpace(
                            adminEmail)
                            ? adminEmail
                            : "Unknown Admin";

                await _auditLogService.LogAsync(
                    userId:
                        adminId,

                    userName:
                        actorName,

                    role:
                        adminRole ??
                        "Admin",

                    action:
                        action,

                    entityType:
                        entityType,

                    entityId:
                        entityId,

                    details:
                        details);
            }
            catch
            {
                // Audit logging must not interrupt a
                // successfully completed Admin action.
            }
        }

        // --------------------------------------------------
        // GET CURRENT ADMIN USER ID FROM JWT
        // --------------------------------------------------
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

        // --------------------------------------------------
        // NORMALIZE PRIVILEGED ROLE
        // --------------------------------------------------
        private static string?
            NormalizePrivilegedRole(
                string? role)
        {
            if (string.IsNullOrWhiteSpace(
                    role))
            {
                return null;
            }

            string normalizedRole =
                role.Trim()
                    .ToLowerInvariant();

            return normalizedRole switch
            {
                "hiringmanager" =>
                    "HiringManager",

                "hiring manager" =>
                    "HiringManager",

                "admin" =>
                    "Admin",

                _ =>
                    null
            };
        }
    }

    public class CreatePrivilegedUserDto
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
            "HiringManager";
    }
}