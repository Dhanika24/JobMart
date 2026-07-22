import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Bot,
  BriefcaseBusiness,
  Building2,
  CalendarCheck,
  CheckCircle2,
  FileSearch,
  FileText,
  LockKeyhole,
  Search,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
  WandSparkles,
} from "lucide-react";
import PublicFooter from "../../components/public/PublicFooter";
import PublicNavbar from "../../components/public/PublicNavbar";
import "./LandingPage.css";

function LandingPage() {
  const features = [
    {
      icon: FileSearch,
      title: "AI Resume Analysis",
      description:
        "Parse resumes, extract skills and organize candidate information automatically.",
    },
    {
      icon: WandSparkles,
      title: "Intelligent Job Matching",
      description:
        "Recommend suitable vacancies using candidate skills, experience and profile data.",
    },
    {
      icon: UserCheck,
      title: "Candidate Ranking",
      description:
        "Support recruiters with automated screening, matching scores and structured shortlisting.",
    },
    {
      icon: CalendarCheck,
      title: "Interview Management",
      description:
        "Schedule interviews, manage feedback and monitor hiring decisions from one platform.",
    },
    {
      icon: BarChart3,
      title: "Recruitment Analytics",
      description:
        "Track applications, hiring performance, candidate activity and recruitment trends.",
    },
    {
      icon: ShieldCheck,
      title: "Secure Role Access",
      description:
        "Protect platform functions using JWT authentication and role-based access control.",
    },
  ];

  const roles = [
    {
      icon: BriefcaseBusiness,
      title: "Candidates",
      description:
        "Create profiles, upload resumes, search jobs, receive recommendations and track applications.",
      button: "Create Candidate Account",
      link: "/register",
    },
    {
      icon: Users,
      title: "Recruiters",
      description:
        "Publish vacancies, review applications, rank candidates and organize interviews.",
      button: "Register as Recruiter",
      link: "/register",
    },
    {
      icon: Building2,
      title: "Hiring Teams",
      description:
        "Review shortlisted candidates, submit evaluations and manage final hiring decisions.",
      button: "Access Platform",
      link: "/login",
    },
  ];

  return (
    <div className="landing-page">
      <PublicNavbar />

      <main>
        <section
          id="home"
          className="landing-hero"
        >
          <div className="landing-hero-container">
            <div className="landing-hero-content">
              <span className="landing-hero-badge">
                <Sparkles size={16} />
                AI-Powered Recruitment Ecosystem
              </span>

              <h1>
                Build better teams with{" "}
                <span>intelligent recruitment</span>
              </h1>

              <p>
                JobMart connects candidates, recruiters and
                hiring managers through one secure platform
                for job matching, screening, interviews and
                recruitment analytics.
              </p>

              <div className="landing-hero-actions">
                <Link
                  to="/register"
                  className="landing-primary-button"
                >
                  Create Free Account
                  <ArrowRight size={18} />
                </Link>

                <Link
                  to="/login"
                  className="landing-secondary-button"
                >
                  Login to JobMart
                </Link>
              </div>

              <div className="landing-hero-benefits">
                <span>
                  <CheckCircle2 size={17} />
                  Secure authentication
                </span>

                <span>
                  <CheckCircle2 size={17} />
                  AI matching
                </span>

                <span>
                  <CheckCircle2 size={17} />
                  Role-based portals
                </span>
              </div>
            </div>

            <div className="landing-hero-visual">
              <div className="landing-visual-main-card">
                <div className="landing-visual-heading">
                  <div>
                    <span>Recruitment Overview</span>
                    <strong>Talent Pipeline</strong>
                  </div>

                  <Bot size={24} />
                </div>

                <div className="landing-visual-stats">
                  <article>
                    <span>Applications</span>
                    <strong>1,248</strong>
                    <small>+18% this month</small>
                  </article>

                  <article>
                    <span>Shortlisted</span>
                    <strong>326</strong>
                    <small>AI screened</small>
                  </article>
                </div>

                <div className="landing-candidate-list">
                  <article>
                    <span className="landing-candidate-avatar">
                      A
                    </span>

                    <div>
                      <strong>Amaya Silva</strong>
                      <small>Full-Stack Developer</small>
                    </div>

                    <span className="landing-match-score">
                      94%
                    </span>
                  </article>

                  <article>
                    <span className="landing-candidate-avatar">
                      N
                    </span>

                    <div>
                      <strong>Nimal Perera</strong>
                      <small>Cloud Engineer</small>
                    </div>

                    <span className="landing-match-score">
                      89%
                    </span>
                  </article>

                  <article>
                    <span className="landing-candidate-avatar">
                      S
                    </span>

                    <div>
                      <strong>Sarah Fernando</strong>
                      <small>Quality Engineer</small>
                    </div>

                    <span className="landing-match-score">
                      86%
                    </span>
                  </article>
                </div>
              </div>

              <div className="landing-floating-card landing-floating-ai">
                <Bot size={21} />
                <div>
                  <strong>AI Screening</strong>
                  <span>Ranking completed</span>
                </div>
              </div>

              <div className="landing-floating-card landing-floating-secure">
                <LockKeyhole size={20} />
                <div>
                  <strong>Protected</strong>
                  <span>Role-based access</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-statistics">
          <div className="landing-section-container">
            <article>
              <strong>4</strong>
              <span>Role-Based Portals</span>
            </article>

            <article>
              <strong>AI</strong>
              <span>Candidate Matching</span>
            </article>

            <article>
              <strong>24/7</strong>
              <span>Platform Availability</span>
            </article>

            <article>
              <strong>100%</strong>
              <span>Responsive Experience</span>
            </article>
          </div>
        </section>

        <section
          id="features"
          className="landing-section landing-features"
        >
          <div className="landing-section-container">
            <div className="landing-section-heading">
              <span>Platform Capabilities</span>

              <h2>
                Everything needed for a modern recruitment
                lifecycle
              </h2>

              <p>
                Manage candidates, applications, interviews
                and hiring decisions using a connected
                recruitment platform.
              </p>
            </div>

            <div className="landing-features-grid">
              {features.map((feature) => {
                const Icon = feature.icon;

                return (
                  <article key={feature.title}>
                    <div className="landing-feature-icon">
                      <Icon size={24} />
                    </div>

                    <h3>{feature.title}</h3>

                    <p>{feature.description}</p>

                    <span>
                      Explore capability
                      <ArrowRight size={15} />
                    </span>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section
          id="roles"
          className="landing-section landing-role-section"
        >
          <div className="landing-section-container">
            <div className="landing-section-heading">
              <span>Built for Every User</span>

              <h2>
                Dedicated experiences for the complete hiring
                team
              </h2>

              <p>
                Each JobMart role receives a secure workspace
                designed around its responsibilities.
              </p>
            </div>

            <div className="landing-role-grid">
              {roles.map((role) => {
                const Icon = role.icon;

                return (
                  <article key={role.title}>
                    <div className="landing-role-icon">
                      <Icon size={27} />
                    </div>

                    <h3>{role.title}</h3>

                    <p>{role.description}</p>

                    <Link to={role.link}>
                      {role.button}
                      <ArrowRight size={17} />
                    </Link>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section
          id="security"
          className="landing-section landing-security-section"
        >
          <div className="landing-section-container landing-security-container">
            <div className="landing-security-content">
              <span className="landing-security-label">
                <ShieldCheck size={17} />
                Security and Architecture
              </span>

              <h2>
                Built on a secure and reliable recruitment
                architecture
              </h2>

              <p>
                JobMart uses ASP.NET Web API, SQL Server,
                encrypted credentials, JWT authentication and
                role-based access controls.
              </p>

              <ul>
                <li>
                  <CheckCircle2 size={18} />
                  Secure JWT authentication
                </li>

                <li>
                  <CheckCircle2 size={18} />
                  BCrypt password hashing
                </li>

                <li>
                  <CheckCircle2 size={18} />
                  Role-based access control
                </li>

                <li>
                  <CheckCircle2 size={18} />
                  Audit logging and monitoring
                </li>
              </ul>
            </div>

            <div className="landing-security-card">
              <div className="landing-security-card-heading">
                <FileText size={22} />

                <div>
                  <strong>JobMart Platform</strong>
                  <span>System status</span>
                </div>
              </div>

              <div className="landing-code-block">
                <span>
                  &gt; Initializing secure platform...
                </span>

                <span>
                  &gt; SQL Server connection established
                </span>

                <span>
                  &gt; JWT authentication enabled
                </span>

                <span>
                  &gt; Role permissions verified
                </span>

                <strong>
                  &gt; System ready
                </strong>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-call-to-action">
          <div className="landing-section-container">
            <div>
              <span>
                <Search size={18} />
                Start your recruitment journey
              </span>

              <h2>
                Discover better opportunities and build better
                teams with JobMart.
              </h2>
            </div>

            <div className="landing-call-actions">
              <Link to="/register">
                Create Account
                <ArrowRight size={18} />
              </Link>

              <Link to="/login">
                Sign In
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}

export default LandingPage;