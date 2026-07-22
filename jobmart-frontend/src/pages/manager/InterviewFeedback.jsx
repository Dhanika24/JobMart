import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import "./InterviewFeedback.css";

function InterviewFeedback() {
  const navigate = useNavigate();

  const [interviews, setInterviews] = useState([]);
  const [selectedInterview, setSelectedInterview] =
    useState(null);

  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("All");

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    loadInterviews();
  }, []);

  const loadInterviews = async () => {
    setLoading(true);
    setMessage("");
    setIsError(false);

    try {
      const response = await axiosInstance.get(
        "/Interviews/manager/all"
      );

      const interviewData =
        response.data?.interviews ??
        response.data ??
        [];

      setInterviews(
        Array.isArray(interviewData)
          ? interviewData
          : []
      );

      setSelectedInterview((currentInterview) => {
        if (!currentInterview) {
          return null;
        }

        return (
          interviewData.find(
            (interview) =>
              interview.interviewId ===
              currentInterview.interviewId
          ) ?? null
        );
      });
    } catch (error) {
      console.error(
        "Hiring Manager interviews error:",
        error
      );

      setIsError(true);

      setMessage(
        error.response?.data?.message ??
          "Unable to load interview information."
      );
    } finally {
      setLoading(false);
    }
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

  const formatStatus = (status) => {
    if (status === "InterviewScheduled") {
      return "Interview Scheduled";
    }

    if (status === "InterviewCompleted") {
      return "Interview Completed";
    }

    if (status === "UnderReview") {
      return "Under Review";
    }

    if (status === "Hired") {
      return "Selected";
    }

    return status || "Unknown";
  };

  const getStatusClass = (status) => {
    return formatStatus(status)
      .toLowerCase()
      .replaceAll(" ", "-");
  };

  const filteredInterviews = useMemo(() => {
    const normalizedSearch =
      searchText.trim().toLowerCase();

    return interviews.filter((interview) => {
      const displayedStatus =
        formatStatus(interview.status);

      const matchesStatus =
        statusFilter === "All" ||
        displayedStatus === statusFilter;

      const searchableText = [
        interview.candidateName,
        interview.candidateEmail,
        interview.jobTitle,
        interview.jobLocation,
        interview.interviewType,
        interview.meetingLinkOrLocation,
        interview.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !normalizedSearch ||
        searchableText.includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [interviews, searchText, statusFilter]);

  const statusOptions = useMemo(() => {
    const availableStatuses = interviews
      .map((interview) =>
        formatStatus(interview.status)
      )
      .filter(Boolean);

    return [
      "All",
      ...new Set(availableStatuses),
    ];
  }, [interviews]);

  const summary = useMemo(() => {
    return {
      total: interviews.length,

      scheduled: interviews.filter(
        (interview) =>
          interview.status === "Scheduled" ||
          interview.status === "Rescheduled"
      ).length,

      completed: interviews.filter(
        (interview) =>
          interview.status === "Completed"
      ).length,

      evaluated: interviews.filter(
        (interview) =>
          interview.evaluationId != null
      ).length,
    };
  }, [interviews]);

  const openMeetingLink = (value) => {
    if (!value) {
      return;
    }

    const isOnlineLink =
      value.startsWith("http://") ||
      value.startsWith("https://");

    if (!isOnlineLink) {
      return;
    }

    window.open(
      value,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const openEvaluation = (interview) => {
    navigate(
      `/manager/evaluations?applicationId=${interview.jobApplicationId}`
    );
  };

  if (loading) {
    return (
      <section className="interview-feedback-state">
        <h2>Loading interviews...</h2>

        <p>
          Please wait while interview information is
          loaded.
        </p>
      </section>
    );
  }

  return (
    <div className="interview-feedback-page">
      <section className="interview-feedback-heading">
        <div>
          <span>Interview Review</span>

          <h2>Interview Feedback</h2>

          <p>
            Review scheduled and completed interviews,
            meeting information, candidate details and
            evaluation results.
          </p>
        </div>

        <button
          type="button"
          onClick={loadInterviews}
        >
          Refresh Interviews
        </button>
      </section>

      {message && (
        <div
          className={
            isError
              ? "interview-feedback-message error"
              : "interview-feedback-message success"
          }
        >
          {message}
        </div>
      )}

      <section className="interview-feedback-summary">
        <article>
          <span>Total Interviews</span>
          <strong>{summary.total}</strong>
        </article>

        <article>
          <span>Scheduled</span>
          <strong>{summary.scheduled}</strong>
        </article>

        <article>
          <span>Completed</span>
          <strong>{summary.completed}</strong>
        </article>

        <article>
          <span>Evaluated</span>
          <strong>{summary.evaluated}</strong>
        </article>
      </section>

      <section className="interview-feedback-filters">
        <div>
          <label htmlFor="interviewSearch">
            Search interviews
          </label>

          <input
            id="interviewSearch"
            type="search"
            placeholder="Search candidate, job or interview type"
            value={searchText}
            onChange={(event) =>
              setSearchText(event.target.value)
            }
          />
        </div>

        <div>
          <label htmlFor="interviewStatus">
            Interview status
          </label>

          <select
            id="interviewStatus"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
          >
            {statusOptions.map((status) => (
              <option
                key={status}
                value={status}
              >
                {status}
              </option>
            ))}
          </select>
        </div>
      </section>

      {filteredInterviews.length === 0 ? (
        <section className="interview-feedback-state">
          <h2>No interviews found</h2>

          <p>
            No interviews match the selected search and
            status filters.
          </p>
        </section>
      ) : (
        <section className="interview-feedback-grid">
          {filteredInterviews.map((interview) => (
            <article
              className="interview-feedback-card"
              key={interview.interviewId}
            >
              <div className="interview-feedback-card-header">
                <div className="interview-feedback-avatar">
                  {interview.candidateName
                    ?.charAt(0)
                    .toUpperCase() ?? "C"}
                </div>

                <div>
                  <h3>
                    {interview.candidateName ??
                      "Unknown Candidate"}
                  </h3>

                  <p>
                    {interview.candidateEmail ||
                      "No email available"}
                  </p>
                </div>

                <span
                  className={`interview-feedback-status ${getStatusClass(
                    interview.status
                  )}`}
                >
                  {formatStatus(interview.status)}
                </span>
              </div>

              <div className="interview-feedback-job">
                <div>
                  <span>Position</span>

                  <strong>
                    {interview.jobTitle ??
                      "Unknown Job"}
                  </strong>
                </div>

                <div>
                  <span>Location</span>

                  <strong>
                    {interview.jobLocation ||
                      "Not specified"}
                  </strong>
                </div>

                <div>
                  <span>AI Score</span>

                  <strong>
                    {Math.round(
                      Number(interview.aiScore ?? 0)
                    )}
                    %
                  </strong>
                </div>
              </div>

              <div className="interview-feedback-details">
                <article>
                  <span>Date and Time</span>

                  <strong>
                    {formatDateTime(
                      interview.scheduledDateTime
                    )}
                  </strong>
                </article>

                <article>
                  <span>Interview Type</span>

                  <strong>
                    {interview.interviewType ||
                      "Not specified"}
                  </strong>
                </article>

                <article className="full-width">
                  <span>Meeting Link or Location</span>

                  <strong>
                    {interview.meetingLinkOrLocation ||
                      "Not specified"}
                  </strong>
                </article>
              </div>

              <div className="interview-feedback-notes">
                <span>Interview Notes</span>

                <p>
                  {interview.notes ||
                    "No interview notes have been added."}
                </p>
              </div>

              <div className="interview-feedback-evaluation">
                {interview.evaluationId ? (
                  <>
                    <div>
                      <span>Evaluation Score</span>

                      <strong>
                        {interview.evaluationScore ?? 0}
                        /10
                      </strong>
                    </div>

                    <div>
                      <span>Decision</span>

                      <strong>
                        {interview.evaluationDecision ??
                          "Pending"}
                      </strong>
                    </div>
                  </>
                ) : (
                  <p>
                    No candidate evaluation has been
                    created for this interview.
                  </p>
                )}
              </div>

              <div className="interview-feedback-actions">
                <button
                  type="button"
                  className="primary"
                  onClick={() =>
                    openEvaluation(interview)
                  }
                >
                  {interview.evaluationId
                    ? "View Evaluation"
                    : "Add Evaluation"}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedInterview(interview)
                  }
                >
                  View Details
                </button>

                <button
                  type="button"
                  disabled={
                    !interview.meetingLinkOrLocation?.startsWith(
                      "http"
                    )
                  }
                  onClick={() =>
                    openMeetingLink(
                      interview.meetingLinkOrLocation
                    )
                  }
                >
                  Open Meeting
                </button>
              </div>
            </article>
          ))}
        </section>
      )}

      {selectedInterview && (
        <div
          className="interview-feedback-modal-overlay"
          role="presentation"
          onClick={() =>
            setSelectedInterview(null)
          }
        >
          <section
            className="interview-feedback-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="interviewDetailsTitle"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="interview-feedback-modal-header">
              <div>
                <span>Interview Information</span>

                <h2 id="interviewDetailsTitle">
                  {selectedInterview.candidateName}
                </h2>

                <p>
                  {selectedInterview.jobTitle}
                </p>
              </div>

              <button
                type="button"
                aria-label="Close interview details"
                onClick={() =>
                  setSelectedInterview(null)
                }
              >
                ×
              </button>
            </div>

            <div className="interview-feedback-modal-grid">
              <article>
                <span>Interview Status</span>

                <strong>
                  {formatStatus(
                    selectedInterview.status
                  )}
                </strong>
              </article>

              <article>
                <span>Application Status</span>

                <strong>
                  {formatStatus(
                    selectedInterview.applicationStatus
                  )}
                </strong>
              </article>

              <article>
                <span>Date and Time</span>

                <strong>
                  {formatDateTime(
                    selectedInterview.scheduledDateTime
                  )}
                </strong>
              </article>

              <article>
                <span>Interview Type</span>

                <strong>
                  {selectedInterview.interviewType ||
                    "Not specified"}
                </strong>
              </article>

              <article>
                <span>Experience</span>

                <strong>
                  {selectedInterview.experienceYears ?? 0}{" "}
                  years
                </strong>
              </article>

              <article>
                <span>AI Score</span>

                <strong>
                  {Math.round(
                    Number(
                      selectedInterview.aiScore ?? 0
                    )
                  )}
                  %
                </strong>
              </article>
            </div>

            <div className="interview-feedback-modal-section">
              <h3>Meeting Link or Location</h3>

              <p>
                {selectedInterview.meetingLinkOrLocation ||
                  "Not specified"}
              </p>
            </div>

            <div className="interview-feedback-modal-section">
              <h3>Candidate Skills</h3>

              <p>
                {selectedInterview.candidateSkills ||
                  "No skills have been added."}
              </p>
            </div>

            <div className="interview-feedback-modal-section">
              <h3>Interview Notes</h3>

              <p>
                {selectedInterview.notes ||
                  "No interview notes have been added."}
              </p>
            </div>

            <div className="interview-feedback-modal-actions">
              <button
                type="button"
                className="primary"
                onClick={() =>
                  openEvaluation(selectedInterview)
                }
              >
                {selectedInterview.evaluationId
                  ? "View Candidate Evaluation"
                  : "Create Candidate Evaluation"}
              </button>

              <button
                type="button"
                disabled={
                  !selectedInterview.meetingLinkOrLocation?.startsWith(
                    "http"
                  )
                }
                onClick={() =>
                  openMeetingLink(
                    selectedInterview.meetingLinkOrLocation
                  )
                }
              >
                Open Meeting Link
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default InterviewFeedback;