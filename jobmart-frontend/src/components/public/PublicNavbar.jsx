import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BriefcaseBusiness,
  LogIn,
  Menu,
  UserPlus,
  X,
} from "lucide-react";
import "./PublicNavbar.css";

function PublicNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <>
      <header className="public-navbar">
        <div className="public-navbar-container">
          <Link
            to="/"
            className="public-navbar-brand"
            onClick={closeMenu}
          >
            <span className="public-navbar-brand-icon">
              <BriefcaseBusiness size={24} />
            </span>

            <span className="public-navbar-brand-text">
              <strong>JobMart</strong>
              <small>AI Recruitment Platform</small>
            </span>
          </Link>

          <nav className="public-navbar-desktop-links">
            <a href="#home">Home</a>
            <a href="#features">Features</a>
            <a href="#roles">Solutions</a>
            <a href="#security">Security</a>
            <a href="#contact">Contact</a>
          </nav>

          <div className="public-navbar-actions">
            <Link
              to="/login"
              className="public-navbar-login"
            >
              <LogIn size={18} />
              Login
            </Link>

            <Link
              to="/register"
              className="public-navbar-register"
            >
              <UserPlus size={18} />
              Create Account
            </Link>
          </div>

          <button
            type="button"
            className="public-navbar-menu-button"
            aria-label="Open navigation menu"
            onClick={() => setMenuOpen(true)}
          >
            <Menu size={24} />
          </button>
        </div>
      </header>

      {menuOpen && (
        <button
          type="button"
          className="public-navbar-overlay"
          aria-label="Close navigation"
          onClick={closeMenu}
        />
      )}

      <aside
        className={`public-mobile-menu ${
          menuOpen ? "public-mobile-menu-open" : ""
        }`}
      >
        <div className="public-mobile-menu-heading">
          <Link
            to="/"
            className="public-navbar-brand"
            onClick={closeMenu}
          >
            <span className="public-navbar-brand-icon">
              <BriefcaseBusiness size={22} />
            </span>

            <span className="public-navbar-brand-text">
              <strong>JobMart</strong>
              <small>AI Recruitment Platform</small>
            </span>
          </Link>

          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={closeMenu}
          >
            <X size={22} />
          </button>
        </div>

        <nav className="public-mobile-links">
          <a href="#home" onClick={closeMenu}>
            Home
          </a>

          <a href="#features" onClick={closeMenu}>
            Features
          </a>

          <a href="#roles" onClick={closeMenu}>
            Solutions
          </a>

          <a href="#security" onClick={closeMenu}>
            Security
          </a>

          <a href="#contact" onClick={closeMenu}>
            Contact
          </a>
        </nav>

        <div className="public-mobile-actions">
          <Link to="/login" onClick={closeMenu}>
            <LogIn size={18} />
            Login
          </Link>

          <Link to="/register" onClick={closeMenu}>
            <UserPlus size={18} />
            Create Account
          </Link>
        </div>
      </aside>
    </>
  );
}

export default PublicNavbar;