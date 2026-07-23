import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import axiosInstance from "../../api/axiosInstance";
import "./OrganizationManagement.css";

const emptyForm = {
  name: "",
  description: "",
  address: "",
  phoneNumber: "",
  email: "",
  website: "",
};

function OrganizationManagement() {
  const [organizations, setOrganizations] =
    useState([]);

  const [summary, setSummary] = useState({
    totalOrganizations: 0,
    activeOrganizations: 0,
    inactiveOrganizations: 0,
  });

  const [formData, setFormData] =
    useState(emptyForm);

  const [editingOrganizationId, setEditingOrganizationId] =
    useState(null);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [actionLoadingId, setActionLoadingId] =
    useState(null);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const isEditing =
    editingOrganizationId !== null;

  const clearAlerts = () => {
    setMessage("");
    setError("");
  };

  const getErrorMessage = (requestError) => {
    return (
      requestError.response?.data?.message ||
      requestError.message ||
      "An unexpected error occurred."
    );
  };

  const fetchOrganizations =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await axiosInstance.get(
            "/Organizations"
          );

        const responseData =
          response.data ?? {};

        setOrganizations(
          responseData.organizations ?? []
        );

        setSummary({
          totalOrganizations:
            responseData.totalOrganizations ?? 0,

          activeOrganizations:
            responseData.activeOrganizations ?? 0,

          inactiveOrganizations:
            responseData.inactiveOrganizations ?? 0,
        });
      } catch (requestError) {
        setError(
          getErrorMessage(requestError)
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  const filteredOrganizations =
    useMemo(() => {
      const normalizedSearch =
        searchTerm.trim().toLowerCase();

      return organizations.filter(
        (organization) => {
          const matchesSearch =
            normalizedSearch === "" ||
            organization.name
              ?.toLowerCase()
              .includes(normalizedSearch) ||
            organization.email
              ?.toLowerCase()
              .includes(normalizedSearch) ||
            organization.address
              ?.toLowerCase()
              .includes(normalizedSearch);

          const matchesStatus =
            statusFilter === "All" ||
            (statusFilter === "Active" &&
              organization.isActive) ||
            (statusFilter === "Inactive" &&
              !organization.isActive);

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      organizations,
      searchTerm,
      statusFilter,
    ]);

  const handleInputChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setFormData((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingOrganizationId(null);
  };

  const handleCancelEdit = () => {
    resetForm();
    clearAlerts();
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError(
        "Organization name is required."
      );

      return false;
    }

    return true;
  };

  const buildRequestBody = () => ({
    name: formData.name.trim(),

    description:
      formData.description.trim() || null,

    address:
      formData.address.trim() || null,

    phoneNumber:
      formData.phoneNumber.trim() || null,

    email:
      formData.email.trim() || null,

    website:
      formData.website.trim() || null,
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    clearAlerts();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      const requestBody =
        buildRequestBody();

      if (isEditing) {
        const response =
          await axiosInstance.put(
            `/Organizations/${editingOrganizationId}`,
            requestBody
          );

        setMessage(
          response.data?.message ||
          "Organization updated successfully."
        );
      } else {
        const response =
          await axiosInstance.post(
            "/Organizations",
            requestBody
          );

        setMessage(
          response.data?.message ||
          "Organization created successfully."
        );
      }

      resetForm();
      await fetchOrganizations();
    } catch (requestError) {
      setError(
        getErrorMessage(requestError)
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (organization) => {
    clearAlerts();

    setEditingOrganizationId(
      organization.organizationId
    );

    setFormData({
      name:
        organization.name ?? "",

      description:
        organization.description ?? "",

      address:
        organization.address ?? "",

      phoneNumber:
        organization.phoneNumber ?? "",

      email:
        organization.email ?? "",

      website:
        organization.website ?? "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleStatusChange = async (
    organization
  ) => {
    clearAlerts();

    const action =
      organization.isActive
        ? "deactivate"
        : "activate";

    const confirmationMessage =
      organization.isActive
        ? `Deactivate ${organization.name}? Its departments will also be deactivated.`
        : `Activate ${organization.name}?`;

    const confirmed =
      window.confirm(
        confirmationMessage
      );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoadingId(
        organization.organizationId
      );

      const response =
        await axiosInstance.put(
          `/Organizations/${organization.organizationId}/${action}`
        );

      setMessage(
        response.data?.message ||
        `Organization ${action}d successfully.`
      );

      await fetchOrganizations();
    } catch (requestError) {
      setError(
        getErrorMessage(requestError)
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (
    organization
  ) => {
    clearAlerts();

    const confirmed =
      window.confirm(
        `Permanently delete ${organization.name}? This is allowed only when it has no departments, staff profiles, or jobs.`
      );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoadingId(
        organization.organizationId
      );

      const response =
        await axiosInstance.delete(
          `/Organizations/${organization.organizationId}`
        );

      setMessage(
        response.data?.message ||
        "Organization deleted successfully."
      );

      if (
        editingOrganizationId ===
        organization.organizationId
      ) {
        resetForm();
      }

      await fetchOrganizations();
    } catch (requestError) {
      setError(
        getErrorMessage(requestError)
      );
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="organization-page">
      <section className="organization-page-heading">
        <div>
          <p className="organization-eyebrow">
            Administration
          </p>

          <h2>
            Organization Management
          </h2>

          <p>
            Create, update, activate and
            manage organizations registered
            in JobMart.
          </p>
        </div>

        <button
          type="button"
          className="organization-refresh-button"
          onClick={fetchOrganizations}
          disabled={loading}
        >
          {loading
            ? "Refreshing..."
            : "Refresh"}
        </button>
      </section>

      <section className="organization-summary-grid">
        <article className="organization-summary-card">
          <span>Total Organizations</span>

          <strong>
            {summary.totalOrganizations}
          </strong>
        </article>

        <article className="organization-summary-card">
          <span>Active Organizations</span>

          <strong>
            {summary.activeOrganizations}
          </strong>
        </article>

        <article className="organization-summary-card">
          <span>Inactive Organizations</span>

          <strong>
            {summary.inactiveOrganizations}
          </strong>
        </article>
      </section>

      {message && (
        <div
          className="organization-alert success"
          role="status"
        >
          {message}
        </div>
      )}

      {error && (
        <div
          className="organization-alert error"
          role="alert"
        >
          {error}
        </div>
      )}

      <section className="organization-form-card">
        <div className="organization-section-heading">
          <div>
            <h3>
              {isEditing
                ? "Edit Organization"
                : "Create Organization"}
            </h3>

            <p>
              Fields marked with * are
              required.
            </p>
          </div>

          {isEditing && (
            <button
              type="button"
              className="organization-secondary-button"
              onClick={handleCancelEdit}
            >
              Cancel Edit
            </button>
          )}
        </div>

        <form
          className="organization-form"
          onSubmit={handleSubmit}
        >
          <div className="organization-field full-width">
            <label htmlFor="organization-name">
              Organization Name *
            </label>

            <input
              id="organization-name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              maxLength={150}
              required
              placeholder="Example: JobMart Global Solutions"
            />
          </div>

          <div className="organization-field full-width">
            <label htmlFor="organization-description">
              Description
            </label>

            <textarea
              id="organization-description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              maxLength={500}
              rows={4}
              placeholder="Enter a short organization description"
            />
          </div>

          <div className="organization-field">
            <label htmlFor="organization-address">
              Address
            </label>

            <input
              id="organization-address"
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              maxLength={250}
              placeholder="Colombo, Sri Lanka"
            />
          </div>

          <div className="organization-field">
            <label htmlFor="organization-phone">
              Phone Number
            </label>

            <input
              id="organization-phone"
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              maxLength={30}
              placeholder="+94 11 234 5678"
            />
          </div>

          <div className="organization-field">
            <label htmlFor="organization-email">
              Email
            </label>

            <input
              id="organization-email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              maxLength={150}
              placeholder="info@example.com"
            />
          </div>

          <div className="organization-field">
            <label htmlFor="organization-website">
              Website
            </label>

            <input
              id="organization-website"
              type="url"
              name="website"
              value={formData.website}
              onChange={handleInputChange}
              maxLength={200}
              placeholder="https://www.example.com"
            />
          </div>

          <div className="organization-form-actions full-width">
            <button
              type="submit"
              className="organization-primary-button"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : isEditing
                  ? "Update Organization"
                  : "Create Organization"}
            </button>

            <button
              type="button"
              className="organization-secondary-button"
              onClick={resetForm}
              disabled={saving}
            >
              Clear Form
            </button>
          </div>
        </form>
      </section>

      <section className="organization-list-card">
        <div className="organization-section-heading organization-list-heading">
          <div>
            <h3>Registered Organizations</h3>

            <p>
              {filteredOrganizations.length} result
              {filteredOrganizations.length === 1
                ? ""
                : "s"}
            </p>
          </div>

          <div className="organization-filters">
            <label>
              <span className="organization-visually-hidden">
                Search organizations
              </span>

              <input
                type="search"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value
                  )
                }
                placeholder="Search organizations"
              />
            </label>

            <label>
              <span className="organization-visually-hidden">
                Filter by status
              </span>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value
                  )
                }
              >
                <option value="All">
                  All Statuses
                </option>

                <option value="Active">
                  Active
                </option>

                <option value="Inactive">
                  Inactive
                </option>
              </select>
            </label>
          </div>
        </div>

        {loading ? (
          <div className="organization-state">
            Loading organizations...
          </div>
        ) : filteredOrganizations.length ===
          0 ? (
          <div className="organization-state">
            No organizations match the
            selected filters.
          </div>
        ) : (
          <div className="organization-table-wrapper">
            <table className="organization-table">
              <thead>
                <tr>
                  <th>Organization</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th>Departments</th>
                  <th>Recruiters</th>
                  <th>Managers</th>
                  <th>Jobs</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredOrganizations.map(
                  (organization) => {
                    const isActionLoading =
                      actionLoadingId ===
                      organization.organizationId;

                    return (
                      <tr
                        key={
                          organization.organizationId
                        }
                      >
                        <td>
                          <div className="organization-name-cell">
                            <strong>
                              {organization.name}
                            </strong>

                            <span>
                              {organization.address ||
                                "No address provided"}
                            </span>
                          </div>
                        </td>

                        <td>
                          <div className="organization-contact-cell">
                            <span>
                              {organization.email ||
                                "No email"}
                            </span>

                            <span>
                              {organization.phoneNumber ||
                                "No phone"}
                            </span>
                          </div>
                        </td>

                        <td>
                          <span
                            className={
                              organization.isActive
                                ? "organization-status active"
                                : "organization-status inactive"
                            }
                          >
                            {organization.isActive
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </td>

                        <td>
                          {organization.totalDepartments ??
                            0}
                        </td>

                        <td>
                          {organization.totalRecruiters ??
                            0}
                        </td>

                        <td>
                          {organization.totalHiringManagers ??
                            0}
                        </td>

                        <td>
                          {organization.totalJobs ??
                            0}
                        </td>

                        <td>
                          <div className="organization-action-buttons">
                            <button
                              type="button"
                              className="organization-table-button edit"
                              onClick={() =>
                                handleEdit(
                                  organization
                                )
                              }
                              disabled={
                                isActionLoading
                              }
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              className={
                                organization.isActive
                                  ? "organization-table-button deactivate"
                                  : "organization-table-button activate"
                              }
                              onClick={() =>
                                handleStatusChange(
                                  organization
                                )
                              }
                              disabled={
                                isActionLoading
                              }
                            >
                              {isActionLoading
                                ? "Working..."
                                : organization.isActive
                                  ? "Deactivate"
                                  : "Activate"}
                            </button>

                            <button
                              type="button"
                              className="organization-table-button delete"
                              onClick={() =>
                                handleDelete(
                                  organization
                                )
                              }
                              disabled={
                                isActionLoading
                              }
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default OrganizationManagement;