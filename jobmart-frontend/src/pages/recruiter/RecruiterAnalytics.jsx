import {
  useEffect,
  useMemo,
  useState,
} from "react";

import axiosInstance from "../../api/axiosInstance.js";
import "./RecruiterAnalytics.css";

function RecruiterAnalytics() {
  const [summary, setSummary] = useState(null);

  const [statusData, setStatusData] =
    useState([]);

  const [topJobs, setTopJobs] =
    useState([]);

  const [
    recentApplications,
    setRecentApplications,
  ] = useState([]);

  const [
    upcomingInterviews,
    setUpcomingInterviews,
  ] = useState([]);

  const [
    topCandidates,
    setTopCandidates,
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

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [isError, setIsError] =
    useState(false);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async (
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
        summaryResponse,
        statusResponse,
        topJobsResponse,
        applicationsResponse,
        interviewsResponse,
        candidatesResponse,
        monthlyTrendResponse,
        jobStatusResponse,
        performanceResponse,
      ] = await Promise.all([
        axiosInstance.get(
          "/Dashboard/summary"
        ),

        axiosInstance.get(
          "/Dashboard/application-status"
        ),

        axiosInstance.get(
          "/Dashboard/top-jobs?limit=10"
        ),

        axiosInstance.get(
          "/Dashboard/recent-applications?limit=8"
        ),

        axiosInstance.get(
          "/Dashboard/upcoming-interviews?limit=8"
        ),

        axiosInstance.get(
          "/Dashboard/top-candidates?limit=8"
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
      ]);

      setSummary(
        summaryResponse.data ?? null
      );

      setStatusData(
        statusResponse.data?.statistics ??
          []
      );

      setTopJobs(
        topJobsResponse.data?.jobs ?? []
      );

      setRecentApplications(
        applicationsResponse.data
          ?.applications ?? []
      );

      setUpcomingInterviews(
        interviewsResponse.data
          ?.interviews ?? []
      );

      setTopCandidates(
        candidatesResponse.data
          ?.candidates ?? []
      );

      setMonthlyTrend(
        monthlyTrendResponse.data?.trend ??
          []
      );

      setJobStatusData(
        jobStatusResponse.data?.statistics ??
          []
      );

      setRecruitmentPerformance(
        performanceResponse.data ?? null
      );

      if (isRefresh) {
        setMessage(
          "Analytics refreshed successfully."
        );
      }
    } catch (error) {
      console.error(
        "Recruiter analytics loading error:",
        error
      );

      setIsError(true);

      setMessage(
        error.response?.data?.message ??
          "Unable to load recruiter analytics."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const normalizedStatusData =
    useMemo(() => {
      const groupedStatuses = {};

      statusData.forEach((item) => {
        let normalizedStatus =
          item.status;

        if (
          normalizedStatus ===
            "UnderReview" ||
          normalizedStatus ===
            "Under Review"
        ) {
          normalizedStatus =
            "Under Review";
        }

        if (
          normalizedStatus ===
          "InterviewScheduled"
        ) {
          normalizedStatus =
            "Interview Scheduled";
        }

        if (
          normalizedStatus ===
          "InterviewCompleted"
        ) {
          normalizedStatus =
            "Interview Completed";
        }

        if (
          normalizedStatus === "Hired"
        ) {
          normalizedStatus =
            "Selected";
        }

        groupedStatuses[
          normalizedStatus
        ] =
          (groupedStatuses[
            normalizedStatus
          ] ?? 0) +
          Number(item.count ?? 0);
      });

      return Object.entries(
        groupedStatuses
      )
        .map(([status, count]) => ({
          status,
          count,
        }))
        .sort(
          (first, second) =>
            second.count - first.count
        );
    }, [statusData]);

  const totalApplicationsFromStatus =
    useMemo(
      () =>
        normalizedStatusData.reduce(
          (total, item) =>
            total + item.count,
          0
        ),
      [normalizedStatusData]
    );

  const maximumStatusCount =
    useMemo(() => {
      if (
        normalizedStatusData.length ===
        0
      ) {
        return 1;
      }

      return Math.max(
        ...normalizedStatusData.map(
          (item) => item.count
        )
      );
    }, [normalizedStatusData]);

  const maximumJobApplications =
    useMemo(() => {
      if (topJobs.length === 0) {
        return 1;
      }

      return Math.max(
        ...topJobs.map(
          (job) =>
            job.applicationCount ?? 0
        ),
        1
      );
    }, [topJobs]);

  const maximumTrendApplications =
    useMemo(() => {
      if (monthlyTrend.length === 0) {
        return 1;
      }

      return Math.max(
        ...monthlyTrend.map(
          (item) =>
            item.applications ?? 0
        ),
        1
      );
    }, [monthlyTrend]);

  const maximumJobStatusCount =
    useMemo(() => {
      if (jobStatusData.length === 0) {
        return 1;
      }

      return Math.max(
        ...jobStatusData.map(
          (item) => item.count ?? 0
        ),
        1
      );
    }, [jobStatusData]);

  const performanceRates =
    recruitmentPerformance?.rates ?? {};

  const performanceScores =
    recruitmentPerformance?.scores ?? {};

  const formatStatus = (status) => {
    if (!status) {
      return "Unknown";
    }

    if (
      status === "UnderReview"
    ) {
      return "Under Review";
    }

    if (
      status ===
      "InterviewScheduled"
    ) {
      return "Interview Scheduled";
    }

    if (
      status ===
      "InterviewCompleted"
    ) {
      return "Interview Completed";
    }

    if (status === "Hired") {
      return "Selected";
    }

    return status;
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

  const getScoreClass = (score) => {
    if (score >= 80) {
      return "excellent";
    }

    if (score >= 65) {
      return "good";
    }

    if (score >= 50) {
      return "average";
    }

    return "low";
  };

  const getStatusClass = (
    status
  ) => {
    const normalized =
      status
        ?.toLowerCase()
        .replaceAll(" ", "-") ??
      "unknown";

    return normalized;
  };

  if (loading) {
    return (
      <div className="analytics-state-card">
        <h2>
          Loading analytics...
        </h2>

        <p>
          Please wait while
          recruitment statistics are
          calculated.
        </p>
      </div>
    );
  }

  return (
    <div className="recruiter-analytics-page">
      <section className="analytics-page-header">
        <div>
          <span>
            Recruitment Intelligence
          </span>

          <h2>Analytics</h2>

          <p>
            Review recruitment
            activity, hiring trends,
            candidate performance and
            overall recruitment
            progress.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            loadAnalytics(true)
          }
          disabled={refreshing}
        >
          {refreshing
            ? "Refreshing..."
            : "Refresh Analytics"}
        </button>
      </section>

      {message && (
        <div
          className={
            isError
              ? "analytics-page-message error"
              : "analytics-page-message success"
          }
        >
          {message}
        </div>
      )}

      <section className="analytics-main-summary">
        <article>
          <span>Total Jobs</span>

          <strong>
            {summary?.jobs?.total ?? 0}
          </strong>

          <small>
            {summary?.jobs?.open ?? 0}{" "}
            open ·{" "}
            {summary?.jobs?.closed ?? 0}{" "}
            closed
          </small>
        </article>

        <article>
          <span>
            Total Applications
          </span>

          <strong>
            {summary?.applications
              ?.total ?? 0}
          </strong>

          <small>
            {summary?.applications
              ?.pending ?? 0}{" "}
            pending
          </small>
        </article>

        <article>
          <span>
            Total Interviews
          </span>

          <strong>
            {summary?.interviews
              ?.total ?? 0}
          </strong>

          <small>
            {summary?.interviews
              ?.upcoming ?? 0}{" "}
            upcoming
          </small>
        </article>

        <article>
          <span>
            Average AI Score
          </span>

          <strong>
            {Math.round(
              performanceScores
                .averageAIScore ??
                summary?.aiRanking
                  ?.averageAIScore ??
                0
            )}
            %
          </strong>

          <small>
            Across all applications
          </small>
        </article>

        <article>
          <span>
            Total Evaluations
          </span>

          <strong>
            {summary?.evaluations
              ?.total ?? 0}
          </strong>

          <small>
            Average{" "}
            {performanceScores
              .averageEvaluationScore ??
              summary?.evaluations
                ?.averageScore ??
              0}
          </small>
        </article>
      </section>

      <section className="analytics-rate-grid analytics-rate-grid-four">
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

          <div className="analytics-progress-track">
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

          <div className="analytics-progress-track">
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

        <article className="analytics-danger-rate">
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

          <div className="analytics-progress-track">
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

          <div className="analytics-progress-track">
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

      <section className="analytics-section-card">
        <div className="analytics-section-heading">
          <div>
            <h3>
              Monthly Recruitment Trend
            </h3>

            <p>
              Applications, shortlisted
              candidates, selections and
              rejections during the last
              six months.
            </p>
          </div>
        </div>

        {monthlyTrend.length === 0 ? (
          <div className="analytics-empty-state">
            No monthly recruitment
            trend is available.
          </div>
        ) : (
          <div className="monthly-trend-chart">
            {monthlyTrend.map(
              (trendItem) => {
                const applicationHeight =
                  Math.max(
                    Math.round(
                      ((trendItem
                        .applications ??
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
                      ((trendItem
                        .selected ??
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
                      ((trendItem
                        .rejected ??
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
                    className="monthly-trend-column"
                  >
                    <div className="monthly-trend-bars">
                      <div
                        className="monthly-trend-bar applications"
                        style={{
                          height: `${applicationHeight}%`,
                        }}
                        title={`${trendItem.applications} applications`}
                      >
                        <span>
                          {trendItem.applications}
                        </span>
                      </div>

                      <div
                        className="monthly-trend-bar selected"
                        style={{
                          height: `${selectedHeight}%`,
                        }}
                        title={`${trendItem.selected} selected`}
                      >
                        <span>
                          {trendItem.selected}
                        </span>
                      </div>

                      <div
                        className="monthly-trend-bar rejected"
                        style={{
                          height: `${rejectedHeight}%`,
                        }}
                        title={`${trendItem.rejected} rejected`}
                      >
                        <span>
                          {trendItem.rejected}
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
        )}

        <div className="monthly-trend-legend">
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
      </section>

      <section className="analytics-two-column-grid">
        <article className="analytics-section-card">
          <div className="analytics-section-heading">
            <div>
              <h3>
                Application Status
              </h3>

              <p>
                Distribution across the
                recruitment workflow.
              </p>
            </div>

            <strong>
              {
                totalApplicationsFromStatus
              }
            </strong>
          </div>

          {normalizedStatusData.length ===
          0 ? (
            <div className="analytics-empty-state">
              No application status
              data available.
            </div>
          ) : (
            <div className="status-analytics-list">
              {normalizedStatusData.map(
                (item) => {
                  const percentage =
                    totalApplicationsFromStatus >
                    0
                      ? Math.round(
                          (item.count /
                            totalApplicationsFromStatus) *
                            100
                        )
                      : 0;

                  const barWidth =
                    maximumStatusCount > 0
                      ? Math.round(
                          (item.count /
                            maximumStatusCount) *
                            100
                        )
                      : 0;

                  return (
                    <div
                      key={item.status}
                      className="status-analytics-row"
                    >
                      <div>
                        <span>
                          {item.status}
                        </span>

                        <strong>
                          {item.count} (
                          {percentage}%)
                        </strong>
                      </div>

                      <div className="analytics-bar-track">
                        <span
                          style={{
                            width: `${barWidth}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </article>

        <article className="analytics-section-card">
          <div className="analytics-section-heading">
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

            <strong>
              {jobStatusData.reduce(
                (total, item) =>
                  total +
                  Number(
                    item.count ?? 0
                  ),
                0
              )}
            </strong>
          </div>

          {jobStatusData.length === 0 ? (
            <div className="analytics-empty-state">
              No job-status data is
              available.
            </div>
          ) : (
            <div className="job-status-analytics-list">
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
                          className={`job-status-indicator ${getStatusClass(
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

                      <div className="analytics-bar-track">
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

      <section className="analytics-two-column-grid">
        <article className="analytics-section-card">
          <div className="analytics-section-heading">
            <div>
              <h3>
                Interview Performance
              </h3>

              <p>
                Current interview
                scheduling and
                completion activity.
              </p>
            </div>
          </div>

          <div className="interview-analytics-grid">
            <div>
              <span>Total</span>

              <strong>
                {summary?.interviews
                  ?.total ?? 0}
              </strong>
            </div>

            <div>
              <span>Upcoming</span>

              <strong>
                {summary?.interviews
                  ?.upcoming ?? 0}
              </strong>
            </div>

            <div>
              <span>Completed</span>

              <strong>
                {summary?.interviews
                  ?.completed ?? 0}
              </strong>
            </div>

            <div>
              <span>Cancelled</span>

              <strong>
                {summary?.interviews
                  ?.cancelled ?? 0}
              </strong>
            </div>
          </div>

          <div className="analytics-highlight-box">
            <span>
              Evaluation Average
            </span>

            <strong>
              {performanceScores
                .averageEvaluationScore ??
                summary?.evaluations
                  ?.averageScore ??
                0}
            </strong>

            <p>
              Average score from all
              completed candidate
              evaluations.
            </p>
          </div>
        </article>

        <article className="analytics-section-card">
          <div className="analytics-section-heading">
            <div>
              <h3>
                Recruitment Performance
              </h3>

              <p>
                Overall recruitment
                outcomes generated from
                all applications.
              </p>
            </div>
          </div>

          <div className="recruitment-performance-list">
            <div>
              <span>
                Shortlisted Candidates
              </span>

              <strong>
                {recruitmentPerformance
                  ?.totals
                  ?.shortlisted ?? 0}
              </strong>
            </div>

            <div>
              <span>
                Selected Candidates
              </span>

              <strong>
                {recruitmentPerformance
                  ?.totals?.selected ??
                  0}
              </strong>
            </div>

            <div>
              <span>
                Rejected Candidates
              </span>

              <strong>
                {recruitmentPerformance
                  ?.totals?.rejected ??
                  0}
              </strong>
            </div>

            <div>
              <span>
                Completed Interviews
              </span>

              <strong>
                {recruitmentPerformance
                  ?.totals
                  ?.completedInterviews ??
                  0}
              </strong>
            </div>

            <div>
              <span>
                Cancelled Interviews
              </span>

              <strong>
                {recruitmentPerformance
                  ?.totals
                  ?.cancelledInterviews ??
                  0}
              </strong>
            </div>

            <div>
              <span>
                Candidate Evaluations
              </span>

              <strong>
                {recruitmentPerformance
                  ?.totals?.evaluations ??
                  0}
              </strong>
            </div>
          </div>
        </article>
      </section>

      <section className="analytics-section-card">
        <div className="analytics-section-heading">
          <div>
            <h3>Top Jobs</h3>

            <p>
              Job postings ranked by
              application volume.
            </p>
          </div>
        </div>

        {topJobs.length === 0 ? (
          <div className="analytics-empty-state">
            No job analytics are
            available.
          </div>
        ) : (
          <div className="top-jobs-analytics-list">
            {topJobs.map(
              (job, index) => {
                const width =
                  Math.round(
                    ((job.applicationCount ??
                      0) /
                      maximumJobApplications) *
                      100
                  );

                return (
                  <article
                    key={job.jobId}
                  >
                    <div className="top-job-position">
                      #{index + 1}
                    </div>

                    <div className="top-job-content">
                      <div>
                        <div>
                          <h4>
                            {job.title}
                          </h4>

                          <p>
                            {job.location ||
                              "Location not specified"}{" "}
                            ·{" "}
                            {job.employmentType ||
                              "Type not specified"}
                          </p>
                        </div>

                        <span
                          className={`analytics-job-status ${getStatusClass(
                            job.status
                          )}`}
                        >
                          {job.status}
                        </span>
                      </div>

                      <div className="top-job-statistics">
                        <span>
                          {job.applicationCount ??
                            0}{" "}
                          applications
                        </span>

                        <span>
                          Average AI{" "}
                          {Math.round(
                            job.averageAIScore ??
                              0
                          )}
                          %
                        </span>

                        <span>
                          Deadline{" "}
                          {formatDate(
                            job.deadline
                          )}
                        </span>
                      </div>

                      <div className="analytics-bar-track">
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

      <section className="analytics-two-column-grid">
        <article className="analytics-section-card">
          <div className="analytics-section-heading">
            <div>
              <h3>
                Top Candidates
              </h3>

              <p>
                Highest-ranked
                candidates by AI
                matching score.
              </p>
            </div>
          </div>

          {topCandidates.length === 0 ? (
            <div className="analytics-empty-state">
              No candidate ranking
              data available.
            </div>
          ) : (
            <div className="analytics-candidate-list">
              {topCandidates.map(
                (
                  candidate,
                  index
                ) => (
                  <article
                    key={
                      candidate.applicationId
                    }
                  >
                    <div className="analytics-list-rank">
                      {index + 1}
                    </div>

                    <div>
                      <h4>
                        {
                          candidate.candidateName
                        }
                      </h4>

                      <p>
                        {
                          candidate.jobTitle
                        }
                      </p>

                      <small>
                        {candidate.experienceYears ??
                          0}{" "}
                        years experience ·{" "}
                        {formatStatus(
                          candidate.status
                        )}
                      </small>
                    </div>

                    <span
                      className={`analytics-score-badge ${getScoreClass(
                        candidate.aiScore ??
                          0
                      )}`}
                    >
                      {candidate.aiScore ??
                        0}
                      %
                    </span>
                  </article>
                )
              )}
            </div>
          )}
        </article>

        <article className="analytics-section-card">
          <div className="analytics-section-heading">
            <div>
              <h3>
                Upcoming Interviews
              </h3>

              <p>
                Next scheduled
                candidate interviews.
              </p>
            </div>
          </div>

          {upcomingInterviews.length ===
          0 ? (
            <div className="analytics-empty-state">
              No upcoming interviews.
            </div>
          ) : (
            <div className="analytics-interview-list">
              {upcomingInterviews.map(
                (interview) => (
                  <article
                    key={
                      interview.interviewId
                    }
                  >
                    <div>
                      <h4>
                        {
                          interview.candidateName
                        }
                      </h4>

                      <p>
                        {
                          interview.jobTitle
                        }
                      </p>

                      <small>
                        {
                          interview.interviewType
                        }
                      </small>
                    </div>

                    <strong>
                      {formatDateTime(
                        interview.scheduledDateTime
                      )}
                    </strong>
                  </article>
                )
              )}
            </div>
          )}
        </article>
      </section>

      <section className="analytics-section-card">
        <div className="analytics-section-heading">
          <div>
            <h3>
              Recent Applications
            </h3>

            <p>
              Latest candidate
              applications submitted
              to JobMart.
            </p>
          </div>
        </div>

        {recentApplications.length ===
        0 ? (
          <div className="analytics-empty-state">
            No recent applications.
          </div>
        ) : (
          <div className="analytics-table-wrapper">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Job</th>
                  <th>Status</th>
                  <th>AI Score</th>
                  <th>Applied</th>
                </tr>
              </thead>

              <tbody>
                {recentApplications.map(
                  (application) => (
                    <tr
                      key={
                        application.applicationId
                      }
                    >
                      <td>
                        <strong>
                          {
                            application.candidateName
                          }
                        </strong>

                        <span>
                          {
                            application.candidateEmail
                          }
                        </span>
                      </td>

                      <td>
                        {
                          application.jobTitle
                        }
                      </td>

                      <td>
                        <span
                          className={`analytics-table-status ${getStatusClass(
                            formatStatus(
                              application.status
                            )
                          )}`}
                        >
                          {formatStatus(
                            application.status
                          )}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`analytics-score-badge ${getScoreClass(
                            application.aiScore ??
                              0
                          )}`}
                        >
                          {application.aiScore ??
                            0}
                          %
                        </span>
                      </td>

                      <td>
                        {formatDate(
                          application.appliedAt
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

      <p className="analytics-generated-time">
        Last generated:{" "}
        {formatDateTime(
          recruitmentPerformance
            ?.generatedAt ??
            summary?.generatedAt
        )}
      </p>
    </div>
  );
}

export default RecruiterAnalytics;