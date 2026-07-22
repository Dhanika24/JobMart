import {
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom";

import PortalFooter from "../components/common/PortalFooter";
import "./AdminLayout.css";

function AdminLayout() {
  const navigate = useNavigate();

  const adminName =
    localStorage.getItem("jobmartFullName") ||
    "Administrator";

  const getNavLinkClass = ({ isActive }) =>
    isActive
      ? "admin-nav-link active"
      : "admin-nav-link";

  const handleLogout = () => {
    const confirmed = window.confirm(
      "Are you sure you want to log out?"
    );

    if (!confirmed) {
      return;
    }

    localStorage.removeItem("jobmartToken");
    localStorage.removeItem("jobmartRole");
    localStorage.removeItem("jobmartFullName");

    navigate("/login", {
      replace: true,
    });
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-brand-icon">
            J
          </div>

          <div>
            <h1>JobMart</h1>
            <span>Admin Portal</span>
          </div>
        </div>

        <nav className="admin-navigation">
          <p className="admin-nav-section-title">
            MAIN
          </p>

          <NavLink
            to="/admin"
            end
            className={getNavLinkClass}
          >
            <span className="admin-nav-icon">
              ⌂
            </span>

            Dashboard
          </NavLink>

          <p className="admin-nav-section-title">
            USER MANAGEMENT
          </p>

          <NavLink
            to="/admin/users"
            className={getNavLinkClass}
          >
            <span className="admin-nav-icon">
              ◉
            </span>

            User Management
          </NavLink>

          <NavLink
            to="/admin/pending-recruiters"
            className={getNavLinkClass}
          >
            <span className="admin-nav-icon">
              ◷
            </span>

            Pending Recruiters
          </NavLink>

          <NavLink
            to="/admin/create-staff"
            className={getNavLinkClass}
          >
            <span className="admin-nav-icon">
              ＋
            </span>

            Create Staff Account
          </NavLink>

          <p className="admin-nav-section-title">
            ORGANIZATION
          </p>

          <NavLink
            to="/admin/organizations"
            className={getNavLinkClass}
          >
            <span className="admin-nav-icon">
              ◫
            </span>

            Organizations
          </NavLink>

          <NavLink
            to="/admin/departments"
            className={getNavLinkClass}
          >
            <span className="admin-nav-icon">
              ▦
            </span>

            Departments
          </NavLink>

          <NavLink
            to="/admin/staff-assignments"
            className={getNavLinkClass}
          >
            <span className="admin-nav-icon">
              ⇄
            </span>

            Staff Assignments
          </NavLink>

          <p className="admin-nav-section-title">
            SYSTEM
          </p>

          <NavLink
            to="/admin/system-monitoring"
            className={getNavLinkClass}
          >
            <span className="admin-nav-icon">
              ◌
            </span>

            System Monitoring
          </NavLink>

          <p className="admin-nav-section-title">
            REPORTING
          </p>

          <NavLink
            to="/admin/reports"
            className={getNavLinkClass}
          >
            <span className="admin-nav-icon">
              ▤
            </span>

            System Reports
          </NavLink>
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-sidebar-user">
            <div className="admin-user-avatar">
              {adminName
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <strong>{adminName}</strong>

              <span>
                System Administrator
              </span>
            </div>
          </div>

          <button
            type="button"
            className="admin-logout-button"
            onClick={handleLogout}
          >
            Log Out
          </button>
        </div>
      </aside>

      <div className="admin-main-area">
        <header className="admin-topbar">
          <div>
            <span className="admin-topbar-label">
              JobMart Administration
            </span>

            <h2>
              Welcome, {adminName}
            </h2>
          </div>

          <div className="admin-topbar-profile">
            <div className="admin-topbar-avatar">
              {adminName
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <strong>{adminName}</strong>
              <span>Admin</span>
            </div>
          </div>
        </header>

        <main className="admin-content">
          <Outlet />

          <PortalFooter />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;