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
    public class InterviewsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public InterviewsController(
            ApplicationDbContext context)
        {
            _context = context;
        }

        // ------------------------------------------------------
        // CREATE INTERVIEW
        // POST: /api/Interviews
        // Recruiter or Admin
        // ------------------------------------------------------
        [Authorize(Roles = "Recruiter,Admin")]
        [HttpPost]
        public async Task<IActionResult> CreateInterview(
            CreateInterviewDto request)
        {
            var application =
                await _context.JobApplications
                    .Include(application =>
                        application.JobPosting)
                    .Include(application =>
                        application.CandidateProfile)
                        .ThenInclude(profile =>
                            profile!.User)
                    .FirstOrDefaultAsync(application =>
                        application.JobApplicationId ==
                        request.JobApplicationId);

            if (application == null)
            {
                return NotFound(new
                {
                    message =
                        "Job application not found."
                });
            }

            bool validApplicationStatus =
                application.Status.Equals(
                    "Shortlisted",
                    StringComparison.OrdinalIgnoreCase) ||
                application.Status.Equals(
                    "UnderReview",
                    StringComparison.OrdinalIgnoreCase) ||
                application.Status.Equals(
                    "Under Review",
                    StringComparison.OrdinalIgnoreCase);

            if (!validApplicationStatus)
            {
                return BadRequest(new
                {
                    message =
                        "Only shortlisted or reviewed candidates can be scheduled."
                });
            }

            if (request.ScheduledDateTime <= DateTime.UtcNow)
            {
                return BadRequest(new
                {
                    message =
                        "Interview date and time must be in the future."
                });
            }

            bool interviewExists =
                await _context.Interviews
                    .AnyAsync(interview =>
                        interview.JobApplicationId ==
                            request.JobApplicationId &&
                        interview.Status != "Cancelled");

            if (interviewExists)
            {
                return BadRequest(new
                {
                    message =
                        "An active interview already exists for this application."
                });
            }

            var interview = new Interview
            {
                JobApplicationId =
                    request.JobApplicationId,

                ScheduledDateTime =
                    request.ScheduledDateTime,

                InterviewType =
                    request.InterviewType,

                MeetingLinkOrLocation =
                    request.MeetingLinkOrLocation,

                Notes =
                    request.Notes,

                Status =
                    "Scheduled",

                CreatedAt =
                    DateTime.UtcNow
            };

            _context.Interviews.Add(interview);

            application.Status =
                "InterviewScheduled";

            User? candidateUser =
                application.CandidateProfile?.User;

            if (candidateUser != null)
            {
                var notification =
                    new Notification
                    {
                        UserId =
                            candidateUser.UserId,

                        JobApplicationId =
                            application.JobApplicationId,

                        Title =
                            "Interview Scheduled",

                        Message =
                            BuildInterviewMessage(
                                "scheduled",
                                application.JobPosting?.Title,
                                request.ScheduledDateTime,
                                request.InterviewType,
                                request.MeetingLinkOrLocation),

                        Type =
                            "InterviewScheduled",

                        IsRead =
                            false,

                        CreatedAt =
                            DateTime.UtcNow
                    };

                _context.Notifications.Add(
                    notification);
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Interview scheduled successfully.",

                interviewId =
                    interview.InterviewId,

                interview.JobApplicationId,

                jobTitle =
                    application.JobPosting?.Title,

                candidateName =
                    candidateUser?.FullName,

                interview.ScheduledDateTime,
                interview.InterviewType,
                interview.MeetingLinkOrLocation,
                interview.Notes,
                interview.Status,

                applicationStatus =
                    application.Status,

                notificationCreated =
                    candidateUser != null
            });
        }

        // ------------------------------------------------------
        // CANDIDATE VIEWS OWN INTERVIEWS
        // GET: /api/Interviews/my
        // ------------------------------------------------------
        [Authorize(Roles = "Candidate")]
        [HttpGet("my")]
        public async Task<IActionResult> GetMyInterviews()
        {
            int? userId =
                GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized(new
                {
                    message =
                        "Invalid user token."
                });
            }

            var interviews =
                await _context.Interviews
                    .Include(interview =>
                        interview.JobApplication)
                        .ThenInclude(application =>
                            application!.JobPosting)
                    .Include(interview =>
                        interview.JobApplication)
                        .ThenInclude(application =>
                            application!.CandidateProfile)
                    .Where(interview =>
                        interview.JobApplication != null &&
                        interview.JobApplication
                            .CandidateProfile != null &&
                        interview.JobApplication
                            .CandidateProfile.UserId ==
                            userId.Value)
                    .OrderBy(interview =>
                        interview.ScheduledDateTime)
                    .Select(interview => new
                    {
                        interview.InterviewId,
                        interview.JobApplicationId,

                        jobTitle =
                            interview.JobApplication != null &&
                            interview.JobApplication
                                .JobPosting != null
                                ? interview.JobApplication
                                    .JobPosting.Title
                                : null,

                        interview.ScheduledDateTime,
                        interview.InterviewType,
                        interview.MeetingLinkOrLocation,
                        interview.Notes,
                        interview.Status
                    })
                    .ToListAsync();

            return Ok(new
            {
                totalInterviews =
                    interviews.Count,

                interviews
            });
        }

        // ------------------------------------------------------
        // RECRUITER OR ADMIN VIEWS INTERVIEWS FOR A JOB
        // GET: /api/Interviews/job/1
        // ------------------------------------------------------
        [Authorize(Roles = "Recruiter,Admin")]
        [HttpGet("job/{jobId}")]
        public async Task<IActionResult>
            GetInterviewsForJob(int jobId)
        {
            bool jobExists =
                await _context.JobPostings
                    .AnyAsync(job =>
                        job.JobId == jobId);

            if (!jobExists)
            {
                return NotFound(new
                {
                    message =
                        "Job not found."
                });
            }

            var interviews =
                await _context.Interviews
                    .Include(interview =>
                        interview.JobApplication)
                        .ThenInclude(application =>
                            application!.CandidateProfile)
                            .ThenInclude(profile =>
                                profile!.User)
                    .Where(interview =>
                        interview.JobApplication != null &&
                        interview.JobApplication.JobId ==
                            jobId)
                    .OrderBy(interview =>
                        interview.ScheduledDateTime)
                    .Select(interview => new
                    {
                        interview.InterviewId,
                        interview.JobApplicationId,

                        candidateName =
                            interview.JobApplication != null &&
                            interview.JobApplication
                                .CandidateProfile != null &&
                            interview.JobApplication
                                .CandidateProfile.User != null
                                ? interview.JobApplication
                                    .CandidateProfile
                                    .User
                                    .FullName
                                : null,

                        candidateEmail =
                            interview.JobApplication != null &&
                            interview.JobApplication
                                .CandidateProfile != null &&
                            interview.JobApplication
                                .CandidateProfile.User != null
                                ? interview.JobApplication
                                    .CandidateProfile
                                    .User
                                    .Email
                                : null,

                        interview.ScheduledDateTime,
                        interview.InterviewType,
                        interview.MeetingLinkOrLocation,
                        interview.Notes,
                        interview.Status
                    })
                    .ToListAsync();

            return Ok(new
            {
                jobId,

                totalInterviews =
                    interviews.Count,

                interviews
            });
        }

        // ------------------------------------------------------
        // HIRING MANAGER VIEWS ALL INTERVIEWS
        // GET: /api/Interviews/manager/all
        // ------------------------------------------------------
        [Authorize(Roles = "HiringManager,Admin")]
        [HttpGet("manager/all")]
        public async Task<IActionResult>
            GetAllInterviewsForHiringManager()
        {
            var interviews =
                await _context.Interviews
                    .Include(interview =>
                        interview.JobApplication)
                        .ThenInclude(application =>
                            application!.CandidateProfile)
                            .ThenInclude(profile =>
                                profile!.User)
                    .Include(interview =>
                        interview.JobApplication)
                        .ThenInclude(application =>
                            application!.JobPosting)
                    .OrderByDescending(interview =>
                        interview.ScheduledDateTime)
                    .Select(interview => new
                    {
                        interviewId =
                            interview.InterviewId,

                        jobApplicationId =
                            interview.JobApplicationId,

                        candidateProfileId =
                            interview.JobApplication != null
                                ? interview.JobApplication
                                    .CandidateProfileId
                                : 0,

                        candidateName =
                            interview.JobApplication != null &&
                            interview.JobApplication
                                .CandidateProfile != null &&
                            interview.JobApplication
                                .CandidateProfile.User != null
                                ? interview.JobApplication
                                    .CandidateProfile
                                    .User
                                    .FullName
                                : "Unknown Candidate",

                        candidateEmail =
                            interview.JobApplication != null &&
                            interview.JobApplication
                                .CandidateProfile != null &&
                            interview.JobApplication
                                .CandidateProfile.User != null
                                ? interview.JobApplication
                                    .CandidateProfile
                                    .User
                                    .Email
                                : string.Empty,

                        candidatePhone =
                            interview.JobApplication != null &&
                            interview.JobApplication
                                .CandidateProfile != null
                                ? interview.JobApplication
                                    .CandidateProfile.Phone
                                : string.Empty,

                        candidateSkills =
                            interview.JobApplication != null &&
                            interview.JobApplication
                                .CandidateProfile != null
                                ? interview.JobApplication
                                    .CandidateProfile.Skills
                                : string.Empty,

                        experienceYears =
                            interview.JobApplication != null &&
                            interview.JobApplication
                                .CandidateProfile != null
                                ? interview.JobApplication
                                    .CandidateProfile
                                    .ExperienceYears
                                : 0,

                        jobId =
                            interview.JobApplication != null
                                ? interview.JobApplication.JobId
                                : 0,

                        jobTitle =
                            interview.JobApplication != null &&
                            interview.JobApplication
                                .JobPosting != null
                                ? interview.JobApplication
                                    .JobPosting.Title
                                : "Unknown Job",

                        jobLocation =
                            interview.JobApplication != null &&
                            interview.JobApplication
                                .JobPosting != null
                                ? interview.JobApplication
                                    .JobPosting.Location
                                : string.Empty,

                        applicationStatus =
                            interview.JobApplication != null
                                ? interview.JobApplication.Status
                                : "Unknown",

                        aiScore =
                            interview.JobApplication != null
                                ? interview.JobApplication.AIScore
                                : 0,

                        interview.ScheduledDateTime,
                        interview.InterviewType,
                        interview.MeetingLinkOrLocation,
                        interview.Notes,
                        interview.Status,
                        interview.CreatedAt,

                        evaluationId =
                            _context.CandidateEvaluations
                                .Where(evaluation =>
                                    evaluation.JobApplicationId ==
                                    interview.JobApplicationId)
                                .OrderByDescending(evaluation =>
                                    evaluation.UpdatedAt)
                                .Select(evaluation =>
                                    (int?)evaluation.EvaluationId)
                                .FirstOrDefault(),

                        evaluationScore =
                            _context.CandidateEvaluations
                                .Where(evaluation =>
                                    evaluation.JobApplicationId ==
                                    interview.JobApplicationId)
                                .OrderByDescending(evaluation =>
                                    evaluation.UpdatedAt)
                                .Select(evaluation =>
                                    (decimal?)evaluation.OverallScore)
                                .FirstOrDefault(),

                        evaluationDecision =
                            _context.CandidateEvaluations
                                .Where(evaluation =>
                                    evaluation.JobApplicationId ==
                                    interview.JobApplicationId)
                                .OrderByDescending(evaluation =>
                                    evaluation.UpdatedAt)
                                .Select(evaluation =>
                                    evaluation.Decision)
                                .FirstOrDefault()
                    })
                    .ToListAsync();

            return Ok(new
            {
                totalInterviews =
                    interviews.Count,

                scheduledInterviews =
                    interviews.Count(interview =>
                        interview.Status == "Scheduled" ||
                        interview.Status == "Rescheduled"),

                completedInterviews =
                    interviews.Count(interview =>
                        interview.Status == "Completed"),

                cancelledInterviews =
                    interviews.Count(interview =>
                        interview.Status == "Cancelled"),

                interviews
            });
        }

        // ------------------------------------------------------
        // UPDATE INTERVIEW
        // PUT: /api/Interviews/1
        // Recruiter or Admin
        // ------------------------------------------------------
        [Authorize(Roles = "Recruiter,Admin")]
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateInterview(
            int id,
            UpdateInterviewDto request)
        {
            var interview =
                await _context.Interviews
                    .Include(item =>
                        item.JobApplication)
                        .ThenInclude(application =>
                            application!.JobPosting)
                    .Include(item =>
                        item.JobApplication)
                        .ThenInclude(application =>
                            application!.CandidateProfile)
                            .ThenInclude(profile =>
                                profile!.User)
                    .FirstOrDefaultAsync(item =>
                        item.InterviewId == id);

            if (interview == null)
            {
                return NotFound(new
                {
                    message =
                        "Interview not found."
                });
            }

            string[] allowedStatuses =
            {
                "Scheduled",
                "Completed",
                "Cancelled",
                "Rescheduled"
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
                        "Invalid interview status.",

                    allowedStatuses
                });
            }

            if (normalizedStatus != "Completed" &&
                normalizedStatus != "Cancelled" &&
                request.ScheduledDateTime <= DateTime.UtcNow)
            {
                return BadRequest(new
                {
                    message =
                        "Interview date and time must be in the future."
                });
            }

            interview.ScheduledDateTime =
                request.ScheduledDateTime;

            interview.InterviewType =
                request.InterviewType;

            interview.MeetingLinkOrLocation =
                request.MeetingLinkOrLocation;

            interview.Notes =
                request.Notes;

            interview.Status =
                normalizedStatus;

            var application =
                interview.JobApplication;

            if (application != null)
            {
                if (normalizedStatus == "Cancelled")
                {
                    application.Status =
                        "Shortlisted";
                }
                else if (
                    normalizedStatus == "Scheduled" ||
                    normalizedStatus == "Rescheduled")
                {
                    application.Status =
                        "InterviewScheduled";
                }
                else if (
                    normalizedStatus == "Completed")
                {
                    application.Status =
                        "InterviewCompleted";
                }

                User? candidateUser =
                    application.CandidateProfile?.User;

                if (candidateUser != null)
                {
                    Notification notification =
                        CreateInterviewNotification(
                            candidateUser.UserId,
                            application.JobApplicationId,
                            application.JobPosting?.Title,
                            normalizedStatus,
                            interview.ScheduledDateTime,
                            interview.InterviewType,
                            interview.MeetingLinkOrLocation);

                    _context.Notifications.Add(
                        notification);
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Interview updated successfully.",

                interview.InterviewId,
                interview.JobApplicationId,
                interview.ScheduledDateTime,
                interview.InterviewType,
                interview.MeetingLinkOrLocation,
                interview.Notes,
                interview.Status,

                applicationStatus =
                    application?.Status,

                notificationCreated =
                    application?
                        .CandidateProfile?
                        .User != null
            });
        }

        // ------------------------------------------------------
        // CREATE INTERVIEW NOTIFICATION
        // ------------------------------------------------------
        private static Notification
            CreateInterviewNotification(
                int userId,
                int jobApplicationId,
                string? jobTitle,
                string status,
                DateTime scheduledDateTime,
                string interviewType,
                string? meetingLinkOrLocation)
        {
            string title;
            string type;
            string message;

            switch (status)
            {
                case "Rescheduled":
                    title =
                        "Interview Rescheduled";

                    type =
                        "InterviewRescheduled";

                    message =
                        BuildInterviewMessage(
                            "rescheduled",
                            jobTitle,
                            scheduledDateTime,
                            interviewType,
                            meetingLinkOrLocation);
                    break;

                case "Cancelled":
                    title =
                        "Interview Cancelled";

                    type =
                        "InterviewCancelled";

                    message =
                        $"Your interview for {jobTitle ?? "the job"} has been cancelled.";
                    break;

                case "Completed":
                    title =
                        "Interview Completed";

                    type =
                        "InterviewCompleted";

                    message =
                        $"Your interview for {jobTitle ?? "the job"} has been marked as completed.";
                    break;

                default:
                    title =
                        "Interview Scheduled";

                    type =
                        "InterviewScheduled";

                    message =
                        BuildInterviewMessage(
                            "scheduled",
                            jobTitle,
                            scheduledDateTime,
                            interviewType,
                            meetingLinkOrLocation);
                    break;
            }

            return new Notification
            {
                UserId =
                    userId,

                JobApplicationId =
                    jobApplicationId,

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
        }

        // ------------------------------------------------------
        // BUILD INTERVIEW MESSAGE
        // ------------------------------------------------------
        private static string BuildInterviewMessage(
            string action,
            string? jobTitle,
            DateTime scheduledDateTime,
            string interviewType,
            string? meetingLinkOrLocation)
        {
            string message =
                $"Your interview for {jobTitle ?? "the job"} has been {action}. " +
                $"Date and time: {scheduledDateTime:yyyy-MM-dd HH:mm} UTC. " +
                $"Type: {interviewType}.";

            if (!string.IsNullOrWhiteSpace(
                    meetingLinkOrLocation))
            {
                message +=
                    $" Meeting link or location: {meetingLinkOrLocation}.";
            }

            return message;
        }

        // ------------------------------------------------------
        // GET CURRENT USER ID
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
    }
}