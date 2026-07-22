import { NavLink, Outlet, useNavigate } from "react-router-dom";
import PortalFooter from "../components/common/PortalFooter";
import "./HiringManagerLayout.css";

function HiringManagerLayout() {
  const navigate = useNavigate();

  const fullName =
    localStorage.getItem("jobmartFullName") ??
    "Hiring Manager";

  const getLinkClass = ({ isActive }) =>
    isActive
      ? "manager-sidebar-link active"
      : "manager-sidebar-link";

  const handleLogout = () => {
    localStorage.removeItem("jobmartToken");
    localStorage.removeItem("jobmartRole");
    localStorage.removeItem("jobmartFullName");

    navigate("/login");
  };

  return (
    <div className="manager-layout">
      <aside className="manager-sidebar">
        <div className="manager-sidebar-brand">
          <h2>JobMart</h2>
          <p>Hiring Manager Portal</p>
        </div>

        <nav className="manager-sidebar-navigation">
          <NavLink
            to="/manager"
            end
            className={getLinkClass}
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/manager/candidates"
            className={getLinkClass}
          >
            Shortlisted Candidates
          </NavLink>

          <NavLink
            to="/manager/evaluations"
            className={getLinkClass}
          >
            Candidate Evaluations
          </NavLink>

          <NavLink
            to="/manager/interviews"
            className={getLinkClass}
          >
            Interview Feedback
          </NavLink>

          <NavLink
            to="/manager/decisions"
            className={getLinkClass}
          >
            Hiring Decisions
          </NavLink>
        </nav>

        <button
          type="button"
          className="manager-logout-button"
          onClick={handleLogout}
        >
          Logout
        </button>
      </aside>

      <main className="manager-main">
        <header className="manager-header">
          <div>
            <h1>Hiring Manager Portal</h1>
            <p>Welcome back, {fullName}</p>
          </div>

          <div className="manager-avatar">
            {fullName.charAt(0).toUpperCase()}
          </div>
        </header>

        <section className="manager-content">
          <Outlet />

          <PortalFooter />
        </section>
      </main>
    </div>
  );
}

export default HiringManagerLayout;