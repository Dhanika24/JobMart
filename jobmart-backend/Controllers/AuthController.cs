using jobmart.Data;
using jobmart.DTOs;
using jobmart.Interfaces;
using jobmart.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace jobmart.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IJwtService _jwtService;
        private readonly IAuditLogService
            _auditLogService;

        public AuthController(
            ApplicationDbContext context,
            IJwtService jwtService,
            IAuditLogService auditLogService)
        {
            _context = context;
            _jwtService = jwtService;
            _auditLogService = auditLogService;
        }

        // --------------------------------------------------
        // PUBLIC REGISTRATION
        // POST: /api/Auth/register
        // Only Candidate and Recruiter are allowed.
        // --------------------------------------------------
        [HttpPost("register")]
        public async Task<IActionResult> Register(
            RegisterDto request)
        {
            string fullName =
                request.FullName?.Trim()
                ?? string.Empty;

            string normalizedEmail =
                request.Email?.Trim()
                    .ToLowerInvariant()
                ?? string.Empty;

            if (string.IsNullOrWhiteSpace(fullName))
            {
                await SafeAuditLogAsync(
                    userId: null,
                    userName: normalizedEmail,
                    role: request.Role,
                    action: "Registration Failed",
                    entityType: "User",
                    entityId: null,
                    details:
                        "Registration failed because the full name was missing.");

                return BadRequest(new
                {
                    message =
                        "Full name is required."
                });
            }

            if (string.IsNullOrWhiteSpace(
                    normalizedEmail))
            {
                await SafeAuditLogAsync(
                    userId: null,
                    userName: fullName,
                    role: request.Role,
                    action: "Registration Failed",
                    entityType: "User",
                    entityId: null,
                    details:
                        "Registration failed because the email address was missing.");

                return BadRequest(new
                {
                    message =
                        "Email address is required."
                });
            }

            string? normalizedRole =
                NormalizePublicRole(
                    request.Role);

            if (normalizedRole == null)
            {
                await SafeAuditLogAsync(
                    userId: null,
                    userName: normalizedEmail,
                    role: request.Role,
                    action: "Registration Failed",
                    entityType: "User",
                    entityId: null,
                    details:
                        "Registration failed because an invalid public role was selected.");

                return BadRequest(new
                {
                    message =
                        "Public registration is available only for Candidate and Recruiter accounts.",

                    allowedRoles = new[]
                    {
                        "Candidate",
                        "Recruiter"
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
                await SafeAuditLogAsync(
                    userId: null,
                    userName: normalizedEmail,
                    role: normalizedRole,
                    action: "Registration Failed",
                    entityType: "User",
                    entityId: null,
                    details:
                        $"Registration failed because an account already exists for {normalizedEmail}.");

                return BadRequest(new
                {
                    message =
                        "An account with this email already exists."
                });
            }

            string passwordHash =
                BCrypt.Net.BCrypt.HashPassword(
                    request.Password);

            bool isCandidate =
                normalizedRole ==
                "Candidate";

            bool isRecruiter =
                normalizedRole ==
                "Recruiter";

            var user = new User
            {
                FullName =
                    fullName,

                Email =
                    normalizedEmail,

                PasswordHash =
                    passwordHash,

                Role =
                    normalizedRole,

                // Candidates can log in immediately.
                // Recruiters require Admin approval.
                IsActive =
                    isCandidate,

                CreatedAt =
                    DateTime.UtcNow
            };

            await using var transaction =
                await _context.Database
                    .BeginTransactionAsync();

            try
            {
                _context.Users.Add(user);

                await _context.SaveChangesAsync();

                // Automatically create Candidate profile.
                if (isCandidate)
                {
                    var candidateProfile =
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
                        candidateProfile);
                }

                // Automatically create Recruiter profile.
                // Organization and Department will be
                // assigned later by an Admin.
                if (isRecruiter)
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
                }

                await _context.SaveChangesAsync();

                await transaction.CommitAsync();
            }
            catch
            {
                await transaction.RollbackAsync();

                await SafeAuditLogAsync(
                    userId: null,
                    userName: normalizedEmail,
                    role: normalizedRole,
                    action: "Registration Failed",
                    entityType: "User",
                    entityId: null,
                    details:
                        $"The system could not complete registration for {normalizedEmail}.");

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
                userId: user.UserId,
                userName: user.FullName,
                role: user.Role,
                action: "Registration Success",
                entityType: "User",
                entityId:
                    user.UserId.ToString(),
                details:
                    $"{user.Role} account registered successfully for {user.Email}.");

            if (isCandidate)
            {
                return Ok(new
                {
                    message =
                        "Candidate account created successfully. You can now sign in.",

                    requiresApproval =
                        false,

                    profileCreated =
                        true,

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

            return Ok(new
            {
                message =
                    "Recruiter account and profile created successfully. Your account is awaiting Admin approval.",

                requiresApproval =
                    true,

                profileCreated =
                    true,

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
        // LOGIN
        // POST: /api/Auth/login
        // --------------------------------------------------
        [HttpPost("login")]
        public async Task<IActionResult> Login(
            LoginDto request)
        {
            string normalizedEmail =
                request.Email?.Trim()
                    .ToLowerInvariant()
                ?? string.Empty;

            if (string.IsNullOrWhiteSpace(
                    normalizedEmail))
            {
                await SafeAuditLogAsync(
                    userId: null,
                    userName: null,
                    role: null,
                    action: "Login Failed",
                    entityType: "Authentication",
                    entityId: null,
                    details:
                        "Login failed because no email address was provided.");

                return Unauthorized(new
                {
                    message =
                        "Invalid email or password."
                });
            }

            var user =
                await _context.Users
                    .FirstOrDefaultAsync(item =>
                        item.Email ==
                        normalizedEmail);

            if (user == null)
            {
                await SafeAuditLogAsync(
                    userId: null,
                    userName: normalizedEmail,
                    role: null,
                    action: "Login Failed",
                    entityType: "Authentication",
                    entityId: null,
                    details:
                        $"Login failed because no account exists for {normalizedEmail}.");

                return Unauthorized(new
                {
                    message =
                        "Invalid email or password."
                });
            }

            bool validPassword;

            try
            {
                validPassword =
                    BCrypt.Net.BCrypt.Verify(
                        request.Password,
                        user.PasswordHash);
            }
            catch
            {
                validPassword =
                    false;
            }

            if (!validPassword)
            {
                await SafeAuditLogAsync(
                    userId: user.UserId,
                    userName: user.FullName,
                    role: user.Role,
                    action: "Login Failed",
                    entityType: "Authentication",
                    entityId:
                        user.UserId.ToString(),
                    details:
                        $"Login failed because an invalid password was entered for {user.Email}.");

                return Unauthorized(new
                {
                    message =
                        "Invalid email or password."
                });
            }

            if (!user.IsActive)
            {
                await SafeAuditLogAsync(
                    userId: user.UserId,
                    userName: user.FullName,
                    role: user.Role,
                    action: "Login Blocked",
                    entityType: "Authentication",
                    entityId:
                        user.UserId.ToString(),
                    details:
                        user.Role == "Recruiter"
                            ? $"Login blocked because Recruiter account {user.Email} is awaiting Admin approval."
                            : $"Login blocked because account {user.Email} is inactive.");

                if (user.Role == "Recruiter")
                {
                    return Unauthorized(new
                    {
                        message =
                            "Your Recruiter account is awaiting Admin approval.",

                        requiresApproval =
                            true
                    });
                }

                return Unauthorized(new
                {
                    message =
                        "Your account is inactive. Contact the system administrator.",

                    requiresApproval =
                        false
                });
            }

            string token =
                _jwtService.GenerateToken(user);

            await SafeAuditLogAsync(
                userId: user.UserId,
                userName: user.FullName,
                role: user.Role,
                action: "Login Success",
                entityType: "Authentication",
                entityId:
                    user.UserId.ToString(),
                details:
                    $"{user.Role} user {user.Email} logged in successfully.");

            return Ok(new
            {
                message =
                    "Login successful.",

                token,

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
        // SAFE AUDIT LOGGING
        // Authentication must continue even if an audit
        // logging error occurs.
        // --------------------------------------------------
        private async Task SafeAuditLogAsync(
            int? userId,
            string? userName,
            string? role,
            string action,
            string entityType,
            string? entityId,
            string details)
        {
            try
            {
                await _auditLogService.LogAsync(
                    userId,
                    userName,
                    role,
                    action,
                    entityType,
                    entityId,
                    details);
            }
            catch
            {
                // Do not expose audit logging errors
                // or interrupt authentication.
            }
        }

        // --------------------------------------------------
        // NORMALIZE PUBLIC REGISTRATION ROLE
        // --------------------------------------------------
        private static string?
            NormalizePublicRole(string? role)
        {
            if (string.IsNullOrWhiteSpace(role))
            {
                return null;
            }

            string normalizedRole =
                role.Trim()
                    .ToLowerInvariant();

            return normalizedRole switch
            {
                "candidate" =>
                    "Candidate",

                "recruiter" =>
                    "Recruiter",

                _ =>
                    null
            };
        }
    }
}