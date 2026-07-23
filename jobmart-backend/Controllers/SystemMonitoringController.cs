using System.Diagnostics;
using System.Reflection;
using jobmart.Data;
using jobmart.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace jobmart.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class SystemMonitoringController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _environment;
        private readonly ILogger<SystemMonitoringController> _logger;

        public SystemMonitoringController(
            ApplicationDbContext context,
            IWebHostEnvironment environment,
            ILogger<SystemMonitoringController> logger)
        {
            _context = context;
            _environment = environment;
            _logger = logger;
        }

        // --------------------------------------------------
        // GET: /api/SystemMonitoring/summary
        // --------------------------------------------------
        [HttpGet("summary")]
        public async Task<ActionResult<SystemMonitoringSummaryDto>>
            GetMonitoringSummary()
        {
            try
            {
                bool databaseAvailable =
                    await _context.Database.CanConnectAsync();

                DateTime twentyFourHoursAgo =
                    DateTime.UtcNow.AddHours(-24);

                DateTime processStartTime =
                    Process
                        .GetCurrentProcess()
                        .StartTime
                        .ToUniversalTime();

                TimeSpan uptime =
                    DateTime.UtcNow - processStartTime;

                string applicationVersion =
                    Assembly
                        .GetExecutingAssembly()
                        .GetName()
                        .Version?
                        .ToString() ??
                    "1.0.0";

                int totalUsers =
                    await _context.Users.CountAsync();

                int activeUsers =
                    await _context.Users.CountAsync(
                        user => user.IsActive);

                int inactiveUsers =
                    await _context.Users.CountAsync(
                        user => !user.IsActive);

                int totalCandidates =
                    await _context.Users.CountAsync(
                        user => user.Role == "Candidate");

                int totalRecruiters =
                    await _context.Users.CountAsync(
                        user => user.Role == "Recruiter");

                int totalHiringManagers =
                    await _context.Users.CountAsync(
                        user => user.Role == "HiringManager");

                int totalAdmins =
                    await _context.Users.CountAsync(
                        user => user.Role == "Admin");

                int totalJobs =
                    await _context.JobPostings.CountAsync();

                int activeJobs =
                    await _context.JobPostings.CountAsync(
                        job => job.Status == "Active");

                int totalApplications =
                    await _context.JobApplications.CountAsync();

                int totalInterviews =
                    await _context.Interviews.CountAsync();

                int totalOrganizations =
                    await _context.Organizations.CountAsync();

                int totalDepartments =
                    await _context.Departments.CountAsync();

                int auditEventsLast24Hours =
                    await _context.AuditLogs.CountAsync(
                        log =>
                            log.CreatedAt >=
                            twentyFourHoursAgo);

                int failedEventsLast24Hours =
                    await _context.AuditLogs.CountAsync(
                        log =>
                            log.CreatedAt >=
                                twentyFourHoursAgo &&
                            (
                                log.Action.Contains("Failed") ||
                                log.Action.Contains("Error") ||
                                log.Action.Contains("Blocked")
                            ));

                var summary =
                    new SystemMonitoringSummaryDto
                    {
                        ApiStatus = "Online",

                        DatabaseStatus =
                            databaseAvailable
                                ? "Connected"
                                : "Disconnected",

                        ServerTimeUtc =
                            DateTime.UtcNow,

                        ApplicationVersion =
                            applicationVersion,

                        Environment =
                            _environment.EnvironmentName,

                        UptimeSeconds =
                            Convert.ToInt64(
                                uptime.TotalSeconds),

                        UptimeHours =
                            Math.Round(
                                uptime.TotalHours,
                                2),

                        TotalUsers =
                            totalUsers,

                        ActiveUsers =
                            activeUsers,

                        InactiveUsers =
                            inactiveUsers,

                        TotalCandidates =
                            totalCandidates,

                        TotalRecruiters =
                            totalRecruiters,

                        TotalHiringManagers =
                            totalHiringManagers,

                        TotalAdmins =
                            totalAdmins,

                        TotalJobs =
                            totalJobs,

                        ActiveJobs =
                            activeJobs,

                        TotalApplications =
                            totalApplications,

                        TotalInterviews =
                            totalInterviews,

                        TotalOrganizations =
                            totalOrganizations,

                        TotalDepartments =
                            totalDepartments,

                        AuditEventsLast24Hours =
                            auditEventsLast24Hours,

                        FailedEventsLast24Hours =
                            failedEventsLast24Hours,

                        GeneratedAtUtc =
                            DateTime.UtcNow
                    };

                return Ok(summary);
            }
            catch (Exception exception)
            {
                _logger.LogError(
                    exception,
                    "Unable to generate the system monitoring summary.");

                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        message =
                            "Unable to generate the system monitoring summary."
                    });
            }
        }

        // --------------------------------------------------
        // GET: /api/SystemMonitoring/api-health
        // --------------------------------------------------
        [HttpGet("api-health")]
        public async Task<ActionResult<SystemHealthDto>>
            GetApiHealth()
        {
            Stopwatch stopwatch =
                Stopwatch.StartNew();

            try
            {
                bool databaseAvailable =
                    await _context.Database.CanConnectAsync();

                stopwatch.Stop();

                string applicationVersion =
                    Assembly
                        .GetExecutingAssembly()
                        .GetName()
                        .Version?
                        .ToString() ??
                    "1.0.0";

                var health =
                    new SystemHealthDto
                    {
                        Status =
                            databaseAvailable
                                ? "Healthy"
                                : "Degraded",

                        ApiStatus =
                            "Online",

                        DatabaseStatus =
                            databaseAvailable
                                ? "Connected"
                                : "Disconnected",

                        CheckedAtUtc =
                            DateTime.UtcNow,

                        ResponseTimeMilliseconds =
                            stopwatch.ElapsedMilliseconds,

                        Environment =
                            _environment.EnvironmentName,

                        ApplicationVersion =
                            applicationVersion
                    };

                if (!databaseAvailable)
                {
                    return StatusCode(
                        StatusCodes.Status503ServiceUnavailable,
                        health);
                }

                return Ok(health);
            }
            catch (Exception exception)
            {
                stopwatch.Stop();

                _logger.LogError(
                    exception,
                    "System health check failed.");

                string applicationVersion =
                    Assembly
                        .GetExecutingAssembly()
                        .GetName()
                        .Version?
                        .ToString() ??
                    "1.0.0";

                var health =
                    new SystemHealthDto
                    {
                        Status =
                            "Unhealthy",

                        ApiStatus =
                            "Online",

                        DatabaseStatus =
                            "Error",

                        CheckedAtUtc =
                            DateTime.UtcNow,

                        ResponseTimeMilliseconds =
                            stopwatch.ElapsedMilliseconds,

                        Environment =
                            _environment.EnvironmentName,

                        ApplicationVersion =
                            applicationVersion
                    };

                return StatusCode(
                    StatusCodes.Status503ServiceUnavailable,
                    health);
            }
        }

        // --------------------------------------------------
        // GET: /api/SystemMonitoring/recent-errors
        // --------------------------------------------------
        [HttpGet("recent-errors")]
        public async Task<ActionResult>
            GetRecentErrors(
                [FromQuery] int limit = 20)
        {
            try
            {
                if (limit < 1)
                {
                    limit = 1;
                }

                if (limit > 100)
                {
                    limit = 100;
                }

                var errors =
                    await _context.AuditLogs
                        .Where(log =>
                            log.Action.Contains("Failed") ||
                            log.Action.Contains("Error") ||
                            log.Action.Contains("Blocked"))
                        .OrderByDescending(
                            log => log.CreatedAt)
                        .Take(limit)
                        .Select(log =>
                            new SystemErrorDto
                            {
                                AuditLogId =
                                    log.AuditLogId,

                                UserId =
                                    log.UserId,

                                UserName =
                                    log.UserName ??
                                    "Unknown User",

                                Action =
                                    log.Action,

                                EntityType =
                                    log.EntityType ??
                                    "System",

                                Details =
                                    log.Details ??
                                    string.Empty,

                                IpAddress =
                                    log.IpAddress ??
                                    string.Empty,

                                CreatedAt =
                                    log.CreatedAt
                            })
                        .ToListAsync();

                return Ok(new
                {
                    totalErrors =
                        errors.Count,

                    errors
                });
            }
            catch (Exception exception)
            {
                _logger.LogError(
                    exception,
                    "Unable to load recent system errors.");

                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        message =
                            "Unable to load recent system errors."
                    });
            }
        }
    }
}