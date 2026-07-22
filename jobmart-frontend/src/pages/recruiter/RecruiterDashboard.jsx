import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance.js";
import "./RecruiterDashboard.css";

const initialSummary = {
  jobs: {
    total: 0,
    open: 0,
    closed: 0,
  },
  applications: {
    total: 0,
    pending: 0,
    underReview: 0,
    shortlisted: 0,
    selected: 0,
    rejected: 0,
  },
  interviews: {
    total: 0,
    upcoming: 0,
    completed: 0,
    cancelled: 0,
  },
  evaluations: {
    total: 0,
    averageScore: 0,
  },
  aiRanking: {
    averageAIScore: 0,
  },
};

function RecruiterDashboard() {
  const [summary, setSummary] = useState(initialSummary);
  const [topJobs, setTopJobs] = useState([]);
  const [recentApplications, setRecentApplications] =
    useState([]);
  const [upcomingInterviews, setUpcomingInterviews] =
    useState([]);
  const [topCandidates, setTopCandidates] = useState([]);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setMessage("");

      try {
        const [
          summaryResponse,
          topJobsResponse,
          applicationsResponse,
          interviewsResponse,
          candidatesResponse,
        ] = await Promise.all([
          axiosInstance.get("/Dashboard/summary"),
          axiosInstance.get("/Dashboard/top-jobs?limit=5"),
          axiosInstance.get(
            "/Dashboard/recent-applications?limit=5"
          ),
          axiosInstance.get(
            "/Dashboard/upcoming-interviews?limit=5"
          ),
          axiosInstance.get(
            "/Dashboard/top-candidates?limit=5"
          ),
        ]);

        setSummary(summaryResponse.data ?? initialSummary);

        setTopJobs(
          topJobsResponse.data?.jobs ?? []
        );

        setRecentApplications(
          applicationsResponse.data?.applications ?? []
        );

        setUpcomingInterviews(
          interviewsResponse.data?.interviews ?? []
        );

        setTopCandidates(
          candidatesResponse.data?.candidates ?? []
        );
      } catch (error) {
        console.error(
          "Recruiter dashboard loading error:",
          error
        );

        setMessage(
          error.response?.data?.message ??
            "Unable to load recruiter dashboard."
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "Not available";
    }

    return new Date(dateValue).toLocaleDateString(
      "en-LK",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    );
  };

  const formatDateTime = (dateValue) => {
    if (!dateValue) {
      return "Not available";
    }

    return new Date(dateValue).toLocaleString(
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

  const summaryCards = [
    {
      title: "Total Jobs",
      value: summary.jobs?.total ?? 0,
      detail: `${summary.jobs?.open ?? 0} open`,
    },
    {
      title: "Applications",
      value: summary.applications?.total ?? 0,
      detail: `${summary.applications?.pending ?? 0} pending`,
    },
    {
      title: "Shortlisted",
      value: summary.applications?.shortlisted ?? 0,
      detail: `${summary.applications?.selected ?? 0} selected`,
    },
    {
      title: "Upcoming Interviews",
      value: summary.interviews?.upcoming ?? 0,
      detail: `${summary.interviews?.total ?? 0} total`,
    },
    {
      title: "Evaluations",
      value: summary.evaluations?.total ?? 0,
      detail: `Average ${
        summary.evaluations?.averageScore ?? 0
      }`,
    },
    {
      title: "Average AI Score",
      value: `${summary.aiRanking?.averageAIScore ?? 0}%`,
      detail: "Across applications",
    },
  ];

  if (loading) {
    return (
      <div className="recruiter-dashboard-state">
        <h2>Loading recruiter dashboard...</h2>
        <p>Please wait while recruitment data is loaded.</p>
      </div>
    );
  }

  return (
    <div className="recruiter-dashboard-page">
      <section className="recruiter-dashboard-welcome">
        <div>
          <span>Recruitment Overview</span>

          <h2>Recruiter Dashboard</h2>

          <p>
            Monitor jobs, applications, AI rankings and
            interviews from one place.
          </p>
        </div>

        <Link
          to="/recruiter/jobs"
          className="recruiter-dashboard-action"
        >
          Manage Job Postings
        </Link>
      </section>

      {message && (
        <div className="recruiter-dashboard-error">
          {message}
        </div>
      )}

      <section className="recruiter-summary-grid">
        {summaryCards.map((card) => (
          <article
            key={card.title}
            className="recruiter-summary-card"
          >
            <span>{card.title}</span>
            <strong>{card.value}</strong>
            <p>{card.detail}</p>
          </article>
        ))}
      </section>

      <section className="recruiter-dashboard-grid">
        <article className="recruiter-dashboard-panel">
          <div className="recruiter-panel-heading">
            <div>
              <h3>Recent Applications</h3>
              <p>Latest candidate submissions</p>
            </div>

            <Link to="/recruiter/applications">
              View All
            </Link>
          </div>

          {recentApplications.length === 0 ? (
            <p className="recruiter-empty-text">
              No applications found.
            </p>
          ) : (
            <div className="recruiter-list">
              {recentApplications.map((application) => (
                <div
                  key={application.applicationId}
                  className="recruiter-list-item"
                >
                  <div>
                    <strong>
                      {application.candidateName}
                    </strong>

                    <span>
                      {application.jobTitle}
                    </span>
                  </div>

                  <div className="recruiter-list-right">
                    <strong>
                      {application.aiScore}%
                    </strong>

                    <span>{application.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="recruiter-dashboard-panel">
          <div className="recruiter-panel-heading">
            <div>
              <h3>Top AI Candidates</h3>
              <p>Highest-ranked applications</p>
            </div>

            <Link to="/recruiter/rankings">
              View Rankings
            </Link>
          </div>

          {topCandidates.length === 0 ? (
            <p className="recruiter-empty-text">
              No ranked candidates found.
            </p>
          ) : (
            <div className="recruiter-list">
              {topCandidates.map((candidate) => (
                <div
                  key={candidate.applicationId}
                  className="recruiter-list-item"
                >
                  <div>
                    <strong>
                      {candidate.candidateName}
                    </strong>

                    <span>{candidate.jobTitle}</span>
                  </div>

                  <div className="recruiter-ai-score">
                    {candidate.aiScore}%
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="recruiter-dashboard-panel">
          <div className="recruiter-panel-heading">
            <div>
              <h3>Top Jobs</h3>
              <p>Jobs with the most applications</p>
            </div>

            <Link to="/recruiter/jobs">
              Manage Jobs
            </Link>
          </div>

          {topJobs.length === 0 ? (
            <p className="recruiter-empty-text">
              No jobs found.
            </p>
          ) : (
            <div className="recruiter-list">
              {topJobs.map((job) => (
                <div
                  key={job.jobId}
                  className="recruiter-list-item"
                >
                  <div>
                    <strong>{job.title}</strong>

                    <span>
                      {job.location ?? "No location"}
                    </span>
                  </div>

                  <div className="recruiter-list-right">
                    <strong>
                      {job.applicationCount}
                    </strong>

                    <span>Applications</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="recruiter-dashboard-panel">
          <div className="recruiter-panel-heading">
            <div>
              <h3>Upcoming Interviews</h3>
              <p>Scheduled candidate meetings</p>
            </div>

            <Link to="/recruiter/interviews">
              View Interviews
            </Link>
          </div>

          {upcomingInterviews.length === 0 ? (
            <p className="recruiter-empty-text">
              No upcoming interviews.
            </p>
          ) : (
            <div className="recruiter-list">
              {upcomingInterviews.map((interview) => (
                <div
                  key={interview.interviewId}
                  className="recruiter-list-item"
                >
                  <div>
                    <strong>
                      {interview.candidateName}
                    </strong>

                    <span>{interview.jobTitle}</span>
                  </div>

                  <div className="recruiter-list-right">
                    <strong>
                      {formatDate(
                        interview.scheduledDateTime
                      )}
                    </strong>

                    <span>
                      {formatDateTime(
                        interview.scheduledDateTime
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>
    </div>
  );
}

export default RecruiterDashboard;