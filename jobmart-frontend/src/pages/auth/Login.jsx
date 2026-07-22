import { useEffect, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import "./Login.css";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isPendingMessage, setIsPendingMessage] =
    useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const registrationMessage =
      location.state?.registrationMessage;

    if (registrationMessage) {
      setMessage(registrationMessage);
      setIsError(false);

      setIsPendingMessage(
        Boolean(
          location.state?.registrationPending
        )
      );

      window.history.replaceState(
        {},
        document.title
      );
    }
  }, [location.state]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));

    if (isError) {
      setMessage("");
      setIsError(false);
      setIsPendingMessage(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setIsError(false);
    setIsPendingMessage(false);
    setLoading(true);

    try {
      const response =
        await axiosInstance.post(
          "/Auth/login",
          {
            email:
              formData.email
                .trim()
                .toLowerCase(),

            password:
              formData.password,
          }
        );

      console.log(
        "Login response:",
        response.data
      );

      const token =
        response.data.token ??
        response.data.accessToken ??
        response.data.jwtToken;

      const role =
        response.data.role ??
        response.data.user?.role;

      const fullName =
        response.data.fullName ??
        response.data.user?.fullName ??
        "JobMart User";

      if (!token) {
        throw new Error(
          "The API response did not contain a token."
        );
      }

      localStorage.setItem(
        "jobmartToken",
        token
      );

      localStorage.setItem(
        "jobmartRole",
        role ?? ""
      );

      localStorage.setItem(
        "jobmartFullName",
        fullName
      );

      setMessage(
        "Login successful."
      );

      if (role === "Candidate") {
        navigate("/candidate");
      } else if (role === "Recruiter") {
        navigate("/recruiter");
      } else if (
        role === "HiringManager"
      ) {
        navigate("/manager");
      } else if (role === "Admin") {
        navigate("/admin");
      } else {
        localStorage.removeItem(
          "jobmartToken"
        );

        localStorage.removeItem(
          "jobmartRole"
        );

        localStorage.removeItem(
          "jobmartFullName"
        );

        throw new Error(
          "The account role is not supported."
        );
      }
    } catch (error) {
      console.error(
        "Login error:",
        error
      );

      const responseData =
        error.response?.data;

      const errorMessage =
        responseData?.message ??
        responseData ??
        error.message ??
        "Login failed. Check your email and password.";

      const requiresApproval =
        responseData?.requiresApproval ===
        true;

      setIsError(!requiresApproval);
      setIsPendingMessage(
        requiresApproval
      );

      setMessage(
        typeof errorMessage === "string"
          ? errorMessage
          : "Login failed. Check your details."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <h1>JobMart</h1>

          <p>
            Recruitment Management System
          </p>
        </div>

        <h2>Welcome Back</h2>

        <p className="login-subtitle">
          Sign in to continue to your account
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
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
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              Password
            </label>

            <input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
              autoComplete="current-password"
            />
          </div>

          {message && (
            <div
              className={
                isError
                  ? "login-message error"
                  : isPendingMessage
                    ? "login-message pending"
                    : "login-message success"
              }
            >
              {message}
            </div>
          )}

          <button
            className="login-button"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Signing in..."
              : "Sign In"}
          </button>
        </form>

        <p className="login-register-link">
          Do not have an account?{" "}

          <Link to="/register">
            Create Account
          </Link>
        </p>

        <p className="test-account-note">
          Recruiter accounts require Admin
          approval before login.
        </p>
      </div>
    </div>
  );
}

export default Login;