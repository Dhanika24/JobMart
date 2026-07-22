import { Link } from "react-router-dom";
import "./CandidateDashboard.css";

function CandidateDashboard() {
  const fullName =
    localStorage.getItem("jobmartFullName") ?? "Candidate";

  const dashboardCards = [
    {
      title: "Browse Jobs",
      description: "Find jobs matching your skills and experience.",
      link: "/candidate/jobs",
      buttonText: "View Jobs",
    },
    {
      title: "My Applications",
      description: "Track your submitted job applications.",
      link: "/candidate/applications",
      buttonText: "View Applications",
    },
    {
      title: "My CVs",
      description: "Upload and manage your resumes.",
      link: "/candidate/resumes",
      buttonText: "Manage CVs",
    },
    {
      title: "Interviews",
      description: "Check your upcoming interview schedules.",
      link: "/candidate/interviews",
      buttonText: "View Interviews",
    },
    {
      title: "Notifications",
      description: "View application and interview updates.",
      link: "/candidate/notifications",
      buttonText: "View Notifications",
    },
    {
      title: "My Profile",
      description: "Update your skills, education and experience.",
      link: "/candidate/profile",
      buttonText: "Edit Profile",
    },
  ];

  return (
    <div className="candidate-dashboard-page">
      <section className="candidate-welcome-card">
        <div>
          <span className="welcome-label">Candidate Dashboard</span>

          <h2>Hello, {fullName}</h2>

          <p>
            Manage your profile, applications, interviews and
            notifications from one place.
          </p>
        </div>

        <Link
          to="/candidate/jobs"
          className="welcome-action-button"
        >
          Browse Available Jobs
        </Link>
      </section>

      <section className="dashboard-section">
        <div className="dashboard-section-heading">
          <div>
            <h2>Quick Actions</h2>
            <p>Access the main candidate features.</p>
          </div>
        </div>

        <div className="candidate-dashboard-grid">
          {dashboardCards.map((card) => (
            <article
              className="candidate-dashboard-card"
              key={card.title}
            >
              <div>
                <h3>{card.title}</h3>
                <p>{card.description}</p>
              </div>

              <Link
                to={card.link}
                className="dashboard-card-link"
              >
                {card.buttonText}
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default CandidateDashboard;