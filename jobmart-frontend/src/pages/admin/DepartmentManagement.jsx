import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import axiosInstance from "../../api/axiosInstance";
import "./DepartmentManagement.css";

const emptyForm = {
  name: "",
  description: "",
  organizationId: "",
};

function DepartmentManagement() {
  const [departments, setDepartments] =
    useState([]);

  const [organizations, setOrganizations] =
    useState([]);

  const [summary, setSummary] = useState({
    totalDepartments: 0,
    activeDepartments: 0,
    inactiveDepartments: 0,
  });

  const [formData, setFormData] =
    useState(emptyForm);

  const [editingDepartmentId, setEditingDepartmentId] =
    useState(null);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [organizationFilter, setOrganizationFilter] =
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
    editingDepartmentId !== null;

  const getErrorMessage = (requestError) => {
    return (
      requestError.response?.data?.message ||
      requestError.message ||
      "An unexpected error occurred."
    );
  };

  const clearAlerts = () => {
    setMessage("");
    setError("");
  };

  const fetchDepartments =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await axiosInstance.get(
            "/Departments"
          );

        const responseData =
          response.data ?? {};

        setDepartments(
          responseData.departments ?? []
        );

        setSummary({
          totalDepartments:
            responseData.totalDepartments ?? 0,

          activeDepartments:
            responseData.activeDepartments ?? 0,

          inactiveDepartments:
            responseData.inactiveDepartments ?? 0,
        });
      } catch (requestError) {
        setError(
          getErrorMessage(requestError)
        );
      } finally {
        setLoading(false);
      }
    }, []);

  const fetchOrganizations =
    useCallback(async () => {
      try {
        const response =
          await axiosInstance.get(
            "/Organizations"
          );

        setOrganizations(
          response.data?.organizations ?? []
        );
      } catch (requestError) {
        setError(
          getErrorMessage(requestError)
        );
      }
    }, []);

  useEffect(() => {
    fetchDepartments();
    fetchOrganizations();
  }, [
    fetchDepartments,
    fetchOrganizations,
  ]);

  const activeOrganizations =
    useMemo(() => {
      return organizations.filter(
        (organization) =>
          organization.isActive
      );
    }, [organizations]);

  const filteredDepartments =
    useMemo(() => {
      const normalizedSearch =
        searchTerm.trim().toLowerCase();

      return departments.filter(
        (department) => {
          const matchesSearch =
            normalizedSearch === "" ||
            department.name
              ?.toLowerCase()
              .includes(normalizedSearch) ||
            department.description
              ?.toLowerCase()
              .includes(normalizedSearch) ||
            department.organizationName
              ?.toLowerCase()
              .includes(normalizedSearch);

          const matchesStatus =
            statusFilter === "All" ||
            (statusFilter === "Active" &&
              department.isActive) ||
            (statusFilter === "Inactive" &&
              !department.isActive);

          const matchesOrganization =
            organizationFilter === "All" ||
            String(
              department.organizationId
            ) === organizationFilter;

          return (
            matchesSearch &&
            matchesStatus &&
            matchesOrganization
          );
        }
      );
    }, [
      departments,
      searchTerm,
      statusFilter,
      organizationFilter,
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
    setEditingDepartmentId(null);
  };

  const handleCancelEdit = () => {
    resetForm();
    clearAlerts();
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError(
        "Department name is required."
      );

      return false;
    }

    if (!formData.organizationId) {
      setError(
        "Please select an organization."
      );

      return false;
    }

    return true;
  };

  const buildRequestBody = () => ({
    name: formData.name.trim(),

    description:
      formData.description.trim() || null,

    organizationId:
      Number(formData.organizationId),
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
            `/Departments/${editingDepartmentId}`,
            requestBody
          );

        setMessage(
          response.data?.message ||
          "Department updated successfully."
        );
      } else {
        const response =
          await axiosInstance.post(
            "/Departments",
            requestBody
          );

        setMessage(
          response.data?.message ||
          "Department created successfully."
        );
      }

      resetForm();

      await fetchDepartments();
      await fetchOrganizations();
    } catch (requestError) {
      setError(
        getErrorMessage(requestError)
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (department) => {
    clearAlerts();

    setEditingDepartmentId(
      department.departmentId
    );

    setFormData({
      name:
        department.name ?? "",

      description:
        department.description ?? "",

      organizationId:
        String(
          department.organizationId ?? ""
        ),
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleStatusChange = async (
    department
  ) => {
    clearAlerts();

    const action =
      department.isActive
        ? "deactivate"
        : "activate";

    const confirmed =
      window.confirm(
        department.isActive
          ? `Deactivate ${department.name}?`
          : `Activate ${department.name}?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoadingId(
        department.departmentId
      );

      const response =
        await axiosInstance.put(
          `/Departments/${department.departmentId}/${action}`
        );

      setMessage(
        response.data?.message ||
        `Department ${action}d successfully.`
      );

      await fetchDepartments();
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
    department
  ) => {
    clearAlerts();

    const confirmed =
      window.confirm(
        `Permanently delete ${department.name}? This is allowed only when no staff profiles or job postings are assigned to it.`
      );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoadingId(
        department.departmentId
      );

      const response =
        await axiosInstance.delete(
          `/Departments/${department.departmentId}`
        );

      setMessage(
        response.data?.message ||
        "Department deleted successfully."
      );

      if (
        editingDepartmentId ===
        department.departmentId
      ) {
        resetForm();
      }

      await fetchDepartments();
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
    <div className="department-page">
      <section className="department-page-heading">
        <div>
          <p className="department-eyebrow">
            Administration
          </p>

          <h2>
            Department Management
          </h2>

          <p>
            Create and manage departments
            belonging to registered
            organizations.
          </p>
        </div>

        <button
          type="button"
          className="department-refresh-button"
          onClick={() => {
            fetchDepartments();
            fetchOrganizations();
          }}
          disabled={loading}
        >
          {loading
            ? "Refreshing..."
            : "Refresh"}
        </button>
      </section>

      <section className="department-summary-grid">
        <article className="department-summary-card">
          <span>Total Departments</span>

          <strong>
            {summary.totalDepartments}
          </strong>
        </article>

        <article className="department-summary-card">
          <span>Active Departments</span>

          <strong>
            {summary.activeDepartments}
          </strong>
        </article>

        <article className="department-summary-card">
          <span>Inactive Departments</span>

          <strong>
            {summary.inactiveDepartments}
          </strong>
        </article>
      </section>

      {message && (
        <div
          className="department-alert success"
          role="status"
        >
          {message}
        </div>
      )}

      {error && (
        <div
          className="department-alert error"
          role="alert"
        >
          {error}
        </div>
      )}

      <section className="department-form-card">
        <div className="department-section-heading">
          <div>
            <h3>
              {isEditing
                ? "Edit Department"
                : "Create Department"}
            </h3>

            <p>
              Select the organization that
              owns this department.
            </p>
          </div>

          {isEditing && (
            <button
              type="button"
              className="department-secondary-button"
              onClick={handleCancelEdit}
            >
              Cancel Edit
            </button>
          )}
        </div>

        <form
          className="department-form"
          onSubmit={handleSubmit}
        >
          <div className="department-field">
            <label htmlFor="department-organization">
              Organization *
            </label>

            <select
              id="department-organization"
              name="organizationId"
              value={
                formData.organizationId
              }
              onChange={handleInputChange}
              required
            >
              <option value="">
                Select an organization
              </option>

              {activeOrganizations.map(
                (organization) => (
                  <option
                    key={
                      organization.organizationId
                    }
                    value={
                      organization.organizationId
                    }
                  >
                    {organization.name}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="department-field">
            <label htmlFor="department-name">
              Department Name *
            </label>

            <input
              id="department-name"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              maxLength={120}
              required
              placeholder="Example: Information Technology"
            />
          </div>

          <div className="department-field full-width">
            <label htmlFor="department-description">
              Description
            </label>

            <textarea
              id="department-description"
              name="description"
              value={
                formData.description
              }
              onChange={handleInputChange}
              maxLength={500}
              rows={4}
              placeholder="Enter a short department description"
            />
          </div>

          <div className="department-form-actions full-width">
            <button
              type="submit"
              className="department-primary-button"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : isEditing
                  ? "Update Department"
                  : "Create Department"}
            </button>

            <button
              type="button"
              className="department-secondary-button"
              onClick={resetForm}
              disabled={saving}
            >
              Clear Form
            </button>
          </div>
        </form>
      </section>

      <section className="department-list-card">
        <div className="department-section-heading department-list-heading">
          <div>
            <h3>
              Registered Departments
            </h3>

            <p>
              {filteredDepartments.length} result
              {filteredDepartments.length === 1
                ? ""
                : "s"}
            </p>
          </div>

          <div className="department-filters">
            <label>
              <span className="department-visually-hidden">
                Search departments
              </span>

              <input
                type="search"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value
                  )
                }
                placeholder="Search departments"
              />
            </label>

            <label>
              <span className="department-visually-hidden">
                Filter by organization
              </span>

              <select
                value={
                  organizationFilter
                }
                onChange={(event) =>
                  setOrganizationFilter(
                    event.target.value
                  )
                }
              >
                <option value="All">
                  All Organizations
                </option>

                {organizations.map(
                  (organization) => (
                    <option
                      key={
                        organization.organizationId
                      }
                      value={
                        organization.organizationId
                      }
                    >
                      {organization.name}
                    </option>
                  )
                )}
              </select>
            </label>

            <label>
              <span className="department-visually-hidden">
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
          <div className="department-state">
            Loading departments...
          </div>
        ) : filteredDepartments.length ===
          0 ? (
          <div className="department-state">
            No departments match the
            selected filters.
          </div>
        ) : (
          <div className="department-table-wrapper">
            <table className="department-table">
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Organization</th>
                  <th>Status</th>
                  <th>Recruiters</th>
                  <th>Managers</th>
                  <th>Jobs</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredDepartments.map(
                  (department) => {
                    const isActionLoading =
                      actionLoadingId ===
                      department.departmentId;

                    return (
                      <tr
                        key={
                          department.departmentId
                        }
                      >
                        <td>
                          <div className="department-name-cell">
                            <strong>
                              {department.name}
                            </strong>

                            <span>
                              {department.description ||
                                "No description provided"}
                            </span>
                          </div>
                        </td>

                        <td>
                          <div className="department-organization-cell">
                            <strong>
                              {department.organizationName ||
                                "Unknown Organization"}
                            </strong>

                            <span>
                              {department.organizationIsActive
                                ? "Organization active"
                                : "Organization inactive"}
                            </span>
                          </div>
                        </td>

                        <td>
                          <span
                            className={
                              department.isActive
                                ? "department-status active"
                                : "department-status inactive"
                            }
                          >
                            {department.isActive
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </td>

                        <td>
                          {department.totalRecruiters ??
                            0}
                        </td>

                        <td>
                          {department.totalHiringManagers ??
                            0}
                        </td>

                        <td>
                          {department.totalJobs ??
                            0}
                        </td>

                        <td>
                          <div className="department-action-buttons">
                            <button
                              type="button"
                              className="department-table-button edit"
                              onClick={() =>
                                handleEdit(
                                  department
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
                                department.isActive
                                  ? "department-table-button deactivate"
                                  : "department-table-button activate"
                              }
                              onClick={() =>
                                handleStatusChange(
                                  department
                                )
                              }
                              disabled={
                                isActionLoading
                              }
                            >
                              {isActionLoading
                                ? "Working..."
                                : department.isActive
                                  ? "Deactivate"
                                  : "Activate"}
                            </button>

                            <button
                              type="button"
                              className="department-table-button delete"
                              onClick={() =>
                                handleDelete(
                                  department
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

export default DepartmentManagement;