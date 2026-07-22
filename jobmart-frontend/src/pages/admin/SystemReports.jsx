import {
  useEffect,
  useMemo,
  useState,
} from "react";

import axiosInstance from "../../api/axiosInstance";
import "./SystemReports.css";

function SystemReports() {
  const [users, setUsers] = useState([]);

  const [
    pendingRecruiters,
    setPendingRecruiters,
  ] = useState([]);

  const [
    monthlyTrend,
    setMonthlyTrend,
  ] = useState([]);

  const [
    jobStatusData,
    setJobStatusData,
  ] = useState([]);

  const [
    recruitmentPerformance,
    setRecruitmentPerformance,
  ] = useState(null);

  const [
    recruiterPerformance,
    setRecruiterPerformance,
  ] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [isError, setIsError] =
    useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async (
    isRefresh = false
  ) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setMessage("");
    setIsError(false);

    try {
      const [
        usersResponse,
        pendingResponse,
        monthlyTrendResponse,
        jobStatusResponse,
        recruitmentResponse,
        recruiterResponse,
      ] = await Promise.all([
        axiosInstance.get(
          "/AdminUsers"
        ),

        axiosInstance.get(
          "/AdminUsers/pending-recruiters"
        ),

        axiosInstance.get(
          "/Dashboard/monthly-recruitment-trend?months=6"
        ),

        axiosInstance.get(
          "/Dashboard/job-status"
        ),

        axiosInstance.get(
          "/Dashboard/recruitment-performance"
        ),

        axiosInstance.get(
          "/Dashboard/recruiter-performance?limit=10"
        ),
      ]);

      const userData =
        usersResponse.data?.users ??
        usersResponse.data ??
        [];

      const pendingData =
        pendingResponse.data?.recruiters ??
        pendingResponse.data ??
        [];

      setUsers(
        Array.isArray(userData)
          ? userData
          : []
      );

      setPendingRecruiters(
        Array.isArray(pendingData)
          ? pendingData
          : []
      );

      setMonthlyTrend(
        monthlyTrendResponse.data?.trend ??
          []
      );

      setJobStatusData(
        jobStatusResponse.data
          ?.statistics ?? []
      );

      setRecruitmentPerformance(
        recruitmentResponse.data ?? null
      );

      setRecruiterPerformance(
        recruiterResponse.data
          ?.recruiters ?? []
      );

      if (isRefresh) {
        setMessage(
          "System reports refreshed successfully."
        );
      }
    } catch (error) {
      console.error(
        "System reports loading error:",
        error
      );

      setIsError(true);

      setMessage(
        error.response?.data?.message ??
          "Unable to load system reports."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const userReport = useMemo(() => {
    const total = users.length;

    const active = users.filter(
      (user) => user.isActive
    ).length;

    const inactive = users.filter(
      (user) => !user.isActive
    ).length;

    const countRole = (role) =>
      users.filter(
        (user) => user.role === role
      ).length;

    const activePercentage =
      total === 0
        ? 0
        : Math.round(
            (active / total) * 100
          );

    return {
      total,
      active,
      inactive,
      activePercentage,

      candidates:
        countRole("Candidate"),

      recruiters:
        countRole("Recruiter"),

      hiringManagers:
        countRole("HiringManager"),

      administrators:
        countRole("Admin"),

      pendingRecruiters:
        pendingRecruiters.length,
    };
  }, [users, pendingRecruiters]);

  const roleReports = useMemo(
    () => [
      {
        role: "Candidates",
        count: userReport.candidates,
      },
      {
        role: "Recruiters",
        count: userReport.recruiters,
      },
      {
        role: "Hiring Managers",
        count:
          userReport.hiringManagers,
      },
      {
        role: "Administrators",
        count:
          userReport.administrators,
      },
    ],
    [userReport]
  );

  const recentUsers = useMemo(() => {
    return [...users]
      .sort(
        (
          firstUser,
          secondUser
        ) =>
          new Date(
            secondUser.createdAt
          ).getTime() -
          new Date(
            firstUser.createdAt
          ).getTime()
      )
      .slice(0, 8);
  }, [users]);

  const maximumTrendApplications =
    useMemo(() => {
      if (monthlyTrend.length === 0) {
        return 1;
      }

      return Math.max(
        ...monthlyTrend.map(
          (item) =>
            Number(
              item.applications ?? 0
            )
        ),
        1
      );
    }, [monthlyTrend]);

  const maximumJobStatusCount =
    useMemo(() => {
      if (
        jobStatusData.length === 0
      ) {
        return 1;
      }

      return Math.max(
        ...jobStatusData.map(
          (item) =>
            Number(item.count ?? 0)
        ),
        1
      );
    }, [jobStatusData]);

  const maximumRecruiterApplications =
    useMemo(() => {
      if (
        recruiterPerformance.length ===
        0
      ) {
        return 1;
      }

      return Math.max(
        ...recruiterPerformance.map(
          (recruiter) =>
            Number(
              recruiter.totalApplications ??
                0
            )
        ),
        1
      );
    }, [recruiterPerformance]);

  const formatRole = (role) => {
    if (role === "HiringManager") {
      return "Hiring Manager";
    }

    return role || "Unknown";
  };

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "Not available";
    }

    const date =
      new Date(dateValue);

    if (
      Number.isNaN(date.getTime())
    ) {
      return "Not available";
    }

    return date.toLocaleDateString(
      "en-LK",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    );
  };

  const formatDateTime = (
    dateValue
  ) => {
    if (!dateValue) {
      return "Not available";
    }

    const date =
      new Date(dateValue);

    if (
      Number.isNaN(date.getTime())
    ) {
      return "Not available";
    }

    return date.toLocaleString(
      "en-LK",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  const getPercentage = (count) => {
    if (userReport.total === 0) {
      return 0;
    }

    return Math.round(
      (count / userReport.total) *
        100
    );
  };

  const formatPercentage = (
    value
  ) => {
    const numberValue =
      Number(value ?? 0);

    if (
      Number.isInteger(numberValue)
    ) {
      return numberValue;
    }

    return numberValue.toFixed(1);
  };

  const getStatusClass = (
    status
  ) => {
    return (
      status
        ?.toLowerCase()
        .replaceAll(" ", "-") ??
      "unknown"
    );
  };

  const printReport = () => {
    window.print();
  };

  const performanceRates =
    recruitmentPerformance?.rates ??
    {};

  const performanceTotals =
    recruitmentPerformance?.totals ??
    {};

  const performanceScores =
    recruitmentPerformance?.scores ??
    {};

  if (loading) {
    return (
      <section className="system-reports-state">
        <h2>
          Loading system reports...
        </h2>

        <p>
          Please wait while account and
          recruitment information is
          prepared.
        </p>
      </section>
    );
  }

  return (
    <div className="system-reports-page">
      <section className="system-reports-heading">
        <div>
          <span>
            System Intelligence
          </span>

          <h2>System Reports</h2>

          <p>
            Review account activity,
            recruitment performance,
            hiring trends and recruiter
            productivity across
            JobMart.
          </p>
        </div>

        <div className="system-reports-heading-actions">
          <button
            type="button"
            onClick={() =>
              loadReports(true)
            }
            disabled={refreshing}
          >
            {refreshing
              ? "Refreshing..."
              : "Refresh Reports"}
          </button>

          <button
            type="button"
            onClick={printReport}
          >
            Print Report
          </button>
        </div>
      </section>

      {message && (
        <div
          className={
            isError
              ? "system-reports-message error"
              : "system-reports-message success"
          }
        >
          {message}
        </div>
      )}

      <section className="system-reports-summary">
        <article>
          <span>Total Users</span>

          <strong>
            {userReport.total}
          </strong>

          <small>
            All registered accounts
          </small>
        </article>

        <article>
          <span>
            Total Applications
          </span>

          <strong>
            {performanceTotals
              .applications ?? 0}
          </strong>

          <small>
            Applications submitted
            across all jobs
          </small>
        </article>

        <article>
          <span>
            Selected Candidates
          </span>

          <strong>
            {performanceTotals.selected ??
              0}
          </strong>

          <small>
            Final successful
            applications
          </small>
        </article>

        <article>
          <span>
            Average AI Score
          </span>

          <strong>
            {formatPercentage(
              performanceScores
                .averageAIScore
            )}
            %
          </strong>

          <small>
            Average candidate-job
            matching score
          </small>
        </article>
      </section>

      <section className="system-performance-rate-grid">
        <article>
          <div>
            <span>
              Shortlist Rate
            </span>

            <strong>
              {formatPercentage(
                performanceRates
                  .shortlistRate
              )}
              %
            </strong>
          </div>

          <div className="system-performance-track">
            <span
              style={{
                width: `${Math.min(
                  Number(
                    performanceRates
                      .shortlistRate ??
                      0
                  ),
                  100
                )}%`,
              }}
            />
          </div>
        </article>

        <article>
          <div>
            <span>
              Selection Rate
            </span>

            <strong>
              {formatPercentage(
                performanceRates
                  .selectionRate
              )}
              %
            </strong>
          </div>

          <div className="system-performance-track">
            <span
              style={{
                width: `${Math.min(
                  Number(
                    performanceRates
                      .selectionRate ??
                      0
                  ),
                  100
                )}%`,
              }}
            />
          </div>
        </article>

        <article className="danger">
          <div>
            <span>
              Rejection Rate
            </span>

            <strong>
              {formatPercentage(
                performanceRates
                  .rejectionRate
              )}
              %
            </strong>
          </div>

          <div className="system-performance-track">
            <span
              style={{
                width: `${Math.min(
                  Number(
                    performanceRates
                      .rejectionRate ??
                      0
                  ),
                  100
                )}%`,
              }}
            />
          </div>
        </article>

        <article>
          <div>
            <span>
              Interview Completion
            </span>

            <strong>
              {formatPercentage(
                performanceRates
                  .interviewCompletionRate
              )}
              %
            </strong>
          </div>

          <div className="system-performance-track">
            <span
              style={{
                width: `${Math.min(
                  Number(
                    performanceRates
                      .interviewCompletionRate ??
                      0
                  ),
                  100
                )}%`,
              }}
            />
          </div>
        </article>
      </section>

      <section className="system-report-card system-monthly-trend-card">
        <div className="system-report-card-heading">
          <div>
            <h3>
              Monthly Recruitment Trend
            </h3>

            <p>
              Applications, selections
              and rejections during the
              last six months.
            </p>
          </div>

          <span>
            Last 6 months
          </span>
        </div>

        {monthlyTrend.length === 0 ? (
          <div className="system-reports-empty">
            No monthly recruitment data
            is available.
          </div>
        ) : (
          <>
            <div className="system-monthly-trend-chart">
              {monthlyTrend.map(
                (trendItem) => {
                  const applicationHeight =
                    Math.max(
                      Math.round(
                        ((trendItem.applications ??
                          0) /
                          maximumTrendApplications) *
                          100
                      ),
                      trendItem.applications >
                        0
                        ? 8
                        : 0
                    );

                  const selectedHeight =
                    Math.max(
                      Math.round(
                        ((trendItem.selected ??
                          0) /
                          maximumTrendApplications) *
                          100
                      ),
                      trendItem.selected > 0
                        ? 8
                        : 0
                    );

                  const rejectedHeight =
                    Math.max(
                      Math.round(
                        ((trendItem.rejected ??
                          0) /
                          maximumTrendApplications) *
                          100
                      ),
                      trendItem.rejected > 0
                        ? 8
                        : 0
                    );

                  return (
                    <article
                      key={`${trendItem.year}-${trendItem.month}`}
                    >
                      <div className="system-monthly-bars">
                        <div
                          className="system-monthly-bar applications"
                          style={{
                            height: `${applicationHeight}%`,
                          }}
                        >
                          <span>
                            {
                              trendItem.applications
                            }
                          </span>
                        </div>

                        <div
                          className="system-monthly-bar selected"
                          style={{
                            height: `${selectedHeight}%`,
                          }}
                        >
                          <span>
                            {
                              trendItem.selected
                            }
                          </span>
                        </div>

                        <div
                          className="system-monthly-bar rejected"
                          style={{
                            height: `${rejectedHeight}%`,
                          }}
                        >
                          <span>
                            {
                              trendItem.rejected
                            }
                          </span>
                        </div>
                      </div>

                      <strong>
                        {trendItem.monthName}
                      </strong>

                      <small>
                        Selection{" "}
                        {formatPercentage(
                          trendItem.selectionRate
                        )}
                        %
                      </small>
                    </article>
                  );
                }
              )}
            </div>

            <div className="system-monthly-legend">
              <span>
                <i className="applications" />
                Applications
              </span>

              <span>
                <i className="selected" />
                Selected
              </span>

              <span>
                <i className="rejected" />
                Rejected
              </span>
            </div>
          </>
        )}
      </section>

      <section className="system-reports-grid">
        <article className="system-report-card">
          <div className="system-report-card-heading">
            <div>
              <h3>
                Recruitment Outcomes
              </h3>

              <p>
                Total results recorded
                across the complete
                recruitment workflow.
              </p>
            </div>
          </div>

          <div className="system-outcome-grid">
            <article>
              <span>
                Shortlisted
              </span>

              <strong>
                {performanceTotals
                  .shortlisted ?? 0}
              </strong>
            </article>

            <article>
              <span>Selected</span>

              <strong>
                {performanceTotals
                  .selected ?? 0}
              </strong>
            </article>

            <article>
              <span>Rejected</span>

              <strong>
                {performanceTotals
                  .rejected ?? 0}
              </strong>
            </article>

            <article>
              <span>
                Completed Interviews
              </span>

              <strong>
                {performanceTotals
                  .completedInterviews ??
                  0}
              </strong>
            </article>

            <article>
              <span>
                Cancelled Interviews
              </span>

              <strong>
                {performanceTotals
                  .cancelledInterviews ??
                  0}
              </strong>
            </article>

            <article>
              <span>Evaluations</span>

              <strong>
                {performanceTotals
                  .evaluations ?? 0}
              </strong>
            </article>
          </div>
        </article>

        <article className="system-report-card">
          <div className="system-report-card-heading">
            <div>
              <h3>
                Job Status Distribution
              </h3>

              <p>
                Current open, closed,
                expired and draft job
                postings.
              </p>
            </div>
          </div>

          {jobStatusData.length ===
          0 ? (
            <div className="system-reports-empty">
              No job status data is
              available.
            </div>
          ) : (
            <div className="system-job-status-list">
              {jobStatusData.map(
                (item) => {
                  const width =
                    Math.round(
                      ((item.count ?? 0) /
                        maximumJobStatusCount) *
                        100
                    );

                  return (
                    <article
                      key={item.status}
                    >
                      <div>
                        <span
                          className={`system-job-status-dot ${getStatusClass(
                            item.status
                          )}`}
                        />

                        <strong>
                          {item.status}
                        </strong>

                        <small>
                          {item.count} job
                          {item.count === 1
                            ? ""
                            : "s"}
                        </small>
                      </div>

                      <div className="system-job-status-track">
                        <span
                          className={getStatusClass(
                            item.status
                          )}
                          style={{
                            width: `${width}%`,
                          }}
                        />
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          )}
        </article>
      </section>

      <section className="system-report-card system-recruiter-performance-card">
        <div className="system-report-card-heading">
          <div>
            <h3>
              Recruiter Performance
            </h3>

            <p>
              Recruiter productivity
              ranked by hiring outcomes,
              application volume and AI
              scores.
            </p>
          </div>

          <span>
            {
              recruiterPerformance.length
            }{" "}
            recruiter
            {recruiterPerformance.length ===
            1
              ? ""
              : "s"}
          </span>
        </div>

        {recruiterPerformance.length ===
        0 ? (
          <div className="system-reports-empty">
            No recruiter performance
            information is available.
          </div>
        ) : (
          <div className="system-recruiter-performance-list">
            {recruiterPerformance.map(
              (
                recruiter,
                index
              ) => {
                const width =
                  Math.round(
                    ((recruiter.totalApplications ??
                      0) /
                      maximumRecruiterApplications) *
                      100
                  );

                return (
                  <article
                    key={
                      recruiter.recruiterId
                    }
                  >
                    <div className="system-recruiter-rank">
                      {index + 1}
                    </div>

                    <div className="system-recruiter-information">
                      <div className="system-recruiter-heading">
                        <div>
                          <strong>
                            {
                              recruiter.recruiterName
                            }
                          </strong>

                          <span>
                            {
                              recruiter.recruiterEmail
                            }
                          </span>
                        </div>

                        <span
                          className={
                            recruiter.isActive
                              ? "system-report-status active"
                              : "system-report-status inactive"
                          }
                        >
                          {recruiter.isActive
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </div>

                      <div className="system-recruiter-statistics">
                        <span>
                          {
                            recruiter.totalJobs
                          }{" "}
                          jobs
                        </span>

                        <span>
                          {
                            recruiter.activeJobs
                          }{" "}
                          active
                        </span>

                        <span>
                          {
                            recruiter.totalApplications
                          }{" "}
                          applications
                        </span>

                        <span>
                          {
                            recruiter.shortlisted
                          }{" "}
                          shortlisted
                        </span>

                        <span>
                          {
                            recruiter.selected
                          }{" "}
                          selected
                        </span>

                        <span>
                          AI{" "}
                          {formatPercentage(
                            recruiter.averageAIScore
                          )}
                          %
                        </span>

                        <span>
                          Selection{" "}
                          {formatPercentage(
                            recruiter.selectionRate
                          )}
                          %
                        </span>
                      </div>

                      <div className="system-recruiter-progress">
                        <span
                          style={{
                            width: `${width}%`,
                          }}
                        />
                      </div>
                    </div>
                  </article>
                );
              }
            )}
          </div>
        )}
      </section>

      <section className="system-reports-grid">
        <article className="system-report-card">
          <div className="system-report-card-heading">
            <div>
              <h3>
                User Distribution by
                Role
              </h3>

              <p>
                Percentage of registered
                accounts belonging to
                each role.
              </p>
            </div>
          </div>

          <div className="system-role-report-list">
            {roleReports.map(
              (roleReport) => {
                const percentage =
                  getPercentage(
                    roleReport.count
                  );

                return (
                  <article
                    key={
                      roleReport.role
                    }
                    className="system-role-report"
                  >
                    <div className="system-role-report-heading">
                      <div>
                        <strong>
                          {
                            roleReport.role
                          }
                        </strong>

                        <span>
                          {
                            roleReport.count
                          }{" "}
                          account
                          {roleReport.count ===
                          1
                            ? ""
                            : "s"}
                        </span>
                      </div>

                      <strong>
                        {percentage}%
                      </strong>
                    </div>

                    <div className="system-role-progress">
                      <span
                        style={{
                          width: `${percentage}%`,
                        }}
                      />
                    </div>
                  </article>
                );
              }
            )}
          </div>
        </article>

        <article className="system-report-card">
          <div className="system-report-card-heading">
            <div>
              <h3>
                Account Status Report
              </h3>

              <p>
                Comparison between
                active, inactive and
                pending accounts.
              </p>
            </div>
          </div>

          <div className="system-status-report">
            <article>
              <div className="system-status-circle active">
                {userReport.active}
              </div>

              <div>
                <strong>
                  Active Accounts
                </strong>

                <p>
                  Users who can
                  currently sign in to
                  JobMart.
                </p>
              </div>
            </article>

            <article>
              <div className="system-status-circle inactive">
                {userReport.inactive}
              </div>

              <div>
                <strong>
                  Inactive Accounts
                </strong>

                <p>
                  Users whose login
                  access is currently
                  blocked.
                </p>
              </div>
            </article>

            <article>
              <div className="system-status-circle pending">
                {
                  userReport.pendingRecruiters
                }
              </div>

              <div>
                <strong>
                  Pending Approvals
                </strong>

                <p>
                  Recruiters waiting for
                  Admin approval.
                </p>
              </div>
            </article>
          </div>
        </article>
      </section>

      <section className="system-report-card system-recent-users-card">
        <div className="system-report-card-heading">
          <div>
            <h3>
              Recent User Registrations
            </h3>

            <p>
              The most recently created
              JobMart accounts.
            </p>
          </div>

          <span>
            Showing{" "}
            {recentUsers.length} users
          </span>
        </div>

        {recentUsers.length === 0 ? (
          <div className="system-reports-empty">
            No user registrations are
            available.
          </div>
        ) : (
          <div className="system-reports-table-wrapper">
            <table className="system-reports-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>
                    Registered Date
                  </th>
                </tr>
              </thead>

              <tbody>
                {recentUsers.map(
                  (user) => (
                    <tr
                      key={user.userId}
                    >
                      <td>
                        <div className="system-report-user">
                          <div className="system-report-avatar">
                            {user.fullName
                              ?.charAt(0)
                              .toUpperCase() ??
                              "U"}
                          </div>

                          <div>
                            <strong>
                              {user.fullName ??
                                "Unknown User"}
                            </strong>

                            <span>
                              {user.email ??
                                "No email available"}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        {formatRole(
                          user.role
                        )}
                      </td>

                      <td>
                        <span
                          className={
                            user.isActive
                              ? "system-report-status active"
                              : "system-report-status inactive"
                          }
                        >
                          {user.isActive
                            ? "Active"
                            : "Inactive"}
                        </span>
                      </td>

                      <td>
                        {formatDate(
                          user.createdAt
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="system-report-generated-time">
        Recruitment report generated:{" "}
        {formatDateTime(
          recruitmentPerformance
            ?.generatedAt
        )}
      </p>
    </div>
  );
}

export default SystemReports;