using jobmart.Data;
using jobmart.Interfaces;
using jobmart.Models;

namespace jobmart.Services
{
    public class AuditLogService :
        IAuditLogService
    {
        private readonly ApplicationDbContext
            _context;

        private readonly IHttpContextAccessor
            _httpContextAccessor;

        public AuditLogService(
            ApplicationDbContext context,
            IHttpContextAccessor
                httpContextAccessor)
        {
            _context = context;

            _httpContextAccessor =
                httpContextAccessor;
        }

        public async Task LogAsync(
            int? userId,
            string? userName,
            string? role,
            string action,
            string entityType,
            string? entityId,
            string details,
            string? ipAddress = null)
        {
            string resolvedIpAddress =
                ResolveIpAddress(
                    ipAddress);

            var auditLog =
                new AuditLog
                {
                    UserId =
                        userId,

                    UserName =
                        CleanOptionalValue(
                            userName,
                            100),

                    Role =
                        CleanOptionalValue(
                            role,
                            30),

                    Action =
                        CleanRequiredValue(
                            action,
                            "Unknown Action",
                            100),

                    EntityType =
                        CleanRequiredValue(
                            entityType,
                            "Unknown Entity",
                            100),

                    EntityId =
                        CleanOptionalValue(
                            entityId,
                            100),

                    Details =
                        CleanRequiredValue(
                            details,
                            "No additional details.",
                            1000),

                    IpAddress =
                        CleanOptionalValue(
                            resolvedIpAddress,
                            100),

                    CreatedAt =
                        DateTime.UtcNow
                };

            _context.AuditLogs.Add(
                auditLog);

            await _context.SaveChangesAsync();
        }

        private string ResolveIpAddress(
            string? providedIpAddress)
        {
            if (!string.IsNullOrWhiteSpace(
                    providedIpAddress))
            {
                return providedIpAddress.Trim();
            }

            HttpContext? httpContext =
                _httpContextAccessor
                    .HttpContext;

            if (httpContext == null)
            {
                return "Unknown";
            }

            string? forwardedFor =
                httpContext.Request.Headers[
                    "X-Forwarded-For"]
                    .FirstOrDefault();

            if (!string.IsNullOrWhiteSpace(
                    forwardedFor))
            {
                return forwardedFor
                    .Split(',')
                    .First()
                    .Trim();
            }

            string? remoteIpAddress =
                httpContext.Connection
                    .RemoteIpAddress?
                    .ToString();

            return string.IsNullOrWhiteSpace(
                    remoteIpAddress)
                ? "Unknown"
                : remoteIpAddress;
        }

        private static string
            CleanRequiredValue(
                string? value,
                string fallback,
                int maximumLength)
        {
            string cleanedValue =
                string.IsNullOrWhiteSpace(value)
                    ? fallback
                    : value.Trim();

            if (cleanedValue.Length >
                maximumLength)
            {
                cleanedValue =
                    cleanedValue[
                        ..maximumLength];
            }

            return cleanedValue;
        }

        private static string?
            CleanOptionalValue(
                string? value,
                int maximumLength)
        {
            if (string.IsNullOrWhiteSpace(
                    value))
            {
                return null;
            }

            string cleanedValue =
                value.Trim();

            if (cleanedValue.Length >
                maximumLength)
            {
                cleanedValue =
                    cleanedValue[
                        ..maximumLength];
            }

            return cleanedValue;
        }
    }
}