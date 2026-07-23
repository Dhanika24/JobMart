import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import "./AdminDashboard.css";

function AdminDashboard() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [pendingRecruiters, setPendingRecruiters] =
    useState([]);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    setMessage("");
    setIsError(false);

    try {
      const [
        usersResponse,
        pendingResponse,
      ] = await Promise.all([
        axiosInstance.get("/AdminUsers"),
        axiosInstance.get(
          "/AdminUsers/pending-recruiters"
        ),
      ]);

      const userData =
        usersResponse.data?.users ??
        usersResponse.data ??
        [];

      const pendingData =
        pendingResponse.data?.recruiters ??
        pendingResponse.data ??
        [];

      setUsers(
        Array.isArray(userData)
          ? userData
          : []
      );

      setPendingRecruiters(
        Array.isArray(pendingData)
          ? pendingData
          : []
      );
    } catch (error) {
      console.error(
        "Admin dashboard error:",
        error
      );

      setIsError(true);

      setMessage(
        error.response?.data?.message ??
          "Unable to load Admin dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  const summary = useMemo(() => {
    const countRole = (role) =>
      users.filter(
        (user) => user.role === role
      ).length;

    return {
      total: users.length,
      active: users.filter(
        (user) => user.isActive
      ).length,
      inactive: users.filter(
        (user) => !user.isActive
      ).length,
      candidates: countRole("Candidate"),
      recruiters: countRole("Recruiter"),
      managers: countRole("HiringManager"),
      admins: countRole("Admin"),
    };
  }, [users]);

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

  const approveRecruiter = async (userId) => {
    setMessage("");
    setIsError(false);

    try {
      const response = await axiosInstance.put(
        `/AdminUsers/${userId}/approve`
      );

      setMessage(
        response.data?.message ??
          "Recruiter approved successfully."
      );

      await loadDashboard();
    } catch (error) {
      console.error(
        "Approve Recruiter error:",
        error
      );

      setIsError(true);

      setMessage(
        error.response?.data?.message ??
          "Unable to approve Recruiter."
      );
    }
  };

  if (loading) {
    return (
      <section className="admin-dashboard-state">
        <h2>Loading Admin dashboard...</h2>

        <p>
          Please wait while user information is loaded.
        </p>
      </section>
    );
  }

  return (
    <div className="admin-dashboard">
      <section className="admin-dashboard-hero">
        <div>
          <span>System Administration</span>

          <h2>Admin Dashboard</h2>

          <p>
            Manage user accounts, approve Recruiters and
            monitor JobMart system access.
          </p>
        </div>

        <button
          type="button"
          onClick={loadDashboard}
        >
          Refresh Dashboard
        </button>
      </section>

      {message && (
        <div
          className={
            isError
              ? "admin-dashboard-message error"
              : "admin-dashboard-message success"
          }
        >
          {message}
        </div>
      )}

      <section className="admin-dashboard-summary">
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
          <span>Pending Recruiters</span>
          <strong>{pendingRecruiters.length}</strong>
        </article>
      </section>

      <section className="admin-role-summary">
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

      <section className="admin-dashboard-actions">
        <button
          type="button"
          onClick={() =>
            navigate("/admin/users")
          }
        >
          <strong>User Management</strong>

          <span>
            View, search, activate and deactivate users.
          </span>
        </button>

        <button
          type="button"
          onClick={() =>
            navigate("/admin/pending-recruiters")
          }
        >
          <strong>Pending Recruiters</strong>

          <span>
            Review and approve Recruiter registrations.
          </span>
        </button>

        <button
          type="button"
          onClick={() =>
            navigate("/admin/create-staff")
          }
        >
          <strong>Create Staff Account</strong>

          <span>
            Create Hiring Manager or Admin accounts.
          </span>
        </button>

        <button
          type="button"
          onClick={() =>
            navigate("/admin/reports")
          }
        >
          <strong>System Reports</strong>

          <span>
            View account and recruitment statistics.
          </span>
        </button>
      </section>

      <section className="admin-dashboard-grid">
        <article className="admin-dashboard-card">
          <div className="admin-dashboard-card-heading">
            <div>
              <h3>Pending Recruiter Requests</h3>

              <p>
                Recruiters waiting for account approval.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate("/admin/pending-recruiters")
              }
            >
              View All
            </button>
          </div>

          {pendingRecruiters.length === 0 ? (
            <div className="admin-dashboard-empty">
              No Recruiter accounts are waiting for
              approval.
            </div>
          ) : (
            <div className="admin-pending-list">
              {pendingRecruiters
                .slice(0, 5)
                .map((recruiter) => (
                  <article key={recruiter.userId}>
                    <div className="admin-user-avatar">
                      {recruiter.fullName
                        ?.charAt(0)
                        .toUpperCase() ?? "R"}
                    </div>

                    <div>
                      <h4>{recruiter.fullName}</h4>

                      <p>{recruiter.email}</p>

                      <small>
                        Registered{" "}
                        {formatDate(
                          recruiter.createdAt
                        )}
                      </small>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        approveRecruiter(
                          recruiter.userId
                        )
                      }
                    >
                      Approve
                    </button>
                  </article>
                ))}
            </div>
          )}
        </article>

        <article className="admin-dashboard-card">
          <div className="admin-dashboard-card-heading">
            <div>
              <h3>Recently Registered Users</h3>

              <p>
                Latest user accounts created in JobMart.
              </p>
            </div>
          </div>

          {users.length === 0 ? (
            <div className="admin-dashboard-empty">
              No users are available.
            </div>
          ) : (
            <div className="admin-recent-user-list">
              {users
                .slice(0, 6)
                .map((user) => (
                  <article key={user.userId}>
                    <div className="admin-user-avatar">
                      {user.fullName
                        ?.charAt(0)
                        .toUpperCase() ?? "U"}
                    </div>

                    <div>
                      <h4>{user.fullName}</h4>

                      <p>{user.email}</p>

                      <small>{user.role}</small>
                    </div>

                    <span
                      className={
                        user.isActive
                          ? "admin-account-status active"
                          : "admin-account-status inactive"
                      }
                    >
                      {user.isActive
                        ? "Active"
                        : "Inactive"}
                    </span>
                  </article>
                ))}
            </div>
          )}
        </article>
      </section>
    </div>
  );
}

export default AdminDashboard;