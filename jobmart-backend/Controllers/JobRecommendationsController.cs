using System.Security.Claims;
using jobmart.Data;
using jobmart.DTOs;
using jobmart.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace jobmart.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Candidate")]
    public class JobRecommendationsController
        : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        private readonly ICandidateMatchingService
            _matchingService;

        public JobRecommendationsController(
            ApplicationDbContext context,
            ICandidateMatchingService matchingService)
        {
            _context = context;
            _matchingService = matchingService;
        }

        // GET: /api/JobRecommendations/my
        [HttpGet("my")]
        public async Task<IActionResult>
            GetMyJobRecommendations()
        {
            int? userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized(new
                {
                    message = "Invalid user token."
                });
            }

            var candidateProfile =
                await _context.CandidateProfiles
                    .Include(profile => profile.User)
                    .FirstOrDefaultAsync(profile =>
                        profile.UserId == userId.Value);

            if (candidateProfile == null)
            {
                return NotFound(new
                {
                    message =
                        "Candidate profile not found. " +
                        "Please complete your profile first."
                });
            }

            bool profileHasMatchingInformation =
                !string.IsNullOrWhiteSpace(
                    candidateProfile.Skills) ||
                candidateProfile.ExperienceYears > 0 ||
                !string.IsNullOrWhiteSpace(
                    candidateProfile.Education);

            if (!profileHasMatchingInformation)
            {
                return BadRequest(new
                {
                    message =
                        "Please add your skills, education " +
                        "or experience before requesting " +
                        "job recommendations."
                });
            }

            DateTime currentDate = DateTime.UtcNow;

            var availableJobs =
                await _context.JobPostings
                    .Where(job =>
                        job.Status == "Open" &&
                        job.Deadline >= currentDate)
                    .OrderByDescending(job =>
                        job.CreatedAt)
                    .ToListAsync();

            if (availableJobs.Count == 0)
            {
                return Ok(new
                {
                    candidateProfileId =
                        candidateProfile
                            .CandidateProfileId,

                    candidateName =
                        candidateProfile.User?.FullName
                        ?? "Candidate",

                    totalRecommendations = 0,

                    recommendations =
                        new List<
                            JobRecommendationResultDto>()
                });
            }

            var candidateApplications =
                await _context.JobApplications
                    .Where(application =>
                        application.CandidateProfileId ==
                        candidateProfile
                            .CandidateProfileId)
                    .ToListAsync();

            var recommendationResults =
                new List<
                    JobRecommendationResultDto>();

            foreach (var job in availableJobs)
            {
                var existingApplication =
                    candidateApplications
                        .FirstOrDefault(application =>
                            application.JobId ==
                            job.JobId);

                JobRecommendationResultDto result =
                    _matchingService
                        .CalculateJobRecommendation(
                            candidateProfile,
                            job,
                            existingApplication);

                recommendationResults.Add(result);
            }

            var rankedRecommendations =
                recommendationResults
                    .OrderByDescending(result =>
                        result.TotalScore)
                    .ThenBy(result => result.Title)
                    .ToList();

            return Ok(new
            {
                candidateProfileId =
                    candidateProfile
                        .CandidateProfileId,

                candidateName =
                    candidateProfile.User?.FullName
                    ?? "Candidate",

                candidateSkills =
                    candidateProfile.Skills
                    ?? string.Empty,

                experienceYears =
                    candidateProfile.ExperienceYears,

                education =
                    candidateProfile.Education
                    ?? string.Empty,

                totalRecommendations =
                    rankedRecommendations.Count,

                excellentMatches =
                    rankedRecommendations.Count(
                        result =>
                            result.TotalScore >= 80),

                goodMatches =
                    rankedRecommendations.Count(
                        result =>
                            result.TotalScore >= 65 &&
                            result.TotalScore < 80),

                recommendations =
                    rankedRecommendations
            });
        }

        // GET: /api/JobRecommendations/my/top/5
        [HttpGet("my/top/{count:int}")]
        public async Task<IActionResult>
            GetMyTopRecommendations(int count)
        {
            int? userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized(new
                {
                    message = "Invalid user token."
                });
            }

            if (count < 1 || count > 20)
            {
                return BadRequest(new
                {
                    message =
                        "The recommendation count must " +
                        "be between 1 and 20."
                });
            }

            var candidateProfile =
                await _context.CandidateProfiles
                    .Include(profile => profile.User)
                    .FirstOrDefaultAsync(profile =>
                        profile.UserId == userId.Value);

            if (candidateProfile == null)
            {
                return NotFound(new
                {
                    message =
                        "Candidate profile not found."
                });
            }

            DateTime currentDate = DateTime.UtcNow;

            var availableJobs =
                await _context.JobPostings
                    .Where(job =>
                        job.Status == "Open" &&
                        job.Deadline >= currentDate)
                    .ToListAsync();

            var candidateApplications =
                await _context.JobApplications
                    .Where(application =>
                        application.CandidateProfileId ==
                        candidateProfile
                            .CandidateProfileId)
                    .ToListAsync();

            var recommendations =
                availableJobs
                    .Select(job =>
                    {
                        var existingApplication =
                            candidateApplications
                                .FirstOrDefault(
                                    application =>
                                        application.JobId ==
                                        job.JobId);

                        return _matchingService
                            .CalculateJobRecommendation(
                                candidateProfile,
                                job,
                                existingApplication);
                    })
                    .OrderByDescending(result =>
                        result.TotalScore)
                    .ThenBy(result => result.Title)
                    .Take(count)
                    .ToList();

            return Ok(new
            {
                candidateName =
                    candidateProfile.User?.FullName
                    ?? "Candidate",

                requestedCount = count,

                returnedCount =
                    recommendations.Count,

                recommendations
            });
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
    }
}