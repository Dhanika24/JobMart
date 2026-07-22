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
    public class NotificationsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public NotificationsController(
            ApplicationDbContext context)
        {
            _context = context;
        }

        // --------------------------------------------------
        // CURRENT USER VIEWS OWN NOTIFICATIONS
        // GET: /api/Notifications/my
        // --------------------------------------------------
        [HttpGet("my")]
        public async Task<IActionResult>
            GetMyNotifications()
        {
            int? userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized(new
                {
                    message = "Invalid user token."
                });
            }

            var notifications =
                await _context.Notifications
                    .Where(notification =>
                        notification.UserId ==
                        userId.Value)
                    .OrderByDescending(notification =>
                        notification.CreatedAt)
                    .Select(notification => new
                    {
                        notification.NotificationId,
                        notification.Title,
                        notification.Message,
                        notification.Type,
                        notification.JobApplicationId,
                        notification.IsRead,
                        notification.CreatedAt
                    })
                    .ToListAsync();

            int unreadCount =
                notifications.Count(notification =>
                    !notification.IsRead);

            return Ok(new
            {
                totalNotifications =
                    notifications.Count,

                unreadCount,

                notifications
            });
        }

        // --------------------------------------------------
        // CURRENT USER GETS UNREAD COUNT
        // GET: /api/Notifications/unread-count
        // --------------------------------------------------
        [HttpGet("unread-count")]
        public async Task<IActionResult>
            GetUnreadCount()
        {
            int? userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized(new
                {
                    message = "Invalid user token."
                });
            }

            int unreadCount =
                await _context.Notifications
                    .CountAsync(notification =>
                        notification.UserId ==
                            userId.Value &&
                        !notification.IsRead);

            return Ok(new
            {
                unreadCount
            });
        }

        // --------------------------------------------------
        // CURRENT USER MARKS ONE NOTIFICATION AS READ
        // PUT: /api/Notifications/1/read
        // --------------------------------------------------
        [HttpPut("{notificationId}/read")]
        public async Task<IActionResult> MarkAsRead(
            int notificationId)
        {
            int? userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized(new
                {
                    message = "Invalid user token."
                });
            }

            var notification =
                await _context.Notifications
                    .FirstOrDefaultAsync(item =>
                        item.NotificationId ==
                            notificationId &&
                        item.UserId ==
                            userId.Value);

            if (notification == null)
            {
                return NotFound(new
                {
                    message =
                        "Notification not found."
                });
            }

            notification.IsRead = true;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Notification marked as read.",

                notificationId =
                    notification.NotificationId,

                isRead =
                    notification.IsRead
            });
        }

        // --------------------------------------------------
        // CURRENT USER MARKS ALL NOTIFICATIONS AS READ
        // PUT: /api/Notifications/read-all
        // --------------------------------------------------
        [HttpPut("read-all")]
        public async Task<IActionResult>
            MarkAllAsRead()
        {
            int? userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized(new
                {
                    message = "Invalid user token."
                });
            }

            var unreadNotifications =
                await _context.Notifications
                    .Where(notification =>
                        notification.UserId ==
                            userId.Value &&
                        !notification.IsRead)
                    .ToListAsync();

            foreach (
                var notification
                in unreadNotifications)
            {
                notification.IsRead = true;
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "All notifications marked as read.",

                updatedCount =
                    unreadNotifications.Count
            });
        }

        // --------------------------------------------------
        // CURRENT USER DELETES OWN NOTIFICATION
        // DELETE: /api/Notifications/1
        // --------------------------------------------------
        [HttpDelete("{notificationId}")]
        public async Task<IActionResult>
            DeleteNotification(int notificationId)
        {
            int? userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized(new
                {
                    message = "Invalid user token."
                });
            }

            var notification =
                await _context.Notifications
                    .FirstOrDefaultAsync(item =>
                        item.NotificationId ==
                            notificationId &&
                        item.UserId ==
                            userId.Value);

            if (notification == null)
            {
                return NotFound(new
                {
                    message =
                        "Notification not found."
                });
            }

            _context.Notifications.Remove(
                notification);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Notification deleted successfully."
            });
        }

        // --------------------------------------------------
        // RECRUITER OR ADMIN SENDS MESSAGE TO CANDIDATE
        // POST: /api/Notifications/recruiter/send
        // --------------------------------------------------
        [Authorize(Roles = "Recruiter,Admin")]
        [HttpPost("recruiter/send")]
        public async Task<IActionResult>
            SendCandidateNotification(
                SendCandidateNotificationDto request)
        {
            if (string.IsNullOrWhiteSpace(
                    request.Title))
            {
                return BadRequest(new
                {
                    message =
                        "Notification title is required."
                });
            }

            if (string.IsNullOrWhiteSpace(
                    request.Message))
            {
                return BadRequest(new
                {
                    message =
                        "Notification message is required."
                });
            }

            var application =
                await _context.JobApplications
                    .Include(item =>
                        item.JobPosting)
                    .Include(item =>
                        item.CandidateProfile)
                        .ThenInclude(profile =>
                            profile!.User)
                    .FirstOrDefaultAsync(item =>
                        item.JobApplicationId ==
                        request.JobApplicationId);

            if (application == null)
            {
                return NotFound(new
                {
                    message =
                        "Job application not found."
                });
            }

            User? candidateUser =
                application.CandidateProfile?.User;

            if (candidateUser == null)
            {
                return BadRequest(new
                {
                    message =
                        "Candidate user information could not be found."
                });
            }

            string notificationType =
                string.IsNullOrWhiteSpace(
                    request.Type)
                    ? "RecruiterMessage"
                    : request.Type.Trim();

            var notification =
                new Notification
                {
                    UserId =
                        candidateUser.UserId,

                    JobApplicationId =
                        application.JobApplicationId,

                    Title =
                        request.Title.Trim(),

                    Message =
                        request.Message.Trim(),

                    Type =
                        notificationType,

                    IsRead =
                        false,

                    CreatedAt =
                        DateTime.UtcNow
                };

            _context.Notifications.Add(
                notification);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Message sent to the candidate successfully.",

                notificationId =
                    notification.NotificationId,

                applicationId =
                    application.JobApplicationId,

                jobTitle =
                    application.JobPosting?.Title,

                candidateName =
                    candidateUser.FullName,

                candidateEmail =
                    candidateUser.Email,

                notificationTitle =
                    notification.Title,

                notificationMessage =
                    notification.Message,

                notificationType =
                    notification.Type,

                createdAt =
                    notification.CreatedAt
            });
        }

        // --------------------------------------------------
        // RECRUITER OR ADMIN VIEWS SENT CANDIDATE MESSAGES
        // GET: /api/Notifications/recruiter/sent
        // --------------------------------------------------
        [Authorize(Roles = "Recruiter,Admin")]
        [HttpGet("recruiter/sent")]
        public async Task<IActionResult>
            GetSentCandidateNotifications()
        {
            var notifications =
                await _context.Notifications
                    .Include(notification =>
                        notification.User)
                    .Include(notification =>
                        notification.JobApplication)
                        .ThenInclude(application =>
                            application!.JobPosting)
                    .Where(notification =>
                        notification.Type ==
                            "RecruiterMessage" ||
                        notification.Type ==
                            "ApplicationUpdate" ||
                        notification.Type ==
                            "InterviewReminder")
                    .OrderByDescending(notification =>
                        notification.CreatedAt)
                    .Select(notification => new
                    {
                        notificationId =
                            notification.NotificationId,

                        userId =
                            notification.UserId,

                        candidateName =
                            notification.User != null
                                ? notification.User.FullName
                                : "Unknown Candidate",

                        candidateEmail =
                            notification.User != null
                                ? notification.User.Email
                                : string.Empty,

                        jobApplicationId =
                            notification.JobApplicationId,

                        jobTitle =
                            notification.JobApplication != null &&
                            notification.JobApplication
                                .JobPosting != null
                                ? notification
                                    .JobApplication
                                    .JobPosting
                                    .Title
                                : "Unknown Job",

                        title =
                            notification.Title,

                        notificationMessage =
                            notification.Message,

                        notificationType =
                            notification.Type,

                        isRead =
                            notification.IsRead,

                        createdAt =
                            notification.CreatedAt
                    })
                    .ToListAsync();

            return Ok(new
            {
                totalMessages =
                    notifications.Count,

                notifications
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