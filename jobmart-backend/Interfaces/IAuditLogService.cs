namespace jobmart.Interfaces
{
    public interface IAuditLogService
    {
        Task LogAsync(
            int? userId,
            string? userName,
            string? role,
            string action,
            string entityType,
            string? entityId,
            string details,
            string? ipAddress = null);
    }
}