import { NavLink, Outlet, useNavigate } from "react-router-dom";
import PortalFooter from "../components/common/PortalFooter";
import "./RecruiterLayout.css";

function RecruiterLayout() {
  const navigate = useNavigate();

  const fullName =
    localStorage.getItem("jobmartFullName") ?? "Recruiter";

  const getLinkClass = ({ isActive }) =>
    isActive
      ? "recruiter-sidebar-link active"
      : "recruiter-sidebar-link";

  const handleLogout = () => {
    localStorage.removeItem("jobmartToken");
    localStorage.removeItem("jobmartRole");
    localStorage.removeItem("jobmartFullName");

    navigate("/login");
  };

  return (
    <div className="recruiter-layout">
      <aside className="recruiter-sidebar">
        <div className="recruiter-sidebar-brand">
          <h2>JobMart</h2>
          <p>Recruiter Portal</p>
        </div>

        <nav className="recruiter-sidebar-navigation">
          <NavLink
            to="/recruiter"
            end
            className={getLinkClass}
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/recruiter/jobs"
            className={getLinkClass}
          >
            Job Postings
          </NavLink>

          <NavLink
            to="/recruiter/applications"
            className={getLinkClass}
          >
            Applications
          </NavLink>

          <NavLink
            to="/recruiter/rankings"
            className={getLinkClass}
          >
            AI Rankings
          </NavLink>

          <NavLink
            to="/recruiter/interviews"
            className={getLinkClass}
          >
            Interviews
          </NavLink>

          <NavLink
            to="/recruiter/communication"
            className={getLinkClass}
          >
            Communication
          </NavLink>

          <NavLink
            to="/recruiter/analytics"
            className={getLinkClass}
          >
            Analytics
          </NavLink>
        </nav>

        <button
          type="button"
          className="recruiter-logout-button"
          onClick={handleLogout}
        >
          Logout
        </button>
      </aside>

      <main className="recruiter-main">
        <header className="recruiter-header">
          <div>
            <h1>Recruiter Portal</h1>
            <p>Welcome back, {fullName}</p>
          </div>

          <div className="recruiter-avatar">
            {fullName.charAt(0).toUpperCase()}
          </div>
        </header>

        <section className="recruiter-content">
          <Outlet />

          <PortalFooter />
        </section>
      </main>
    </div>
  );
}

export default RecruiterLayout;