import { useEffect, useMemo, useState } from "react";
import axiosInstance from "../../api/axiosInstance.js";
import "./MyInterviews.css";

function MyInterviews() {
  const [interviews, setInterviews] = useState([]);
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchText, setSearchText] = useState("");

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
      const response =
        await axiosInstance.get("/Interviews/my");

      const responseData = response.data;

      if (Array.isArray(responseData)) {
        setInterviews(responseData);
      } else {
        setInterviews(responseData?.interviews ?? []);
      }
    } catch (error) {
      console.error("Interview loading error:", error);

      const errorMessage =
        error.response?.data?.message ??
        "Unable to load your interviews.";

      setIsError(true);
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const filteredInterviews = useMemo(() => {
    const normalizedSearch =
      searchText.trim().toLowerCase();

    return interviews.filter((interview) => {
      const searchableText = [
        interview.jobTitle,
        interview.interviewType,
        interview.meetingLinkOrLocation,
        interview.notes,
        interview.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        normalizedSearch.length === 0 ||
        searchableText.includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "All" ||
        interview.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [interviews, searchText, statusFilter]);

  const getStatusClass = (status) => {
    switch (status) {
      case "Scheduled":
        return "scheduled";

      case "Rescheduled":
        return "rescheduled";

      case "Completed":
        return "completed";

      case "Cancelled":
        return "cancelled";

      default:
        return "default";
    }
  };

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "Not available";
    }

    return new Date(dateValue).toLocaleDateString("en-LK", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateValue) => {
    if (!dateValue) {
      return "Not available";
    }

    return new Date(dateValue).toLocaleTimeString("en-LK", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isUpcoming = (dateValue, status) => {
    if (!dateValue) {
      return false;
    }

    return (
      new Date(dateValue) > new Date() &&
      status !== "Completed" &&
      status !== "Cancelled"
    );
  };

  if (loading) {
    return (
      <div className="interviews-state-card">
        <h2>Loading interviews...</h2>
        <p>Please wait while your interview details are loaded.</p>
      </div>
    );
  }

  return (
    <div className="my-interviews-page">
      <section className="interviews-header">
        <div>
          <span className="interviews-label">
            Candidate Interviews
          </span>

          <h2>My Interviews</h2>

          <p>
            View your scheduled, rescheduled and completed
            interviews.
          </p>
        </div>

        <div className="interviews-total">
          <strong>{interviews.length}</strong>
          <span>Total interviews</span>
        </div>
      </section>

      <section className="interviews-toolbar">
        <input
          type="search"
          placeholder="Search by job, type, location or status"
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
          <option value="Scheduled">Scheduled</option>
          <option value="Rescheduled">Rescheduled</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>

        <button
          type="button"
          onClick={loadInterviews}
        >
          Refresh
        </button>
      </section>

      {message && (
        <div
          className={
            isError
              ? "interviews-message error"
              : "interviews-message success"
          }
        >
          {message}
        </div>
      )}

      {filteredInterviews.length === 0 ? (
        <div className="interviews-state-card">
          <h3>No interviews found</h3>
          <p>
            There are no interviews matching the selected filters.
          </p>
        </div>
      ) : (
        <section className="interviews-grid">
          {filteredInterviews.map((interview) => (
            <article
              className="interview-card"
              key={interview.interviewId}
            >
              <div className="interview-card-header">
                <div>
                  <span
                    className={`interview-status ${getStatusClass(
                      interview.status
                    )}`}
                  >
                    {interview.status}
                  </span>

                  <h3>
                    {interview.jobTitle ?? "Unknown Job"}
                  </h3>
                </div>

                {isUpcoming(
                  interview.scheduledDateTime,
                  interview.status
                ) && (
                  <span className="upcoming-badge">
                    Upcoming
                  </span>
                )}
              </div>

              <div className="interview-date-time">
                <div>
                  <span>Date</span>
                  <strong>
                    {formatDate(
                      interview.scheduledDateTime
                    )}
                  </strong>
                </div>

                <div>
                  <span>Time</span>
                  <strong>
                    {formatTime(
                      interview.scheduledDateTime
                    )}
                  </strong>
                </div>
              </div>

              <div className="interview-information">
                <div>
                  <span>Interview Type</span>
                  <strong>
                    {interview.interviewType ??
                      "Not specified"}
                  </strong>
                </div>

                <div>
                  <span>Application ID</span>
                  <strong>
                    #{interview.jobApplicationId}
                  </strong>
                </div>
              </div>

              <div className="interview-location-section">
                <h4>Meeting Link or Location</h4>

                {interview.meetingLinkOrLocation ? (
                  interview.meetingLinkOrLocation.startsWith(
                    "http"
                  ) ? (
                    <a
                      href={
                        interview.meetingLinkOrLocation
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="meeting-link"
                    >
                      Open Meeting Link
                    </a>
                  ) : (
                    <p>
                      {interview.meetingLinkOrLocation}
                    </p>
                  )
                ) : (
                  <p>No meeting link or location provided.</p>
                )}
              </div>

              <div className="interview-notes">
                <h4>Notes</h4>

                <p>
                  {interview.notes ||
                    "No additional notes provided."}
                </p>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

export default MyInterviews;