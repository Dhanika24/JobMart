import { Link } from "react-router-dom";
import {
  BriefcaseBusiness,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import "./PublicFooter.css";

function PublicFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer id="contact" className="public-footer">
      <div className="public-footer-container">
        <div className="public-footer-main">
          <section className="public-footer-brand-column">
            <Link to="/" className="public-footer-brand">
              <span>
                <BriefcaseBusiness size={25} />
              </span>

              <strong>JobMart</strong>
            </Link>

            <p>
              An AI-powered recruitment and talent management
              platform connecting candidates, recruiters and
              hiring teams.
            </p>

            <div className="public-footer-socials">
              <a
                href="#contact"
                aria-label="LinkedIn"
                title="LinkedIn"
              >
                in
              </a>

              <a
                href="#contact"
                aria-label="Website"
                title="Website"
              >
                Web
              </a>

              <a
                href="#contact"
                aria-label="GitHub"
                title="GitHub"
              >
                GH
              </a>
            </div>
          </section>

          <section>
            <h3>For Candidates</h3>

            <Link to="/register">
              Create Account
            </Link>

            <Link to="/login">
              Browse Opportunities
            </Link>

            <Link to="/login">
              Manage Applications
            </Link>

            <Link to="/login">
              AI Recommendations
            </Link>
          </section>

          <section>
            <h3>For Employers</h3>

            <Link to="/register">
              Recruiter Registration
            </Link>

            <Link to="/login">
              Post Job Vacancies
            </Link>

            <Link to="/login">
              Candidate Ranking
            </Link>

            <Link to="/login">
              Recruitment Analytics
            </Link>
          </section>

          <section>
            <h3>Contact</h3>

            <p className="public-footer-contact">
              <MapPin size={17} />
              Colombo, Sri Lanka
            </p>

            <p className="public-footer-contact">
              <Mail size={17} />
              support@jobmart.com
            </p>

            <p className="public-footer-contact">
              <Phone size={17} />
              +94 11 234 5678
            </p>
          </section>
        </div>

        <div className="public-footer-bottom">
          <p>
            © {currentYear} JobMart. All rights reserved.
          </p>

          <div>
            <a href="#privacy">
              Privacy Policy
            </a>

            <a href="#terms">
              Terms of Service
            </a>

            <a href="#support">
              Support
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default PublicFooter;