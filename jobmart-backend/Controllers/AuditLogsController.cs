using jobmart.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace jobmart.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class AuditLogsController :
        ControllerBase
    {
        private readonly ApplicationDbContext
            _context;

        public AuditLogsController(
            ApplicationDbContext context)
        {
            _context = context;
        }

        // --------------------------------------------------
        // GET AUDIT LOGS
        // GET: /api/AuditLogs
        // GET: /api/AuditLogs?page=1&pageSize=20
        // GET: /api/AuditLogs?action=Login
        // --------------------------------------------------
        [HttpGet]
        public async Task<IActionResult>
            GetAuditLogs(
                string? search = null,
                string? action = null,
                string? entityType = null,
                string? role = null,
                DateTime? fromDate = null,
                DateTime? toDate = null,
                int page = 1,
                int pageSize = 20)
        {
            if (page < 1)
            {
                page = 1;
            }

            if (pageSize < 1)
            {
                pageSize = 20;
            }

            if (pageSize > 100)
            {
                pageSize = 100;
            }

            var query =
                _context.AuditLogs
                    .AsNoTracking()
                    .AsQueryable();

            if (!string.IsNullOrWhiteSpace(
                    search))
            {
                string cleanedSearch =
                    search.Trim();

                query =
                    query.Where(log =>
                        (log.UserName != null &&
                         log.UserName.Contains(
                             cleanedSearch)) ||

                        log.Action.Contains(
                            cleanedSearch) ||

                        log.EntityType.Contains(
                            cleanedSearch) ||

                        (log.EntityId != null &&
                         log.EntityId.Contains(
                             cleanedSearch)) ||

                        log.Details.Contains(
                            cleanedSearch));
            }

            if (!string.IsNullOrWhiteSpace(
                    action))
            {
                string cleanedAction =
                    action.Trim();

                query =
                    query.Where(log =>
                        log.Action ==
                        cleanedAction);
            }

            if (!string.IsNullOrWhiteSpace(
                    entityType))
            {
                string cleanedEntityType =
                    entityType.Trim();

                query =
                    query.Where(log =>
                        log.EntityType ==
                        cleanedEntityType);
            }

            if (!string.IsNullOrWhiteSpace(
                    role))
            {
                string cleanedRole =
                    role.Trim();

                query =
                    query.Where(log =>
                        log.Role ==
                        cleanedRole);
            }

            if (fromDate.HasValue)
            {
                query =
                    query.Where(log =>
                        log.CreatedAt >=
                        fromDate.Value);
            }

            if (toDate.HasValue)
            {
                DateTime inclusiveToDate =
                    toDate.Value.Date
                        .AddDays(1);

                query =
                    query.Where(log =>
                        log.CreatedAt <
                        inclusiveToDate);
            }

            int totalLogs =
                await query.CountAsync();

            var logs =
                await query
                    .OrderByDescending(log =>
                        log.CreatedAt)
                    .Skip(
                        (page - 1) *
                        pageSize)
                    .Take(pageSize)
                    .Select(log => new
                    {
                        log.AuditLogId,
                        log.UserId,
                        log.UserName,
                        log.Role,
                        log.Action,
                        log.EntityType,
                        log.EntityId,
                        log.Details,
                        log.IpAddress,
                        log.CreatedAt
                    })
                    .ToListAsync();

            int totalPages =
                totalLogs == 0
                    ? 0
                    : (int)Math.Ceiling(
                        totalLogs /
                        (double)pageSize);

            return Ok(new
            {
                totalLogs,
                page,
                pageSize,
                totalPages,
                logs
            });
        }

        // --------------------------------------------------
        // GET ONE AUDIT LOG
        // GET: /api/AuditLogs/1
        // --------------------------------------------------
        [HttpGet("{auditLogId:int}")]
        public async Task<IActionResult>
            GetAuditLog(int auditLogId)
        {
            var auditLog =
                await _context.AuditLogs
                    .AsNoTracking()
                    .Where(log =>
                        log.AuditLogId ==
                        auditLogId)
                    .Select(log => new
                    {
                        log.AuditLogId,
                        log.UserId,
                        log.UserName,
                        log.Role,
                        log.Action,
                        log.EntityType,
                        log.EntityId,
                        log.Details,
                        log.IpAddress,
                        log.CreatedAt
                    })
                    .FirstOrDefaultAsync();

            if (auditLog == null)
            {
                return NotFound(new
                {
                    message =
                        "Audit log not found."
                });
            }

            return Ok(auditLog);
        }

        // --------------------------------------------------
        // GET AUDIT LOG FILTER OPTIONS
        // GET: /api/AuditLogs/filters
        // --------------------------------------------------
        [HttpGet("filters")]
        public async Task<IActionResult>
            GetFilterOptions()
        {
            var actions =
                await _context.AuditLogs
                    .AsNoTracking()
                    .Select(log =>
                        log.Action)
                    .Distinct()
                    .OrderBy(action =>
                        action)
                    .ToListAsync();

            var entityTypes =
                await _context.AuditLogs
                    .AsNoTracking()
                    .Select(log =>
                        log.EntityType)
                    .Distinct()
                    .OrderBy(entityType =>
                        entityType)
                    .ToListAsync();

            var roles =
                await _context.AuditLogs
                    .AsNoTracking()
                    .Where(log =>
                        log.Role != null)
                    .Select(log =>
                        log.Role!)
                    .Distinct()
                    .OrderBy(role =>
                        role)
                    .ToListAsync();

            return Ok(new
            {
                actions,
                entityTypes,
                roles
            });
        }

        // --------------------------------------------------
        // GET AUDIT LOG SUMMARY
        // GET: /api/AuditLogs/summary
        // --------------------------------------------------
        [HttpGet("summary")]
        public async Task<IActionResult>
            GetAuditLogSummary()
        {
            DateTime today =
                DateTime.UtcNow.Date;

            DateTime sevenDaysAgo =
                today.AddDays(-6);

            int totalLogs =
                await _context.AuditLogs
                    .CountAsync();

            int todayLogs =
                await _context.AuditLogs
                    .CountAsync(log =>
                        log.CreatedAt >= today);

            int lastSevenDaysLogs =
                await _context.AuditLogs
                    .CountAsync(log =>
                        log.CreatedAt >=
                        sevenDaysAgo);

            int loginSuccesses =
                await _context.AuditLogs
                    .CountAsync(log =>
                        log.Action ==
                        "Login Success");

            int loginFailures =
                await _context.AuditLogs
                    .CountAsync(log =>
                        log.Action ==
                        "Login Failed");

            var recentLogs =
                await _context.AuditLogs
                    .AsNoTracking()
                    .OrderByDescending(log =>
                        log.CreatedAt)
                    .Take(5)
                    .Select(log => new
                    {
                        log.AuditLogId,
                        log.UserName,
                        log.Role,
                        log.Action,
                        log.EntityType,
                        log.Details,
                        log.CreatedAt
                    })
                    .ToListAsync();

            return Ok(new
            {
                totalLogs,
                todayLogs,
                lastSevenDaysLogs,
                loginSuccesses,
                loginFailures,
                recentLogs
            });
        }
    }
}