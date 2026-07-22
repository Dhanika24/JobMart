import { useEffect, useMemo, useState } from "react";
import axiosInstance from "../../api/axiosInstance.js";
import "./RecruiterInterviews.css";

const initialFormData = {
  jobApplicationId: "",
  scheduledDateTime: "",
  interviewType: "Online",
  meetingLinkOrLocation: "",
  notes: "",
  status: "Scheduled",
};

const interviewStatuses = [
  "Scheduled",
  "Rescheduled",
  "Completed",
  "Cancelled",
];

function RecruiterInterviews() {
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [interviews, setInterviews] = useState([]);

  const [selectedJobId, setSelectedJobId] = useState("");
  const [formData, setFormData] = useState(initialFormData);
  const [editingInterviewId, setEditingInterviewId] =
    useState(null);

  const [showForm, setShowForm] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [loading, setLoading] = useState(true);
  const [loadingInterviews, setLoadingInterviews] =
    useState(false);
  const [saving, setSaving] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    setMessage("");
    setIsError(false);

    try {
      const [jobsResponse, applicationsResponse] =
        await Promise.all([
          axiosInstance.get("/Jobs"),
          axiosInstance.get("/Applications/recruiter/all"),
        ]);

      const loadedJobs = jobsResponse.data ?? [];
      const loadedApplications =
        applicationsResponse.data?.applications ?? [];

      setJobs(loadedJobs);
      setApplications(loadedApplications);

      if (loadedJobs.length > 0) {
        const firstJobId = String(loadedJobs[0].jobId);

        setSelectedJobId(firstJobId);
        await loadInterviews(firstJobId);
      }
    } catch (error) {
      console.error(
        "Interview page loading error:",
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

  const loadInterviews = async (jobId) => {
    if (!jobId) {
      setInterviews([]);
      return;
    }

    setLoadingInterviews(true);
    setMessage("");
    setIsError(false);

    try {
      const response = await axiosInstance.get(
        `/Interviews/job/${jobId}`
      );

      setInterviews(response.data?.interviews ?? []);
    } catch (error) {
      console.error("Interview loading error:", error);

      setInterviews([]);
      setIsError(true);
      setMessage(
        error.response?.data?.message ??
          "Unable to load interviews for this job."
      );
    } finally {
      setLoadingInterviews(false);
    }
  };

  const handleJobChange = async (event) => {
    const jobId = event.target.value;

    setSelectedJobId(jobId);
    setShowForm(false);
    setEditingInterviewId(null);
    setFormData(initialFormData);

    await loadInterviews(jobId);
  };

  const eligibleApplications = useMemo(() => {
    return applications.filter((application) => {
      const belongsToSelectedJob =
        String(application.jobId) === selectedJobId;

      const isEligible =
        application.status === "Shortlisted" ||
        application.status === "UnderReview";

      return belongsToSelectedJob && isEligible;
    });
  }, [applications, selectedJobId]);

  const filteredInterviews = useMemo(() => {
    const normalizedSearch = searchText
      .trim()
      .toLowerCase();

    return interviews.filter((interview) => {
      const matchesSearch =
        !normalizedSearch ||
        interview.candidateName
          ?.toLowerCase()
          .includes(normalizedSearch) ||
        interview.candidateEmail
          ?.toLowerCase()
          .includes(normalizedSearch) ||
        interview.interviewType
          ?.toLowerCase()
          .includes(normalizedSearch) ||
        interview.meetingLinkOrLocation
          ?.toLowerCase()
          .includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "All" ||
        interview.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [interviews, searchText, statusFilter]);

  const summary = useMemo(() => {
    const now = new Date();

    return {
      total: interviews.length,

      upcoming: interviews.filter(
        (interview) =>
          new Date(interview.scheduledDateTime) > now &&
          interview.status !== "Cancelled" &&
          interview.status !== "Completed"
      ).length,

      completed: interviews.filter(
        (interview) =>
          interview.status === "Completed"
      ).length,

      cancelled: interviews.filter(
        (interview) =>
          interview.status === "Cancelled"
      ).length,
    };
  }, [interviews]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  const openCreateForm = () => {
    setEditingInterviewId(null);
    setFormData(initialFormData);
    setMessage("");
    setIsError(false);
    setShowForm(true);
  };

  const openEditForm = (interview) => {
    setEditingInterviewId(interview.interviewId);

    setFormData({
      jobApplicationId: String(
        interview.jobApplicationId
      ),

      scheduledDateTime: convertToDateTimeLocal(
        interview.scheduledDateTime
      ),

      interviewType:
        interview.interviewType ?? "Online",

      meetingLinkOrLocation:
        interview.meetingLinkOrLocation ?? "",

      notes: interview.notes ?? "",
      status: interview.status ?? "Scheduled",
    });

    setMessage("");
    setIsError(false);
    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingInterviewId(null);
    setFormData(initialFormData);
  };

  const convertToDateTimeLocal = (dateValue) => {
    if (!dateValue) {
      return "";
    }

    const date = new Date(dateValue);
    const offset = date.getTimezoneOffset() * 60000;

    return new Date(date.getTime() - offset)
      .toISOString()
      .slice(0, 16);
  };

  const validateForm = () => {
    if (!editingInterviewId && !formData.jobApplicationId) {
      return "Please select a candidate application.";
    }

    if (!formData.scheduledDateTime) {
      return "Please select the interview date and time.";
    }

    const selectedDate = new Date(
      formData.scheduledDateTime
    );

    const doesNotRequireFutureDate =
      editingInterviewId &&
      (formData.status === "Completed" ||
        formData.status === "Cancelled");

    if (
      !doesNotRequireFutureDate &&
      selectedDate <= new Date()
    ) {
      return "Interview date and time must be in the future.";
    }

    if (!formData.interviewType.trim()) {
      return "Interview type is required.";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationMessage = validateForm();

    if (validationMessage) {
      setIsError(true);
      setMessage(validationMessage);
      return;
    }

    setSaving(true);
    setMessage("");
    setIsError(false);

    try {
      if (editingInterviewId) {
        const response = await axiosInstance.put(
          `/Interviews/${editingInterviewId}`,
          {
            scheduledDateTime: new Date(
              formData.scheduledDateTime
            ).toISOString(),

            interviewType:
              formData.interviewType.trim(),

            meetingLinkOrLocation:
              formData.meetingLinkOrLocation.trim() ||
              null,

            notes: formData.notes.trim() || null,
            status: formData.status,
          }
        );

        setMessage(
          response.data?.message ??
            "Interview updated successfully."
        );
      } else {
        const response = await axiosInstance.post(
          "/Interviews",
          {
            jobApplicationId: Number(
              formData.jobApplicationId
            ),

            scheduledDateTime: new Date(
              formData.scheduledDateTime
            ).toISOString(),

            interviewType:
              formData.interviewType.trim(),

            meetingLinkOrLocation:
              formData.meetingLinkOrLocation.trim() ||
              null,

            notes: formData.notes.trim() || null,
          }
        );

        setMessage(
          response.data?.message ??
            "Interview scheduled successfully."
        );
      }

      setShowForm(false);
      setEditingInterviewId(null);
      setFormData(initialFormData);

      await loadInterviews(selectedJobId);

      const applicationsResponse =
        await axiosInstance.get(
          "/Applications/recruiter/all"
        );

      setApplications(
        applicationsResponse.data?.applications ?? []
      );
    } catch (error) {
      console.error("Interview saving error:", error);

      const responseData = error.response?.data;

      let errorMessage =
        responseData?.message ??
        "Unable to save the interview.";

      if (responseData?.errors) {
        const validationErrors = Object.values(
          responseData.errors
        )
          .flat()
          .join(" ");

        if (validationErrors) {
          errorMessage = validationErrors;
        }
      }

      setIsError(true);
      setMessage(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const updateInterviewStatus = async (
    interview,
    newStatus
  ) => {
    setProcessingId(interview.interviewId);
    setMessage("");
    setIsError(false);

    try {
      const response = await axiosInstance.put(
        `/Interviews/${interview.interviewId}`,
        {
          scheduledDateTime:
            interview.scheduledDateTime,

          interviewType:
            interview.interviewType,

          meetingLinkOrLocation:
            interview.meetingLinkOrLocation,

          notes: interview.notes,
          status: newStatus,
        }
      );

      setInterviews((previousInterviews) =>
        previousInterviews.map((item) =>
          item.interviewId === interview.interviewId
            ? {
                ...item,
                status: newStatus,
              }
            : item
        )
      );

      setMessage(
        response.data?.message ??
          "Interview status updated successfully."
      );
    } catch (error) {
      console.error(
        "Interview status update error:",
        error
      );

      setIsError(true);
      setMessage(
        error.response?.data?.message ??
          "Unable to update the interview status."
      );
    } finally {
      setProcessingId(null);
    }
  };

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

  const isWebLink = (value) => {
    return (
      value?.startsWith("http://") ||
      value?.startsWith("https://")
    );
  };

  if (loading) {
    return (
      <div className="recruiter-interviews-state">
        <h2>Loading interviews...</h2>
        <p>Please wait while interview data is loaded.</p>
      </div>
    );
  }

  return (
    <div className="recruiter-interviews-page">
      <section className="interviews-page-header">
        <div>
          <span>Interview Management</span>

          <h2>Interviews</h2>

          <p>
            Schedule, reschedule, complete and cancel
            candidate interviews.
          </p>
        </div>

        <button
          type="button"
          className="schedule-interview-main-button"
          onClick={openCreateForm}
          disabled={!selectedJobId}
        >
          Schedule Interview
        </button>
      </section>

      {message && (
        <div
          className={
            isError
              ? "interviews-page-message error"
              : "interviews-page-message success"
          }
        >
          {message}
        </div>
      )}

      <section className="interview-job-selector">
        <div>
          <label htmlFor="interview-job">
            Select job posting
          </label>

          <select
            id="interview-job"
            value={selectedJobId}
            onChange={handleJobChange}
          >
            {jobs.length === 0 && (
              <option value="">
                No job postings available
              </option>
            )}

            {jobs.map((job) => (
              <option
                key={job.jobId}
                value={String(job.jobId)}
              >
                {job.title} — {job.status}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() =>
            loadInterviews(selectedJobId)
          }
          disabled={
            !selectedJobId || loadingInterviews
          }
        >
          {loadingInterviews
            ? "Refreshing..."
            : "Refresh Interviews"}
        </button>
      </section>

      {showForm && (
        <section className="interview-form-card">
          <div className="interview-form-heading">
            <div>
              <h3>
                {editingInterviewId
                  ? "Edit Interview"
                  : "Schedule Interview"}
              </h3>

              <p>
                Enter the interview details below.
              </p>
            </div>

            <button
              type="button"
              onClick={closeForm}
            >
              Close
            </button>
          </div>

          <form
            className="interview-form"
            onSubmit={handleSubmit}
          >
            <div className="interview-form-grid">
              {!editingInterviewId && (
                <div className="interview-form-group full-width">
                  <label htmlFor="jobApplicationId">
                    Candidate application
                  </label>

                  <select
                    id="jobApplicationId"
                    name="jobApplicationId"
                    value={
                      formData.jobApplicationId
                    }
                    onChange={handleChange}
                    required
                  >
                    <option value="">
                      Select shortlisted or reviewed candidate
                    </option>

                    {eligibleApplications.map(
                      (application) => (
                        <option
                          key={
                            application.applicationId
                          }
                          value={String(
                            application.applicationId
                          )}
                        >
                          {application.candidateName} —{" "}
                          {application.status} — AI{" "}
                          {application.aiScore}%
                        </option>
                      )
                    )}
                  </select>

                  {eligibleApplications.length === 0 && (
                    <small>
                      No eligible candidates are available.
                      Mark an application as Shortlisted or
                      Under Review first.
                    </small>
                  )}
                </div>
              )}

              <div className="interview-form-group">
                <label htmlFor="scheduledDateTime">
                  Date and time
                </label>

                <input
                  id="scheduledDateTime"
                  name="scheduledDateTime"
                  type="datetime-local"
                  value={
                    formData.scheduledDateTime
                  }
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="interview-form-group">
                <label htmlFor="interviewType">
                  Interview type
                </label>

                <select
                  id="interviewType"
                  name="interviewType"
                  value={formData.interviewType}
                  onChange={handleChange}
                >
                  <option value="Online">
                    Online
                  </option>

                  <option value="Onsite">
                    Onsite
                  </option>

                  <option value="Telephone">
                    Telephone
                  </option>

                  <option value="Technical">
                    Technical
                  </option>

                  <option value="HR">
                    HR
                  </option>

                  <option value="Panel">
                    Panel
                  </option>
                </select>
              </div>

              <div className="interview-form-group full-width">
                <label htmlFor="meetingLinkOrLocation">
                  Meeting link or location
                </label>

                <input
                  id="meetingLinkOrLocation"
                  name="meetingLinkOrLocation"
                  type="text"
                  placeholder="Google Meet link or office location"
                  value={
                    formData.meetingLinkOrLocation
                  }
                  onChange={handleChange}
                />
              </div>

              {editingInterviewId && (
                <div className="interview-form-group">
                  <label htmlFor="status">
                    Interview status
                  </label>

                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    {interviewStatuses.map(
                      (status) => (
                        <option
                          key={status}
                          value={status}
                        >
                          {status}
                        </option>
                      )
                    )}
                  </select>
                </div>
              )}

              <div className="interview-form-group full-width">
                <label htmlFor="notes">
                  Interview notes
                </label>

                <textarea
                  id="notes"
                  name="notes"
                  rows="5"
                  placeholder="Interview instructions, panel members or preparation details..."
                  value={formData.notes}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="interview-form-actions">
              <button
                type="button"
                className="interview-cancel-form-button"
                onClick={closeForm}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="interview-save-button"
                disabled={
                  saving ||
                  (!editingInterviewId &&
                    eligibleApplications.length === 0)
                }
              >
                {saving
                  ? "Saving..."
                  : editingInterviewId
                    ? "Update Interview"
                    : "Schedule Interview"}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="interview-summary-grid">
        <article>
          <span>Total Interviews</span>
          <strong>{summary.total}</strong>
        </article>

        <article>
          <span>Upcoming</span>
          <strong>{summary.upcoming}</strong>
        </article>

        <article>
          <span>Completed</span>
          <strong>{summary.completed}</strong>
        </article>

        <article>
          <span>Cancelled</span>
          <strong>{summary.cancelled}</strong>
        </article>
      </section>

      <section className="interview-filter-card">
        <input
          type="search"
          placeholder="Search candidate, email, type or location"
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

          {interviewStatuses.map((status) => (
            <option
              key={status}
              value={status}
            >
              {status}
            </option>
          ))}
        </select>
      </section>

      {loadingInterviews ? (
        <div className="recruiter-interviews-state">
          <h3>Loading interviews...</h3>
        </div>
      ) : filteredInterviews.length === 0 ? (
        <div className="recruiter-interviews-state">
          <h3>No interviews found</h3>

          <p>
            Select a job and schedule an interview for an
            eligible candidate.
          </p>
        </div>
      ) : (
        <section className="recruiter-interview-list">
          {filteredInterviews.map((interview) => (
            <article
              key={interview.interviewId}
              className="recruiter-interview-card"
            >
              <div className="interview-card-header">
                <div>
                  <span>
                    Interview #{interview.interviewId}
                  </span>

                  <h3>
                    {interview.candidateName ??
                      "Unknown Candidate"}
                  </h3>

                  <p>
                    {interview.candidateEmail ??
                      "Email not available"}
                  </p>
                </div>

                <span
                  className={`interview-status-badge ${interview.status?.toLowerCase()}`}
                >
                  {interview.status}
                </span>
              </div>

              <div className="interview-information-grid">
                <div>
                  <span>Date and time</span>

                  <strong>
                    {formatDateTime(
                      interview.scheduledDateTime
                    )}
                  </strong>
                </div>

                <div>
                  <span>Interview type</span>

                  <strong>
                    {interview.interviewType}
                  </strong>
                </div>

                <div>
                  <span>Application</span>

                  <strong>
                    #
                    {interview.jobApplicationId}
                  </strong>
                </div>
              </div>

              <div className="interview-location-box">
                <span>Meeting link or location</span>

                {isWebLink(
                  interview.meetingLinkOrLocation
                ) ? (
                  <a
                    href={
                      interview.meetingLinkOrLocation
                    }
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open meeting link
                  </a>
                ) : (
                  <p>
                    {interview.meetingLinkOrLocation ||
                      "Not specified"}
                  </p>
                )}
              </div>

              <div className="interview-notes-box">
                <span>Notes</span>

                <p>
                  {interview.notes ||
                    "No interview notes provided."}
                </p>
              </div>

              <div className="interview-card-actions">
                <button
                  type="button"
                  className="edit-interview-button"
                  onClick={() =>
                    openEditForm(interview)
                  }
                  disabled={
                    processingId ===
                    interview.interviewId
                  }
                >
                  Edit
                </button>

                <button
                  type="button"
                  className="complete-interview-button"
                  onClick={() =>
                    updateInterviewStatus(
                      interview,
                      "Completed"
                    )
                  }
                  disabled={
                    processingId ===
                      interview.interviewId ||
                    interview.status === "Completed" ||
                    interview.status === "Cancelled"
                  }
                >
                  Mark Completed
                </button>

                <button
                  type="button"
                  className="cancel-interview-button"
                  onClick={() =>
                    updateInterviewStatus(
                      interview,
                      "Cancelled"
                    )
                  }
                  disabled={
                    processingId ===
                      interview.interviewId ||
                    interview.status === "Cancelled"
                  }
                >
                  Cancel Interview
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

export default RecruiterInterviews;