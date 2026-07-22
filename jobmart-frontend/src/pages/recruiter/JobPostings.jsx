import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import axiosInstance from "../../api/axiosInstance.js";
import "./JobPostings.css";

const initialFormData = {
  title: "",
  description: "",
  requirements: "",
  location: "",
  employmentType: "Full-Time",
  salaryMin: "",
  salaryMax: "",
  deadline: "",
  status: "Open",
};

function JobPostings() {
  const [jobs, setJobs] = useState([]);

  const [summary, setSummary] = useState({
    totalJobs: 0,
    openJobs: 0,
    closedJobs: 0,
    draftJobs: 0,
  });

  const [formData, setFormData] =
    useState(initialFormData);

  const [editingJobId, setEditingJobId] =
    useState(null);

  const [showForm, setShowForm] =
    useState(false);

  const [searchText, setSearchText] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [processingId, setProcessingId] =
    useState(null);

  const [message, setMessage] =
    useState("");

  const [isError, setIsError] =
    useState(false);

  const getErrorMessage = (error) => {
    const responseData =
      error.response?.data;

    if (responseData?.errors) {
      const validationErrors =
        Object.values(
          responseData.errors
        )
          .flat()
          .join(" ");

      if (validationErrors) {
        return validationErrors;
      }
    }

    return (
      responseData?.message ||
      error.message ||
      "An unexpected error occurred."
    );
  };

  const loadJobs =
    useCallback(async () => {
      setLoading(true);
      setMessage("");
      setIsError(false);

      try {
        const response =
          await axiosInstance.get(
            "/Jobs/my"
          );

        const responseData =
          response.data ?? {};

        setJobs(
          responseData.jobs ?? []
        );

        setSummary({
          totalJobs:
            responseData.totalJobs ?? 0,

          openJobs:
            responseData.openJobs ?? 0,

          closedJobs:
            responseData.closedJobs ?? 0,

          draftJobs:
            responseData.draftJobs ?? 0,
        });
      } catch (error) {
        console.error(
          "Job loading error:",
          error
        );

        setIsError(true);

        setMessage(
          getErrorMessage(error)
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const filteredJobs =
    useMemo(() => {
      const normalizedSearch =
        searchText
          .trim()
          .toLowerCase();

      return jobs.filter((job) => {
        const matchesSearch =
          !normalizedSearch ||
          job.title
            ?.toLowerCase()
            .includes(
              normalizedSearch
            ) ||
          job.location
            ?.toLowerCase()
            .includes(
              normalizedSearch
            ) ||
          job.employmentType
            ?.toLowerCase()
            .includes(
              normalizedSearch
            ) ||
          job.description
            ?.toLowerCase()
            .includes(
              normalizedSearch
            ) ||
          job.organizationName
            ?.toLowerCase()
            .includes(
              normalizedSearch
            ) ||
          job.departmentName
            ?.toLowerCase()
            .includes(
              normalizedSearch
            );

        const matchesStatus =
          statusFilter === "All" ||
          job.status === statusFilter;

        return (
          matchesSearch &&
          matchesStatus
        );
      });
    }, [
      jobs,
      searchText,
      statusFilter,
    ]);

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setFormData(
      (previousData) => ({
        ...previousData,
        [name]: value,
      })
    );
  };

  const openCreateForm = () => {
    setEditingJobId(null);

    setFormData(
      initialFormData
    );

    setMessage("");
    setIsError(false);
    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const openEditForm = (job) => {
    setEditingJobId(job.jobId);

    setFormData({
      title:
        job.title ?? "",

      description:
        job.description ?? "",

      requirements:
        job.requirements ?? "",

      location:
        job.location ?? "",

      employmentType:
        job.employmentType ??
        "Full-Time",

      salaryMin:
        job.salaryMin ?? "",

      salaryMax:
        job.salaryMax ?? "",

      deadline:
        convertToDateTimeLocal(
          job.deadline
        ),

      status:
        job.status ?? "Open",
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
    setEditingJobId(null);

    setFormData(
      initialFormData
    );
  };

  const convertToDateTimeLocal = (
    dateValue
  ) => {
    if (!dateValue) {
      return "";
    }

    const date =
      new Date(dateValue);

    const timezoneOffset =
      date.getTimezoneOffset() *
      60000;

    return new Date(
      date.getTime() -
        timezoneOffset
    )
      .toISOString()
      .slice(0, 16);
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      return "Job title is required.";
    }

    if (!formData.description.trim()) {
      return "Job description is required.";
    }

    if (!formData.deadline) {
      return "Application deadline is required.";
    }

    if (
      new Date(
        formData.deadline
      ).getTime() <=
      new Date().getTime()
    ) {
      return "Deadline must be in the future.";
    }

    const minimumSalary =
      formData.salaryMin === ""
        ? null
        : Number(
            formData.salaryMin
          );

    const maximumSalary =
      formData.salaryMax === ""
        ? null
        : Number(
            formData.salaryMax
          );

    if (
      minimumSalary !== null &&
      minimumSalary < 0
    ) {
      return "Minimum salary cannot be negative.";
    }

    if (
      maximumSalary !== null &&
      maximumSalary < 0
    ) {
      return "Maximum salary cannot be negative.";
    }

    if (
      minimumSalary !== null &&
      maximumSalary !== null &&
      maximumSalary <
        minimumSalary
    ) {
      return "Maximum salary must be greater than or equal to minimum salary.";
    }

    return "";
  };

  const buildRequestBody = () => ({
    title:
      formData.title.trim(),

    description:
      formData.description.trim(),

    requirements:
      formData.requirements
        .trim() || null,

    location:
      formData.location
        .trim() || null,

    employmentType:
      formData.employmentType
        .trim() || null,

    salaryMin:
      formData.salaryMin === ""
        ? null
        : Number(
            formData.salaryMin
          ),

    salaryMax:
      formData.salaryMax === ""
        ? null
        : Number(
            formData.salaryMax
          ),

    deadline:
      new Date(
        formData.deadline
      ).toISOString(),

    status:
      formData.status,
  });

  const handleSubmit =
    async (event) => {
      event.preventDefault();

      const validationMessage =
        validateForm();

      if (validationMessage) {
        setIsError(true);
        setMessage(
          validationMessage
        );

        return;
      }

      setSaving(true);
      setMessage("");
      setIsError(false);

      const wasEditing =
        editingJobId !== null;

      try {
        const requestBody =
          buildRequestBody();

        let response;

        if (wasEditing) {
          response =
            await axiosInstance.put(
              `/Jobs/${editingJobId}`,
              requestBody
            );
        } else {
          response =
            await axiosInstance.post(
              "/Jobs",
              requestBody
            );
        }

        closeForm();

        await loadJobs();

        setIsError(false);

        setMessage(
          response.data?.message ||
            (wasEditing
              ? "Job updated successfully."
              : "Job created successfully.")
        );
      } catch (error) {
        console.error(
          "Job saving error:",
          error
        );

        setIsError(true);

        setMessage(
          getErrorMessage(error)
        );
      } finally {
        setSaving(false);
      }
    };

  const updateJobStatus =
    async (job, newStatus) => {
      setProcessingId(
        job.jobId
      );

      setMessage("");
      setIsError(false);

      try {
        const response =
          await axiosInstance.put(
            `/Jobs/${job.jobId}/status`,
            {
              status: newStatus,
            }
          );

        await loadJobs();

        setIsError(false);

        setMessage(
          response.data?.message ||
            `Job marked as ${newStatus}.`
        );
      } catch (error) {
        console.error(
          "Job status update error:",
          error
        );

        setIsError(true);

        setMessage(
          getErrorMessage(error)
        );
      } finally {
        setProcessingId(null);
      }
    };

  const deleteJob =
    async (job) => {
      const confirmed =
        window.confirm(
          `Delete the job "${job.title}"?`
        );

      if (!confirmed) {
        return;
      }

      setProcessingId(
        job.jobId
      );

      setMessage("");
      setIsError(false);

      try {
        const response =
          await axiosInstance.delete(
            `/Jobs/${job.jobId}`
          );

        await loadJobs();

        if (
          editingJobId ===
          job.jobId
        ) {
          closeForm();
        }

        setIsError(false);

        setMessage(
          response.data?.message ||
            "Job deleted successfully."
        );
      } catch (error) {
        console.error(
          "Job deletion error:",
          error
        );

        setIsError(true);

        setMessage(
          getErrorMessage(error)
        );
      } finally {
        setProcessingId(null);
      }
    };

  const formatSalary = (
    minimum,
    maximum
  ) => {
    if (
      minimum == null &&
      maximum == null
    ) {
      return "Not specified";
    }

    const formatter =
      new Intl.NumberFormat(
        "en-LK",
        {
          style: "currency",
          currency: "LKR",
          maximumFractionDigits: 0,
        }
      );

    if (
      minimum != null &&
      maximum != null
    ) {
      return `${formatter.format(
        minimum
      )} - ${formatter.format(
        maximum
      )}`;
    }

    if (minimum != null) {
      return `From ${formatter.format(
        minimum
      )}`;
    }

    return `Up to ${formatter.format(
      maximum
    )}`;
  };

  const formatDate = (
    dateValue
  ) => {
    if (!dateValue) {
      return "Not available";
    }

    return new Date(
      dateValue
    ).toLocaleDateString(
      "en-LK",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    );
  };

  const getDisplayedStatus = (
    job
  ) => {
    const deadlineExpired =
      new Date(job.deadline) <
      new Date();

    if (
      deadlineExpired &&
      job.status === "Open"
    ) {
      return "Expired";
    }

    return job.status;
  };

  if (loading) {
    return (
      <div className="job-postings-state-card">
        <h2>
          Loading job postings...
        </h2>

        <p>
          Please wait while your job
          postings are loaded.
        </p>
      </div>
    );
  }

  return (
    <div className="job-postings-page">
      <section className="job-postings-header">
        <div>
          <span>
            Recruitment Management
          </span>

          <h2>Job Postings</h2>

          <p>
            Create and manage job
            postings for your assigned
            organization and department.
          </p>
        </div>

        <button
          type="button"
          className="create-job-button"
          onClick={openCreateForm}
        >
          Create New Job
        </button>
      </section>

      {message && (
        <div
          className={
            isError
              ? "job-postings-message error"
              : "job-postings-message success"
          }
          role={
            isError
              ? "alert"
              : "status"
          }
        >
          {message}
        </div>
      )}

      {showForm && (
        <section className="job-form-card">
          <div className="job-form-heading">
            <div>
              <h3>
                {editingJobId
                  ? "Edit Job Posting"
                  : "Create Job Posting"}
              </h3>

              <p>
                Your organization and
                department are assigned
                automatically from your
                Recruiter profile.
              </p>
            </div>

            <button
              type="button"
              className="close-job-form-button"
              onClick={closeForm}
            >
              Close
            </button>
          </div>

          <form
            className="job-posting-form"
            onSubmit={handleSubmit}
          >
            <div className="job-form-grid">
              <div className="job-form-group">
                <label htmlFor="title">
                  Job title
                </label>

                <input
                  id="title"
                  name="title"
                  type="text"
                  maxLength={150}
                  placeholder="Software Engineer"
                  value={
                    formData.title
                  }
                  onChange={
                    handleChange
                  }
                  required
                />
              </div>

              <div className="job-form-group">
                <label htmlFor="location">
                  Location
                </label>

                <input
                  id="location"
                  name="location"
                  type="text"
                  maxLength={150}
                  placeholder="Colombo"
                  value={
                    formData.location
                  }
                  onChange={
                    handleChange
                  }
                />
              </div>

              <div className="job-form-group">
                <label htmlFor="employmentType">
                  Employment type
                </label>

                <select
                  id="employmentType"
                  name="employmentType"
                  value={
                    formData.employmentType
                  }
                  onChange={
                    handleChange
                  }
                >
                  <option value="Full-Time">
                    Full-Time
                  </option>

                  <option value="Part-Time">
                    Part-Time
                  </option>

                  <option value="Contract">
                    Contract
                  </option>

                  <option value="Internship">
                    Internship
                  </option>

                  <option value="Remote">
                    Remote
                  </option>
                </select>
              </div>

              <div className="job-form-group">
                <label htmlFor="deadline">
                  Application deadline
                </label>

                <input
                  id="deadline"
                  name="deadline"
                  type="datetime-local"
                  value={
                    formData.deadline
                  }
                  onChange={
                    handleChange
                  }
                  required
                />
              </div>

              <div className="job-form-group">
                <label htmlFor="salaryMin">
                  Minimum salary
                </label>

                <input
                  id="salaryMin"
                  name="salaryMin"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="100000"
                  value={
                    formData.salaryMin
                  }
                  onChange={
                    handleChange
                  }
                />
              </div>

              <div className="job-form-group">
                <label htmlFor="salaryMax">
                  Maximum salary
                </label>

                <input
                  id="salaryMax"
                  name="salaryMax"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="200000"
                  value={
                    formData.salaryMax
                  }
                  onChange={
                    handleChange
                  }
                />
              </div>

              <div className="job-form-group">
                <label htmlFor="status">
                  Job status
                </label>

                <select
                  id="status"
                  name="status"
                  value={
                    formData.status
                  }
                  onChange={
                    handleChange
                  }
                >
                  <option value="Open">
                    Open
                  </option>

                  <option value="Draft">
                    Draft
                  </option>

                  <option value="Closed">
                    Closed
                  </option>
                </select>
              </div>

              <div className="job-form-group full-width">
                <label htmlFor="description">
                  Job description
                </label>

                <textarea
                  id="description"
                  name="description"
                  rows={5}
                  placeholder="Describe the position and responsibilities..."
                  value={
                    formData.description
                  }
                  onChange={
                    handleChange
                  }
                  required
                />
              </div>

              <div className="job-form-group full-width">
                <label htmlFor="requirements">
                  Job requirements
                </label>

                <textarea
                  id="requirements"
                  name="requirements"
                  rows={5}
                  placeholder="C#, React, SQL Server, experience and education requirements..."
                  value={
                    formData.requirements
                  }
                  onChange={
                    handleChange
                  }
                />

                <small>
                  These requirements are
                  used by the AI candidate
                  ranking system.
                </small>
              </div>
            </div>

            <div className="job-form-actions">
              <button
                type="button"
                className="cancel-job-button"
                onClick={closeForm}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="save-job-button"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingJobId
                    ? "Update Job"
                    : "Create Job"}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="job-posting-summary-grid">
        <article>
          <span>Total Jobs</span>

          <strong>
            {summary.totalJobs}
          </strong>
        </article>

        <article>
          <span>Open Jobs</span>

          <strong>
            {summary.openJobs}
          </strong>
        </article>

        <article>
          <span>Closed Jobs</span>

          <strong>
            {summary.closedJobs}
          </strong>
        </article>

        <article>
          <span>Draft Jobs</span>

          <strong>
            {summary.draftJobs}
          </strong>
        </article>
      </section>

      <section className="job-postings-toolbar">
        <input
          type="search"
          placeholder="Search jobs, organization or department"
          value={searchText}
          onChange={(event) =>
            setSearchText(
              event.target.value
            )
          }
        />

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(
              event.target.value
            )
          }
        >
          <option value="All">
            All statuses
          </option>

          <option value="Open">
            Open
          </option>

          <option value="Closed">
            Closed
          </option>

          <option value="Draft">
            Draft
          </option>
        </select>

        <button
          type="button"
          onClick={loadJobs}
          disabled={loading}
        >
          Refresh
        </button>
      </section>

      {filteredJobs.length === 0 ? (
        <div className="job-postings-state-card">
          <h3>
            No job postings found
          </h3>

          <p>
            Create a new job or change
            the selected search filters.
          </p>
        </div>
      ) : (
        <section className="job-postings-list">
          {filteredJobs.map(
            (job) => {
              const displayedStatus =
                getDisplayedStatus(
                  job
                );

              const isProcessing =
                processingId ===
                job.jobId;

              return (
                <article
                  key={job.jobId}
                  className="recruiter-job-card"
                >
                  <div className="recruiter-job-card-header">
                    <div>
                      <span className="job-number">
                        Job #{job.jobId}
                      </span>

                      <h3>
                        {job.title}
                      </h3>

                      <div className="job-meta">
                        <span>
                          {job.location ||
                            "Location not specified"}
                        </span>

                        <span>
                          {job.employmentType ||
                            "Type not specified"}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`job-status-badge ${displayedStatus
                        .toLowerCase()
                        .replaceAll(
                          " ",
                          "-"
                        )}`}
                    >
                      {displayedStatus}
                    </span>
                  </div>

                  <p className="job-description">
                    {job.description ||
                      "No description provided."}
                  </p>

                  <div className="job-information-grid">
                    <div>
                      <span>
                        Organization
                      </span>

                      <strong>
                        {job.organizationName ||
                          "Not Assigned"}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Department
                      </span>

                      <strong>
                        {job.departmentName ||
                          "Not Assigned"}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Applications
                      </span>

                      <strong>
                        {job.totalApplications ??
                          0}
                      </strong>
                    </div>

                    <div>
                      <span>Salary</span>

                      <strong>
                        {formatSalary(
                          job.salaryMin,
                          job.salaryMax
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>Deadline</span>

                      <strong>
                        {formatDate(
                          job.deadline
                        )}
                      </strong>
                    </div>

                    <div>
                      <span>Created</span>

                      <strong>
                        {formatDate(
                          job.createdAt
                        )}
                      </strong>
                    </div>
                  </div>

                  <div className="job-requirements">
                    <strong>
                      Requirements
                    </strong>

                    <p>
                      {job.requirements ||
                        "No requirements provided."}
                    </p>
                  </div>

                  <div className="recruiter-job-actions">
                    <button
                      type="button"
                      className="edit-job-button"
                      onClick={() =>
                        openEditForm(job)
                      }
                      disabled={
                        isProcessing
                      }
                    >
                      Edit
                    </button>

                    {job.status !== "Open" && (
                      <button
                        type="button"
                        className="open-job-button"
                        onClick={() =>
                          updateJobStatus(
                            job,
                            "Open"
                          )
                        }
                        disabled={
                          isProcessing
                        }
                      >
                        {isProcessing
                          ? "Working..."
                          : "Open Job"}
                      </button>
                    )}

                    {job.status !== "Draft" && (
                      <button
                        type="button"
                        className="open-job-button"
                        onClick={() =>
                          updateJobStatus(
                            job,
                            "Draft"
                          )
                        }
                        disabled={
                          isProcessing
                        }
                      >
                        {isProcessing
                          ? "Working..."
                          : "Move to Draft"}
                      </button>
                    )}

                    {job.status !== "Closed" && (
                      <button
                        type="button"
                        className="close-job-button"
                        onClick={() =>
                          updateJobStatus(
                            job,
                            "Closed"
                          )
                        }
                        disabled={
                          isProcessing
                        }
                      >
                        {isProcessing
                          ? "Working..."
                          : "Close Job"}
                      </button>
                    )}

                    <button
                      type="button"
                      className="delete-job-button"
                      onClick={() =>
                        deleteJob(job)
                      }
                      disabled={
                        isProcessing
                      }
                    >
                      {isProcessing
                        ? "Working..."
                        : "Delete"}
                    </button>
                  </div>
                </article>
              );
            }
          )}
        </section>
      )}
    </div>
  );
}

export default JobPostings;