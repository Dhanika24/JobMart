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
    public class JobsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IAuditLogService _auditLogService;

        public JobsController(
            ApplicationDbContext context,
            IAuditLogService auditLogService)
        {
            _context = context;
            _auditLogService = auditLogService;
        }

        // --------------------------------------------------
        // GET ALL OPEN JOBS
        // GET: /api/Jobs
        // Public endpoint
        // --------------------------------------------------
        [HttpGet]
        public async Task<IActionResult> GetAllJobs()
        {
            var jobs =
                await _context.JobPostings
                    .Where(job =>
                        job.Status == "Open")
                    .OrderByDescending(job =>
                        job.CreatedAt)
                    .Select(job => new
                    {
                        job.JobId,
                        job.Title,
                        job.Description,
                        job.Requirements,
                        job.Location,
                        job.EmploymentType,
                        job.SalaryMin,
                        job.SalaryMax,
                        job.Deadline,
                        job.Status,
                        job.CreatedAt,
                        job.UpdatedAt,

                        job.OrganizationId,

                        organizationName =
                            job.Organization != null
                                ? job.Organization.Name
                                : "Not Assigned",

                        organizationIsActive =
                            job.Organization != null &&
                            job.Organization.IsActive,

                        job.DepartmentId,

                        departmentName =
                            job.Department != null
                                ? job.Department.Name
                                : "Not Assigned",

                        departmentIsActive =
                            job.Department != null &&
                            job.Department.IsActive,

                        job.RecruiterId,

                        recruiterName =
                            job.Recruiter != null
                                ? job.Recruiter.FullName
                                : "Not Assigned"
                    })
                    .ToListAsync();

            return Ok(jobs);
        }

        // --------------------------------------------------
        // GET ALL JOBS FOR ADMIN
        // GET: /api/Jobs/admin/all
        // Includes Open, Closed and Draft jobs
        // --------------------------------------------------
        [Authorize(Roles = "Admin")]
        [HttpGet("admin/all")]
        public async Task<IActionResult>
            GetAllJobsForAdmin()
        {
            var jobs =
                await _context.JobPostings
                    .OrderByDescending(job =>
                        job.CreatedAt)
                    .Select(job => new
                    {
                        job.JobId,
                        job.Title,
                        job.Description,
                        job.Requirements,
                        job.Location,
                        job.EmploymentType,
                        job.SalaryMin,
                        job.SalaryMax,
                        job.Deadline,
                        job.Status,
                        job.CreatedAt,
                        job.UpdatedAt,

                        job.OrganizationId,

                        organizationName =
                            job.Organization != null
                                ? job.Organization.Name
                                : "Not Assigned",

                        job.DepartmentId,

                        departmentName =
                            job.Department != null
                                ? job.Department.Name
                                : "Not Assigned",

                        job.RecruiterId,

                        recruiterName =
                            job.Recruiter != null
                                ? job.Recruiter.FullName
                                : "Not Assigned",

                        recruiterEmail =
                            job.Recruiter != null
                                ? job.Recruiter.Email
                                : string.Empty
                    })
                    .ToListAsync();

            return Ok(new
            {
                totalJobs =
                    jobs.Count,

                openJobs =
                    jobs.Count(job =>
                        job.Status == "Open"),

                closedJobs =
                    jobs.Count(job =>
                        job.Status == "Closed"),

                draftJobs =
                    jobs.Count(job =>
                        job.Status == "Draft"),

                jobs
            });
        }

        // --------------------------------------------------
        // GET CURRENT RECRUITER'S JOBS
        // GET: /api/Jobs/my
        // --------------------------------------------------
        [Authorize(Roles = "Recruiter")]
        [HttpGet("my")]
        public async Task<IActionResult>
            GetMyJobs()
        {
            int? recruiterId =
                GetCurrentUserId();

            if (recruiterId == null)
            {
                return Unauthorized(new
                {
                    message =
                        "Invalid user token."
                });
            }

            var jobs =
                await _context.JobPostings
                    .Where(job =>
                        job.RecruiterId ==
                        recruiterId.Value)
                    .OrderByDescending(job =>
                        job.CreatedAt)
                    .Select(job => new
                    {
                        job.JobId,
                        job.Title,
                        job.Description,
                        job.Requirements,
                        job.Location,
                        job.EmploymentType,
                        job.SalaryMin,
                        job.SalaryMax,
                        job.Deadline,
                        job.Status,
                        job.CreatedAt,
                        job.UpdatedAt,

                        job.OrganizationId,

                        organizationName =
                            job.Organization != null
                                ? job.Organization.Name
                                : "Not Assigned",

                        job.DepartmentId,

                        departmentName =
                            job.Department != null
                                ? job.Department.Name
                                : "Not Assigned",

                        job.RecruiterId,

                        totalApplications =
                            _context.JobApplications
                                .Count(application =>
                                    application.JobId ==
                                    job.JobId)
                    })
                    .ToListAsync();

            return Ok(new
            {
                totalJobs =
                    jobs.Count,

                openJobs =
                    jobs.Count(job =>
                        job.Status == "Open"),

                closedJobs =
                    jobs.Count(job =>
                        job.Status == "Closed"),

                draftJobs =
                    jobs.Count(job =>
                        job.Status == "Draft"),

                jobs
            });
        }

        // --------------------------------------------------
        // GET ONE JOB
        // GET: /api/Jobs/1
        // --------------------------------------------------
        [HttpGet("{id:int}")]
        public async Task<IActionResult>
            GetJobById(int id)
        {
            var job =
                await _context.JobPostings
                    .Where(item =>
                        item.JobId == id)
                    .Select(item => new
                    {
                        item.JobId,
                        item.Title,
                        item.Description,
                        item.Requirements,
                        item.Location,
                        item.EmploymentType,
                        item.SalaryMin,
                        item.SalaryMax,
                        item.Deadline,
                        item.Status,
                        item.CreatedAt,
                        item.UpdatedAt,

                        item.OrganizationId,

                        organizationName =
                            item.Organization != null
                                ? item.Organization.Name
                                : "Not Assigned",

                        item.DepartmentId,

                        departmentName =
                            item.Department != null
                                ? item.Department.Name
                                : "Not Assigned",

                        item.RecruiterId,

                        recruiterName =
                            item.Recruiter != null
                                ? item.Recruiter.FullName
                                : "Not Assigned"
                    })
                    .FirstOrDefaultAsync();

            if (job == null)
            {
                return NotFound(new
                {
                    message =
                        "Job not found."
                });
            }

            return Ok(job);
        }

        // --------------------------------------------------
        // CREATE JOB
        // POST: /api/Jobs
        // Recruiter assignment is applied automatically.
        // Admin must provide assignment IDs.
        // --------------------------------------------------
        [Authorize(Roles = "Recruiter,Admin")]
        [HttpPost]
        public async Task<IActionResult>
            CreateJob(CreateJobDto request)
        {
            IActionResult? validationResponse =
                ValidateJobRequest(
                    request.Title,
                    request.Deadline,
                    request.SalaryMin,
                    request.SalaryMax,
                    request.Status);

            if (validationResponse != null)
            {
                return validationResponse;
            }

            string? currentRole =
                User.FindFirstValue(
                    ClaimTypes.Role);

            int recruiterId;
            int organizationId;
            int departmentId;

            if (currentRole == "Recruiter")
            {
                int? currentUserId =
                    GetCurrentUserId();

                if (currentUserId == null)
                {
                    return Unauthorized(new
                    {
                        message =
                            "Invalid user token."
                    });
                }

                var assignment =
                    await GetRecruiterAssignment(
                        currentUserId.Value);

                if (assignment.ErrorMessage != null)
                {
                    return BadRequest(new
                    {
                        message =
                            assignment.ErrorMessage
                    });
                }

                recruiterId =
                    currentUserId.Value;

                organizationId =
                    assignment.OrganizationId!.Value;

                departmentId =
                    assignment.DepartmentId!.Value;
            }
            else if (currentRole == "Admin")
            {
                if (!request.RecruiterId.HasValue ||
                    !request.OrganizationId.HasValue ||
                    !request.DepartmentId.HasValue)
                {
                    return BadRequest(new
                    {
                        message =
                            "Admin must provide RecruiterId, OrganizationId and DepartmentId when creating a job."
                    });
                }

                var assignment =
                    await ValidateAdminJobAssignment(
                        request.RecruiterId.Value,
                        request.OrganizationId.Value,
                        request.DepartmentId.Value);

                if (assignment.ErrorMessage != null)
                {
                    return BadRequest(new
                    {
                        message =
                            assignment.ErrorMessage
                    });
                }

                recruiterId =
                    assignment.RecruiterId!.Value;

                organizationId =
                    assignment.OrganizationId!.Value;

                departmentId =
                    assignment.DepartmentId!.Value;
            }
            else
            {
                return Forbid();
            }

            var job =
                new JobPosting
                {
                    Title =
                        request.Title.Trim(),

                    Description =
                        CleanOptionalText(
                            request.Description)
                        ?? string.Empty,

                    Requirements =
                        CleanOptionalText(
                            request.Requirements),

                    Location =
                        CleanOptionalText(
                            request.Location),

                    EmploymentType =
                        CleanOptionalText(
                            request.EmploymentType),

                    SalaryMin =
                        request.SalaryMin,

                    SalaryMax =
                        request.SalaryMax,

                    Deadline =
                        request.Deadline,

                    Status =
                        NormalizeStatus(
                            request.Status,
                            "Open"),

                    RecruiterId =
                        recruiterId,

                    OrganizationId =
                        organizationId,

                    DepartmentId =
                        departmentId,

                    CreatedAt =
                        DateTime.UtcNow,

                    UpdatedAt =
                        null
                };

            _context.JobPostings.Add(job);

            await _context.SaveChangesAsync();

            await SafeAuditLogAsync(
                action: "Job Created",
                entityType: "JobPosting",
                entityId: job.JobId.ToString(),
                details:
                    $"Job '{job.Title}' was created with status '{job.Status}' for Recruiter ID {job.RecruiterId}, Organization ID {job.OrganizationId}, and Department ID {job.DepartmentId}.");

            var createdJob =
                await GetJobResponse(
                    job.JobId);

            return CreatedAtAction(
                nameof(GetJobById),
                new
                {
                    id = job.JobId
                },
                new
                {
                    message =
                        "Job created successfully.",

                    job = createdJob
                });
        }

        // --------------------------------------------------
        // UPDATE JOB
        // PUT: /api/Jobs/1
        // Recruiter can update only their own job.
        // --------------------------------------------------
        [Authorize(Roles = "Recruiter,Admin")]
        [HttpPut("{id:int}")]
        public async Task<IActionResult>
            UpdateJob(
                int id,
                UpdateJobDto request)
        {
            var existingJob =
                await _context.JobPostings
                    .FirstOrDefaultAsync(job =>
                        job.JobId == id);

            if (existingJob == null)
            {
                return NotFound(new
                {
                    message =
                        "Job not found."
                });
            }

            string previousTitle =
                existingJob.Title;

            string previousStatus =
                existingJob.Status;

            string? currentRole =
                User.FindFirstValue(
                    ClaimTypes.Role);

            if (currentRole == "Recruiter")
            {
                int? currentUserId =
                    GetCurrentUserId();

                if (currentUserId == null)
                {
                    return Unauthorized(new
                    {
                        message =
                            "Invalid user token."
                    });
                }

                if (existingJob.RecruiterId !=
                    currentUserId.Value)
                {
                    return StatusCode(
                        StatusCodes
                            .Status403Forbidden,
                        new
                        {
                            message =
                                "You can update only job postings created by your account."
                        });
                }

                var assignment =
                    await GetRecruiterAssignment(
                        currentUserId.Value);

                if (assignment.ErrorMessage != null)
                {
                    return BadRequest(new
                    {
                        message =
                            assignment.ErrorMessage
                    });
                }

                existingJob.RecruiterId =
                    currentUserId.Value;

                existingJob.OrganizationId =
                    assignment.OrganizationId!.Value;

                existingJob.DepartmentId =
                    assignment.DepartmentId!.Value;
            }
            else if (currentRole == "Admin")
            {
                int recruiterId =
                    request.RecruiterId ??
                    existingJob.RecruiterId ??
                    0;

                int organizationId =
                    request.OrganizationId ??
                    existingJob.OrganizationId ??
                    0;

                int departmentId =
                    request.DepartmentId ??
                    existingJob.DepartmentId ??
                    0;

                if (recruiterId <= 0 ||
                    organizationId <= 0 ||
                    departmentId <= 0)
                {
                    return BadRequest(new
                    {
                        message =
                            "The job must have a valid Recruiter, Organization and Department assignment."
                    });
                }

                var assignment =
                    await ValidateAdminJobAssignment(
                        recruiterId,
                        organizationId,
                        departmentId);

                if (assignment.ErrorMessage != null)
                {
                    return BadRequest(new
                    {
                        message =
                            assignment.ErrorMessage
                    });
                }

                existingJob.RecruiterId =
                    assignment.RecruiterId!.Value;

                existingJob.OrganizationId =
                    assignment.OrganizationId!.Value;

                existingJob.DepartmentId =
                    assignment.DepartmentId!.Value;
            }
            else
            {
                return Forbid();
            }

            IActionResult? validationResponse =
                ValidateJobRequest(
                    request.Title,
                    request.Deadline,
                    request.SalaryMin,
                    request.SalaryMax,
                    request.Status);

            if (validationResponse != null)
            {
                return validationResponse;
            }

            existingJob.Title =
                request.Title.Trim();

            existingJob.Description =
                CleanOptionalText(
                    request.Description)
                ?? string.Empty;

            existingJob.Requirements =
                CleanOptionalText(
                    request.Requirements);

            existingJob.Location =
                CleanOptionalText(
                    request.Location);

            existingJob.EmploymentType =
                CleanOptionalText(
                    request.EmploymentType);

            existingJob.SalaryMin =
                request.SalaryMin;

            existingJob.SalaryMax =
                request.SalaryMax;

            existingJob.Deadline =
                request.Deadline;

            existingJob.Status =
                NormalizeStatus(
                    request.Status,
                    existingJob.Status);

            existingJob.UpdatedAt =
                DateTime.UtcNow;

            await _context.SaveChangesAsync();

            await SafeAuditLogAsync(
                action: "Job Updated",
                entityType: "JobPosting",
                entityId:
                    existingJob.JobId.ToString(),
                details:
                    $"Job '{previousTitle}' was updated to '{existingJob.Title}'. Status changed from '{previousStatus}' to '{existingJob.Status}'.");

            var updatedJob =
                await GetJobResponse(
                    existingJob.JobId);

            return Ok(new
            {
                message =
                    "Job updated successfully.",

                job = updatedJob
            });
        }

        // --------------------------------------------------
        // DELETE JOB
        // DELETE: /api/Jobs/1
        // Recruiter can delete only their own job.
        // --------------------------------------------------
        [Authorize(Roles = "Recruiter,Admin")]
        [HttpDelete("{id:int}")]
        public async Task<IActionResult>
            DeleteJob(int id)
        {
            var job =
                await _context.JobPostings
                    .FirstOrDefaultAsync(item =>
                        item.JobId == id);

            if (job == null)
            {
                return NotFound(new
                {
                    message =
                        "Job not found."
                });
            }

            string? currentRole =
                User.FindFirstValue(
                    ClaimTypes.Role);

            if (currentRole == "Recruiter")
            {
                int? currentUserId =
                    GetCurrentUserId();

                if (currentUserId == null)
                {
                    return Unauthorized(new
                    {
                        message =
                            "Invalid user token."
                    });
                }

                if (job.RecruiterId !=
                    currentUserId.Value)
                {
                    return StatusCode(
                        StatusCodes
                            .Status403Forbidden,
                        new
                        {
                            message =
                                "You can delete only job postings created by your account."
                        });
                }
            }

            bool hasApplications =
                await _context.JobApplications
                    .AnyAsync(application =>
                        application.JobId == id);

            if (hasApplications)
            {
                return BadRequest(new
                {
                    message =
                        "This job cannot be deleted because applications have already been submitted. Close the job instead."
                });
            }

            string deletedJobTitle =
                job.Title;

            string deletedJobStatus =
                job.Status;

            _context.JobPostings.Remove(job);

            await _context.SaveChangesAsync();

            await SafeAuditLogAsync(
                action: "Job Deleted",
                entityType: "JobPosting",
                entityId: id.ToString(),
                details:
                    $"Job '{deletedJobTitle}' with status '{deletedJobStatus}' was deleted.");

            return Ok(new
            {
                message =
                    "Job deleted successfully."
            });
        }

        // --------------------------------------------------
        // CHANGE JOB STATUS
        // PUT: /api/Jobs/1/status
        // --------------------------------------------------
        [Authorize(Roles = "Recruiter,Admin")]
        [HttpPut("{id:int}/status")]
        public async Task<IActionResult>
            ChangeJobStatus(
                int id,
                ChangeJobStatusDto request)
        {
            var job =
                await _context.JobPostings
                    .FirstOrDefaultAsync(item =>
                        item.JobId == id);

            if (job == null)
            {
                return NotFound(new
                {
                    message =
                        "Job not found."
                });
            }

            string? currentRole =
                User.FindFirstValue(
                    ClaimTypes.Role);

            if (currentRole == "Recruiter")
            {
                int? currentUserId =
                    GetCurrentUserId();

                if (currentUserId == null)
                {
                    return Unauthorized(new
                    {
                        message =
                            "Invalid user token."
                    });
                }

                if (job.RecruiterId !=
                    currentUserId.Value)
                {
                    return StatusCode(
                        StatusCodes
                            .Status403Forbidden,
                        new
                        {
                            message =
                                "You can change the status only for your own job postings."
                        });
                }
            }

            string? normalizedStatus =
                NormalizeAllowedStatus(
                    request.Status);

            if (normalizedStatus == null)
            {
                return BadRequest(new
                {
                    message =
                        "Invalid job status.",

                    allowedStatuses =
                        new[]
                        {
                            "Open",
                            "Closed",
                            "Draft"
                        }
                });
            }

            string previousStatus =
                job.Status;

            job.Status =
                normalizedStatus;

            job.UpdatedAt =
                DateTime.UtcNow;

            await _context.SaveChangesAsync();

            await SafeAuditLogAsync(
                action: "Job Status Changed",
                entityType: "JobPosting",
                entityId: job.JobId.ToString(),
                details:
                    $"Job '{job.Title}' status changed from '{previousStatus}' to '{job.Status}'.");

            return Ok(new
            {
                message =
                    "Job status updated successfully.",

                job.JobId,
                job.Status,
                job.UpdatedAt
            });
        }

        // --------------------------------------------------
        // GET RECRUITER ASSIGNMENT
        // --------------------------------------------------
        private async Task<JobAssignmentResult>
            GetRecruiterAssignment(
                int recruiterId)
        {
            var recruiter =
                await _context.Users
                    .Include(user =>
                        user.RecruiterProfile)
                    .ThenInclude(profile =>
                        profile!.Organization)
                    .Include(user =>
                        user.RecruiterProfile)
                    .ThenInclude(profile =>
                        profile!.Department)
                    .FirstOrDefaultAsync(user =>
                        user.UserId ==
                            recruiterId &&
                        user.Role ==
                            "Recruiter");

            if (recruiter == null)
            {
                return new JobAssignmentResult
                {
                    ErrorMessage =
                        "Recruiter account not found."
                };
            }

            if (!recruiter.IsActive)
            {
                return new JobAssignmentResult
                {
                    ErrorMessage =
                        "Your Recruiter account is inactive."
                };
            }

            var profile =
                recruiter.RecruiterProfile;

            if (profile == null)
            {
                return new JobAssignmentResult
                {
                    ErrorMessage =
                        "Your Recruiter profile has not been created."
                };
            }

            if (!profile.OrganizationId.HasValue ||
                !profile.DepartmentId.HasValue)
            {
                return new JobAssignmentResult
                {
                    ErrorMessage =
                        "You must be assigned to an organization and department before creating or updating job postings."
                };
            }

            if (profile.Organization == null ||
                !profile.Organization.IsActive)
            {
                return new JobAssignmentResult
                {
                    ErrorMessage =
                        "Your assigned organization is inactive or unavailable."
                };
            }

            if (profile.Department == null ||
                !profile.Department.IsActive)
            {
                return new JobAssignmentResult
                {
                    ErrorMessage =
                        "Your assigned department is inactive or unavailable."
                };
            }

            if (profile.Department.OrganizationId !=
                profile.OrganizationId.Value)
            {
                return new JobAssignmentResult
                {
                    ErrorMessage =
                        "Your assigned department does not belong to your assigned organization."
                };
            }

            return new JobAssignmentResult
            {
                RecruiterId =
                    recruiter.UserId,

                OrganizationId =
                    profile.OrganizationId.Value,

                DepartmentId =
                    profile.DepartmentId.Value
            };
        }

        // --------------------------------------------------
        // VALIDATE ADMIN JOB ASSIGNMENT
        // --------------------------------------------------
        private async Task<JobAssignmentResult>
            ValidateAdminJobAssignment(
                int recruiterId,
                int organizationId,
                int departmentId)
        {
            var recruiter =
                await _context.Users
                    .Include(user =>
                        user.RecruiterProfile)
                    .FirstOrDefaultAsync(user =>
                        user.UserId ==
                        recruiterId);

            if (recruiter == null)
            {
                return new JobAssignmentResult
                {
                    ErrorMessage =
                        "The selected Recruiter account does not exist."
                };
            }

            if (recruiter.Role != "Recruiter")
            {
                return new JobAssignmentResult
                {
                    ErrorMessage =
                        "The selected user is not a Recruiter."
                };
            }

            if (!recruiter.IsActive)
            {
                return new JobAssignmentResult
                {
                    ErrorMessage =
                        "The selected Recruiter account is inactive."
                };
            }

            if (recruiter.RecruiterProfile == null)
            {
                return new JobAssignmentResult
                {
                    ErrorMessage =
                        "The selected Recruiter does not have a Recruiter profile."
                };
            }

            if (recruiter.RecruiterProfile
                    .OrganizationId !=
                organizationId ||
                recruiter.RecruiterProfile
                    .DepartmentId !=
                departmentId)
            {
                return new JobAssignmentResult
                {
                    ErrorMessage =
                        "The selected organization and department do not match the Recruiter's current assignment."
                };
            }

            var organization =
                await _context.Organizations
                    .FirstOrDefaultAsync(item =>
                        item.OrganizationId ==
                        organizationId);

            if (organization == null ||
                !organization.IsActive)
            {
                return new JobAssignmentResult
                {
                    ErrorMessage =
                        "The selected organization is inactive or does not exist."
                };
            }

            var department =
                await _context.Departments
                    .FirstOrDefaultAsync(item =>
                        item.DepartmentId ==
                        departmentId);

            if (department == null ||
                !department.IsActive)
            {
                return new JobAssignmentResult
                {
                    ErrorMessage =
                        "The selected department is inactive or does not exist."
                };
            }

            if (department.OrganizationId !=
                organizationId)
            {
                return new JobAssignmentResult
                {
                    ErrorMessage =
                        "The selected department does not belong to the selected organization."
                };
            }

            return new JobAssignmentResult
            {
                RecruiterId =
                    recruiterId,

                OrganizationId =
                    organizationId,

                DepartmentId =
                    departmentId
            };
        }

        // --------------------------------------------------
        // VALIDATE JOB FIELDS
        // --------------------------------------------------
        private IActionResult?
            ValidateJobRequest(
                string? title,
                DateTime deadline,
                decimal? salaryMin,
                decimal? salaryMax,
                string? status)
        {
            if (string.IsNullOrWhiteSpace(
                    title))
            {
                return BadRequest(new
                {
                    message =
                        "Job title is required."
                });
            }

            if (deadline <=
                DateTime.UtcNow)
            {
                return BadRequest(new
                {
                    message =
                        "Deadline must be in the future."
                });
            }

            if (salaryMin.HasValue &&
                salaryMin.Value < 0)
            {
                return BadRequest(new
                {
                    message =
                        "Minimum salary cannot be negative."
                });
            }

            if (salaryMax.HasValue &&
                salaryMax.Value < 0)
            {
                return BadRequest(new
                {
                    message =
                        "Maximum salary cannot be negative."
                });
            }

            if (salaryMin.HasValue &&
                salaryMax.HasValue &&
                salaryMax.Value <
                salaryMin.Value)
            {
                return BadRequest(new
                {
                    message =
                        "Maximum salary cannot be lower than minimum salary."
                });
            }

            if (!string.IsNullOrWhiteSpace(
                    status) &&
                NormalizeAllowedStatus(
                    status) == null)
            {
                return BadRequest(new
                {
                    message =
                        "Invalid job status.",

                    allowedStatuses =
                        new[]
                        {
                            "Open",
                            "Closed",
                            "Draft"
                        }
                });
            }

            return null;
        }

        // --------------------------------------------------
        // GET ONE JOB RESPONSE
        // --------------------------------------------------
        private async Task<dynamic?>
            GetJobResponse(int jobId)
        {
            return await _context.JobPostings
                .Where(job =>
                    job.JobId == jobId)
                .Select(job => new
                {
                    job.JobId,
                    job.Title,
                    job.Description,
                    job.Requirements,
                    job.Location,
                    job.EmploymentType,
                    job.SalaryMin,
                    job.SalaryMax,
                    job.Deadline,
                    job.Status,
                    job.CreatedAt,
                    job.UpdatedAt,

                    job.OrganizationId,

                    organizationName =
                        job.Organization != null
                            ? job.Organization.Name
                            : "Not Assigned",

                    job.DepartmentId,

                    departmentName =
                        job.Department != null
                            ? job.Department.Name
                            : "Not Assigned",

                    job.RecruiterId,

                    recruiterName =
                        job.Recruiter != null
                            ? job.Recruiter.FullName
                            : "Not Assigned"
                })
                .FirstOrDefaultAsync();
        }

        // --------------------------------------------------
        // SAFE AUDIT LOGGING
        // Job actions must remain successful even if
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
                int? userId =
                    GetCurrentUserId();

                string? userName =
                    User.FindFirstValue(
                        ClaimTypes.Name);

                string? userEmail =
                    User.FindFirstValue(
                        ClaimTypes.Email);

                string? userRole =
                    User.FindFirstValue(
                        ClaimTypes.Role);

                string actorName =
                    !string.IsNullOrWhiteSpace(
                        userName)
                        ? userName
                        : !string.IsNullOrWhiteSpace(
                            userEmail)
                            ? userEmail
                            : "Unknown User";

                await _auditLogService.LogAsync(
                    userId: userId,
                    userName: actorName,
                    role: userRole,
                    action: action,
                    entityType: entityType,
                    entityId: entityId,
                    details: details);
            }
            catch
            {
                // Audit logging must not interrupt a
                // successfully completed job action.
            }
        }

        // --------------------------------------------------
        // GET CURRENT USER ID
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

        private static string
            NormalizeStatus(
                string? status,
                string fallbackStatus)
        {
            return NormalizeAllowedStatus(
                       status)
                   ?? fallbackStatus;
        }

        private static string?
            NormalizeAllowedStatus(
                string? status)
        {
            if (string.IsNullOrWhiteSpace(
                    status))
            {
                return null;
            }

            return status
                .Trim()
                .ToLowerInvariant() switch
            {
                "open" =>
                    "Open",

                "closed" =>
                    "Closed",

                "draft" =>
                    "Draft",

                _ =>
                    null
            };
        }

        private static string?
            CleanOptionalText(
                string? value)
        {
            return string.IsNullOrWhiteSpace(
                    value)
                ? null
                : value.Trim();
        }

        private class JobAssignmentResult
        {
            public string? ErrorMessage
            {
                get;
                set;
            }

            public int? RecruiterId
            {
                get;
                set;
            }

            public int? OrganizationId
            {
                get;
                set;
            }

            public int? DepartmentId
            {
                get;
                set;
            }
        }
    }

    public class CreateJobDto
    {
        [Required]
        [MaxLength(150)]
        public string Title { get; set; } =
            string.Empty;

        public string? Description { get; set; }

        public string? Requirements { get; set; }

        [MaxLength(150)]
        public string? Location { get; set; }

        [MaxLength(50)]
        public string? EmploymentType
        {
            get;
            set;
        }

        public decimal? SalaryMin { get; set; }

        public decimal? SalaryMax { get; set; }

        [Required]
        public DateTime Deadline { get; set; }

        [MaxLength(30)]
        public string? Status { get; set; }

        public int? RecruiterId { get; set; }

        public int? OrganizationId { get; set; }

        public int? DepartmentId { get; set; }
    }

    public class UpdateJobDto
    {
        [Required]
        [MaxLength(150)]
        public string Title { get; set; } =
            string.Empty;

        public string? Description { get; set; }

        public string? Requirements { get; set; }

        [MaxLength(150)]
        public string? Location { get; set; }

        [MaxLength(50)]
        public string? EmploymentType
        {
            get;
            set;
        }

        public decimal? SalaryMin { get; set; }

        public decimal? SalaryMax { get; set; }

        [Required]
        public DateTime Deadline { get; set; }

        [MaxLength(30)]
        public string? Status { get; set; }

        public int? RecruiterId { get; set; }

        public int? OrganizationId { get; set; }

        public int? DepartmentId { get; set; }
    }

    public class ChangeJobStatusDto
    {
        [Required]
        [MaxLength(30)]
        public string Status { get; set; } =
            string.Empty;
    }
}