using jobmart.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace jobmart.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Recruiter,HiringManager,Admin")]
    public class DashboardController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public DashboardController(
            ApplicationDbContext context)
        {
            _context = context;
        }

        // ------------------------------------------------------
        // RECRUITER DASHBOARD SUMMARY
        // GET: api/Dashboard/summary
        // ------------------------------------------------------
        [HttpGet("summary")]
        public async Task<IActionResult>
            GetDashboardSummary()
        {
            DateTime currentDateTime =
                DateTime.UtcNow;

            int totalJobs =
                await _context.JobPostings
                    .CountAsync();

            int openJobs =
                await _context.JobPostings
                    .CountAsync(job =>
                        job.Status == "Open" &&
                        job.Deadline >=
                            currentDateTime);

            int closedJobs =
                await _context.JobPostings
                    .CountAsync(job =>
                        job.Status == "Closed" ||
                        job.Deadline <
                            currentDateTime);

            int totalApplications =
                await _context.JobApplications
                    .CountAsync();

            int pendingApplications =
                await _context.JobApplications
                    .CountAsync(application =>
                        application.Status ==
                        "Pending");

            int underReviewApplications =
                await _context.JobApplications
                    .CountAsync(application =>
                        application.Status ==
                            "Under Review" ||
                        application.Status ==
                            "UnderReview");

            int shortlistedApplications =
                await _context.JobApplications
                    .CountAsync(application =>
                        application.Status ==
                        "Shortlisted");

            int selectedApplications =
                await _context.JobApplications
                    .CountAsync(application =>
                        application.Status ==
                            "Selected" ||
                        application.Status ==
                            "Hired");

            int rejectedApplications =
                await _context.JobApplications
                    .CountAsync(application =>
                        application.Status ==
                        "Rejected");

            int totalInterviews =
                await _context.Interviews
                    .CountAsync();

            int upcomingInterviews =
                await _context.Interviews
                    .CountAsync(interview =>
                        interview.ScheduledDateTime >=
                            currentDateTime &&
                        interview.Status ==
                            "Scheduled");

            int completedInterviews =
                await _context.Interviews
                    .CountAsync(interview =>
                        interview.Status ==
                        "Completed");

            int cancelledInterviews =
                await _context.Interviews
                    .CountAsync(interview =>
                        interview.Status ==
                        "Cancelled");

            int totalEvaluations =
                await _context
                    .CandidateEvaluations
                    .CountAsync();

            double averageAIScore = 0;

            if (totalApplications > 0)
            {
                averageAIScore =
                    await _context
                        .JobApplications
                        .AverageAsync(application =>
                            application.AIScore);

                averageAIScore =
                    Math.Round(
                        averageAIScore,
                        2);
            }

            decimal averageEvaluationScore = 0;

            if (totalEvaluations > 0)
            {
                averageEvaluationScore =
                    await _context
                        .CandidateEvaluations
                        .AverageAsync(evaluation =>
                            evaluation
                                .OverallScore);

                averageEvaluationScore =
                    Math.Round(
                        averageEvaluationScore,
                        2);
            }

            return Ok(new
            {
                generatedAt =
                    currentDateTime,

                jobs = new
                {
                    total =
                        totalJobs,

                    open =
                        openJobs,

                    closed =
                        closedJobs
                },

                applications = new
                {
                    total =
                        totalApplications,

                    pending =
                        pendingApplications,

                    underReview =
                        underReviewApplications,

                    shortlisted =
                        shortlistedApplications,

                    selected =
                        selectedApplications,

                    rejected =
                        rejectedApplications
                },

                interviews = new
                {
                    total =
                        totalInterviews,

                    upcoming =
                        upcomingInterviews,

                    completed =
                        completedInterviews,

                    cancelled =
                        cancelledInterviews
                },

                evaluations = new
                {
                    total =
                        totalEvaluations,

                    averageScore =
                        averageEvaluationScore
                },

                aiRanking = new
                {
                    averageAIScore
                }
            });
        }

        // ------------------------------------------------------
        // APPLICATION STATUS STATISTICS
        // GET: api/Dashboard/application-status
        // ------------------------------------------------------
        [HttpGet("application-status")]
        public async Task<IActionResult>
            GetApplicationStatusStatistics()
        {
            var rawStatistics =
                await _context
                    .JobApplications
                    .GroupBy(application =>
                        application.Status)
                    .Select(group => new
                    {
                        status =
                            group.Key,

                        count =
                            group.Count()
                    })
                    .ToListAsync();

            var normalizedStatistics =
                rawStatistics
                    .GroupBy(item =>
                        NormalizeApplicationStatus(
                            item.status))
                    .Select(group => new
                    {
                        status =
                            group.Key,

                        count =
                            group.Sum(item =>
                                item.count)
                    })
                    .OrderByDescending(item =>
                        item.count)
                    .ToList();

            int totalApplications =
                normalizedStatistics
                    .Sum(item =>
                        item.count);

            return Ok(new
            {
                totalApplications,

                statistics =
                    normalizedStatistics
            });
        }

        // ------------------------------------------------------
        // TOP JOBS BY APPLICATION COUNT
        // GET: api/Dashboard/top-jobs
        // ------------------------------------------------------
        [HttpGet("top-jobs")]
        public async Task<IActionResult>
            GetTopJobs(
                [FromQuery] int limit = 5)
        {
            if (limit < 1)
            {
                limit = 5;
            }

            if (limit > 20)
            {
                limit = 20;
            }

            var topJobs =
                await _context
                    .JobPostings
                    .GroupJoin(
                        _context.JobApplications,

                        job =>
                            job.JobId,

                        application =>
                            application.JobId,

                        (
                            job,
                            applications
                        ) => new
                        {
                            job.JobId,
                            job.Title,
                            job.Status,
                            job.Location,
                            job.EmploymentType,
                            job.Deadline,

                            applicationCount =
                                applications
                                    .Count(),

                            averageAIScore =
                                applications.Any()
                                    ? applications
                                        .Average(
                                            application =>
                                                application
                                                    .AIScore)
                                    : 0
                        })
                    .OrderByDescending(item =>
                        item.applicationCount)
                    .ThenByDescending(item =>
                        item.averageAIScore)
                    .Take(limit)
                    .ToListAsync();

            var result =
                topJobs.Select(job => new
                {
                    job.JobId,
                    job.Title,
                    job.Status,
                    job.Location,
                    job.EmploymentType,
                    job.Deadline,
                    job.applicationCount,

                    averageAIScore =
                        Math.Round(
                            job.averageAIScore,
                            2)
                });

            return Ok(new
            {
                totalJobs =
                    topJobs.Count,

                jobs =
                    result
            });
        }

        // ------------------------------------------------------
        // RECENT APPLICATIONS
        // GET: api/Dashboard/recent-applications
        // ------------------------------------------------------
        [HttpGet("recent-applications")]
        public async Task<IActionResult>
            GetRecentApplications(
                [FromQuery] int limit = 10)
        {
            if (limit < 1)
            {
                limit = 10;
            }

            if (limit > 50)
            {
                limit = 50;
            }

            var applications =
                await _context
                    .JobApplications
                    .Include(application =>
                        application.JobPosting)
                    .Include(application =>
                        application
                            .CandidateProfile)
                    .ThenInclude(profile =>
                        profile!.User)
                    .OrderByDescending(application =>
                        application.AppliedAt)
                    .Take(limit)
                    .Select(application => new
                    {
                        applicationId =
                            application
                                .JobApplicationId,

                        jobId =
                            application.JobId,

                        jobTitle =
                            application
                                    .JobPosting !=
                                null
                                ? application
                                    .JobPosting
                                    .Title
                                : "Unknown Job",

                        candidateProfileId =
                            application
                                .CandidateProfileId,

                        candidateName =
                            application
                                    .CandidateProfile !=
                                null &&
                            application
                                    .CandidateProfile
                                    .User !=
                                null
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
                                    .User !=
                                null
                                ? application
                                    .CandidateProfile
                                    .User
                                    .Email
                                : string.Empty,

                        application.Status,
                        application.AIScore,
                        application.AppliedAt
                    })
                    .ToListAsync();

            return Ok(new
            {
                totalApplications =
                    applications.Count,

                applications
            });
        }

        // ------------------------------------------------------
        // UPCOMING INTERVIEWS
        // GET: api/Dashboard/upcoming-interviews
        // ------------------------------------------------------
        [HttpGet("upcoming-interviews")]
        public async Task<IActionResult>
            GetUpcomingInterviews(
                [FromQuery] int limit = 10)
        {
            if (limit < 1)
            {
                limit = 10;
            }

            if (limit > 50)
            {
                limit = 50;
            }

            DateTime currentDateTime =
                DateTime.UtcNow;

            var interviews =
                await _context
                    .Interviews
                    .Include(interview =>
                        interview
                            .JobApplication)
                    .ThenInclude(application =>
                        application!
                            .JobPosting)
                    .Include(interview =>
                        interview
                            .JobApplication)
                    .ThenInclude(application =>
                        application!
                            .CandidateProfile)
                    .ThenInclude(profile =>
                        profile!.User)
                    .Where(interview =>
                        interview
                                .ScheduledDateTime >=
                            currentDateTime &&
                        interview.Status ==
                            "Scheduled")
                    .OrderBy(interview =>
                        interview
                            .ScheduledDateTime)
                    .Take(limit)
                    .Select(interview => new
                    {
                        interview.InterviewId,

                        interview
                            .JobApplicationId,

                        jobTitle =
                            interview
                                    .JobApplication !=
                                null &&
                            interview
                                    .JobApplication
                                    .JobPosting !=
                                null
                                ? interview
                                    .JobApplication
                                    .JobPosting
                                    .Title
                                : "Unknown Job",

                        candidateName =
                            interview
                                    .JobApplication !=
                                null &&
                            interview
                                    .JobApplication
                                    .CandidateProfile !=
                                null &&
                            interview
                                    .JobApplication
                                    .CandidateProfile
                                    .User !=
                                null
                                ? interview
                                    .JobApplication
                                    .CandidateProfile
                                    .User
                                    .FullName
                                : "Unknown Candidate",

                        candidateEmail =
                            interview
                                    .JobApplication !=
                                null &&
                            interview
                                    .JobApplication
                                    .CandidateProfile !=
                                null &&
                            interview
                                    .JobApplication
                                    .CandidateProfile
                                    .User !=
                                null
                                ? interview
                                    .JobApplication
                                    .CandidateProfile
                                    .User
                                    .Email
                                : string.Empty,

                        interview
                            .ScheduledDateTime,

                        interview
                            .InterviewType,

                        interview
                            .MeetingLinkOrLocation,

                        interview.Status,

                        interview.Notes
                    })
                    .ToListAsync();

            return Ok(new
            {
                totalUpcomingInterviews =
                    interviews.Count,

                interviews
            });
        }

        // ------------------------------------------------------
        // TOP-RANKED CANDIDATES
        // GET: api/Dashboard/top-candidates
        // ------------------------------------------------------
        [HttpGet("top-candidates")]
        public async Task<IActionResult>
            GetTopCandidates(
                [FromQuery] int limit = 10)
        {
            if (limit < 1)
            {
                limit = 10;
            }

            if (limit > 50)
            {
                limit = 50;
            }

            var candidates =
                await _context
                    .JobApplications
                    .Include(application =>
                        application.JobPosting)
                    .Include(application =>
                        application
                            .CandidateProfile)
                    .ThenInclude(profile =>
                        profile!.User)
                    .OrderByDescending(application =>
                        application.AIScore)
                    .ThenByDescending(application =>
                        application.AppliedAt)
                    .Take(limit)
                    .Select(application => new
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
                                    .User !=
                                null
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
                                    .User !=
                                null
                                ? application
                                    .CandidateProfile
                                    .User
                                    .Email
                                : string.Empty,

                        jobId =
                            application.JobId,

                        jobTitle =
                            application
                                    .JobPosting !=
                                null
                                ? application
                                    .JobPosting
                                    .Title
                                : "Unknown Job",

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

                        aiScore =
                            application.AIScore,

                        status =
                            application.Status,

                        appliedAt =
                            application.AppliedAt
                    })
                    .ToListAsync();

            return Ok(new
            {
                totalCandidates =
                    candidates.Count,

                candidates
            });
        }

        // ------------------------------------------------------
        // MONTHLY RECRUITMENT TREND
        // GET:
        // api/Dashboard/monthly-recruitment-trend?months=6
        // ------------------------------------------------------
        [HttpGet("monthly-recruitment-trend")]
        public async Task<IActionResult>
            GetMonthlyRecruitmentTrend(
                [FromQuery] int months = 6)
        {
            if (months < 1)
            {
                months = 6;
            }

            if (months > 24)
            {
                months = 24;
            }

            DateTime currentMonth =
                new DateTime(
                    DateTime.UtcNow.Year,
                    DateTime.UtcNow.Month,
                    1);

            DateTime firstMonth =
                currentMonth
                    .AddMonths(-(months - 1));

            var applications =
                await _context
                    .JobApplications
                    .Where(application =>
                        application.AppliedAt >=
                        firstMonth)
                    .Select(application => new
                    {
                        application.AppliedAt,
                        application.Status
                    })
                    .ToListAsync();

            var trend = new List<object>();

            for (int index = 0;
                 index < months;
                 index++)
            {
                DateTime monthStart =
                    firstMonth.AddMonths(index);

                DateTime nextMonth =
                    monthStart.AddMonths(1);

                var monthlyApplications =
                    applications
                        .Where(application =>
                            application.AppliedAt >=
                                monthStart &&
                            application.AppliedAt <
                                nextMonth)
                        .ToList();

                int applicationCount =
                    monthlyApplications.Count;

                int selectedCount =
                    monthlyApplications.Count(
                        application =>
                            IsSelectedStatus(
                                application.Status));

                int shortlistedCount =
                    monthlyApplications.Count(
                        application =>
                            NormalizeApplicationStatus(
                                application.Status) ==
                            "Shortlisted");

                int rejectedCount =
                    monthlyApplications.Count(
                        application =>
                            NormalizeApplicationStatus(
                                application.Status) ==
                            "Rejected");

                double selectionRate =
                    applicationCount > 0
                        ? Math.Round(
                            (double)selectedCount /
                            applicationCount *
                            100,
                            2)
                        : 0;

                trend.Add(new
                {
                    year =
                        monthStart.Year,

                    month =
                        monthStart.Month,

                    monthName =
                        monthStart.ToString(
                            "MMM yyyy"),

                    applications =
                        applicationCount,

                    shortlisted =
                        shortlistedCount,

                    selected =
                        selectedCount,

                    rejected =
                        rejectedCount,

                    selectionRate
                });
            }

            return Ok(new
            {
                monthsIncluded =
                    months,

                startMonth =
                    firstMonth,

                endMonth =
                    currentMonth,

                trend
            });
        }

        // ------------------------------------------------------
        // JOB STATUS DISTRIBUTION
        // GET: api/Dashboard/job-status
        // ------------------------------------------------------
        [HttpGet("job-status")]
        public async Task<IActionResult>
            GetJobStatusStatistics()
        {
            DateTime currentDateTime =
                DateTime.UtcNow;

            var jobs =
                await _context
                    .JobPostings
                    .Select(job => new
                    {
                        job.Status,
                        job.Deadline
                    })
                    .ToListAsync();

            int totalJobs =
                jobs.Count;

            int openJobs =
                jobs.Count(job =>
                    job.Status == "Open" &&
                    job.Deadline >=
                        currentDateTime);

            int closedJobs =
                jobs.Count(job =>
                    job.Status == "Closed");

            int expiredJobs =
                jobs.Count(job =>
                    job.Status != "Closed" &&
                    job.Deadline <
                        currentDateTime);

            int draftJobs =
                jobs.Count(job =>
                    job.Status == "Draft");

            int otherJobs =
                totalJobs -
                openJobs -
                closedJobs -
                expiredJobs -
                draftJobs;

            var statistics =
                new[]
                {
                    new
                    {
                        status =
                            "Open",

                        count =
                            openJobs
                    },

                    new
                    {
                        status =
                            "Closed",

                        count =
                            closedJobs
                    },

                    new
                    {
                        status =
                            "Expired",

                        count =
                            expiredJobs
                    },

                    new
                    {
                        status =
                            "Draft",

                        count =
                            draftJobs
                    },

                    new
                    {
                        status =
                            "Other",

                        count =
                            Math.Max(
                                otherJobs,
                                0)
                    }
                }
                .Where(item =>
                    item.count > 0)
                .ToList();

            return Ok(new
            {
                totalJobs,

                statistics
            });
        }

        // ------------------------------------------------------
        // OVERALL RECRUITMENT PERFORMANCE
        // GET: api/Dashboard/recruitment-performance
        // ------------------------------------------------------
        [HttpGet("recruitment-performance")]
        public async Task<IActionResult>
            GetRecruitmentPerformance()
        {
            int totalApplications =
                await _context
                    .JobApplications
                    .CountAsync();

            int shortlistedApplications =
                await _context
                    .JobApplications
                    .CountAsync(application =>
                        application.Status ==
                        "Shortlisted");

            int selectedApplications =
                await _context
                    .JobApplications
                    .CountAsync(application =>
                        application.Status ==
                            "Selected" ||
                        application.Status ==
                            "Hired");

            int rejectedApplications =
                await _context
                    .JobApplications
                    .CountAsync(application =>
                        application.Status ==
                        "Rejected");

            int totalInterviews =
                await _context
                    .Interviews
                    .CountAsync();

            int completedInterviews =
                await _context
                    .Interviews
                    .CountAsync(interview =>
                        interview.Status ==
                        "Completed");

            int cancelledInterviews =
                await _context
                    .Interviews
                    .CountAsync(interview =>
                        interview.Status ==
                        "Cancelled");

            int totalEvaluations =
                await _context
                    .CandidateEvaluations
                    .CountAsync();

            double averageAIScore = 0;

            if (totalApplications > 0)
            {
                averageAIScore =
                    await _context
                        .JobApplications
                        .AverageAsync(application =>
                            application.AIScore);
            }

            decimal averageEvaluationScore = 0;

            if (totalEvaluations > 0)
            {
                averageEvaluationScore =
                    await _context
                        .CandidateEvaluations
                        .AverageAsync(evaluation =>
                            evaluation
                                .OverallScore);
            }

            double shortlistRate =
                CalculatePercentage(
                    shortlistedApplications,
                    totalApplications);

            double selectionRate =
                CalculatePercentage(
                    selectedApplications,
                    totalApplications);

            double rejectionRate =
                CalculatePercentage(
                    rejectedApplications,
                    totalApplications);

            double interviewCompletionRate =
                CalculatePercentage(
                    completedInterviews,
                    totalInterviews);

            double interviewCancellationRate =
                CalculatePercentage(
                    cancelledInterviews,
                    totalInterviews);

            return Ok(new
            {
                generatedAt =
                    DateTime.UtcNow,

                totals = new
                {
                    applications =
                        totalApplications,

                    shortlisted =
                        shortlistedApplications,

                    selected =
                        selectedApplications,

                    rejected =
                        rejectedApplications,

                    interviews =
                        totalInterviews,

                    completedInterviews,

                    cancelledInterviews,

                    evaluations =
                        totalEvaluations
                },

                rates = new
                {
                    shortlistRate,

                    selectionRate,

                    rejectionRate,

                    interviewCompletionRate,

                    interviewCancellationRate
                },

                scores = new
                {
                    averageAIScore =
                        Math.Round(
                            averageAIScore,
                            2),

                    averageEvaluationScore =
                        Math.Round(
                            averageEvaluationScore,
                            2)
                }
            });
        }

        // ------------------------------------------------------
        // RECRUITER PERFORMANCE
        // GET:
        // api/Dashboard/recruiter-performance?limit=10
        // ------------------------------------------------------
        [HttpGet("recruiter-performance")]
        public async Task<IActionResult>
            GetRecruiterPerformance(
                [FromQuery] int limit = 10)
        {
            if (limit < 1)
            {
                limit = 10;
            }

            if (limit > 50)
            {
                limit = 50;
            }

            var recruiters =
                await _context
                    .Users
                    .Where(user =>
                        user.Role ==
                        "Recruiter")
                    .Select(user => new
                    {
                        user.UserId,
                        user.FullName,
                        user.Email,
                        user.IsActive
                    })
                    .ToListAsync();

            var jobs =
                await _context
                    .JobPostings
                    .Select(job => new
                    {
                        job.JobId,
                        job.RecruiterId,
                        job.Status,
                        job.Deadline
                    })
                    .ToListAsync();

            var applications =
                await _context
                    .JobApplications
                    .Select(application => new
                    {
                        application.JobId,
                        application.Status,
                        application.AIScore
                    })
                    .ToListAsync();

            DateTime currentDateTime =
                DateTime.UtcNow;

            var performance =
                recruiters
                    .Select(recruiter =>
                    {
                        var recruiterJobs =
                            jobs
                                .Where(job =>
                                    job.RecruiterId ==
                                    recruiter.UserId)
                                .ToList();

                        var recruiterJobIds =
                            recruiterJobs
                                .Select(job =>
                                    job.JobId)
                                .ToHashSet();

                        var recruiterApplications =
                            applications
                                .Where(application =>
                                    recruiterJobIds
                                        .Contains(
                                            application
                                                .JobId))
                                .ToList();

                        int totalJobs =
                            recruiterJobs.Count;

                        int activeJobs =
                            recruiterJobs.Count(job =>
                                job.Status ==
                                    "Open" &&
                                job.Deadline >=
                                    currentDateTime);

                        int totalApplications =
                            recruiterApplications
                                .Count;

                        int shortlisted =
                            recruiterApplications
                                .Count(application =>
                                    NormalizeApplicationStatus(
                                        application
                                            .Status) ==
                                    "Shortlisted");

                        int selected =
                            recruiterApplications
                                .Count(application =>
                                    IsSelectedStatus(
                                        application
                                            .Status));

                        int rejected =
                            recruiterApplications
                                .Count(application =>
                                    NormalizeApplicationStatus(
                                        application
                                            .Status) ==
                                    "Rejected");

                        double averageAIScore =
                            totalApplications > 0
                                ? Math.Round(
                                    recruiterApplications
                                        .Average(
                                            application =>
                                                application
                                                    .AIScore),
                                    2)
                                : 0;

                        double selectionRate =
                            CalculatePercentage(
                                selected,
                                totalApplications);

                        return new
                        {
                            recruiterId =
                                recruiter.UserId,

                            recruiterName =
                                recruiter.FullName,

                            recruiterEmail =
                                recruiter.Email,

                            recruiter.IsActive,

                            totalJobs,

                            activeJobs,

                            totalApplications,

                            shortlisted,

                            selected,

                            rejected,

                            averageAIScore,

                            selectionRate
                        };
                    })
                    .OrderByDescending(item =>
                        item.selected)
                    .ThenByDescending(item =>
                        item.totalApplications)
                    .ThenByDescending(item =>
                        item.averageAIScore)
                    .Take(limit)
                    .ToList();

            return Ok(new
            {
                totalRecruiters =
                    recruiters.Count,

                returnedRecruiters =
                    performance.Count,

                recruiters =
                    performance
            });
        }

        // ------------------------------------------------------
        // HELPER METHODS
        // ------------------------------------------------------
        private static string
            NormalizeApplicationStatus(
                string? status)
        {
            if (string.IsNullOrWhiteSpace(
                status))
            {
                return "Unknown";
            }

            string normalizedStatus =
                status.Trim();

            if (
                normalizedStatus.Equals(
                    "UnderReview",
                    StringComparison
                        .OrdinalIgnoreCase) ||
                normalizedStatus.Equals(
                    "Under Review",
                    StringComparison
                        .OrdinalIgnoreCase))
            {
                return "Under Review";
            }

            if (
                normalizedStatus.Equals(
                    "InterviewScheduled",
                    StringComparison
                        .OrdinalIgnoreCase))
            {
                return "Interview Scheduled";
            }

            if (
                normalizedStatus.Equals(
                    "InterviewCompleted",
                    StringComparison
                        .OrdinalIgnoreCase))
            {
                return "Interview Completed";
            }

            if (
                normalizedStatus.Equals(
                    "Hired",
                    StringComparison
                        .OrdinalIgnoreCase) ||
                normalizedStatus.Equals(
                    "Selected",
                    StringComparison
                        .OrdinalIgnoreCase))
            {
                return "Selected";
            }

            return normalizedStatus;
        }

        private static bool
            IsSelectedStatus(
                string? status)
        {
            string normalizedStatus =
                NormalizeApplicationStatus(
                    status);

            return normalizedStatus ==
                "Selected";
        }

        private static double
            CalculatePercentage(
                int value,
                int total)
        {
            if (total <= 0)
            {
                return 0;
            }

            return Math.Round(
                (double)value /
                total *
                100,
                2);
        }
    }
}