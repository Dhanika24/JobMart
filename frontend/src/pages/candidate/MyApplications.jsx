import { useEffect, useMemo, useState } from "react";
import axiosInstance from "../../api/axiosInstance.js";
import "./MyApplications.css";

function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    setLoading(true);
    setMessage("");
    setIsError(false);

    try {
      const response =
        await axiosInstance.get("/Applications/my");

      setApplications(response.data ?? []);
    } catch (error) {
      console.error("Applications loading error:", error);

      const errorMessage =
        error.response?.data?.message ??
        "Unable to load your applications.";

      setIsError(true);
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const filteredApplications = useMemo(() => {
    const normalizedSearch =
      searchText.trim().toLowerCase();

    return applications.filter((application) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        application.jobTitle
          ?.toLowerCase()
          .includes(normalizedSearch) ||
        application.jobLocation
          ?.toLowerCase()
          .includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "All" ||
        normalizeStatus(application.status) === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [applications, searchText, statusFilter]);

  const normalizeStatus = (status) => {
    if (!status) {
      return "Unknown";
    }

    const normalized =
      status.replace(/\s/g, "").toLowerCase();

    const statusMap = {
      pending: "Pending",
      underreview: "Under Review",
      shortlisted: "Shortlisted",
      interviewscheduled: "Interview Scheduled",
      interviewcompleted: "Interview Completed",
      selected: "Selected",
      hired: "Selected",
      rejected: "Rejected",
    };

    return statusMap[normalized] ?? status;
  };

  const getStatusClass = (status) => {
    const normalized = normalizeStatus(status);

    switch (normalized) {
      case "Selected":
        return "selected";

      case "Shortlisted":
        return "shortlisted";

      case "Interview Scheduled":
      case "Interview Completed":
        return "interview";

      case "Rejected":
        return "rejected";

      case "Under Review":
        return "review";

      default:
        return "pending";
    }
  };

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "Not available";
    }

    return new Date(dateValue).toLocaleDateString("en-LK", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="applications-state-card">
        <h2>Loading applications...</h2>
        <p>Please wait while your applications are loaded.</p>
      </div>
    );
  }

  return (
    <div className="my-applications-page">
      <section className="applications-header">
        <div>
          <span className="applications-label">
            Candidate Applications
          </span>

          <h2>My Applications</h2>

          <p>
            Track your application status and AI matching score.
          </p>
        </div>

        <div className="applications-total">
          <strong>{applications.length}</strong>
          <span>Total applications</span>
        </div>
      </section>

      <section className="applications-toolbar">
        <input
          type="search"
          placeholder="Search by job title or location"
          value={searchText}
          onChange={(event) =>
            setSearchText(event.target.value)
          }
        />

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value)
          }
        >
          <option value="All">All statuses</option>
          <option value="Pending">Pending</option>
          <option value="Under Review">Under Review</option>
          <option value="Shortlisted">Shortlisted</option>
          <option value="Interview Scheduled">
            Interview Scheduled
          </option>
          <option value="Interview Completed">
            Interview Completed
          </option>
          <option value="Selected">Selected</option>
          <option value="Rejected">Rejected</option>
        </select>

        <button
          type="button"
          onClick={loadApplications}
        >
          Refresh
        </button>
      </section>

      {message && (
        <div
          className={
            isError
              ? "applications-message error"
              : "applications-message success"
          }
        >
          {message}
        </div>
      )}

      {filteredApplications.length === 0 ? (
        <div className="applications-state-card">
          <h3>No applications found</h3>
          <p>
            Apply for a job or change your search filters.
          </p>
        </div>
      ) : (
        <section className="applications-grid">
          {filteredApplications.map((application) => {
            const displayStatus =
              normalizeStatus(application.status);

            return (
              <article
                className="application-card"
                key={application.jobApplicationId}
              >
                <div className="application-card-header">
                  <div>
                    <span
                      className={`application-status ${getStatusClass(
                        application.status
                      )}`}
                    >
                      {displayStatus}
                    </span>

                    <h3>
                      {application.jobTitle ??
                        "Unknown Job"}
                    </h3>

                    <p>
                      {application.jobLocation ??
                        "Location not specified"}
                    </p>
                  </div>

                  <div className="ai-score-box">
                    <strong>
                      {Math.round(
                        application.aiScore ?? 0
                      )}
                    </strong>
                    <span>AI Score</span>
                  </div>
                </div>

                <div className="application-details">
                  <div>
                    <span>Application ID</span>
                    <strong>
                      #{application.jobApplicationId}
                    </strong>
                  </div>

                  <div>
                    <span>Applied date</span>
                    <strong>
                      {formatDate(application.appliedAt)}
                    </strong>
                  </div>
                </div>

                <div className="application-cover-letter">
                  <h4>Cover Letter</h4>

                  <p>
                    {application.coverLetter ||
                      "No cover letter provided."}
                  </p>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}

export default MyApplications;