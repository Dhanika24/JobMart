import { useEffect, useMemo, useState } from "react";
import axiosInstance from "../../api/axiosInstance.js";
import "./RecruiterCommunication.css";

const initialFormData = {
  jobApplicationId: "",
  title: "",
  message: "",
  type: "RecruiterMessage",
};

function RecruiterCommunication() {
  const [applications, setApplications] = useState([]);
  const [sentMessages, setSentMessages] = useState([]);

  const [formData, setFormData] = useState(initialFormData);

  const [searchText, setSearchText] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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
      const [applicationsResponse, sentMessagesResponse] =
        await Promise.all([
          axiosInstance.get("/Applications/recruiter/all"),
          axiosInstance.get("/Notifications/recruiter/sent"),
        ]);

      setApplications(
        applicationsResponse.data?.applications ?? []
      );

      setSentMessages(
        sentMessagesResponse.data?.notifications ?? []
      );
    } catch (error) {
      console.error(
        "Communication page loading error:",
        error
      );

      setIsError(true);
      setMessage(
        error.response?.data?.message ??
          "Unable to load communication information."
      );
    } finally {
      setLoading(false);
    }
  };

  const refreshSentMessages = async () => {
    setRefreshing(true);
    setMessage("");
    setIsError(false);

    try {
      const response = await axiosInstance.get(
        "/Notifications/recruiter/sent"
      );

      setSentMessages(
        response.data?.notifications ?? []
      );
    } catch (error) {
      console.error(
        "Sent messages refresh error:",
        error
      );

      setIsError(true);
      setMessage(
        error.response?.data?.message ??
          "Unable to refresh sent messages."
      );
    } finally {
      setRefreshing(false);
    }
  };

  const candidateOptions = useMemo(() => {
    return applications
      .map((application) => ({
        applicationId: application.applicationId,
        candidateName:
          application.candidateName ??
          "Unknown Candidate",
        candidateEmail:
          application.candidateEmail ?? "",
        jobTitle:
          application.jobTitle ?? "Unknown Job",
        status:
          application.status ?? "Unknown",
      }))
      .sort((first, second) =>
        first.candidateName.localeCompare(
          second.candidateName
        )
      );
  }, [applications]);

  const filteredMessages = useMemo(() => {
    const normalizedSearch = searchText
      .trim()
      .toLowerCase();

    return sentMessages.filter((notification) => {
      const notificationType =
        notification.notificationType ??
        notification.type ??
        "";

      const notificationMessage =
        notification.notificationMessage ??
        notification.message ??
        "";

      const matchesSearch =
        !normalizedSearch ||
        notification.candidateName
          ?.toLowerCase()
          .includes(normalizedSearch) ||
        notification.candidateEmail
          ?.toLowerCase()
          .includes(normalizedSearch) ||
        notification.jobTitle
          ?.toLowerCase()
          .includes(normalizedSearch) ||
        notification.title
          ?.toLowerCase()
          .includes(normalizedSearch) ||
        notificationMessage
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesType =
        typeFilter === "All" ||
        notificationType === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [sentMessages, searchText, typeFilter]);

  const summary = useMemo(() => {
    return {
      total: sentMessages.length,

      recruiterMessages: sentMessages.filter(
        (notification) =>
          (notification.notificationType ??
            notification.type) ===
          "RecruiterMessage"
      ).length,

      applicationUpdates: sentMessages.filter(
        (notification) =>
          (notification.notificationType ??
            notification.type) ===
          "ApplicationUpdate"
      ).length,

      read: sentMessages.filter(
        (notification) => notification.isRead
      ).length,
    };
  }, [sentMessages]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  const applyTemplate = (templateType) => {
    const selectedApplication =
      applications.find(
        (application) =>
          String(application.applicationId) ===
          formData.jobApplicationId
      );

    const candidateName =
      selectedApplication?.candidateName ??
      "Candidate";

    const jobTitle =
      selectedApplication?.jobTitle ??
      "the position";

    if (templateType === "ApplicationUpdate") {
      setFormData((previousData) => ({
        ...previousData,
        title: "Application Update",
        message:
          `Dear ${candidateName},\n\n` +
          `We are writing to update you regarding your application for ${jobTitle}. ` +
          `Your application is currently being reviewed by our recruitment team.\n\n` +
          `Thank you for your patience.\n\nJobMart Recruitment Team`,
        type: "ApplicationUpdate",
      }));
    }

    if (templateType === "InterviewReminder") {
      setFormData((previousData) => ({
        ...previousData,
        title: "Interview Reminder",
        message:
          `Dear ${candidateName},\n\n` +
          `This is a reminder regarding your upcoming interview for ${jobTitle}. ` +
          `Please review your interview details and be ready at the scheduled time.\n\n` +
          `Best regards,\nJobMart Recruitment Team`,
        type: "InterviewReminder",
      }));
    }

    if (templateType === "Shortlisted") {
      setFormData((previousData) => ({
        ...previousData,
        title: "You Have Been Shortlisted",
        message:
          `Dear ${candidateName},\n\n` +
          `Congratulations. You have been shortlisted for ${jobTitle}. ` +
          `We will contact you soon with information about the next stage.\n\n` +
          `Best regards,\nJobMart Recruitment Team`,
        type: "ApplicationUpdate",
      }));
    }

    if (templateType === "Custom") {
      setFormData((previousData) => ({
        ...previousData,
        title: "",
        message: "",
        type: "RecruiterMessage",
      }));
    }
  };

  const validateForm = () => {
    if (!formData.jobApplicationId) {
      return "Please select a candidate application.";
    }

    if (!formData.title.trim()) {
      return "Message title is required.";
    }

    if (!formData.message.trim()) {
      return "Message body is required.";
    }

    if (formData.title.trim().length > 150) {
      return "Message title cannot exceed 150 characters.";
    }

    if (formData.message.trim().length > 2000) {
      return "Message body cannot exceed 2000 characters.";
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

    setSending(true);
    setMessage("");
    setIsError(false);

    try {
      const response = await axiosInstance.post(
        "/Notifications/recruiter/send",
        {
          jobApplicationId: Number(
            formData.jobApplicationId
          ),
          title: formData.title.trim(),
          message: formData.message.trim(),
          type: formData.type,
        }
      );

      setMessage(
        response.data?.message ??
          "Message sent successfully."
      );

      setFormData(initialFormData);

      await refreshSentMessages();
    } catch (error) {
      console.error(
        "Candidate message sending error:",
        error
      );

      const responseData = error.response?.data;

      let errorMessage =
        responseData?.message ??
        "Unable to send the candidate message.";

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
      setSending(false);
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

  const formatType = (type) => {
    if (type === "RecruiterMessage") {
      return "Recruiter Message";
    }

    if (type === "ApplicationUpdate") {
      return "Application Update";
    }

    if (type === "InterviewReminder") {
      return "Interview Reminder";
    }

    return type || "Message";
  };

  if (loading) {
    return (
      <div className="communication-state-card">
        <h2>Loading communication tools...</h2>
        <p>
          Please wait while candidate information is loaded.
        </p>
      </div>
    );
  }

  return (
    <div className="recruiter-communication-page">
      <section className="communication-page-header">
        <div>
          <span>Candidate Communication</span>

          <h2>Communication</h2>

          <p>
            Send candidate notifications and review previous
            recruitment messages.
          </p>
        </div>

        <button
          type="button"
          onClick={refreshSentMessages}
          disabled={refreshing}
        >
          {refreshing
            ? "Refreshing..."
            : "Refresh Messages"}
        </button>
      </section>

      {message && (
        <div
          className={
            isError
              ? "communication-page-message error"
              : "communication-page-message success"
          }
        >
          {message}
        </div>
      )}

      <section className="communication-layout">
        <article className="communication-form-card">
          <div className="communication-section-heading">
            <div>
              <h3>Send Candidate Message</h3>

              <p>
                The candidate will receive this message in
                their Notifications page.
              </p>
            </div>
          </div>

          <form
            className="communication-form"
            onSubmit={handleSubmit}
          >
            <div className="communication-form-group">
              <label htmlFor="jobApplicationId">
                Candidate application
              </label>

              <select
                id="jobApplicationId"
                name="jobApplicationId"
                value={formData.jobApplicationId}
                onChange={handleChange}
                required
              >
                <option value="">
                  Select candidate and job
                </option>

                {candidateOptions.map((application) => (
                  <option
                    key={application.applicationId}
                    value={String(
                      application.applicationId
                    )}
                  >
                    {application.candidateName} —{" "}
                    {application.jobTitle} —{" "}
                    {application.status}
                  </option>
                ))}
              </select>
            </div>

            <div className="communication-template-section">
              <span>Quick templates</span>

              <div>
                <button
                  type="button"
                  onClick={() =>
                    applyTemplate("ApplicationUpdate")
                  }
                >
                  Application Update
                </button>

                <button
                  type="button"
                  onClick={() =>
                    applyTemplate("Shortlisted")
                  }
                >
                  Shortlisted
                </button>

                <button
                  type="button"
                  onClick={() =>
                    applyTemplate("InterviewReminder")
                  }
                >
                  Interview Reminder
                </button>

                <button
                  type="button"
                  onClick={() =>
                    applyTemplate("Custom")
                  }
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="communication-form-group">
              <label htmlFor="type">
                Message type
              </label>

              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
              >
                <option value="RecruiterMessage">
                  Recruiter Message
                </option>

                <option value="ApplicationUpdate">
                  Application Update
                </option>

                <option value="InterviewReminder">
                  Interview Reminder
                </option>
              </select>
            </div>

            <div className="communication-form-group">
              <label htmlFor="title">
                Message title
              </label>

              <input
                id="title"
                name="title"
                type="text"
                maxLength="150"
                placeholder="Application update"
                value={formData.title}
                onChange={handleChange}
                required
              />

              <small>
                {formData.title.length}/150 characters
              </small>
            </div>

            <div className="communication-form-group">
              <label htmlFor="message">
                Message body
              </label>

              <textarea
                id="message"
                name="message"
                rows="10"
                maxLength="2000"
                placeholder="Write the message that should be sent to the candidate..."
                value={formData.message}
                onChange={handleChange}
                required
              />

              <small>
                {formData.message.length}/2000 characters
              </small>
            </div>

            <button
              type="submit"
              className="send-candidate-message-button"
              disabled={sending}
            >
              {sending
                ? "Sending Message..."
                : "Send Message"}
            </button>
          </form>
        </article>

        <aside className="communication-summary-panel">
          <h3>Message Summary</h3>

          <div className="communication-summary-grid">
            <article>
              <span>Total Sent</span>
              <strong>{summary.total}</strong>
            </article>

            <article>
              <span>Recruiter Messages</span>
              <strong>
                {summary.recruiterMessages}
              </strong>
            </article>

            <article>
              <span>Application Updates</span>
              <strong>
                {summary.applicationUpdates}
              </strong>
            </article>

            <article>
              <span>Read by Candidates</span>
              <strong>{summary.read}</strong>
            </article>
          </div>
        </aside>
      </section>

      <section className="sent-messages-section">
        <div className="communication-section-heading">
          <div>
            <h3>Sent Messages</h3>

            <p>
              Review messages previously sent to candidates.
            </p>
          </div>
        </div>

        <div className="communication-filter-card">
          <input
            type="search"
            placeholder="Search candidate, job, title or message"
            value={searchText}
            onChange={(event) =>
              setSearchText(event.target.value)
            }
          />

          <select
            value={typeFilter}
            onChange={(event) =>
              setTypeFilter(event.target.value)
            }
          >
            <option value="All">
              All message types
            </option>

            <option value="RecruiterMessage">
              Recruiter Message
            </option>

            <option value="ApplicationUpdate">
              Application Update
            </option>

            <option value="InterviewReminder">
              Interview Reminder
            </option>
          </select>
        </div>

        {filteredMessages.length === 0 ? (
          <div className="communication-state-card">
            <h3>No sent messages found</h3>

            <p>
              Send a message or change the selected filters.
            </p>
          </div>
        ) : (
          <div className="sent-message-list">
            {filteredMessages.map((notification) => {
              const notificationType =
                notification.notificationType ??
                notification.type;

              const notificationMessage =
                notification.notificationMessage ??
                notification.message;

              return (
                <article
                  key={notification.notificationId}
                  className="sent-message-card"
                >
                  <div className="sent-message-card-header">
                    <div>
                      <span>
                        {formatType(notificationType)}
                      </span>

                      <h3>{notification.title}</h3>

                      <p>
                        To:{" "}
                        <strong>
                          {notification.candidateName}
                        </strong>
                      </p>
                    </div>

                    <span
                      className={
                        notification.isRead
                          ? "message-read-badge read"
                          : "message-read-badge unread"
                      }
                    >
                      {notification.isRead
                        ? "Read"
                        : "Unread"}
                    </span>
                  </div>

                  <div className="sent-message-information">
                    <div>
                      <span>Candidate email</span>

                      <strong>
                        {notification.candidateEmail ||
                          "Not available"}
                      </strong>
                    </div>

                    <div>
                      <span>Job</span>

                      <strong>
                        {notification.jobTitle ||
                          "Not available"}
                      </strong>
                    </div>

                    <div>
                      <span>Sent</span>

                      <strong>
                        {formatDateTime(
                          notification.createdAt
                        )}
                      </strong>
                    </div>
                  </div>

                  <div className="sent-message-body">
                    <span>Message</span>

                    <p>
                      {notificationMessage ||
                        "No message content."}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default RecruiterCommunication;