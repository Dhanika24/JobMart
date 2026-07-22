using System.Security.Claims;
using jobmart.Data;
using jobmart.DTOs;
using jobmart.Interfaces;
using jobmart.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace jobmart.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(
        Roles =
            "Recruiter,HiringManager,Admin")]
    public class RankingController
        : ControllerBase
    {
        private readonly
            ApplicationDbContext _context;

        private readonly
            ICandidateMatchingService
                _matchingService;

        public RankingController(
            ApplicationDbContext context,
            ICandidateMatchingService
                matchingService)
        {
            _context = context;
            _matchingService =
                matchingService;
        }

        // --------------------------------------------------
        // CALCULATE CANDIDATE RANKINGS
        // POST: api/Ranking/job/1/calculate
        // --------------------------------------------------
        [HttpPost(
            "job/{jobId:int}/calculate")]
        public async Task<IActionResult>
            CalculateRankings(int jobId)
        {
            var job =
                await _context.JobPostings
                    .FirstOrDefaultAsync(
                        item =>
                            item.JobId ==
                            jobId);

            if (job == null)
            {
                return NotFound(new
                {
                    message =
                        "Job posting not found."
                });
            }

            IActionResult?
                accessResponse =
                    ValidateJobAccess(job);

            if (accessResponse != null)
            {
                return accessResponse;
            }

            var applications =
                await _context
                    .JobApplications
                    .Include(application =>
                        application
                            .CandidateProfile)
                    .ThenInclude(profile =>
                        profile!.User)
                    .Where(application =>
                        application.JobId ==
                        jobId)
                    .ToListAsync();

            if (applications.Count == 0)
            {
                return NotFound(new
                {
                    message =
                        "No applications were found for this job."
                });
            }

            var results =
                new List<
                    CandidateRankingResultDto>();

            foreach (
                var application
                in applications)
            {
                if (application
                        .CandidateProfile ==
                    null)
                {
                    continue;
                }

                var result =
                    _matchingService
                        .CalculateScore(
                            application,
                            application
                                .CandidateProfile,
                            job);

                application.AIScore =
                    result.TotalScore;

                results.Add(result);
            }

            await _context
                .SaveChangesAsync();

            var rankedResults =
                results
                    .OrderByDescending(
                        result =>
                            result.TotalScore)
                    .ThenBy(result =>
                        result.CandidateName)
                    .ToList();

            return Ok(new
            {
                message =
                    "Candidate ranking completed successfully.",

                jobId =
                    job.JobId,

                jobTitle =
                    job.Title,

                requirements =
                    job.Requirements,

                organizationId =
                    job.OrganizationId,

                departmentId =
                    job.DepartmentId,

                recruiterId =
                    job.RecruiterId,

                totalCandidates =
                    rankedResults.Count,

                rankings =
                    rankedResults
            });
        }

        // --------------------------------------------------
        // GET RANKINGS FOR ONE JOB
        // GET: api/Ranking/job/1
        // --------------------------------------------------
        [HttpGet("job/{jobId:int}")]
        public async Task<IActionResult>
            GetRankings(int jobId)
        {
            var job =
                await _context.JobPostings
                    .FirstOrDefaultAsync(
                        item =>
                            item.JobId ==
                            jobId);

            if (job == null)
            {
                return NotFound(new
                {
                    message =
                        "Job posting not found."
                });
            }

            IActionResult?
                accessResponse =
                    ValidateJobAccess(job);

            if (accessResponse != null)
            {
                return accessResponse;
            }

            var rankings =
                await _context
                    .JobApplications
                    .Include(application =>
                        application
                            .CandidateProfile)
                    .ThenInclude(profile =>
                        profile!.User)
                    .Where(application =>
                        application.JobId ==
                        jobId)
                    .OrderByDescending(
                        application =>
                            application.AIScore)
                    .ThenBy(application =>
                        application
                            .CandidateProfile!
                            .User!
                            .FullName)
                    .Select(application =>
                        new
                        {
                            applicationId =
                                application
                                    .JobApplicationId,

                            candidateProfileId =
                                application
                                    .CandidateProfileId,

                            candidateName =
                                application
                                        .CandidateProfile !=
                                    null &&
                                application
                                        .CandidateProfile
                                        .User != null
                                    ? application
                                        .CandidateProfile
                                        .User
                                        .FullName
                                    : "Unknown Candidate",

                            candidateEmail =
                                application
                                        .CandidateProfile !=
                                    null &&
                                application
                                        .CandidateProfile
                                        .User != null
                                    ? application
                                        .CandidateProfile
                                        .User
                                        .Email
                                    : string.Empty,

                            skills =
                                application
                                        .CandidateProfile !=
                                    null
                                    ? application
                                        .CandidateProfile
                                        .Skills
                                    : string.Empty,

                            experienceYears =
                                application
                                        .CandidateProfile !=
                                    null
                                    ? application
                                        .CandidateProfile
                                        .ExperienceYears
                                    : 0,

                            education =
                                application
                                        .CandidateProfile !=
                                    null
                                    ? application
                                        .CandidateProfile
                                        .Education
                                    : string.Empty,

                            currentJobTitle =
                                application
                                        .CandidateProfile !=
                                    null
                                    ? application
                                        .CandidateProfile
                                        .CurrentJobTitle
                                    : string.Empty,

                            aiScore =
                                application.AIScore,

                            totalScore =
                                application.AIScore,

                            status =
                                application.Status,

                            appliedAt =
                                application.AppliedAt
                        })
                    .ToListAsync();

            return Ok(new
            {
                jobId =
                    job.JobId,

                jobTitle =
                    job.Title,

                requirements =
                    job.Requirements,

                organizationId =
                    job.OrganizationId,

                departmentId =
                    job.DepartmentId,

                recruiterId =
                    job.RecruiterId,

                totalCandidates =
                    rankings.Count,

                rankings
            });
        }

        // --------------------------------------------------
        // GET ONE APPLICATION RANKING BREAKDOWN
        // GET: api/Ranking/application/1
        // --------------------------------------------------
        [HttpGet(
            "application/{applicationId:int}")]
        public async Task<IActionResult>
            GetApplicationRanking(
                int applicationId)
        {
            var application =
                await _context
                    .JobApplications
                    .Include(item =>
                        item.CandidateProfile)
                    .ThenInclude(profile =>
                        profile!.User)
                    .Include(item =>
                        item.JobPosting)
                    .ThenInclude(job =>
                        job!.Organization)
                    .Include(item =>
                        item.JobPosting)
                    .ThenInclude(job =>
                        job!.Department)
                    .FirstOrDefaultAsync(
                        item =>
                            item
                                .JobApplicationId ==
                            applicationId);

            if (application == null)
            {
                return NotFound(new
                {
                    message =
                        "Job application not found."
                });
            }

            if (application.JobPosting ==
                null)
            {
                return BadRequest(new
                {
                    message =
                        "Job posting information is missing."
                });
            }

            IActionResult?
                accessResponse =
                    ValidateJobAccess(
                        application.JobPosting);

            if (accessResponse != null)
            {
                return accessResponse;
            }

            if (application
                    .CandidateProfile ==
                null)
            {
                return BadRequest(new
                {
                    message =
                        "Candidate profile is missing."
                });
            }

            var result =
                _matchingService
                    .CalculateScore(
                        application,
                        application
                            .CandidateProfile,
                        application
                            .JobPosting);

            application.AIScore =
                result.TotalScore;

            await _context
                .SaveChangesAsync();

            return Ok(new
            {
                applicationId =
                    application
                        .JobApplicationId,

                candidateProfileId =
                    application
                        .CandidateProfileId,

                candidateName =
                    application
                        .CandidateProfile
                        .User?
                        .FullName ??
                    "Unknown Candidate",

                candidateEmail =
                    application
                        .CandidateProfile
                        .User?
                        .Email ??
                    string.Empty,

                jobId =
                    application.JobId,

                jobTitle =
                    application
                        .JobPosting
                        .Title,

                organizationName =
                    application
                        .JobPosting
                        .Organization?
                        .Name ??
                    "Not Assigned",

                departmentName =
                    application
                        .JobPosting
                        .Department?
                        .Name ??
                    "Not Assigned",

                applicationStatus =
                    application.Status,

                appliedAt =
                    application.AppliedAt,

                aiScore =
                    result.TotalScore,

                totalScore =
                    result.TotalScore,

                result
            });
        }

        // --------------------------------------------------
        // VALIDATE ACCESS TO JOB RANKINGS
        // Recruiter can access only their own jobs.
        // HiringManager and Admin are allowed.
        // --------------------------------------------------
        private IActionResult?
            ValidateJobAccess(
                JobPosting job)
        {
            if (User.IsInRole("Admin") ||
                User.IsInRole(
                    "HiringManager"))
            {
                return null;
            }

            if (!User.IsInRole(
                    "Recruiter"))
            {
                return Forbid();
            }

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

            if (!job.RecruiterId.HasValue ||
                job.RecruiterId.Value !=
                currentUserId.Value)
            {
                return StatusCode(
                    StatusCodes
                        .Status403Forbidden,
                    new
                    {
                        message =
                            "You can view or calculate rankings only for job postings created by your account."
                    });
            }

            return null;
        }

        // --------------------------------------------------
        // GET LOGGED-IN USER ID
        // --------------------------------------------------
        private int? GetCurrentUserId()
        {
            string? userIdValue =
                User.FindFirstValue(
                    ClaimTypes
                        .NameIdentifier);

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