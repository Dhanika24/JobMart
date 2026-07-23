import { useEffect, useMemo, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import "./PendingRecruiters.css";

function PendingRecruiters() {
  const [recruiters, setRecruiters] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [selectedRecruiter, setSelectedRecruiter] =
    useState(null);

  const [loading, setLoading] = useState(true);
  const [processingUserId, setProcessingUserId] =
    useState(null);

  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    loadPendingRecruiters();
  }, []);

  const loadPendingRecruiters = async () => {
    setLoading(true);
    setMessage("");
    setIsError(false);

    try {
      const response = await axiosInstance.get(
        "/AdminUsers/pending-recruiters"
      );

      const recruiterData =
        response.data?.recruiters ??
        response.data ??
        [];

      const normalizedRecruiters =
        Array.isArray(recruiterData)
          ? recruiterData
          : [];

      setRecruiters(normalizedRecruiters);

      setSelectedRecruiter(
        (currentRecruiter) => {
          if (!currentRecruiter) {
            return null;
          }

          return (
            normalizedRecruiters.find(
              (recruiter) =>
                recruiter.userId ===
                currentRecruiter.userId
            ) ?? null
          );
        }
      );
    } catch (error) {
      console.error(
        "Pending Recruiters loading error:",
        error
      );

      setIsError(true);

      setMessage(
        error.response?.data?.message ??
          "Unable to load pending Recruiter accounts."
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredRecruiters = useMemo(() => {
    const normalizedSearch =
      searchText.trim().toLowerCase();

    if (!normalizedSearch) {
      return recruiters;
    }

    return recruiters.filter((recruiter) => {
      const searchableText = [
        recruiter.fullName,
        recruiter.email,
        recruiter.role,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(
        normalizedSearch
      );
    });
  }, [recruiters, searchText]);

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "Not available";
    }

    return new Date(
      dateValue
    ).toLocaleDateString("en-LK", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (dateValue) => {
    if (!dateValue) {
      return "Not available";
    }

    return new Date(
      dateValue
    ).toLocaleString("en-LK", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPendingDuration = (dateValue) => {
    if (!dateValue) {
      return "Unknown";
    }

    const createdDate = new Date(dateValue);
    const currentDate = new Date();

    const difference =
      currentDate.getTime() -
      createdDate.getTime();

    const days = Math.max(
      0,
      Math.floor(
        difference /
          (1000 * 60 * 60 * 24)
      )
    );

    if (days === 0) {
      return "Less than 1 day";
    }

    if (days === 1) {
      return "1 day";
    }

    return `${days} days`;
  };

  const approveRecruiter = async (
    recruiter
  ) => {
    const confirmed = window.confirm(
      `Approve the Recruiter account for ${recruiter.fullName}?`
    );

    if (!confirmed) {
      return;
    }

    setProcessingUserId(
      recruiter.userId
    );

    setMessage("");
    setIsError(false);

    try {
      const response =
        await axiosInstance.put(
          `/AdminUsers/${recruiter.userId}/approve`
        );

      setMessage(
        response.data?.message ??
          "Recruiter account approved successfully."
      );

      setSelectedRecruiter(null);

      await loadPendingRecruiters();
    } catch (error) {
      console.error(
        "Approve Recruiter error:",
        error
      );

      setIsError(true);

      setMessage(
        error.response?.data?.message ??
          "Unable to approve this Recruiter account."
      );
    } finally {
      setProcessingUserId(null);
    }
  };

  if (loading) {
    return (
      <section className="pending-recruiters-state">
        <h2>
          Loading pending Recruiters...
        </h2>

        <p>
          Please wait while approval requests
          are loaded.
        </p>
      </section>
    );
  }

  return (
    <div className="pending-recruiters-page">
      <section className="pending-recruiters-heading">
        <div>
          <span>
            Recruiter Approvals
          </span>

          <h2>Pending Recruiters</h2>

          <p>
            Review and approve newly registered
            Recruiter accounts.
          </p>
        </div>

        <button
          type="button"
          onClick={loadPendingRecruiters}
        >
          Refresh Requests
        </button>
      </section>

      {message && (
        <div
          className={
            isError
              ? "pending-recruiters-message error"
              : "pending-recruiters-message success"
          }
        >
          {message}
        </div>
      )}

      <section className="pending-recruiters-summary">
        <article>
          <span>
            Pending Requests
          </span>

          <strong>
            {recruiters.length}
          </strong>
        </article>

        <article>
          <span>
            Visible Results
          </span>

          <strong>
            {filteredRecruiters.length}
          </strong>
        </article>

        <article>
          <span>
            Account Status
          </span>

          <strong>Inactive</strong>
        </article>

        <article>
          <span>
            Approval Action
          </span>

          <strong>Admin Only</strong>
        </article>
      </section>

      <section className="pending-recruiters-toolbar">
        <div>
          <label htmlFor="recruiterSearch">
            Search Recruiters
          </label>

          <input
            id="recruiterSearch"
            type="search"
            placeholder="Search by name or email"
            value={searchText}
            onChange={(event) =>
              setSearchText(
                event.target.value
              )
            }
          />
        </div>
      </section>

      {filteredRecruiters.length === 0 ? (
        <section className="pending-recruiters-state">
          <h2>
            No pending Recruiters
          </h2>

          <p>
            There are currently no Recruiter
            accounts waiting for approval.
          </p>
        </section>
      ) : (
        <section className="pending-recruiters-card">
          <div className="pending-recruiters-card-heading">
            <div>
              <h3>
                Approval Requests
              </h3>

              <p>
                Showing{" "}
                {
                  filteredRecruiters.length
                }{" "}
                pending account requests.
              </p>
            </div>
          </div>

          <div className="pending-recruiters-list">
            {filteredRecruiters.map(
              (recruiter) => (
                <article
                  key={recruiter.userId}
                  className="pending-recruiter-item"
                >
                  <div className="pending-recruiter-avatar">
                    {recruiter.fullName
                      ?.charAt(0)
                      .toUpperCase() ?? "R"}
                  </div>

                  <div className="pending-recruiter-information">
                    <div className="pending-recruiter-name-row">
                      <div>
                        <h3>
                          {
                            recruiter.fullName
                          }
                        </h3>

                        <p>
                          {recruiter.email}
                        </p>
                      </div>

                      <span>
                        Awaiting Approval
                      </span>
                    </div>

                    <div className="pending-recruiter-meta">
                      <article>
                        <span>
                          User ID
                        </span>

                        <strong>
                          {
                            recruiter.userId
                          }
                        </strong>
                      </article>

                      <article>
                        <span>
                          Role
                        </span>

                        <strong>
                          Recruiter
                        </strong>
                      </article>

                      <article>
                        <span>
                          Registered
                        </span>

                        <strong>
                          {formatDate(
                            recruiter.createdAt
                          )}
                        </strong>
                      </article>

                      <article>
                        <span>
                          Waiting Time
                        </span>

                        <strong>
                          {getPendingDuration(
                            recruiter.createdAt
                          )}
                        </strong>
                      </article>
                    </div>
                  </div>

                  <div className="pending-recruiter-actions">
                    <button
                      type="button"
                      className="view"
                      onClick={() =>
                        setSelectedRecruiter(
                          recruiter
                        )
                      }
                    >
                      View Details
                    </button>

                    <button
                      type="button"
                      className="approve"
                      disabled={
                        processingUserId ===
                        recruiter.userId
                      }
                      onClick={() =>
                        approveRecruiter(
                          recruiter
                        )
                      }
                    >
                      {processingUserId ===
                      recruiter.userId
                        ? "Approving..."
                        : "Approve Recruiter"}
                    </button>
                  </div>
                </article>
              )
            )}
          </div>
        </section>
      )}

      {selectedRecruiter && (
        <div
          className="pending-recruiter-modal-overlay"
          role="presentation"
          onClick={() =>
            setSelectedRecruiter(null)
          }
        >
          <section
            className="pending-recruiter-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pendingRecruiterTitle"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="pending-recruiter-modal-header">
              <div>
                <span>
                  Recruiter Registration
                </span>

                <h2 id="pendingRecruiterTitle">
                  {
                    selectedRecruiter.fullName
                  }
                </h2>

                <p>
                  {selectedRecruiter.email}
                </p>
              </div>

              <button
                type="button"
                aria-label="Close Recruiter details"
                onClick={() =>
                  setSelectedRecruiter(
                    null
                  )
                }
              >
                ×
              </button>
            </div>

            <div className="pending-recruiter-modal-grid">
              <article>
                <span>User ID</span>

                <strong>
                  {
                    selectedRecruiter.userId
                  }
                </strong>
              </article>

              <article>
                <span>Account Role</span>

                <strong>
                  Recruiter
                </strong>
              </article>

              <article>
                <span>Status</span>

                <strong>
                  Pending Approval
                </strong>
              </article>

              <article>
                <span>
                  Registered Date
                </span>

                <strong>
                  {formatDateTime(
                    selectedRecruiter.createdAt
                  )}
                </strong>
              </article>

              <article>
                <span>
                  Waiting Time
                </span>

                <strong>
                  {getPendingDuration(
                    selectedRecruiter.createdAt
                  )}
                </strong>
              </article>

              <article>
                <span>
                  Login Access
                </span>

                <strong>
                  Currently Blocked
                </strong>
              </article>
            </div>

            <div className="pending-recruiter-modal-notice">
              <h3>
                Approval Information
              </h3>

              <p>
                Approving this request will
                activate the Recruiter account.
                The user will then be able to
                sign in and access the Recruiter
                portal.
              </p>
            </div>

            <div className="pending-recruiter-modal-actions">
              <button
                type="button"
                className="approve"
                disabled={
                  processingUserId ===
                  selectedRecruiter.userId
                }
                onClick={() =>
                  approveRecruiter(
                    selectedRecruiter
                  )
                }
              >
                {processingUserId ===
                selectedRecruiter.userId
                  ? "Approving..."
                  : "Approve Account"}
              </button>

              <button
                type="button"
                onClick={() =>
                  setSelectedRecruiter(
                    null
                  )
                }
              >
                Close
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default PendingRecruiters;