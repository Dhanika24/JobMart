namespace jobmart.DTOs
{
    public class SystemMonitoringSummaryDto
    {
        public string ApiStatus { get; set; } = string.Empty;

        public string DatabaseStatus { get; set; } = string.Empty;

        public DateTime ServerTimeUtc { get; set; }

        public string ApplicationVersion { get; set; } = string.Empty;

        public string Environment { get; set; } = string.Empty;

        public long UptimeSeconds { get; set; }

        public double UptimeHours { get; set; }

        public int TotalUsers { get; set; }

        public int ActiveUsers { get; set; }

        public int InactiveUsers { get; set; }

        public int TotalCandidates { get; set; }

        public int TotalRecruiters { get; set; }

        public int TotalHiringManagers { get; set; }

        public int TotalAdmins { get; set; }

        public int TotalJobs { get; set; }

        public int ActiveJobs { get; set; }

        public int TotalApplications { get; set; }

        public int TotalInterviews { get; set; }

        public int TotalOrganizations { get; set; }

        public int TotalDepartments { get; set; }

        public int AuditEventsLast24Hours { get; set; }

        public int FailedEventsLast24Hours { get; set; }

        public DateTime GeneratedAtUtc { get; set; }
    }
}