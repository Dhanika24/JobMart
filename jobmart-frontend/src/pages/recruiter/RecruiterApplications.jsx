import { useEffect, useMemo, useState } from "react";
import axiosInstance from "../../api/axiosInstance.js";
import "./RecruiterApplications.css";

const applicationStatuses = [
  "Pending",
  "UnderReview",
  "Shortlisted",
  "InterviewScheduled",
  "Rejected",
  "Hired",
];

function RecruiterApplications() {
  const [applications, setApplications] = useState([]);
  const [expandedApplicationId, setExpandedApplicationId] =
    useState(null);

  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [jobFilter, setJobFilter] = useState("All");

  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

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
      const response = await axiosInstance.get(
        "/Applications/recruiter/all"
      );

      setApplications(
        response.data?.applications ?? []
      );
    } catch (error) {
      console.error(
        "Recruiter application loading error:",
        error
      );

      setIsError(true);
      setMessage(
        error.response?.data?.message ??
          "Unable to load candidate applications."
      );
    } finally {
      setLoading(false);
    }
  };

  const jobOptions = useMemo(() => {
    const jobs = applications.map((application) => ({
      jobId: application.jobId,
      jobTitle: application.jobTitle,
    }));

    return Array.from(
      new Map(
        jobs.map((job) => [job.jobId, job])
      ).values()
    );
  }, [applications]);

  const filteredApplications = useMemo(() => {
    const normalizedSearch = searchText
      .trim()
      .toLowerCase();

    return applications.filter((application) => {
      const matchesSearch =
        !normalizedSearch ||
        application.candidateName
          ?.toLowerCase()
          .includes(normalizedSearch) ||
        application.candidateEmail
          ?.toLowerCase()
          .includes(normalizedSearch) ||
        application.jobTitle
          ?.toLowerCase()
          .includes(normalizedSearch) ||
        application.skills
          ?.toLowerCase()
          .includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "All" ||
        application.status === statusFilter;

      const matchesJob =
        jobFilter === "All" ||
        String(application.jobId) === jobFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesJob
      );
    });
  }, [
    applications,
    searchText,
    statusFilter,
    jobFilter,
  ]);

  const summary = useMemo(() => {
    return {
      total: applications.length,

      pending: applications.filter(
        (application) =>
          application.status === "Pending"
      ).length,

      shortlisted: applications.filter(
        (application) =>
          application.status === "Shortlisted"
      ).length,

      hired: applications.filter(
        (application) =>
          application.status === "Hired"
      ).length,
    };
  }, [applications]);

  const updateApplicationStatus = async (
    applicationId,
    newStatus
  ) => {
    setProcessingId(applicationId);
    setMessage("");
    setIsError(false);

    try {
      const response = await axiosInstance.put(
        `/Applications/${applicationId}/status`,
        {
          status: newStatus,
        }
      );

      setApplications((previousApplications) =>
        previousApplications.map((application) =>
          application.applicationId === applicationId
            ? {
                ...application,
                status: newStatus,
              }
            : application
        )
      );

      setMessage(
        response.data?.message ??
          "Application status updated successfully."
      );
    } catch (error) {
      console.error(
        "Application status update error:",
        error
      );

      setIsError(true);
      setMessage(
        error.response?.data?.message ??
          "Unable to update the application status."
      );
    } finally {
      setProcessingId(null);
    }
  };

  const downloadResume = async (application) => {
    if (!application.primaryResumeId) {
      setIsError(true);
      setMessage(
        "This candidate has not uploaded a primary CV."
      );
      return;
    }

    setProcessingId(application.applicationId);
    setMessage("");
    setIsError(false);

    try {
      const response = await axiosInstance.get(
        `/Resumes/recruiter/${application.primaryResumeId}/download`,
        {
          responseType: "blob",
        }
      );

      const fileUrl = window.URL.createObjectURL(
        new Blob([response.data])
      );

      const downloadLink = document.createElement("a");

      downloadLink.href = fileUrl;

      downloadLink.download =
        application.primaryResumeName ??
        "candidate-resume";

      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();

      window.URL.revokeObjectURL(fileUrl);
    } catch (error) {
      console.error(
        "Candidate CV download error:",
        error
      );

      setIsError(true);
      setMessage(
        error.response?.data?.message ??
          "Unable to download the candidate CV."
      );
    } finally {
      setProcessingId(null);
    }
  };

  const toggleApplicationDetails = (applicationId) => {
    setExpandedApplicationId((currentId) =>
      currentId === applicationId
        ? null
        : applicationId
    );
  };

  const formatDate = (dateValue) => {
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

  const getStatusLabel = (status) => {
    if (status === "UnderReview") {
      return "Under Review";
    }

    if (status === "InterviewScheduled") {
      return "Interview Scheduled";
    }

    return status;
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
      <div className="recruiter-applications-state">
        <h2>Loading applications...</h2>

        <p>
          Please wait while candidate applications are
          loaded.
        </p>
      </div>
    );
  }

  return (
    <div className="recruiter-applications-page">
      <section className="applications-page-header">
        <div>
          <span>Candidate Management</span>

          <h2>Applications</h2>

          <p>
            Review candidates, view AI scores, download CVs
            and update application statuses.
          </p>
        </div>

        <button
          type="button"
          className="applications-refresh-main-button"
          onClick={loadApplications}
        >
          Refresh Applications
        </button>
      </section>

      {message && (
        <div
          className={
            isError
              ? "applications-page-message error"
              : "applications-page-message success"
          }
        >
          {message}
        </div>
      )}

      <section className="applications-summary-grid">
        <article>
          <span>Total Applications</span>
          <strong>{summary.total}</strong>
        </article>

        <article>
          <span>Pending</span>
          <strong>{summary.pending}</strong>
        </article>

        <article>
          <span>Shortlisted</span>
          <strong>{summary.shortlisted}</strong>
        </article>

        <article>
          <span>Hired</span>
          <strong>{summary.hired}</strong>
        </article>
      </section>

      <section className="applications-filter-card">
        <input
          type="search"
          placeholder="Search candidate, email, job or skill"
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

          {applicationStatuses.map((status) => (
            <option
              key={status}
              value={status}
            >
              {getStatusLabel(status)}
            </option>
          ))}
        </select>

        <select
          value={jobFilter}
          onChange={(event) =>
            setJobFilter(event.target.value)
          }
        >
          <option value="All">All jobs</option>

          {jobOptions.map((job) => (
            <option
              key={job.jobId}
              value={String(job.jobId)}
            >
              {job.jobTitle}
            </option>
          ))}
        </select>
      </section>

      {filteredApplications.length === 0 ? (
        <div className="recruiter-applications-state">
          <h3>No applications found</h3>

          <p>
            No candidate applications match the selected
            filters.
          </p>
        </div>
      ) : (
        <section className="recruiter-applications-list">
          {filteredApplications.map((application) => {
            const isExpanded =
              expandedApplicationId ===
              application.applicationId;

            return (
              <article
                key={application.applicationId}
                className="recruiter-application-card"
              >
                <div className="application-card-header">
                  <div>
                    <span className="application-number">
                      Application #
                      {application.applicationId}
                    </span>

                    <h3>
                      {application.candidateName}
                    </h3>

                    <p>
                      Applied for{" "}
                      <strong>
                        {application.jobTitle}
                      </strong>
                    </p>
                  </div>

                  <div
                    className={`application-ai-score ${getScoreClass(
                      application.aiScore
                    )}`}
                  >
                    <strong>
                      {application.aiScore}%
                    </strong>

                    <span>AI Score</span>
                  </div>
                </div>

                <div className="application-basic-grid">
                  <div>
                    <span>Email</span>
                    <strong>
                      {application.candidateEmail ||
                        "Not available"}
                    </strong>
                  </div>

                  <div>
                    <span>Experience</span>
                    <strong>
                      {application.experienceYears ?? 0} years
                    </strong>
                  </div>

                  <div>
                    <span>Applied</span>
                    <strong>
                      {formatDate(application.appliedAt)}
                    </strong>
                  </div>

                  <div>
                    <span>Status</span>

                    <strong>
                      {getStatusLabel(application.status)}
                    </strong>
                  </div>
                </div>

                <div className="application-skills-box">
                  <span>Candidate Skills</span>

                  <p>
                    {application.skills ||
                      "No skills provided."}
                  </p>
                </div>

                <div className="application-status-control">
                  <label
                    htmlFor={`status-${application.applicationId}`}
                  >
                    Update status
                  </label>

                  <select
                    id={`status-${application.applicationId}`}
                    value={application.status}
                    disabled={
                      processingId ===
                      application.applicationId
                    }
                    onChange={(event) =>
                      updateApplicationStatus(
                        application.applicationId,
                        event.target.value
                      )
                    }
                  >
                    {applicationStatuses.map((status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {getStatusLabel(status)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="application-card-actions">
                  <button
                    type="button"
                    className="application-details-button"
                    onClick={() =>
                      toggleApplicationDetails(
                        application.applicationId
                      )
                    }
                  >
                    {isExpanded
                      ? "Hide Details"
                      : "View Details"}
                  </button>

                  <button
                    type="button"
                    className="application-cv-button"
                    disabled={
                      processingId ===
                        application.applicationId ||
                      !application.primaryResumeId
                    }
                    onClick={() =>
                      downloadResume(application)
                    }
                  >
                    {application.primaryResumeId
                      ? "Download Primary CV"
                      : "No Primary CV"}
                  </button>

                  <button
                    type="button"
                    className="application-shortlist-button"
                    disabled={
                      processingId ===
                      application.applicationId
                    }
                    onClick={() =>
                      updateApplicationStatus(
                        application.applicationId,
                        "Shortlisted"
                      )
                    }
                  >
                    Shortlist
                  </button>

                  <button
                    type="button"
                    className="application-reject-button"
                    disabled={
                      processingId ===
                      application.applicationId
                    }
                    onClick={() =>
                      updateApplicationStatus(
                        application.applicationId,
                        "Rejected"
                      )
                    }
                  >
                    Reject
                  </button>
                </div>

                {isExpanded && (
                  <section className="application-expanded-details">
                    <div className="application-detail-grid">
                      <div>
                        <span>Current job title</span>

                        <strong>
                          {application.currentJobTitle ||
                            "Not specified"}
                        </strong>
                      </div>

                      <div>
                        <span>Phone</span>

                        <strong>
                          {application.phone ||
                            "Not specified"}
                        </strong>
                      </div>

                      <div>
                        <span>Education</span>

                        <strong>
                          {application.education ||
                            "Not specified"}
                        </strong>
                      </div>

                      <div>
                        <span>Primary CV</span>

                        <strong>
                          {application.primaryResumeName ||
                            "Not uploaded"}
                        </strong>
                      </div>
                    </div>

                    <div className="application-detail-section">
                      <h4>Professional Bio</h4>

                      <p>
                        {application.bio ||
                          "No professional bio provided."}
                      </p>
                    </div>

                    <div className="application-detail-section">
                      <h4>Cover Letter</h4>

                      <p>
                        {application.coverLetter ||
                          "No cover letter provided."}
                      </p>
                    </div>

                    <div className="application-profile-links">
                      {application.linkedInUrl && (
                        <a
                          href={application.linkedInUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open LinkedIn
                        </a>
                      )}

                      {application.portfolioUrl && (
                        <a
                          href={application.portfolioUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open Portfolio
                        </a>
                      )}
                    </div>
                  </section>
                )}
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}

export default RecruiterApplications;