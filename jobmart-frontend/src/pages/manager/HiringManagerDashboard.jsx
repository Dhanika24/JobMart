import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance.js";
import "./HiringManagerDashboard.css";

function HiringManagerDashboard() {
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [topCandidates, setTopCandidates] = useState([]);
  const [upcomingInterviews, setUpcomingInterviews] =
    useState([]);
  const [evaluations, setEvaluations] = useState([]);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    setMessage("");

    try {
      const [
        summaryResponse,
        candidatesResponse,
        interviewsResponse,
        evaluationsResponse,
      ] = await Promise.all([
        axiosInstance.get("/Dashboard/summary"),

        axiosInstance.get(
          "/Dashboard/top-candidates?limit=5"
        ),

        axiosInstance.get(
          "/Dashboard/upcoming-interviews?limit=5"
        ),

        axiosInstance.get("/CandidateEvaluations"),
      ]);

      setSummary(summaryResponse.data ?? null);

      setTopCandidates(
        candidatesResponse.data?.candidates ?? []
      );

      setUpcomingInterviews(
        interviewsResponse.data?.interviews ?? []
      );

      setEvaluations(
        evaluationsResponse.data?.evaluations ?? []
      );
    } catch (error) {
      console.error(
        "Hiring Manager dashboard error:",
        error
      );

      setMessage(
        error.response?.data?.message ??
          "Unable to load Hiring Manager dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  const shortlistedCandidates = useMemo(() => {
    return topCandidates.filter(
      (candidate) =>
        candidate.status === "Shortlisted" ||
        candidate.status === "InterviewScheduled" ||
        candidate.status === "InterviewCompleted" ||
        candidate.status === "UnderReview" ||
        candidate.status === "Under Review"
    );
  }, [topCandidates]);

  const selectedCandidates = useMemo(() => {
    return evaluations.filter(
      (evaluation) =>
        evaluation.decision === "Selected"
    ).length;
  }, [evaluations]);

  const pendingEvaluations = useMemo(() => {
    return shortlistedCandidates.filter(
      (candidate) =>
        !evaluations.some(
          (evaluation) =>
            evaluation.jobApplicationId ===
            candidate.applicationId
        )
    ).length;
  }, [shortlistedCandidates, evaluations]);

  const formatDateTime = (dateValue) => {
    if (!dateValue) {
      return "Not available";
    }

    return new Date(dateValue).toLocaleString("en-LK", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatStatus = (status) => {
    if (status === "UnderReview") {
      return "Under Review";
    }

    if (status === "InterviewScheduled") {
      return "Interview Scheduled";
    }

    if (status === "InterviewCompleted") {
      return "Interview Completed";
    }

    return status || "Unknown";
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

  if (loading) {
    return (
      <div className="manager-dashboard-state">
        <h2>Loading dashboard...</h2>
        <p>Please wait while hiring information is loaded.</p>
      </div>
    );
  }

  return (
    <div className="hiring-manager-dashboard">
      <section className="manager-dashboard-hero">
        <div>
          <span>Hiring Overview</span>

          <h2>Hiring Manager Dashboard</h2>

          <p>
            Review shortlisted candidates, evaluate
            interviews and make final hiring decisions.
          </p>
        </div>

        <button
          type="button"
          onClick={loadDashboard}
        >
          Refresh Dashboard
        </button>
      </section>

      {message && (
        <div className="manager-dashboard-error">
          {message}
        </div>
      )}

      <section className="manager-dashboard-summary">
        <article>
          <span>Shortlisted Candidates</span>

          <strong>
            {summary?.applications?.shortlisted ?? 0}
          </strong>
        </article>

        <article>
          <span>Upcoming Interviews</span>

          <strong>
            {summary?.interviews?.upcoming ?? 0}
          </strong>
        </article>

        <article>
          <span>Completed Evaluations</span>

          <strong>
            {summary?.evaluations?.total ?? 0}
          </strong>
        </article>

        <article>
          <span>Pending Evaluations</span>

          <strong>{pendingEvaluations}</strong>
        </article>

        <article>
          <span>Selected Candidates</span>

          <strong>{selectedCandidates}</strong>
        </article>
      </section>

      <section className="manager-dashboard-actions">
        <button
          type="button"
          onClick={() =>
            navigate("/manager/candidates")
          }
        >
          <strong>Shortlisted Candidates</strong>

          <span>
            Review candidates ready for evaluation.
          </span>
        </button>

        <button
          type="button"
          onClick={() =>
            navigate("/manager/evaluations")
          }
        >
          <strong>Candidate Evaluations</strong>

          <span>
            Score skills, experience and culture fit.
          </span>
        </button>

        <button
          type="button"
          onClick={() =>
            navigate("/manager/interviews")
          }
        >
          <strong>Interview Feedback</strong>

          <span>
            Review interviews and record feedback.
          </span>
        </button>

        <button
          type="button"
          onClick={() =>
            navigate("/manager/decisions")
          }
        >
          <strong>Hiring Decisions</strong>

          <span>
            Compare evaluations and make decisions.
          </span>
        </button>
      </section>

      <section className="manager-dashboard-grid">
        <article className="manager-dashboard-card">
          <div className="manager-card-heading">
            <div>
              <h3>Top Candidates</h3>

              <p>
                Candidates with the strongest AI scores.
              </p>
            </div>
          </div>

          {topCandidates.length === 0 ? (
            <div className="manager-empty-state">
              No candidates are available.
            </div>
          ) : (
            <div className="manager-candidate-list">
              {topCandidates.map(
                (candidate, index) => (
                  <article
                    key={candidate.applicationId}
                  >
                    <div className="manager-list-position">
                      {index + 1}
                    </div>

                    <div>
                      <h4>
                        {candidate.candidateName}
                      </h4>

                      <p>{candidate.jobTitle}</p>

                      <small>
                        {formatStatus(
                          candidate.status
                        )}
                      </small>
                    </div>

                    <span
                      className={`manager-score-badge ${getScoreClass(
                        candidate.aiScore ?? 0
                      )}`}
                    >
                      {candidate.aiScore ?? 0}%
                    </span>
                  </article>
                )
              )}
            </div>
          )}
        </article>

        <article className="manager-dashboard-card">
          <div className="manager-card-heading">
            <div>
              <h3>Upcoming Interviews</h3>

              <p>
                Interviews requiring manager attention.
              </p>
            </div>
          </div>

          {upcomingInterviews.length === 0 ? (
            <div className="manager-empty-state">
              No upcoming interviews.
            </div>
          ) : (
            <div className="manager-interview-list">
              {upcomingInterviews.map(
                (interview) => (
                  <article
                    key={interview.interviewId}
                  >
                    <div>
                      <h4>
                        {interview.candidateName}
                      </h4>

                      <p>{interview.jobTitle}</p>

                      <small>
                        {interview.interviewType}
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

      <section className="manager-dashboard-card">
        <div className="manager-card-heading">
          <div>
            <h3>Recent Evaluations</h3>

            <p>
              Latest hiring manager evaluations and
              decisions.
            </p>
          </div>
        </div>

        {evaluations.length === 0 ? (
          <div className="manager-empty-state">
            No candidate evaluations have been created.
          </div>
        ) : (
          <div className="manager-evaluation-table-wrapper">
            <table className="manager-evaluation-table">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Job</th>
                  <th>AI Score</th>
                  <th>Evaluation</th>
                  <th>Decision</th>
                  <th>Manager</th>
                </tr>
              </thead>

              <tbody>
                {evaluations.slice(0, 6).map(
                  (evaluation) => (
                    <tr
                      key={evaluation.evaluationId}
                    >
                      <td>
                        <strong>
                          {evaluation.candidateName}
                        </strong>

                        <span>
                          {evaluation.candidateEmail}
                        </span>
                      </td>

                      <td>
                        {evaluation.jobTitle}
                      </td>

                      <td>
                        {evaluation.aiScore ?? 0}%
                      </td>

                      <td>
                        {evaluation.overallScore ?? 0}
                      </td>

                      <td>
                        {evaluation.decision}
                      </td>

                      <td>
                        {evaluation.hiringManagerName}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default HiringManagerDashboard;