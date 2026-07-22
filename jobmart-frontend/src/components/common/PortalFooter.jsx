import { Link } from "react-router-dom";
import {
  CircleHelp,
  ExternalLink,
  Home,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import "./PortalFooter.css";

function PortalFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="portal-footer">
      <div className="portal-footer-left">
        <div className="portal-footer-brand">
          <ShieldCheck size={18} />

          <div>
            <strong>© {currentYear} JobMart</strong>
            <span>AI-Powered Recruitment Platform</span>
          </div>
        </div>
      </div>

      <div className="portal-footer-right">
        <nav
          className="portal-footer-links"
          aria-label="Portal footer navigation"
        >
          <Link to="/">
            <Home size={14} />
            Home
          </Link>

          <a href="#privacy">
            <LockKeyhole size={14} />
            Privacy
          </a>

          <a href="#terms">
            Terms
          </a>

          <a href="#support">
            <CircleHelp size={14} />
            Support
          </a>

          <a href="#status">
            <ExternalLink size={14} />
            System Status
          </a>
        </nav>

        <div className="portal-footer-meta">
          <span className="portal-footer-status">
            <span className="portal-footer-status-dot" />
            System Online
          </span>

          <span className="portal-footer-version">
            Version 1.0.0
          </span>
        </div>
      </div>
    </footer>
  );
}

export default PortalFooter;