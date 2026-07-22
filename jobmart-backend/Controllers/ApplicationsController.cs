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
    [Authorize]
    public class ApplicationsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ApplicationsController(
            ApplicationDbContext context)
        {
            _context = context;
        }

        // --------------------------------------------------
        // CANDIDATE APPLIES FOR A JOB
        // POST: /api/Applications
        // --------------------------------------------------
        [Authorize(Roles = "Candidate")]
        [HttpPost]
        public async Task<IActionResult> ApplyForJob(
            CreateJobApplicationDto request)
        {
            int? userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized(new
                {
                    message = "Invalid user token."
                });
            }

            var job = await _context.JobPostings
                .FirstOrDefaultAsync(jobPosting =>
                    jobPosting.JobId == request.JobId);

            if (job == null)
            {
                return NotFound(new
                {
                    message = "Job not found."
                });
            }

            if (job.Status != "Open")
            {
                return BadRequest(new
                {
                    message =
                        "This job is not open for applications."
                });
            }

            if (job.Deadline <= DateTime.UtcNow)
            {
                return BadRequest(new
                {
                    message =
                        "The application deadline has passed."
                });
            }

            var candidateProfile =
                await _context.CandidateProfiles
                    .FirstOrDefaultAsync(profile =>
                        profile.UserId == userId.Value);

            if (candidateProfile == null)
            {
                candidateProfile = new CandidateProfile
                {
                    UserId = userId.Value,
                    ExperienceYears = 0,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.CandidateProfiles.Add(
                    candidateProfile);

                await _context.SaveChangesAsync();
            }

            bool alreadyApplied =
                await _context.JobApplications
                    .AnyAsync(application =>
                        application.JobId ==
                            request.JobId &&
                        application.CandidateProfileId ==
                            candidateProfile
                                .CandidateProfileId);

            if (alreadyApplied)
            {
                return BadRequest(new
                {
                    message =
                        "You have already applied for this job."
                });
            }

            var application = new JobApplication
            {
                JobId = request.JobId,

                CandidateProfileId =
                    candidateProfile.CandidateProfileId,

                CoverLetter =
                    request.CoverLetter?.Trim(),

                Status = "Pending",

                AIScore = 0,

                AppliedAt = DateTime.UtcNow
            };

            _context.JobApplications.Add(application);

            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetMyApplications),
                new { },
                new
                {
                    message =
                        "Application submitted successfully.",

                    application
                });
        }

        // --------------------------------------------------
        // CANDIDATE VIEWS OWN APPLICATIONS
        // GET: /api/Applications/my
        // --------------------------------------------------
        [Authorize(Roles = "Candidate")]
        [HttpGet("my")]
        public async Task<IActionResult>
            GetMyApplications()
        {
            int? userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized(new
                {
                    message = "Invalid user token."
                });
            }

            var applications =
                await _context.JobApplications
                    .Include(application =>
                        application.JobPosting)
                    .Include(application =>
                        application.CandidateProfile)
                    .Where(application =>
                        application.CandidateProfile != null &&
                        application.CandidateProfile.UserId ==
                            userId.Value)
                    .OrderByDescending(application =>
                        application.AppliedAt)
                    .Select(application => new
                    {
                        applicationId =
                            application.JobApplicationId,

                        application.JobId,

                        jobTitle =
                            application.JobPosting != null
                                ? application.JobPosting.Title
                                : null,

                        jobLocation =
                            application.JobPosting != null
                                ? application.JobPosting.Location
                                : null,

                        application.CoverLetter,

                        application.Status,

                        application.AIScore,

                        application.AppliedAt
                    })
                    .ToListAsync();

            return Ok(applications);
        }

        // --------------------------------------------------
        // RECRUITER/ADMIN VIEWS APPLICATIONS FOR ONE JOB
        // GET: /api/Applications/job/1
        // --------------------------------------------------
        [Authorize(Roles = "Recruiter,Admin")]
        [HttpGet("job/{jobId}")]
        public async Task<IActionResult>
            GetApplicationsForJob(int jobId)
        {
            bool jobExists =
                await _context.JobPostings
                    .AnyAsync(job =>
                        job.JobId == jobId);

            if (!jobExists)
            {
                return NotFound(new
                {
                    message = "Job not found."
                });
            }

            var applications =
                await _context.JobApplications
                    .Include(application =>
                        application.JobPosting)
                    .Include(application =>
                        application.CandidateProfile)
                        .ThenInclude(profile =>
                            profile!.User)
                    .Where(application =>
                        application.JobId == jobId)
                    .OrderByDescending(application =>
                        application.AIScore)
                    .ThenByDescending(application =>
                        application.AppliedAt)
                    .Select(application => new
                    {
                        applicationId =
                            application.JobApplicationId,

                        application.JobId,

                        jobTitle =
                            application.JobPosting != null
                                ? application.JobPosting.Title
                                : null,

                        candidateProfileId =
                            application.CandidateProfileId,

                        candidateName =
                            application.CandidateProfile != null &&
                            application.CandidateProfile.User != null
                                ? application.CandidateProfile
                                    .User
                                    .FullName
                                : null,

                        candidateEmail =
                            application.CandidateProfile != null &&
                            application.CandidateProfile.User != null
                                ? application.CandidateProfile
                                    .User
                                    .Email
                                : null,

                        application.CoverLetter,

                        application.Status,

                        application.AIScore,

                        application.AppliedAt
                    })
                    .ToListAsync();

            return Ok(applications);
        }

        // --------------------------------------------------
        // RECRUITER/ADMIN VIEWS ALL APPLICATIONS
        // GET: /api/Applications/recruiter/all
        // --------------------------------------------------
        [Authorize(Roles = "Recruiter,Admin")]
        [HttpGet("recruiter/all")]
        public async Task<IActionResult>
            GetAllApplicationsForRecruiter()
        {
            var applications =
                await _context.JobApplications
                    .Include(application =>
                        application.JobPosting)
                    .Include(application =>
                        application.CandidateProfile)
                        .ThenInclude(profile =>
                            profile!.User)
                    .OrderByDescending(application =>
                        application.AppliedAt)
                    .Select(application => new
                    {
                        applicationId =
                            application.JobApplicationId,

                        jobId =
                            application.JobId,

                        jobTitle =
                            application.JobPosting != null
                                ? application.JobPosting.Title
                                : "Unknown Job",

                        candidateProfileId =
                            application.CandidateProfileId,

                        candidateName =
                            application.CandidateProfile != null &&
                            application.CandidateProfile.User != null
                                ? application.CandidateProfile
                                    .User
                                    .FullName
                                : "Unknown Candidate",

                        candidateEmail =
                            application.CandidateProfile != null &&
                            application.CandidateProfile.User != null
                                ? application.CandidateProfile
                                    .User
                                    .Email
                                : string.Empty,

                        phone =
                            application.CandidateProfile != null
                                ? application.CandidateProfile.Phone
                                : string.Empty,

                        bio =
                            application.CandidateProfile != null
                                ? application.CandidateProfile.Bio
                                : string.Empty,

                        skills =
                            application.CandidateProfile != null
                                ? application.CandidateProfile.Skills
                                : string.Empty,

                        education =
                            application.CandidateProfile != null
                                ? application.CandidateProfile.Education
                                : string.Empty,

                        experienceYears =
                            application.CandidateProfile != null
                                ? application.CandidateProfile
                                    .ExperienceYears
                                : 0,

                        currentJobTitle =
                            application.CandidateProfile != null
                                ? application.CandidateProfile
                                    .CurrentJobTitle
                                : string.Empty,

                        linkedInUrl =
                            application.CandidateProfile != null
                                ? application.CandidateProfile
                                    .LinkedInUrl
                                : string.Empty,

                        portfolioUrl =
                            application.CandidateProfile != null
                                ? application.CandidateProfile
                                    .PortfolioUrl
                                : string.Empty,

                        application.CoverLetter,

                        application.Status,

                        application.AIScore,

                        application.AppliedAt,

                        primaryResumeId =
                            _context.Resumes
                                .Where(resume =>
                                    resume.CandidateProfileId ==
                                        application
                                            .CandidateProfileId &&
                                    resume.IsPrimary)
                                .Select(resume =>
                                    (int?)resume.ResumeId)
                                .FirstOrDefault(),

                        primaryResumeName =
                            _context.Resumes
                                .Where(resume =>
                                    resume.CandidateProfileId ==
                                        application
                                            .CandidateProfileId &&
                                    resume.IsPrimary)
                                .Select(resume =>
                                    resume.OriginalFileName)
                                .FirstOrDefault()
                    })
                    .ToListAsync();

            return Ok(new
            {
                totalApplications =
                    applications.Count,

                applications
            });
        }

        // --------------------------------------------------
        // HIRING MANAGER VIEWS CANDIDATES READY FOR REVIEW
        // GET: /api/Applications/manager/candidates
        // --------------------------------------------------
        [Authorize(Roles = "HiringManager,Admin")]
        [HttpGet("manager/candidates")]
        public async Task<IActionResult>
            GetCandidatesForHiringManager()
        {
            string[] allowedStatuses =
            {
                "UnderReview",
                "Under Review",
                "Shortlisted",
                "InterviewScheduled",
                "InterviewCompleted",
                "Selected",
                "Hired",
                "Rejected"
            };

            var candidates =
                await _context.JobApplications
                    .Include(application =>
                        application.JobPosting)
                    .Include(application =>
                        application.CandidateProfile)
                        .ThenInclude(profile =>
                            profile!.User)
                    .Where(application =>
                        allowedStatuses.Contains(
                            application.Status))
                    .OrderByDescending(application =>
                        application.AIScore)
                    .ThenByDescending(application =>
                        application.AppliedAt)
                    .Select(application => new
                    {
                        applicationId =
                            application.JobApplicationId,

                        jobId =
                            application.JobId,

                        jobTitle =
                            application.JobPosting != null
                                ? application.JobPosting.Title
                                : "Unknown Job",

                        jobLocation =
                            application.JobPosting != null
                                ? application.JobPosting.Location
                                : string.Empty,

                        employmentType =
                            application.JobPosting != null
                                ? application.JobPosting
                                    .EmploymentType
                                : string.Empty,

                        candidateProfileId =
                            application.CandidateProfileId,

                        candidateName =
                            application.CandidateProfile != null &&
                            application.CandidateProfile.User != null
                                ? application.CandidateProfile
                                    .User
                                    .FullName
                                : "Unknown Candidate",

                        candidateEmail =
                            application.CandidateProfile != null &&
                            application.CandidateProfile.User != null
                                ? application.CandidateProfile
                                    .User
                                    .Email
                                : string.Empty,

                        phone =
                            application.CandidateProfile != null
                                ? application.CandidateProfile.Phone
                                : string.Empty,

                        bio =
                            application.CandidateProfile != null
                                ? application.CandidateProfile.Bio
                                : string.Empty,

                        experienceYears =
                            application.CandidateProfile != null
                                ? application.CandidateProfile
                                    .ExperienceYears
                                : 0,

                        education =
                            application.CandidateProfile != null
                                ? application.CandidateProfile
                                    .Education
                                : string.Empty,

                        skills =
                            application.CandidateProfile != null
                                ? application.CandidateProfile.Skills
                                : string.Empty,

                        currentJobTitle =
                            application.CandidateProfile != null
                                ? application.CandidateProfile
                                    .CurrentJobTitle
                                : string.Empty,

                        linkedInUrl =
                            application.CandidateProfile != null
                                ? application.CandidateProfile
                                    .LinkedInUrl
                                : string.Empty,

                        portfolioUrl =
                            application.CandidateProfile != null
                                ? application.CandidateProfile
                                    .PortfolioUrl
                                : string.Empty,

                        address =
                            application.CandidateProfile != null
                                ? application.CandidateProfile
                                    .Address
                                : string.Empty,

                        application.CoverLetter,

                        application.Status,

                        application.AIScore,

                        application.AppliedAt,

                        primaryResumeId =
                            _context.Resumes
                                .Where(resume =>
                                    resume.CandidateProfileId ==
                                        application
                                            .CandidateProfileId &&
                                    resume.IsPrimary)
                                .Select(resume =>
                                    (int?)resume.ResumeId)
                                .FirstOrDefault(),

                        primaryResumeName =
                            _context.Resumes
                                .Where(resume =>
                                    resume.CandidateProfileId ==
                                        application
                                            .CandidateProfileId &&
                                    resume.IsPrimary)
                                .Select(resume =>
                                    resume.OriginalFileName)
                                .FirstOrDefault(),

                        evaluationId =
                            _context.CandidateEvaluations
                                .Where(evaluation =>
                                    evaluation.JobApplicationId ==
                                        application
                                            .JobApplicationId)
                                .OrderByDescending(evaluation =>
                                    evaluation.UpdatedAt)
                                .Select(evaluation =>
                                    (int?)evaluation
                                        .EvaluationId)
                                .FirstOrDefault(),

                        evaluationScore =
                            _context.CandidateEvaluations
                                .Where(evaluation =>
                                    evaluation.JobApplicationId ==
                                        application
                                            .JobApplicationId)
                                .OrderByDescending(evaluation =>
                                    evaluation.UpdatedAt)
                                .Select(evaluation =>
                                    (decimal?)evaluation
                                        .OverallScore)
                                .FirstOrDefault(),

                        evaluationDecision =
                            _context.CandidateEvaluations
                                .Where(evaluation =>
                                    evaluation.JobApplicationId ==
                                        application
                                            .JobApplicationId)
                                .OrderByDescending(evaluation =>
                                    evaluation.UpdatedAt)
                                .Select(evaluation =>
                                    evaluation.Decision)
                                .FirstOrDefault()
                    })
                    .ToListAsync();

            return Ok(new
            {
                totalCandidates =
                    candidates.Count,

                candidates
            });
        }

        // --------------------------------------------------
        // RECRUITER/ADMIN UPDATES APPLICATION STATUS
        // PUT: /api/Applications/1/status
        // --------------------------------------------------
        [Authorize(Roles = "Recruiter,Admin")]
        [HttpPut("{id}/status")]
        public async Task<IActionResult>
            UpdateApplicationStatus(
                int id,
                UpdateApplicationStatusDto request)
        {
            string[] allowedStatuses =
            {
                "Pending",
                "UnderReview",
                "Shortlisted",
                "InterviewScheduled",
                "InterviewCompleted",
                "Rejected",
                "Hired",
                "Selected"
            };

            string? normalizedStatus =
                allowedStatuses.FirstOrDefault(status =>
                    status.Equals(
                        request.Status,
                        StringComparison.OrdinalIgnoreCase));

            if (normalizedStatus == null)
            {
                return BadRequest(new
                {
                    message =
                        "Invalid application status.",

                    allowedStatuses
                });
            }

            var application =
                await _context.JobApplications
                    .FirstOrDefaultAsync(item =>
                        item.JobApplicationId == id);

            if (application == null)
            {
                return NotFound(new
                {
                    message =
                        "Application not found."
                });
            }

            application.Status = normalizedStatus;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Application status updated successfully.",

                applicationId =
                    application.JobApplicationId,

                application.Status
            });
        }

        // --------------------------------------------------
        // GET CURRENT USER ID FROM JWT
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
    }
}