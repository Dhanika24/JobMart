import { useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import "./CreateStaffAccount.css";

function CreateStaffAccount() {
  const initialFormData = {
    fullName: "",
    email: "",
    role: "HiringManager",
    password: "",
    confirmPassword: "",
  };

  const [formData, setFormData] =
    useState(initialFormData);

  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [createdAccount, setCreatedAccount] =
    useState(null);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));

    setMessage("");
    setIsError(false);
    setCreatedAccount(null);
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
      "Unable to create the staff account."
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setIsError(false);
    setCreatedAccount(null);

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

    if (
      formData.password !==
      formData.confirmPassword
    ) {
      setIsError(true);
      setMessage(
        "Password and confirmation password do not match."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await axiosInstance.post(
        "/AdminUsers/create-privileged",
        {
          fullName: cleanedFullName,
          email: cleanedEmail,
          role: formData.role,
          password: formData.password,
          confirmPassword:
            formData.confirmPassword,
        }
      );

      setMessage(
        response.data?.message ??
          "Staff account created successfully."
      );

      setCreatedAccount(
        response.data?.user ?? {
          fullName: cleanedFullName,
          email: cleanedEmail,
          role: formData.role,
          isActive: true,
        }
      );

      setFormData(initialFormData);
    } catch (error) {
      console.error(
        "Create staff account error:",
        error
      );

      setIsError(true);
      setMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const formatRole = (role) => {
    if (role === "HiringManager") {
      return "Hiring Manager";
    }

    if (role === "Admin") {
      return "Administrator";
    }

    return role;
  };

  return (
    <div className="create-staff-page">
      <section className="create-staff-heading">
        <div>
          <span>Staff Administration</span>

          <h2>Create Staff Account</h2>

          <p>
            Create an active Hiring Manager or
            Administrator account.
          </p>
        </div>
      </section>

      {message && (
        <div
          className={
            isError
              ? "create-staff-message error"
              : "create-staff-message success"
          }
        >
          {message}
        </div>
      )}

      <div className="create-staff-grid">
        <section className="create-staff-card">
          <div className="create-staff-card-heading">
            <h3>Account Information</h3>

            <p>
              Enter the details for the new staff
              account.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="create-staff-form-group">
              <label htmlFor="fullName">
                Full name
              </label>

              <input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="Enter full name"
                value={formData.fullName}
                onChange={handleChange}
                required
                maxLength="100"
                autoComplete="name"
              />
            </div>

            <div className="create-staff-form-group">
              <label htmlFor="email">
                Email address
              </label>

              <input
                id="email"
                name="email"
                type="email"
                placeholder="Enter email address"
                value={formData.email}
                onChange={handleChange}
                required
                maxLength="150"
                autoComplete="email"
              />
            </div>

            <div className="create-staff-form-group">
              <label htmlFor="role">
                Account role
              </label>

              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
              >
                <option value="HiringManager">
                  Hiring Manager
                </option>

                <option value="Admin">
                  Administrator
                </option>
              </select>

              <small>
                {formData.role === "Admin"
                  ? "Administrators can manage users, approvals and staff accounts."
                  : "Hiring Managers can review candidates, evaluations, interviews and hiring decisions."}
              </small>
            </div>

            <div className="create-staff-password-grid">
              <div className="create-staff-form-group">
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

              <div className="create-staff-form-group">
                <label htmlFor="confirmPassword">
                  Confirm password
                </label>

                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Repeat password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  minLength="8"
                  maxLength="100"
                  autoComplete="new-password"
                />
              </div>
            </div>

            {formData.confirmPassword &&
              formData.password !==
                formData.confirmPassword && (
                <div className="create-staff-password-error">
                  Passwords do not match.
                </div>
              )}

            <button
              className="create-staff-submit-button"
              type="submit"
              disabled={
                loading ||
                formData.password !==
                  formData.confirmPassword
              }
            >
              {loading
                ? "Creating Account..."
                : `Create ${formatRole(
                    formData.role
                  )} Account`}
            </button>
          </form>
        </section>

        <aside className="create-staff-side-panel">
          <section className="create-staff-information">
            <h3>Account Access</h3>

            <article>
              <strong>Hiring Manager</strong>

              <p>
                Can review shortlisted candidates,
                evaluations, interviews and hiring
                decisions.
              </p>
            </article>

            <article>
              <strong>Administrator</strong>

              <p>
                Can manage all users, approve Recruiters
                and create staff accounts.
              </p>
            </article>
          </section>

          <section className="create-staff-security">
            <h3>Security Notice</h3>

            <p>
              Staff accounts are activated immediately.
              Give the login credentials only to the
              authorized account owner.
            </p>

            <p>
              Use a unique password containing letters,
              numbers and symbols.
            </p>
          </section>

          {createdAccount && (
            <section className="created-account-card">
              <span>Account Created</span>

              <h3>{createdAccount.fullName}</h3>

              <p>{createdAccount.email}</p>

              <div>
                <strong>
                  {formatRole(createdAccount.role)}
                </strong>

                <strong>
                  {createdAccount.isActive
                    ? "Active"
                    : "Inactive"}
                </strong>
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

export default CreateStaffAccount;