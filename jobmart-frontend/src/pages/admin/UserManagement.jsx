import { useEffect, useMemo, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import "./UserManagement.css";

function UserManagement() {
  const [users, setUsers] = useState([]);

  const [searchText, setSearchText] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const [selectedUser, setSelectedUser] = useState(null);
  const [processingUserId, setProcessingUserId] =
    useState(null);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setMessage("");
    setIsError(false);

    try {
      const response = await axiosInstance.get(
        "/AdminUsers"
      );

      const userData =
        response.data?.users ??
        response.data ??
        [];

      setUsers(
        Array.isArray(userData)
          ? userData
          : []
      );

      setSelectedUser((currentUser) => {
        if (!currentUser) {
          return null;
        }

        return (
          userData.find(
            (user) =>
              user.userId === currentUser.userId
          ) ?? null
        );
      });
    } catch (error) {
      console.error(
        "User management loading error:",
        error
      );

      setIsError(true);

      setMessage(
        error.response?.data?.message ??
          "Unable to load user accounts."
      );
    } finally {
      setLoading(false);
    }
  };

  const summary = useMemo(() => {
    return {
      total: users.length,

      active: users.filter(
        (user) => user.isActive
      ).length,

      inactive: users.filter(
        (user) => !user.isActive
      ).length,

      candidates: users.filter(
        (user) => user.role === "Candidate"
      ).length,

      recruiters: users.filter(
        (user) => user.role === "Recruiter"
      ).length,

      managers: users.filter(
        (user) =>
          user.role === "HiringManager"
      ).length,

      admins: users.filter(
        (user) => user.role === "Admin"
      ).length,
    };
  }, [users]);

  const filteredUsers = useMemo(() => {
    const normalizedSearch =
      searchText.trim().toLowerCase();

    return users.filter((user) => {
      const matchesRole =
        roleFilter === "All" ||
        user.role === roleFilter;

      const displayedStatus =
        user.isActive
          ? "Active"
          : "Inactive";

      const matchesStatus =
        statusFilter === "All" ||
        displayedStatus === statusFilter;

      const searchableText = [
        user.fullName,
        user.email,
        user.role,
        displayedStatus,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        normalizedSearch.length === 0 ||
        searchableText.includes(normalizedSearch);

      return (
        matchesRole &&
        matchesStatus &&
        matchesSearch
      );
    });
  }, [
    users,
    searchText,
    roleFilter,
    statusFilter,
  ]);

  const formatRole = (role) => {
    if (role === "HiringManager") {
      return "Hiring Manager";
    }

    return role || "Unknown";
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

  const getRoleClass = (role) => {
    if (role === "HiringManager") {
      return "hiring-manager";
    }

    return String(role ?? "unknown")
      .toLowerCase()
      .replaceAll(" ", "-");
  };

  const activateUser = async (user) => {
    const confirmed = window.confirm(
      `Activate the account for ${user.fullName}?`
    );

    if (!confirmed) {
      return;
    }

    setProcessingUserId(user.userId);
    setMessage("");
    setIsError(false);

    try {
      const response = await axiosInstance.put(
        `/AdminUsers/${user.userId}/activate`
      );

      setMessage(
        response.data?.message ??
          "User account activated successfully."
      );

      await loadUsers();
    } catch (error) {
      console.error(
        "Activate user error:",
        error
      );

      setIsError(true);

      setMessage(
        error.response?.data?.message ??
          "Unable to activate this account."
      );
    } finally {
      setProcessingUserId(null);
    }
  };

  const deactivateUser = async (user) => {
    const confirmed = window.confirm(
      `Deactivate the account for ${user.fullName}? This user will no longer be able to sign in.`
    );

    if (!confirmed) {
      return;
    }

    setProcessingUserId(user.userId);
    setMessage("");
    setIsError(false);

    try {
      const response = await axiosInstance.put(
        `/AdminUsers/${user.userId}/deactivate`
      );

      setMessage(
        response.data?.message ??
          "User account deactivated successfully."
      );

      await loadUsers();
    } catch (error) {
      console.error(
        "Deactivate user error:",
        error
      );

      setIsError(true);

      setMessage(
        error.response?.data?.message ??
          "Unable to deactivate this account."
      );
    } finally {
      setProcessingUserId(null);
    }
  };

  if (loading) {
    return (
      <section className="user-management-state">
        <h2>Loading user accounts...</h2>

        <p>
          Please wait while account information is loaded.
        </p>
      </section>
    );
  }

  return (
    <div className="user-management-page">
      <section className="user-management-heading">
        <div>
          <span>Account Administration</span>

          <h2>User Management</h2>

          <p>
            Search, review, activate and deactivate
            JobMart user accounts.
          </p>
        </div>

        <button
          type="button"
          onClick={loadUsers}
        >
          Refresh Users
        </button>
      </section>

      {message && (
        <div
          className={
            isError
              ? "user-management-message error"
              : "user-management-message success"
          }
        >
          {message}
        </div>
      )}

      <section className="user-management-summary">
        <article>
          <span>Total Users</span>
          <strong>{summary.total}</strong>
        </article>

        <article>
          <span>Active Accounts</span>
          <strong>{summary.active}</strong>
        </article>

        <article>
          <span>Inactive Accounts</span>
          <strong>{summary.inactive}</strong>
        </article>

        <article>
          <span>Candidates</span>
          <strong>{summary.candidates}</strong>
        </article>

        <article>
          <span>Recruiters</span>
          <strong>{summary.recruiters}</strong>
        </article>

        <article>
          <span>Hiring Managers</span>
          <strong>{summary.managers}</strong>
        </article>

        <article>
          <span>Administrators</span>
          <strong>{summary.admins}</strong>
        </article>
      </section>

      <section className="user-management-filters">
        <div className="user-management-search">
          <label htmlFor="userSearch">
            Search users
          </label>

          <input
            id="userSearch"
            type="search"
            placeholder="Search by name, email or role"
            value={searchText}
            onChange={(event) =>
              setSearchText(event.target.value)
            }
          />
        </div>

        <div>
          <label htmlFor="roleFilter">
            User role
          </label>

          <select
            id="roleFilter"
            value={roleFilter}
            onChange={(event) =>
              setRoleFilter(event.target.value)
            }
          >
            <option value="All">All Roles</option>
            <option value="Candidate">Candidate</option>
            <option value="Recruiter">Recruiter</option>
            <option value="HiringManager">
              Hiring Manager
            </option>
            <option value="Admin">Admin</option>
          </select>
        </div>

        <div>
          <label htmlFor="statusFilter">
            Account status
          </label>

          <select
            id="statusFilter"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </section>

      {filteredUsers.length === 0 ? (
        <section className="user-management-state">
          <h2>No users found</h2>

          <p>
            No user accounts match the selected filters.
          </p>
        </section>
      ) : (
        <section className="user-management-table-card">
          <div className="user-management-table-heading">
            <div>
              <h3>User Accounts</h3>

              <p>
                Showing {filteredUsers.length} of{" "}
                {users.length} accounts.
              </p>
            </div>
          </div>

          <div className="user-management-table-wrapper">
            <table className="user-management-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.userId}>
                    <td>
                      <div className="user-management-user">
                        <div className="user-management-avatar">
                          {user.fullName
                            ?.charAt(0)
                            .toUpperCase() ?? "U"}
                        </div>

                        <div>
                          <strong>
                            {user.fullName ??
                              "Unknown User"}
                          </strong>

                          <span>
                            {user.email ??
                              "No email available"}
                          </span>

                          <small>
                            User ID: {user.userId}
                          </small>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span
                        className={`user-role-badge ${getRoleClass(
                          user.role
                        )}`}
                      >
                        {formatRole(user.role)}
                      </span>
                    </td>

                    <td>
                      <span
                        className={
                          user.isActive
                            ? "user-status-badge active"
                            : "user-status-badge inactive"
                        }
                      >
                        {user.isActive
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </td>

                    <td>
                      {formatDate(user.createdAt)}
                    </td>

                    <td>
                      <div className="user-management-actions">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedUser(user)
                          }
                        >
                          View
                        </button>

                        {user.isActive ? (
                          <button
                            type="button"
                            className="danger"
                            disabled={
                              processingUserId ===
                              user.userId
                            }
                            onClick={() =>
                              deactivateUser(user)
                            }
                          >
                            {processingUserId ===
                            user.userId
                              ? "Processing..."
                              : "Deactivate"}
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="success"
                            disabled={
                              processingUserId ===
                              user.userId
                            }
                            onClick={() =>
                              activateUser(user)
                            }
                          >
                            {processingUserId ===
                            user.userId
                              ? "Processing..."
                              : "Activate"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {selectedUser && (
        <div
          className="user-management-modal-overlay"
          role="presentation"
          onClick={() =>
            setSelectedUser(null)
          }
        >
          <section
            className="user-management-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="userDetailsTitle"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="user-management-modal-header">
              <div>
                <span>User Account Details</span>

                <h2 id="userDetailsTitle">
                  {selectedUser.fullName}
                </h2>

                <p>{selectedUser.email}</p>
              </div>

              <button
                type="button"
                aria-label="Close user details"
                onClick={() =>
                  setSelectedUser(null)
                }
              >
                ×
              </button>
            </div>

            <div className="user-management-modal-grid">
              <article>
                <span>User ID</span>
                <strong>{selectedUser.userId}</strong>
              </article>

              <article>
                <span>Role</span>
                <strong>
                  {formatRole(selectedUser.role)}
                </strong>
              </article>

              <article>
                <span>Account Status</span>
                <strong>
                  {selectedUser.isActive
                    ? "Active"
                    : "Inactive"}
                </strong>
              </article>

              <article>
                <span>Created Date</span>
                <strong>
                  {formatDate(
                    selectedUser.createdAt
                  )}
                </strong>
              </article>
            </div>

            <div className="user-management-modal-section">
              <h3>Account Information</h3>

              <p>
                This account belongs to the{" "}
                <strong>
                  {formatRole(selectedUser.role)}
                </strong>{" "}
                role.
              </p>

              <p>
                {selectedUser.isActive
                  ? "The user can currently sign in and access their portal."
                  : "The user cannot currently sign in because the account is inactive."}
              </p>
            </div>

            <div className="user-management-modal-actions">
              {selectedUser.isActive ? (
                <button
                  type="button"
                  className="danger"
                  disabled={
                    processingUserId ===
                    selectedUser.userId
                  }
                  onClick={() =>
                    deactivateUser(selectedUser)
                  }
                >
                  Deactivate Account
                </button>
              ) : (
                <button
                  type="button"
                  className="success"
                  disabled={
                    processingUserId ===
                    selectedUser.userId
                  }
                  onClick={() =>
                    activateUser(selectedUser)
                  }
                >
                  Activate Account
                </button>
              )}

              <button
                type="button"
                onClick={() =>
                  setSelectedUser(null)
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

export default UserManagement;