import { useEffect, useMemo, useState } from "react";
import axiosInstance from "../../api/axiosInstance.js";
import "./BrowseJobs.css";

function BrowseJobs() {
  const [jobs, setJobs] = useState([]);
  const [myApplications, setMyApplications] = useState([]);
  const [searchText, setSearchText] = useState("");

  const [selectedJob, setSelectedJob] = useState(null);
  const [coverLetter, setCoverLetter] = useState("");

  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);

  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    loadPageData();
  }, []);

  const loadPageData = async () => {
    setLoading(true);
    setMessage("");
    setIsError(false);

    try {
      const [jobsResponse, applicationsResponse] =
        await Promise.all([
          axiosInstance.get("/Jobs"),
          axiosInstance.get("/Applications/my"),
        ]);

      setJobs(jobsResponse.data ?? []);
      setMyApplications(applicationsResponse.data ?? []);
    } catch (error) {
      console.error("Browse jobs loading error:", error);

      const errorMessage =
        error.response?.data?.message ??
        "Unable to load jobs. Check whether the backend is running.";

      setIsError(true);
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const appliedJobIds = useMemo(() => {
    return new Set(
      myApplications.map((application) => application.jobId)
    );
  }, [myApplications]);

  const availableJobs = useMemo(() => {
    const currentTime = new Date();
    const normalizedSearch = searchText
      .trim()
      .toLowerCase();

    return jobs.filter((job) => {
      const isOpen =
        job.status?.toLowerCase() === "open";

      const deadlineIsValid =
        new Date(job.deadline) > currentTime;

      const searchableText = [
        job.title,
        job.description,
        job.requirements,
        job.location,
        job.employmentType,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        normalizedSearch.length === 0 ||
        searchableText.includes(normalizedSearch);

      return isOpen && deadlineIsValid && matchesSearch;
    });
  }, [jobs, searchText]);

  const openApplicationForm = (job) => {
    setSelectedJob(job);
    setCoverLetter("");
    setMessage("");
    setIsError(false);
  };

  const closeApplicationForm = () => {
    if (applying) {
      return;
    }

    setSelectedJob(null);
    setCoverLetter("");
  };

  const handleApply = async (event) => {
    event.preventDefault();

    if (!selectedJob) {
      return;
    }

    setApplying(true);
    setMessage("");
    setIsError(false);

    try {
      const response = await axiosInstance.post(
        "/Applications",
        {
          jobId: selectedJob.jobId,
          coverLetter: coverLetter.trim(),
        }
      );

      setMessage(
        response.data?.message ??
          "Application submitted successfully."
      );

      setMyApplications((previousApplications) => [
        ...previousApplications,
        {
          jobId: selectedJob.jobId,
        },
      ]);

      setSelectedJob(null);
      setCoverLetter("");
    } catch (error) {
      console.error("Application submission error:", error);

      const errorMessage =
        error.response?.data?.message ??
        "Unable to submit the application.";

      setIsError(true);
      setMessage(errorMessage);
    } finally {
      setApplying(false);
    }
  };

  const formatSalary = (minimum, maximum) => {
    if (minimum == null && maximum == null) {
      return "Not specified";
    }

    const formatter = new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      maximumFractionDigits: 0,
    });

    if (minimum != null && maximum != null) {
      return `${formatter.format(minimum)} - ${formatter.format(
        maximum
      )}`;
    }

    if (minimum != null) {
      return `From ${formatter.format(minimum)}`;
    }

    return `Up to ${formatter.format(maximum)}`;
  };

  const formatDate = (dateValue) => {
    return new Date(dateValue).toLocaleDateString("en-LK", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="jobs-state-card">
        <h2>Loading jobs...</h2>
        <p>Please wait while available jobs are loaded.</p>
      </div>
    );
  }

  return (
    <div className="browse-jobs-page">
      <section className="jobs-page-header">
        <div>
          <span className="jobs-page-label">
            Candidate Opportunities
          </span>

          <h2>Browse Available Jobs</h2>

          <p>
            Search for suitable positions and submit your
            application.
          </p>
        </div>

        <div className="jobs-count">
          <strong>{availableJobs.length}</strong>
          <span>Open jobs</span>
        </div>
      </section>

      <section className="jobs-search-section">
        <input
          type="search"
          placeholder="Search by title, skill, location or employment type"
          value={searchText}
          onChange={(event) =>
            setSearchText(event.target.value)
          }
        />

        <button
          type="button"
          className="jobs-refresh-button"
          onClick={loadPageData}
        >
          Refresh
        </button>
      </section>

      {message && (
        <div
          className={
            isError
              ? "jobs-message error"
              : "jobs-message success"
          }
        >
          {message}
        </div>
      )}

      {availableJobs.length === 0 ? (
        <div className="jobs-state-card">
          <h3>No open jobs found</h3>
          <p>
            Try another search term or check again later.
          </p>
        </div>
      ) : (
        <section className="jobs-grid">
          {availableJobs.map((job) => {
            const alreadyApplied =
              appliedJobIds.has(job.jobId);

            return (
              <article
                className="job-card"
                key={job.jobId}
              >
                <div className="job-card-top">
                  <div>
                    <span className="job-status-badge">
                      {job.status}
                    </span>

                    <h3>{job.title}</h3>
                  </div>

                  <span className="job-type-badge">
                    {job.employmentType ??
                      "Not specified"}
                  </span>
                </div>

                <div className="job-information">
                  <p>
                    <strong>Location:</strong>{" "}
                    {job.location ?? "Not specified"}
                  </p>

                  <p>
                    <strong>Salary:</strong>{" "}
                    {formatSalary(
                      job.salaryMin,
                      job.salaryMax
                    )}
                  </p>

                  <p>
                    <strong>Deadline:</strong>{" "}
                    {formatDate(job.deadline)}
                  </p>
                </div>

                <div className="job-description">
                  <h4>Description</h4>
                  <p>{job.description}</p>
                </div>

                <div className="job-requirements">
                  <h4>Requirements</h4>
                  <p>
                    {job.requirements ??
                      "No requirements specified."}
                  </p>
                </div>

                <button
                  type="button"
                  className={
                    alreadyApplied
                      ? "job-apply-button applied"
                      : "job-apply-button"
                  }
                  disabled={alreadyApplied}
                  onClick={() =>
                    openApplicationForm(job)
                  }
                >
                  {alreadyApplied
                    ? "Already Applied"
                    : "Apply Now"}
                </button>
              </article>
            );
          })}
        </section>
      )}

      {selectedJob && (
        <div
          className="application-modal-overlay"
          onMouseDown={closeApplicationForm}
        >
          <div
            className="application-modal"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <div className="application-modal-header">
              <div>
                <span>Apply for</span>
                <h3>{selectedJob.title}</h3>
              </div>

              <button
                type="button"
                className="modal-close-button"
                onClick={closeApplicationForm}
                disabled={applying}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleApply}>
              <div className="application-form-group">
                <label htmlFor="coverLetter">
                  Cover letter
                </label>

                <textarea
                  id="coverLetter"
                  rows="8"
                  maxLength="2000"
                  placeholder="Explain why you are suitable for this job..."
                  value={coverLetter}
                  onChange={(event) =>
                    setCoverLetter(event.target.value)
                  }
                />
              </div>

              <div className="cover-letter-counter">
                {coverLetter.length}/2000
              </div>

              <div className="application-modal-actions">
                <button
                  type="button"
                  className="cancel-application-button"
                  onClick={closeApplicationForm}
                  disabled={applying}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="submit-application-button"
                  disabled={applying}
                >
                  {applying
                    ? "Submitting..."
                    : "Submit Application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default BrowseJobs;