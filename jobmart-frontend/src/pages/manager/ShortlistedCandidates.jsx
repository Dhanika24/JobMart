import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import "./ShortlistedCandidates.css";

function ShortlistedCandidates() {
  const navigate = useNavigate();

  const [candidates, setCandidates] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedCandidate, setSelectedCandidate] =
    useState(null);

  const [loading, setLoading] = useState(true);
  const [downloadingResumeId, setDownloadingResumeId] =
    useState(null);

  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    loadCandidates();
  }, []);

  const loadCandidates = async () => {
    setLoading(true);
    setMessage("");
    setIsError(false);

    try {
      const response = await axiosInstance.get(
        "/Applications/manager/candidates"
      );

      const candidateData =
        response.data?.candidates ??
        response.data ??
        [];

      setCandidates(
        Array.isArray(candidateData)
          ? candidateData
          : []
      );
    } catch (error) {
      console.error(
        "Hiring Manager candidates error:",
        error
      );

      setIsError(true);
      setMessage(
        error.response?.data?.message ??
          "Unable to load shortlisted candidates."
      );
    } finally {
      setLoading(false);
    }
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

    if (status === "Hired") {
      return "Selected";
    }

    return status || "Unknown";
  };

  const getStatusClass = (status) => {
    const normalizedStatus =
      formatStatus(status)
        .toLowerCase()
        .replaceAll(" ", "-");

    return `manager-candidate-status ${normalizedStatus}`;
  };

  const getScoreClass = (score) => {
    const numericScore = Number(score ?? 0);

    if (numericScore >= 80) {
      return "excellent";
    }

    if (numericScore >= 65) {
      return "good";
    }

    if (numericScore >= 50) {
      return "average";
    }

    return "low";
  };

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

  const filteredCandidates = useMemo(() => {
    const normalizedSearch =
      searchText.trim().toLowerCase();

    return candidates.filter((candidate) => {
      const displayedStatus =
        formatStatus(candidate.status);

      const matchesStatus =
        statusFilter === "All" ||
        displayedStatus === statusFilter;

      const searchableText = [
        candidate.candidateName,
        candidate.candidateEmail,
        candidate.currentJobTitle,
        candidate.jobTitle,
        candidate.skills,
        candidate.education,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        normalizedSearch.length === 0 ||
        searchableText.includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [candidates, searchText, statusFilter]);

  const statusOptions = useMemo(() => {
    const uniqueStatuses = candidates
      .map((candidate) =>
        formatStatus(candidate.status)
      )
      .filter(Boolean);

    return [
      "All",
      ...new Set(uniqueStatuses),
    ];
  }, [candidates]);

  const downloadResume = async (candidate) => {
    if (!candidate.primaryResumeId) {
      setIsError(true);
      setMessage(
        "This candidate does not have a primary CV."
      );

      return;
    }

    setDownloadingResumeId(
      candidate.primaryResumeId
    );

    setMessage("");
    setIsError(false);

    try {
      const response = await axiosInstance.get(
        `/Resumes/recruiter/${candidate.primaryResumeId}/download`,
        {
          responseType: "blob",
        }
      );

      const contentDisposition =
        response.headers["content-disposition"];

      let fileName =
        candidate.primaryResumeName ??
        `candidate-cv-${candidate.primaryResumeId}.pdf`;

      if (contentDisposition) {
        const fileNameMatch =
          contentDisposition.match(
            /filename\*?=(?:UTF-8'')?["']?([^;"']+)/i
          );

        if (fileNameMatch?.[1]) {
          fileName = decodeURIComponent(
            fileNameMatch[1].replaceAll('"', "")
          );
        }
      }

      const fileUrl = window.URL.createObjectURL(
        new Blob([response.data])
      );

      const link = document.createElement("a");

      link.href = fileUrl;
      link.download = fileName;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(fileUrl);

      setMessage("CV downloaded successfully.");
    } catch (error) {
      console.error("CV download error:", error);

      setIsError(true);
      setMessage(
        error.response?.data?.message ??
          "Unable to download this candidate's CV."
      );
    } finally {
      setDownloadingResumeId(null);
    }
  };

  const openExternalLink = (url) => {
    if (!url) {
      return;
    }

    const completeUrl =
      url.startsWith("http://") ||
      url.startsWith("https://")
        ? url
        : `https://${url}`;

    window.open(
      completeUrl,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const startEvaluation = (candidate) => {
    navigate(
      `/manager/evaluations?applicationId=${candidate.applicationId}`
    );
  };

  const viewEvaluation = (candidate) => {
    navigate(
      `/manager/evaluations?applicationId=${candidate.applicationId}`
    );
  };

  if (loading) {
    return (
      <section className="manager-candidates-state">
        <h2>Loading candidates...</h2>

        <p>
          Please wait while candidate information is
          loaded.
        </p>
      </section>
    );
  }

  return (
    <div className="shortlisted-candidates-page">
      <section className="manager-candidates-heading">
        <div>
          <span>Candidate Review</span>

          <h2>Shortlisted Candidates</h2>

          <p>
            Review candidate profiles, AI scores, CVs
            and existing evaluation results.
          </p>
        </div>

        <button
          type="button"
          onClick={loadCandidates}
        >
          Refresh Candidates
        </button>
      </section>

      {message && (
        <div
          className={
            isError
              ? "manager-candidates-message error"
              : "manager-candidates-message success"
          }
        >
          {message}
        </div>
      )}

      <section className="manager-candidates-summary">
        <article>
          <span>Total Candidates</span>

          <strong>{candidates.length}</strong>
        </article>

        <article>
          <span>Shortlisted</span>

          <strong>
            {
              candidates.filter(
                (candidate) =>
                  formatStatus(candidate.status) ===
                  "Shortlisted"
              ).length
            }
          </strong>
        </article>

        <article>
          <span>Interview Stage</span>

          <strong>
            {
              candidates.filter((candidate) =>
                [
                  "Interview Scheduled",
                  "Interview Completed",
                ].includes(
                  formatStatus(candidate.status)
                )
              ).length
            }
          </strong>
        </article>

        <article>
          <span>Evaluated</span>

          <strong>
            {
              candidates.filter(
                (candidate) =>
                  candidate.evaluationId != null
              ).length
            }
          </strong>
        </article>
      </section>

      <section className="manager-candidate-filters">
        <div className="manager-candidate-search">
          <label htmlFor="managerCandidateSearch">
            Search candidates
          </label>

          <input
            id="managerCandidateSearch"
            type="search"
            placeholder="Search by name, job, skills or email"
            value={searchText}
            onChange={(event) =>
              setSearchText(event.target.value)
            }
          />
        </div>

        <div className="manager-status-filter">
          <label htmlFor="managerStatusFilter">
            Application status
          </label>

          <select
            id="managerStatusFilter"
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

      {filteredCandidates.length === 0 ? (
        <section className="manager-candidates-state">
          <h2>No candidates found</h2>

          <p>
            No candidates match the selected search and
            status filters.
          </p>
        </section>
      ) : (
        <section className="manager-candidate-grid">
          {filteredCandidates.map((candidate) => (
            <article
              className="manager-candidate-card"
              key={candidate.applicationId}
            >
              <div className="manager-candidate-card-header">
                <div className="manager-candidate-initial">
                  {candidate.candidateName
                    ?.charAt(0)
                    .toUpperCase() ?? "C"}
                </div>

                <div className="manager-candidate-main-info">
                  <h3>
                    {candidate.candidateName ??
                      "Unknown Candidate"}
                  </h3>

                  <p>
                    {candidate.currentJobTitle ||
                      "Job Candidate"}
                  </p>

                  <span>
                    {candidate.candidateEmail ||
                      "No email available"}
                  </span>
                </div>

                <div
                  className={`manager-ai-score ${getScoreClass(
                    candidate.aiScore
                  )}`}
                >
                  <span>AI Score</span>

                  <strong>
                    {Math.round(
                      Number(candidate.aiScore ?? 0)
                    )}
                    %
                  </strong>
                </div>
              </div>

              <div className="manager-candidate-job">
                <div>
                  <span>Applied Position</span>

                  <strong>
                    {candidate.jobTitle ??
                      "Unknown Job"}
                  </strong>
                </div>

                <div>
                  <span>Location</span>

                  <strong>
                    {candidate.jobLocation ||
                      "Not specified"}
                  </strong>
                </div>

                <div>
                  <span>Employment Type</span>

                  <strong>
                    {candidate.employmentType ||
                      "Not specified"}
                  </strong>
                </div>
              </div>

              <div className="manager-candidate-meta">
                <span
                  className={getStatusClass(
                    candidate.status
                  )}
                >
                  {formatStatus(candidate.status)}
                </span>

                <span>
                  {candidate.experienceYears ?? 0} years
                  experience
                </span>

                <span>
                  Applied {formatDate(candidate.appliedAt)}
                </span>
              </div>

              <div className="manager-candidate-skills">
                <h4>Skills</h4>

                <p>
                  {candidate.skills ||
                    "No skills have been added."}
                </p>
              </div>

              <div className="manager-candidate-evaluation">
                {candidate.evaluationId ? (
                  <>
                    <div>
                      <span>Evaluation Score</span>

                      <strong>
                        {candidate.evaluationScore ?? 0}
                      </strong>
                    </div>

                    <div>
                      <span>Decision</span>

                      <strong>
                        {candidate.evaluationDecision ||
                          "Pending"}
                      </strong>
                    </div>
                  </>
                ) : (
                  <p>
                    This candidate has not been evaluated
                    yet.
                  </p>
                )}
              </div>

              <div className="manager-candidate-actions">
                <button
                  type="button"
                  className="primary"
                  onClick={() =>
                    candidate.evaluationId
                      ? viewEvaluation(candidate)
                      : startEvaluation(candidate)
                  }
                >
                  {candidate.evaluationId
                    ? "View Evaluation"
                    : "Start Evaluation"}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedCandidate(candidate)
                  }
                >
                  View Profile
                </button>

                <button
                  type="button"
                  disabled={
                    !candidate.primaryResumeId ||
                    downloadingResumeId ===
                      candidate.primaryResumeId
                  }
                  onClick={() =>
                    downloadResume(candidate)
                  }
                >
                  {downloadingResumeId ===
                  candidate.primaryResumeId
                    ? "Downloading..."
                    : candidate.primaryResumeId
                      ? "Download CV"
                      : "No CV"}
                </button>
              </div>
            </article>
          ))}
        </section>
      )}

      {selectedCandidate && (
        <div
          className="manager-candidate-modal-overlay"
          role="presentation"
          onClick={() =>
            setSelectedCandidate(null)
          }
        >
          <section
            className="manager-candidate-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="candidateProfileTitle"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="manager-candidate-modal-header">
              <div>
                <span>Candidate Profile</span>

                <h2 id="candidateProfileTitle">
                  {selectedCandidate.candidateName}
                </h2>

                <p>
                  {selectedCandidate.candidateEmail}
                </p>
              </div>

              <button
                type="button"
                aria-label="Close candidate profile"
                onClick={() =>
                  setSelectedCandidate(null)
                }
              >
                ×
              </button>
            </div>

            <div className="manager-candidate-profile-grid">
              <article>
                <span>Current Position</span>

                <strong>
                  {selectedCandidate.currentJobTitle ||
                    "Not specified"}
                </strong>
              </article>

              <article>
                <span>Experience</span>

                <strong>
                  {selectedCandidate.experienceYears ?? 0}{" "}
                  years
                </strong>
              </article>

              <article>
                <span>Phone</span>

                <strong>
                  {selectedCandidate.phone ||
                    "Not specified"}
                </strong>
              </article>

              <article>
                <span>Address</span>

                <strong>
                  {selectedCandidate.address ||
                    "Not specified"}
                </strong>
              </article>
            </div>

            <div className="manager-profile-section">
              <h3>Professional Summary</h3>

              <p>
                {selectedCandidate.bio ||
                  "No professional summary has been added."}
              </p>
            </div>

            <div className="manager-profile-section">
              <h3>Education</h3>

              <p>
                {selectedCandidate.education ||
                  "No education information has been added."}
              </p>
            </div>

            <div className="manager-profile-section">
              <h3>Skills</h3>

              <p>
                {selectedCandidate.skills ||
                  "No skills have been added."}
              </p>
            </div>

            <div className="manager-profile-section">
              <h3>Cover Letter</h3>

              <p>
                {selectedCandidate.coverLetter ||
                  "No cover letter was submitted."}
              </p>
            </div>

            <div className="manager-profile-links">
              <button
                type="button"
                disabled={
                  !selectedCandidate.linkedInUrl
                }
                onClick={() =>
                  openExternalLink(
                    selectedCandidate.linkedInUrl
                  )
                }
              >
                Open LinkedIn
              </button>

              <button
                type="button"
                disabled={
                  !selectedCandidate.portfolioUrl
                }
                onClick={() =>
                  openExternalLink(
                    selectedCandidate.portfolioUrl
                  )
                }
              >
                Open Portfolio
              </button>

              <button
                type="button"
                disabled={
                  !selectedCandidate.primaryResumeId
                }
                onClick={() =>
                  downloadResume(selectedCandidate)
                }
              >
                Download CV
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default ShortlistedCandidates;