import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import "./Register.css";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "Candidate",
  });

  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordsMatch = useMemo(() => {
    if (
      formData.password.length === 0 ||
      formData.confirmPassword.length === 0
    ) {
      return true;
    }

    return (
      formData.password ===
      formData.confirmPassword
    );
  }, [
    formData.password,
    formData.confirmPassword,
  ]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));

    setMessage("");
    setIsError(false);
  };

  const getErrorMessage = (error) => {
    const responseData = error.response?.data;

    if (typeof responseData === "string") {
      return responseData;
    }

    if (responseData?.message) {
      return responseData.message;
    }

    if (responseData?.errors) {
      const validationMessages = Object.values(
        responseData.errors
      )
        .flat()
        .filter(Boolean);

      if (validationMessages.length > 0) {
        return validationMessages.join(" ");
      }
    }

    return (
      error.message ??
      "Registration failed. Please check your details."
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setIsError(false);

    const cleanedFullName =
      formData.fullName.trim();

    const cleanedEmail =
      formData.email.trim().toLowerCase();

    if (!cleanedFullName) {
      setIsError(true);
      setMessage("Full name is required.");
      return;
    }

    if (formData.password.length < 8) {
      setIsError(true);
      setMessage(
        "Password must contain at least 8 characters."
      );
      return;
    }

    if (!passwordsMatch) {
      setIsError(true);
      setMessage(
        "Password and confirmation password do not match."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await axiosInstance.post(
        "/Auth/register",
        {
          fullName: cleanedFullName,
          email: cleanedEmail,
          password: formData.password,
          confirmPassword:
            formData.confirmPassword,
          role: formData.role,
        }
      );

      const successMessage =
        response.data?.message ??
        "Account created successfully.";

      const requiresApproval =
        response.data?.requiresApproval ??
        formData.role === "Recruiter";

      navigate("/login", {
        replace: true,
        state: {
          registrationMessage:
            successMessage,
          registrationPending:
            requiresApproval,
        },
      });
    } catch (error) {
      console.error(
        "Registration error:",
        error
      );

      setIsError(true);
      setMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-card">
        <div className="register-brand">
          <h1>JobMart</h1>

          <p>
            Recruitment Management System
          </p>
        </div>

        <h2>Create Account</h2>

        <p className="register-subtitle">
          Create a Candidate or Recruiter
          account
        </p>

        <form onSubmit={handleSubmit}>
          <div className="register-form-group">
            <label htmlFor="fullName">
              Full name
            </label>

            <input
              id="fullName"
              name="fullName"
              type="text"
              placeholder="Enter your full name"
              value={formData.fullName}
              onChange={handleChange}
              required
              maxLength="100"
              autoComplete="name"
            />
          </div>

          <div className="register-form-group">
            <label htmlFor="email">
              Email address
            </label>

            <input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
              maxLength="150"
              autoComplete="email"
            />
          </div>

          <div className="register-form-group">
            <label htmlFor="role">
              Account type
            </label>

            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="Candidate">
                Candidate
              </option>

              <option value="Recruiter">
                Recruiter
              </option>
            </select>

            <small>
              {formData.role === "Candidate"
                ? "Candidate accounts can sign in immediately."
                : "Recruiter accounts require Admin approval before sign in."}
            </small>
          </div>

          <div className="register-form-grid">
            <div className="register-form-group">
              <label htmlFor="password">
                Password
              </label>

              <input
                id="password"
                name="password"
                type="password"
                placeholder="Minimum 8 characters"
                value={formData.password}
                onChange={handleChange}
                required
                minLength="8"
                maxLength="100"
                autoComplete="new-password"
              />
            </div>

            <div className="register-form-group">
              <label htmlFor="confirmPassword">
                Confirm password
              </label>

              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Repeat your password"
                value={
                  formData.confirmPassword
                }
                onChange={handleChange}
                required
                minLength="8"
                maxLength="100"
                autoComplete="new-password"
              />
            </div>
          </div>

          {!passwordsMatch && (
            <div className="register-password-error">
              Passwords do not match.
            </div>
          )}

          {message && (
            <div
              className={
                isError
                  ? "register-message error"
                  : "register-message success"
              }
            >
              {message}
            </div>
          )}

          <button
            className="register-button"
            type="submit"
            disabled={
              loading ||
              !passwordsMatch
            }
          >
            {loading
              ? "Creating Account..."
              : "Create Account"}
          </button>
        </form>

        <p className="register-login-link">
          Already have an account?{" "}

          <Link to="/login">
            Sign in
          </Link>
        </p>

        <div className="register-security-note">
          <strong>
            Privileged accounts
          </strong>

          <p>
            Hiring Manager and Admin
            accounts can only be created by
            an authorized Administrator.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;