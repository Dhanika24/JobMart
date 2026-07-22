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
    [Authorize(Roles = "HiringManager,Admin")]
    public class CandidateEvaluationsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CandidateEvaluationsController(
            ApplicationDbContext context)
        {
            _context = context;
        }

        // ------------------------------------------------------
        // CREATE CANDIDATE EVALUATION
        // POST: api/CandidateEvaluations
        // ------------------------------------------------------
        [HttpPost]
        public async Task<IActionResult> CreateEvaluation(
            CreateCandidateEvaluationDto request)
        {
            int? hiringManagerId = GetCurrentUserId();

            if (hiringManagerId == null)
            {
                return Unauthorized(new
                {
                    message = "Invalid user token."
                });
            }

            var jobApplication = await _context.JobApplications
                .Include(application =>
                    application.CandidateProfile)
                    .ThenInclude(profile =>
                        profile!.User)
                .Include(application =>
                    application.JobPosting)
                .FirstOrDefaultAsync(application =>
                    application.JobApplicationId ==
                    request.JobApplicationId);

            if (jobApplication == null)
            {
                return NotFound(new
                {
                    message = "Job application not found."
                });
            }

            bool evaluationExists =
                await _context.CandidateEvaluations
                    .AnyAsync(evaluation =>
                        evaluation.JobApplicationId ==
                        request.JobApplicationId &&
                        evaluation.HiringManagerId ==
                        hiringManagerId.Value);

            if (evaluationExists)
            {
                return Conflict(new
                {
                    message =
                        "You have already evaluated this candidate application."
                });
            }

            decimal overallScore =
                CalculateOverallScore(
                    request.TechnicalScore,
                    request.CommunicationScore,
                    request.ExperienceScore,
                    request.ProblemSolvingScore,
                    request.CultureFitScore);

            string normalizedDecision =
                NormalizeDecision(request.Decision);

            var evaluation = new CandidateEvaluation
            {
                JobApplicationId =
                    request.JobApplicationId,

                HiringManagerId =
                    hiringManagerId.Value,

                TechnicalScore =
                    request.TechnicalScore,

                CommunicationScore =
                    request.CommunicationScore,

                ExperienceScore =
                    request.ExperienceScore,

                ProblemSolvingScore =
                    request.ProblemSolvingScore,

                CultureFitScore =
                    request.CultureFitScore,

                OverallScore =
                    overallScore,

                Feedback =
                    request.Feedback,

                Recommendation =
                    request.Recommendation,

                Decision =
                    normalizedDecision,

                CreatedAt =
                    DateTime.UtcNow,

                UpdatedAt =
                    DateTime.UtcNow
            };

            _context.CandidateEvaluations.Add(evaluation);

            // Update the application status.
            jobApplication.Status =
                normalizedDecision;

            bool notificationCreated =
                CreateDecisionNotification(
                    jobApplication,
                    normalizedDecision);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Candidate evaluation created successfully.",

                evaluationId =
                    evaluation.EvaluationId,

                evaluation.JobApplicationId,
                evaluation.HiringManagerId,

                candidateName =
                    jobApplication
                        .CandidateProfile?
                        .User?
                        .FullName,

                candidateEmail =
                    jobApplication
                        .CandidateProfile?
                        .User?
                        .Email,

                jobTitle =
                    jobApplication
                        .JobPosting?
                        .Title,

                aiScore =
                    jobApplication.AIScore,

                applicationStatus =
                    jobApplication.Status,

                notificationCreated,

                evaluation.TechnicalScore,
                evaluation.CommunicationScore,
                evaluation.ExperienceScore,
                evaluation.ProblemSolvingScore,
                evaluation.CultureFitScore,
                evaluation.OverallScore,
                evaluation.Feedback,
                evaluation.Recommendation,
                evaluation.Decision,
                evaluation.CreatedAt
            });
        }

        // ------------------------------------------------------
        // GET ALL CANDIDATE EVALUATIONS
        // GET: api/CandidateEvaluations
        // ------------------------------------------------------
        [HttpGet]
        public async Task<IActionResult> GetAllEvaluations()
        {
            var evaluations =
                await _context.CandidateEvaluations
                    .Include(evaluation =>
                        evaluation.HiringManager)
                    .Include(evaluation =>
                        evaluation.JobApplication)
                        .ThenInclude(application =>
                            application!.CandidateProfile)
                            .ThenInclude(profile =>
                                profile!.User)
                    .Include(evaluation =>
                        evaluation.JobApplication)
                        .ThenInclude(application =>
                            application!.JobPosting)
                    .OrderByDescending(evaluation =>
                        evaluation.CreatedAt)
                    .Select(evaluation => new
                    {
                        evaluation.EvaluationId,
                        evaluation.JobApplicationId,

                        hiringManagerId =
                            evaluation.HiringManagerId,

                        hiringManagerName =
                            evaluation.HiringManager != null
                                ? evaluation.HiringManager.FullName
                                : "Unknown Hiring Manager",

                        candidateName =
                            evaluation.JobApplication != null &&
                            evaluation.JobApplication.CandidateProfile != null &&
                            evaluation.JobApplication.CandidateProfile.User != null
                                ? evaluation.JobApplication
                                    .CandidateProfile
                                    .User
                                    .FullName
                                : "Unknown Candidate",

                        candidateEmail =
                            evaluation.JobApplication != null &&
                            evaluation.JobApplication.CandidateProfile != null &&
                            evaluation.JobApplication.CandidateProfile.User != null
                                ? evaluation.JobApplication
                                    .CandidateProfile
                                    .User
                                    .Email
                                : string.Empty,

                        jobTitle =
                            evaluation.JobApplication != null &&
                            evaluation.JobApplication.JobPosting != null
                                ? evaluation.JobApplication
                                    .JobPosting
                                    .Title
                                : "Unknown Job",

                        aiScore =
                            evaluation.JobApplication != null
                                ? evaluation.JobApplication.AIScore
                                : 0,

                        applicationStatus =
                            evaluation.JobApplication != null
                                ? evaluation.JobApplication.Status
                                : "Unknown",

                        evaluation.TechnicalScore,
                        evaluation.CommunicationScore,
                        evaluation.ExperienceScore,
                        evaluation.ProblemSolvingScore,
                        evaluation.CultureFitScore,
                        evaluation.OverallScore,
                        evaluation.Feedback,
                        evaluation.Recommendation,
                        evaluation.Decision,
                        evaluation.CreatedAt,
                        evaluation.UpdatedAt
                    })
                    .ToListAsync();

            return Ok(new
            {
                totalEvaluations =
                    evaluations.Count,

                evaluations
            });
        }

        // ------------------------------------------------------
        // GET ONE CANDIDATE EVALUATION
        // GET: api/CandidateEvaluations/1
        // ------------------------------------------------------
        [HttpGet("{evaluationId}")]
        public async Task<IActionResult> GetEvaluation(
            int evaluationId)
        {
            var evaluation =
                await _context.CandidateEvaluations
                    .Include(item =>
                        item.HiringManager)
                    .Include(item =>
                        item.JobApplication)
                        .ThenInclude(application =>
                            application!.CandidateProfile)
                            .ThenInclude(profile =>
                                profile!.User)
                    .Include(item =>
                        item.JobApplication)
                        .ThenInclude(application =>
                            application!.JobPosting)
                    .FirstOrDefaultAsync(item =>
                        item.EvaluationId ==
                        evaluationId);

            if (evaluation == null)
            {
                return NotFound(new
                {
                    message = "Evaluation not found."
                });
            }

            return Ok(new
            {
                evaluation.EvaluationId,
                evaluation.JobApplicationId,

                hiringManager = new
                {
                    evaluation.HiringManagerId,

                    fullName =
                        evaluation.HiringManager?.FullName,

                    email =
                        evaluation.HiringManager?.Email
                },

                candidate = new
                {
                    candidateProfileId =
                        evaluation.JobApplication?
                            .CandidateProfileId,

                    fullName =
                        evaluation.JobApplication?
                            .CandidateProfile?
                            .User?
                            .FullName,

                    email =
                        evaluation.JobApplication?
                            .CandidateProfile?
                            .User?
                            .Email
                },

                job = new
                {
                    jobId =
                        evaluation.JobApplication?.JobId,

                    title =
                        evaluation.JobApplication?
                            .JobPosting?
                            .Title
                },

                aiScore =
                    evaluation.JobApplication?.AIScore,

                applicationStatus =
                    evaluation.JobApplication?.Status,

                evaluation.TechnicalScore,
                evaluation.CommunicationScore,
                evaluation.ExperienceScore,
                evaluation.ProblemSolvingScore,
                evaluation.CultureFitScore,
                evaluation.OverallScore,
                evaluation.Feedback,
                evaluation.Recommendation,
                evaluation.Decision,
                evaluation.CreatedAt,
                evaluation.UpdatedAt
            });
        }

        // ------------------------------------------------------
        // GET EVALUATIONS BY APPLICATION
        // GET: api/CandidateEvaluations/application/1
        // ------------------------------------------------------
        [HttpGet("application/{applicationId}")]
        public async Task<IActionResult>
            GetEvaluationsByApplication(
                int applicationId)
        {
            var jobApplication =
                await _context.JobApplications
                    .FirstOrDefaultAsync(application =>
                        application.JobApplicationId ==
                        applicationId);

            if (jobApplication == null)
            {
                return NotFound(new
                {
                    message =
                        "Job application not found."
                });
            }

            var evaluations =
                await _context.CandidateEvaluations
                    .Include(evaluation =>
                        evaluation.HiringManager)
                    .Where(evaluation =>
                        evaluation.JobApplicationId ==
                        applicationId)
                    .OrderByDescending(evaluation =>
                        evaluation.OverallScore)
                    .Select(evaluation => new
                    {
                        evaluation.EvaluationId,
                        evaluation.HiringManagerId,

                        hiringManagerName =
                            evaluation.HiringManager != null
                                ? evaluation.HiringManager.FullName
                                : "Unknown Hiring Manager",

                        evaluation.TechnicalScore,
                        evaluation.CommunicationScore,
                        evaluation.ExperienceScore,
                        evaluation.ProblemSolvingScore,
                        evaluation.CultureFitScore,
                        evaluation.OverallScore,
                        evaluation.Feedback,
                        evaluation.Recommendation,
                        evaluation.Decision,
                        evaluation.CreatedAt,
                        evaluation.UpdatedAt
                    })
                    .ToListAsync();

            decimal averageScore =
                evaluations.Count > 0
                    ? Math.Round(
                        evaluations.Average(
                            evaluation =>
                                evaluation.OverallScore),
                        2)
                    : 0;

            return Ok(new
            {
                applicationId,

                applicationStatus =
                    jobApplication.Status,

                aiScore =
                    jobApplication.AIScore,

                totalEvaluations =
                    evaluations.Count,

                averageOverallScore =
                    averageScore,

                evaluations
            });
        }

        // ------------------------------------------------------
        // UPDATE CANDIDATE EVALUATION
        // PUT: api/CandidateEvaluations/1
        // ------------------------------------------------------
        [HttpPut("{evaluationId}")]
        public async Task<IActionResult> UpdateEvaluation(
            int evaluationId,
            UpdateCandidateEvaluationDto request)
        {
            int? currentUserId =
                GetCurrentUserId();

            if (currentUserId == null)
            {
                return Unauthorized(new
                {
                    message = "Invalid user token."
                });
            }

            var evaluation =
                await _context.CandidateEvaluations
                    .Include(item =>
                        item.JobApplication)
                        .ThenInclude(application =>
                            application!.CandidateProfile)
                            .ThenInclude(profile =>
                                profile!.User)
                    .Include(item =>
                        item.JobApplication)
                        .ThenInclude(application =>
                            application!.JobPosting)
                    .FirstOrDefaultAsync(item =>
                        item.EvaluationId ==
                        evaluationId);

            if (evaluation == null)
            {
                return NotFound(new
                {
                    message = "Evaluation not found."
                });
            }

            bool isAdmin =
                User.IsInRole("Admin");

            if (!isAdmin &&
                evaluation.HiringManagerId !=
                currentUserId.Value)
            {
                return Forbid();
            }

            string previousDecision =
                evaluation.Decision;

            string normalizedDecision =
                NormalizeDecision(request.Decision);

            evaluation.TechnicalScore =
                request.TechnicalScore;

            evaluation.CommunicationScore =
                request.CommunicationScore;

            evaluation.ExperienceScore =
                request.ExperienceScore;

            evaluation.ProblemSolvingScore =
                request.ProblemSolvingScore;

            evaluation.CultureFitScore =
                request.CultureFitScore;

            evaluation.OverallScore =
                CalculateOverallScore(
                    request.TechnicalScore,
                    request.CommunicationScore,
                    request.ExperienceScore,
                    request.ProblemSolvingScore,
                    request.CultureFitScore);

            evaluation.Feedback =
                request.Feedback;

            evaluation.Recommendation =
                request.Recommendation;

            evaluation.Decision =
                normalizedDecision;

            bool notificationCreated = false;

            if (evaluation.JobApplication != null)
            {
                evaluation.JobApplication.Status =
                    normalizedDecision;

                bool decisionChanged =
                    !previousDecision.Equals(
                        normalizedDecision,
                        StringComparison.OrdinalIgnoreCase);

                if (decisionChanged)
                {
                    notificationCreated =
                        CreateDecisionNotification(
                            evaluation.JobApplication,
                            normalizedDecision);
                }
            }

            evaluation.UpdatedAt =
                DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Evaluation updated successfully.",

                evaluation.EvaluationId,
                evaluation.JobApplicationId,
                evaluation.OverallScore,
                evaluation.Recommendation,
                evaluation.Decision,

                applicationStatus =
                    evaluation.JobApplication?.Status,

                aiScore =
                    evaluation.JobApplication?.AIScore,

                notificationCreated,

                evaluation.UpdatedAt
            });
        }

        // ------------------------------------------------------
        // DELETE CANDIDATE EVALUATION
        // DELETE: api/CandidateEvaluations/1
        // ------------------------------------------------------
        [HttpDelete("{evaluationId}")]
        public async Task<IActionResult> DeleteEvaluation(
            int evaluationId)
        {
            int? currentUserId =
                GetCurrentUserId();

            if (currentUserId == null)
            {
                return Unauthorized(new
                {
                    message = "Invalid user token."
                });
            }

            var evaluation =
                await _context.CandidateEvaluations
                    .FirstOrDefaultAsync(item =>
                        item.EvaluationId ==
                        evaluationId);

            if (evaluation == null)
            {
                return NotFound(new
                {
                    message = "Evaluation not found."
                });
            }

            bool isAdmin =
                User.IsInRole("Admin");

            if (!isAdmin &&
                evaluation.HiringManagerId !=
                currentUserId.Value)
            {
                return Forbid();
            }

            _context.CandidateEvaluations
                .Remove(evaluation);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Evaluation deleted successfully."
            });
        }

        // ------------------------------------------------------
        // CREATE APPLICATION DECISION NOTIFICATION
        // ------------------------------------------------------
        private bool CreateDecisionNotification(
            JobApplication application,
            string decision)
        {
            User? candidateUser =
                application.CandidateProfile?.User;

            if (candidateUser == null)
            {
                return false;
            }

            string jobTitle =
                application.JobPosting?.Title ??
                "the applied position";

            string title;
            string message;
            string type;

            switch (decision)
            {
                case "Shortlisted":
                    title =
                        "Application Shortlisted";

                    message =
                        $"Congratulations! Your application for {jobTitle} has been shortlisted.";

                    type =
                        "Shortlisted";
                    break;

                case "Selected":
                    title =
                        "Application Selected";

                    message =
                        $"Congratulations! You have been selected for {jobTitle}.";

                    type =
                        "Selected";
                    break;

                case "Rejected":
                    title =
                        "Application Update";

                    message =
                        $"Your application for {jobTitle} was not selected. Thank you for your interest.";

                    type =
                        "Rejected";
                    break;

                case "Under Review":
                    title =
                        "Application Under Review";

                    message =
                        $"Your application for {jobTitle} is currently under review.";

                    type =
                        "UnderReview";
                    break;

                default:
                    title =
                        "Application Status Updated";

                    message =
                        $"Your application status for {jobTitle} has been updated to {decision}.";

                    type =
                        "ApplicationUpdate";
                    break;
            }

            var notification = new Notification
            {
                UserId =
                    candidateUser.UserId,

                JobApplicationId =
                    application.JobApplicationId,

                Title =
                    title,

                Message =
                    message,

                Type =
                    type,

                IsRead =
                    false,

                CreatedAt =
                    DateTime.UtcNow
            };

            _context.Notifications.Add(notification);

            return true;
        }

        // ------------------------------------------------------
        // GET CURRENT LOGGED-IN USER ID
        // ------------------------------------------------------
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

        // ------------------------------------------------------
        // NORMALIZE THE HIRING MANAGER DECISION
        // ------------------------------------------------------
        private static string NormalizeDecision(
            string? decision)
        {
            if (string.IsNullOrWhiteSpace(decision))
            {
                return "Pending";
            }

            string normalizedDecision =
                decision.Trim().ToLowerInvariant();

            return normalizedDecision switch
            {
                "shortlisted" => "Shortlisted",
                "shortlist" => "Shortlisted",

                "selected" => "Selected",
                "hired" => "Selected",
                "hire" => "Selected",

                "rejected" => "Rejected",
                "reject" => "Rejected",

                "under review" => "Under Review",
                "underreview" => "Under Review",
                "consider" => "Under Review",
                "recommended" => "Under Review",
                "recommend" => "Under Review",

                "pending" => "Pending",

                _ => "Under Review"
            };
        }

        // ------------------------------------------------------
        // CALCULATE THE AVERAGE EVALUATION SCORE
        // ------------------------------------------------------
        private static decimal CalculateOverallScore(
            int technicalScore,
            int communicationScore,
            int experienceScore,
            int problemSolvingScore,
            int cultureFitScore)
        {
            decimal total =
                technicalScore +
                communicationScore +
                experienceScore +
                problemSolvingScore +
                cultureFitScore;

            return Math.Round(
                total / 5m,
                2);
        }
    }
}