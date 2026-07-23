import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Database,
  FileText,
  Gauge,
  RefreshCw,
  Server,
  ShieldAlert,
  TriangleAlert,
  Users,
} from "lucide-react";

import "./SystemMonitoring.css";

const API_BASE_URL =
  "https://localhost:7078/api/SystemMonitoring";

function SystemMonitoring() {
  const [summary, setSummary] = useState(null);
  const [health, setHealth] = useState(null);
  const [recentErrors, setRecentErrors] = useState([]);
  const [totalErrors, setTotalErrors] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const getAuthorizationHeaders = () => {
    const token = localStorage.getItem("jobmartToken");

    return {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  const readJsonResponse = async (response) => {
    const responseText = await response.text();

    if (!responseText) {
      return null;
    }

    try {
      return JSON.parse(responseText);
    } catch {
      return null;
    }
  };

  const loadMonitoringData = useCallback(
    async (showRefreshState = false) => {
      if (showRefreshState) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      setErrorMessage("");

      try {
        const headers = getAuthorizationHeaders();

        const [
          summaryResponse,
          healthResponse,
          errorsResponse,
        ] = await Promise.all([
          fetch(`${API_BASE_URL}/summary`, {
            method: "GET",
            headers,
          }),

          fetch(`${API_BASE_URL}/api-health`, {
            method: "GET",
            headers,
          }),

          fetch(
            `${API_BASE_URL}/recent-errors?limit=20`,
            {
              method: "GET",
              headers,
            }
          ),
        ]);

        const summaryData =
          await readJsonResponse(summaryResponse);

        const healthData =
          await readJsonResponse(healthResponse);

        const errorsData =
          await readJsonResponse(errorsResponse);

        if (
          summaryResponse.status === 401 ||
          healthResponse.status === 401 ||
          errorsResponse.status === 401
        ) {
          throw new Error(
            "Your login session has expired. Please log in again."
          );
        }

        if (
          summaryResponse.status === 403 ||
          healthResponse.status === 403 ||
          errorsResponse.status === 403
        ) {
          throw new Error(
            "You do not have permission to view system monitoring information."
          );
        }

        if (!summaryResponse.ok) {
          throw new Error(
            summaryData?.message ||
              "Unable to load the system monitoring summary."
          );
        }

        if (
          !healthResponse.ok &&
          healthResponse.status !== 503
        ) {
          throw new Error(
            healthData?.message ||
              "Unable to load the system health status."
          );
        }

        if (!errorsResponse.ok) {
          throw new Error(
            errorsData?.message ||
              "Unable to load recent system errors."
          );
        }

        setSummary(summaryData);
        setHealth(healthData);

        setRecentErrors(
          Array.isArray(errorsData?.errors)
            ? errorsData.errors
            : []
        );

        setTotalErrors(
          Number(errorsData?.totalErrors ?? 0)
        );
      } catch (error) {
        console.error(
          "System monitoring load error:",
          error
        );

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load system monitoring information."
        );
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadMonitoringData();
  }, [loadMonitoringData]);

  const formatDateTime = (dateValue) => {
    if (!dateValue) {
      return "Not available";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "Not available";
    }

    return date.toLocaleString();
  };

  const formatUptime = (totalSeconds) => {
    const seconds = Number(totalSeconds ?? 0);

    if (seconds <= 0) {
      return "0 minutes";
    }

    const days = Math.floor(
      seconds / (24 * 60 * 60)
    );

    const hours = Math.floor(
      (seconds % (24 * 60 * 60)) /
        (60 * 60)
    );

    const minutes = Math.floor(
      (seconds % (60 * 60)) / 60
    );

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    }

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }

    return `${minutes} minute${
      minutes === 1 ? "" : "s"
    }`;
  };

  const getHealthClass = (status) => {
    const normalizedStatus =
      status?.toLowerCase() ?? "";

    if (
      normalizedStatus === "healthy" ||
      normalizedStatus === "online" ||
      normalizedStatus === "connected"
    ) {
      return "healthy";
    }

    if (
      normalizedStatus === "degraded" ||
      normalizedStatus === "warning"
    ) {
      return "warning";
    }

    return "danger";
  };

  const getErrorActionClass = (action) => {
    const normalizedAction =
      action?.toLowerCase() ?? "";

    if (normalizedAction.includes("blocked")) {
      return "blocked";
    }

    if (normalizedAction.includes("error")) {
      return "error";
    }

    return "failed";
  };

  if (isLoading) {
    return (
      <div className="system-monitoring-loading">
        <RefreshCw
          size={28}
          className="system-monitoring-spinner"
        />

        <h2>Loading system monitoring</h2>

        <p>
          Checking API, database and audit activity.
        </p>
      </div>
    );
  }

  return (
    <div className="system-monitoring-page">
      <section className="system-monitoring-hero">
        <div>
          <span className="system-monitoring-eyebrow">
            SYSTEM HEALTH AND ACTIVITY
          </span>

          <h1>System Monitoring</h1>

          <p>
            Monitor JobMart API health, database
            connectivity, platform usage and recent
            system errors.
          </p>
        </div>

        <button
          type="button"
          className="system-monitoring-refresh-button"
          onClick={() =>
            loadMonitoringData(true)
          }
          disabled={isRefreshing}
        >
          <RefreshCw
            size={17}
            className={
              isRefreshing
                ? "system-monitoring-spinner"
                : ""
            }
          />

          {isRefreshing
            ? "Refreshing..."
            : "Refresh Monitoring"}
        </button>
      </section>

      {errorMessage && (
        <div
          className="system-monitoring-error-message"
          role="alert"
        >
          <TriangleAlert size={20} />

          <div>
            <strong>
              Monitoring data could not be loaded
            </strong>

            <span>{errorMessage}</span>
          </div>

          <button
            type="button"
            onClick={() =>
              loadMonitoringData(true)
            }
          >
            Try Again
          </button>
        </div>
      )}

      {summary && health && (
        <>
          <section className="system-health-grid">
            <article className="system-health-card">
              <div className="system-health-card-icon">
                <Server size={22} />
              </div>

              <div>
                <span>API Status</span>

                <strong>
                  {health.apiStatus ||
                    summary.apiStatus}
                </strong>

                <small>
                  JobMart backend service
                </small>
              </div>

              <span
                className={`system-status-badge ${getHealthClass(
                  health.apiStatus ||
                    summary.apiStatus
                )}`}
              >
                <span />
                {health.apiStatus ||
                  summary.apiStatus}
              </span>
            </article>

            <article className="system-health-card">
              <div className="system-health-card-icon">
                <Database size={22} />
              </div>

              <div>
                <span>Database</span>

                <strong>
                  {health.databaseStatus ||
                    summary.databaseStatus}
                </strong>

                <small>SQL Server connection</small>
              </div>

              <span
                className={`system-status-badge ${getHealthClass(
                  health.databaseStatus ||
                    summary.databaseStatus
                )}`}
              >
                <span />
                {health.databaseStatus ||
                  summary.databaseStatus}
              </span>
            </article>

            <article className="system-health-card">
              <div className="system-health-card-icon">
                <Activity size={22} />
              </div>

              <div>
                <span>Overall Health</span>

                <strong>{health.status}</strong>

                <small>
                  Last checked{" "}
                  {formatDateTime(
                    health.checkedAtUtc
                  )}
                </small>
              </div>

              <span
                className={`system-status-badge ${getHealthClass(
                  health.status
                )}`}
              >
                <span />
                {health.status}
              </span>
            </article>

            <article className="system-health-card">
              <div className="system-health-card-icon">
                <Gauge size={22} />
              </div>

              <div>
                <span>Response Time</span>

                <strong>
                  {health.responseTimeMilliseconds} ms
                </strong>

                <small>Database health request</small>
              </div>

              <span
                className={`system-status-badge ${
                  Number(
                    health.responseTimeMilliseconds
                  ) < 500
                    ? "healthy"
                    : "warning"
                }`}
              >
                <span />

                {Number(
                  health.responseTimeMilliseconds
                ) < 500
                  ? "Normal"
                  : "Slow"}
              </span>
            </article>
          </section>

          <section className="system-monitoring-section">
            <div className="system-monitoring-section-heading">
              <div>
                <h2>Platform Overview</h2>

                <p>
                  Current JobMart usage and account
                  statistics.
                </p>
              </div>

              <span className="system-monitoring-generated-time">
                Generated{" "}
                {formatDateTime(
                  summary.generatedAtUtc
                )}
              </span>
            </div>

            <div className="system-stat-grid">
              <article className="system-stat-card">
                <div className="system-stat-icon">
                  <Users size={20} />
                </div>

                <span>Total Users</span>

                <strong>
                  {summary.totalUsers}
                </strong>

                <small>
                  {summary.activeUsers} active,{" "}
                  {summary.inactiveUsers} inactive
                </small>
              </article>

              <article className="system-stat-card">
                <div className="system-stat-icon">
                  <BriefcaseBusiness size={20} />
                </div>

                <span>Total Jobs</span>

                <strong>
                  {summary.totalJobs}
                </strong>

                <small>
                  {summary.activeJobs} active jobs
                </small>
              </article>

              <article className="system-stat-card">
                <div className="system-stat-icon">
                  <FileText size={20} />
                </div>

                <span>Applications</span>

                <strong>
                  {summary.totalApplications}
                </strong>

                <small>
                  Submitted job applications
                </small>
              </article>

              <article className="system-stat-card">
                <div className="system-stat-icon">
                  <CalendarDays size={20} />
                </div>

                <span>Interviews</span>

                <strong>
                  {summary.totalInterviews}
                </strong>

                <small>
                  Scheduled interview records
                </small>
              </article>

              <article className="system-stat-card">
                <div className="system-stat-icon">
                  <Building2 size={20} />
                </div>

                <span>Organizations</span>

                <strong>
                  {summary.totalOrganizations}
                </strong>

                <small>
                  {summary.totalDepartments}{" "}
                  departments
                </small>
              </article>

              <article className="system-stat-card">
                <div className="system-stat-icon">
                  <Activity size={20} />
                </div>

                <span>Audit Activity</span>

                <strong>
                  {
                    summary.auditEventsLast24Hours
                  }
                </strong>

                <small>
                  Events recorded in 24 hours
                </small>
              </article>

              <article className="system-stat-card">
                <div className="system-stat-icon">
                  <ShieldAlert size={20} />
                </div>

                <span>Failed Events</span>

                <strong>
                  {
                    summary.failedEventsLast24Hours
                  }
                </strong>

                <small>
                  Failed, blocked or error events
                </small>
              </article>

              <article className="system-stat-card">
                <div className="system-stat-icon">
                  <Clock3 size={20} />
                </div>

                <span>System Uptime</span>

                <strong className="system-stat-uptime">
                  {formatUptime(
                    summary.uptimeSeconds
                  )}
                </strong>

                <small>
                  Since the API was started
                </small>
              </article>
            </div>
          </section>

          <section className="system-monitoring-details-grid">
            <article className="system-monitoring-panel">
              <div className="system-monitoring-panel-heading">
                <div>
                  <h2>User Distribution</h2>

                  <p>
                    Accounts registered by system role.
                  </p>
                </div>

                <Users size={21} />
              </div>

              <div className="system-role-list">
                <div>
                  <span>Candidates</span>
                  <strong>
                    {summary.totalCandidates}
                  </strong>
                </div>

                <div>
                  <span>Recruiters</span>
                  <strong>
                    {summary.totalRecruiters}
                  </strong>
                </div>

                <div>
                  <span>Hiring Managers</span>
                  <strong>
                    {
                      summary.totalHiringManagers
                    }
                  </strong>
                </div>

                <div>
                  <span>Administrators</span>
                  <strong>
                    {summary.totalAdmins}
                  </strong>
                </div>
              </div>
            </article>

            <article className="system-monitoring-panel">
              <div className="system-monitoring-panel-heading">
                <div>
                  <h2>Runtime Information</h2>

                  <p>
                    Current application environment.
                  </p>
                </div>

                <Server size={21} />
              </div>

              <div className="system-runtime-list">
                <div>
                  <span>Environment</span>
                  <strong>
                    {summary.environment}
                  </strong>
                </div>

                <div>
                  <span>Application Version</span>
                  <strong>
                    {
                      summary.applicationVersion
                    }
                  </strong>
                </div>

                <div>
                  <span>Server Time</span>
                  <strong>
                    {formatDateTime(
                      summary.serverTimeUtc
                    )}
                  </strong>
                </div>

                <div>
                  <span>Uptime Hours</span>
                  <strong>
                    {summary.uptimeHours}
                  </strong>
                </div>
              </div>
            </article>
          </section>
        </>
      )}

      <section className="system-monitoring-section">
        <div className="system-monitoring-section-heading">
          <div>
            <h2>Recent System Errors</h2>

            <p>
              Failed, blocked and error events recorded
              in the audit log.
            </p>
          </div>

          <span className="system-error-count">
            {totalErrors} event
            {totalErrors === 1 ? "" : "s"}
          </span>
        </div>

        {recentErrors.length === 0 ? (
          <div className="system-monitoring-empty-state">
            <CheckCircle2 size={38} />

            <h3>No recent system errors</h3>

            <p>
              No failed, blocked or error audit events
              were found.
            </p>
          </div>
        ) : (
          <div className="system-error-table-wrapper">
            <table className="system-error-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>User</th>
                  <th>Entity</th>
                  <th>Details</th>
                  <th>IP Address</th>
                  <th>Recorded At</th>
                </tr>
              </thead>

              <tbody>
                {recentErrors.map((error) => (
                  <tr key={error.auditLogId}>
                    <td>
                      <span
                        className={`system-error-action ${getErrorActionClass(
                          error.action
                        )}`}
                      >
                        {error.action}
                      </span>
                    </td>

                    <td>
                      <div className="system-error-user">
                        <strong>
                          {error.userName ||
                            "Unknown User"}
                        </strong>

                        <span>
                          User ID:{" "}
                          {error.userId ?? "N/A"}
                        </span>
                      </div>
                    </td>

                    <td>
                      {error.entityType ||
                        "System"}
                    </td>

                    <td>
                      <span className="system-error-details">
                        {error.details ||
                          "No additional details"}
                      </span>
                    </td>

                    <td>
                      {error.ipAddress || "N/A"}
                    </td>

                    <td>
                      {formatDateTime(
                        error.createdAt
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default SystemMonitoring;