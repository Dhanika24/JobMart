import { useEffect, useState } from "react";
import {
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  Bell,
  Bot,
  BriefcaseBusiness,
  CalendarDays,
  ChevronRight,
  FileText,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  UserRound,
  X,
} from "lucide-react";

import PortalFooter from "../components/common/PortalFooter";
import "./CandidateLayout.css";

function CandidateLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fullName =
    localStorage.getItem("jobmartFullName")?.trim() ||
    "Candidate";

  const firstName =
    fullName.split(" ")[0] || "Candidate";

  const avatarLetter =
    fullName.charAt(0).toUpperCase() || "C";

  const navigationItems = [
    {
      path: "/candidate",
      label: "Dashboard",
      icon: LayoutDashboard,
      end: true,
    },
    {
      path: "/candidate/profile",
      label: "My Profile",
      icon: UserRound,
    },
    {
      path: "/candidate/jobs",
      label: "Browse Jobs",
      icon: BriefcaseBusiness,
    },
    {
      path: "/candidate/recommendations",
      label: "AI Recommendations",
      icon: Bot,
    },
    {
      path: "/candidate/applications",
      label: "My Applications",
      icon: FileText,
    },
    {
      path: "/candidate/resumes",
      label: "My CVs",
      icon: FileText,
    },
    {
      path: "/candidate/documents",
      label: "Documents",
      icon: FolderOpen,
    },
    {
      path: "/candidate/interviews",
      label: "Interviews",
      icon: CalendarDays,
    },
    {
      path: "/candidate/notifications",
      label: "Notifications",
      icon: Bell,
    },
  ];

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen
      ? "hidden"
      : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  const handleLogout = () => {
    localStorage.removeItem("jobmartToken");
    localStorage.removeItem("jobmartRole");
    localStorage.removeItem("jobmartFullName");

    navigate("/login");
  };

  const getPageName = () => {
    const activeItem = navigationItems.find((item) => {
      if (item.end) {
        return location.pathname === item.path;
      }

      return location.pathname.startsWith(item.path);
    });

    return activeItem?.label || "Candidate Portal";
  };

  return (
    <div className="candidate-layout">
      {sidebarOpen && (
        <button
          type="button"
          className="candidate-sidebar-overlay"
          aria-label="Close navigation menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`candidate-sidebar ${
          sidebarOpen ? "candidate-sidebar-open" : ""
        }`}
      >
        <div className="candidate-sidebar-top">
          <NavLink
            to="/candidate"
            className="candidate-brand"
          >
            <div className="candidate-brand-icon">
              <BriefcaseBusiness
                size={24}
                strokeWidth={2.4}
              />
            </div>

            <div className="candidate-brand-text">
              <strong>JobMart</strong>
              <span>Candidate Portal</span>
            </div>
          </NavLink>

          <button
            type="button"
            className="candidate-sidebar-close"
            aria-label="Close sidebar"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={22} />
          </button>
        </div>

        <div className="candidate-sidebar-profile">
          <div className="candidate-sidebar-avatar">
            {avatarLetter}
          </div>

          <div>
            <strong>{fullName}</strong>
            <span>Job Seeker</span>
          </div>
        </div>

        <p className="candidate-navigation-label">
          MAIN MENU
        </p>

        <nav className="candidate-navigation">
          {navigationItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  isActive
                    ? "candidate-navigation-link active"
                    : "candidate-navigation-link"
                }
              >
                <span className="candidate-navigation-icon">
                  <Icon size={20} strokeWidth={2} />
                </span>

                <span>{item.label}</span>

                <ChevronRight
                  className="candidate-navigation-arrow"
                  size={17}
                />
              </NavLink>
            );
          })}
        </nav>

        <div className="candidate-sidebar-footer">
          <div className="candidate-help-card">
            <div className="candidate-help-icon">
              <Bot size={21} />
            </div>

            <div>
              <strong>Need career help?</strong>

              <p>
                Use AI recommendations to discover suitable
                opportunities.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="candidate-logout-button"
            onClick={handleLogout}
          >
            <LogOut size={19} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <div className="candidate-main">
        <header className="candidate-header">
          <div className="candidate-header-left">
            <button
              type="button"
              className="candidate-menu-button"
              aria-label="Open navigation menu"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={23} />
            </button>

            <div className="candidate-header-title">
              <p>Candidate Workspace</p>
              <h1>{getPageName()}</h1>
            </div>
          </div>

          <div className="candidate-header-actions">
            <div className="candidate-header-search">
              <Search size={19} />

              <input
                type="search"
                placeholder="Search JobMart..."
                aria-label="Search JobMart"
              />
            </div>

            <NavLink
              to="/candidate/notifications"
              className="candidate-header-icon-button"
              aria-label="View notifications"
            >
              <Bell size={21} />
              <span className="candidate-notification-dot" />
            </NavLink>

            <div className="candidate-header-profile">
              <div className="candidate-header-avatar">
                {avatarLetter}
              </div>

              <div className="candidate-header-user">
                <strong>{firstName}</strong>
                <span>Candidate</span>
              </div>
            </div>
          </div>
        </header>

        <main className="candidate-content">
          <div className="candidate-content-container">
            <Outlet />
          </div>

          <PortalFooter />
        </main>
      </div>
    </div>
  );
}

export default CandidateLayout;