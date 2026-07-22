import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import axiosInstance from "../../api/axiosInstance";
import "./StaffAssignmentManagement.css";

const emptyForm = {
  userId: "",
  role: "",
  fullName: "",
  email: "",
  organizationId: "",
  departmentId: "",
  jobTitle: "",
  phoneNumber: "",
  professionalSummary: "",
  linkedInUrl: "",
};

function StaffAssignmentManagement() {
  const [recruiters, setRecruiters] =
    useState([]);

  const [hiringManagers, setHiringManagers] =
    useState([]);

  const [organizations, setOrganizations] =
    useState([]);

  const [departments, setDepartments] =
    useState([]);

  const [formData, setFormData] =
    useState(emptyForm);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [roleFilter, setRoleFilter] =
    useState("All");

  const [organizationFilter, setOrganizationFilter] =
    useState("All");

  const [assignmentFilter, setAssignmentFilter] =
    useState("All");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [actionLoadingKey, setActionLoadingKey] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const isEditing =
    Boolean(formData.userId);

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

  const fetchStaffProfiles =
    useCallback(async () => {
      const [
        recruiterResponse,
        managerResponse,
      ] = await Promise.all([
        axiosInstance.get(
          "/RecruiterProfiles"
        ),

        axiosInstance.get(
          "/HiringManagerProfiles"
        ),
      ]);

      setRecruiters(
        recruiterResponse.data?.profiles ?? []
      );

      setHiringManagers(
        managerResponse.data?.profiles ?? []
      );
    }, []);

  const fetchOrganizations =
    useCallback(async () => {
      const response =
        await axiosInstance.get(
          "/Organizations"
        );

      setOrganizations(
        response.data?.organizations ?? []
      );
    }, []);

  const fetchDepartments =
    useCallback(async () => {
      const response =
        await axiosInstance.get(
          "/Departments"
        );

      setDepartments(
        response.data?.departments ?? []
      );
    }, []);

  const fetchAllData =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        await Promise.all([
          fetchStaffProfiles(),
          fetchOrganizations(),
          fetchDepartments(),
        ]);
      } catch (requestError) {
        setError(
          getErrorMessage(requestError)
        );
      } finally {
        setLoading(false);
      }
    }, [
      fetchStaffProfiles,
      fetchOrganizations,
      fetchDepartments,
    ]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const staffMembers =
    useMemo(() => {
      const recruiterRows =
        recruiters.map((profile) => ({
          ...profile,
          staffRole: "Recruiter",
        }));

      const managerRows =
        hiringManagers.map((profile) => ({
          ...profile,
          staffRole: "HiringManager",
        }));

      return [
        ...recruiterRows,
        ...managerRows,
      ].sort((first, second) =>
        (first.fullName ?? "")
          .localeCompare(
            second.fullName ?? ""
          )
      );
    }, [
      recruiters,
      hiringManagers,
    ]);

  const summary =
    useMemo(() => {
      const assignedStaff =
        staffMembers.filter(
          (staff) =>
            staff.organizationId != null &&
            staff.departmentId != null
        ).length;

      return {
        totalStaff:
          staffMembers.length,

        totalRecruiters:
          recruiters.length,

        totalHiringManagers:
          hiringManagers.length,

        assignedStaff,

        unassignedStaff:
          staffMembers.length -
          assignedStaff,
      };
    }, [
      staffMembers,
      recruiters,
      hiringManagers,
    ]);

  const activeOrganizations =
    useMemo(() => {
      return organizations.filter(
        (organization) =>
          organization.isActive
      );
    }, [organizations]);

  const availableDepartments =
    useMemo(() => {
      if (!formData.organizationId) {
        return [];
      }

      return departments.filter(
        (department) =>
          department.isActive &&
          department.organizationIsActive &&
          String(
            department.organizationId
          ) ===
            String(
              formData.organizationId
            )
      );
    }, [
      departments,
      formData.organizationId,
    ]);

  const filteredStaff =
    useMemo(() => {
      const normalizedSearch =
        searchTerm
          .trim()
          .toLowerCase();

      return staffMembers.filter(
        (staff) => {
          const isAssigned =
            staff.organizationId != null &&
            staff.departmentId != null;

          const matchesSearch =
            normalizedSearch === "" ||
            staff.fullName
              ?.toLowerCase()
              .includes(
                normalizedSearch
              ) ||
            staff.email
              ?.toLowerCase()
              .includes(
                normalizedSearch
              ) ||
            staff.organizationName
              ?.toLowerCase()
              .includes(
                normalizedSearch
              ) ||
            staff.departmentName
              ?.toLowerCase()
              .includes(
                normalizedSearch
              ) ||
            staff.jobTitle
              ?.toLowerCase()
              .includes(
                normalizedSearch
              );

          const matchesRole =
            roleFilter === "All" ||
            staff.staffRole ===
              roleFilter;

          const matchesOrganization =
            organizationFilter ===
              "All" ||
            String(
              staff.organizationId
            ) ===
              organizationFilter;

          const matchesAssignment =
            assignmentFilter ===
              "All" ||
            (assignmentFilter ===
              "Assigned" &&
              isAssigned) ||
            (assignmentFilter ===
              "Unassigned" &&
              !isAssigned);

          return (
            matchesSearch &&
            matchesRole &&
            matchesOrganization &&
            matchesAssignment
          );
        }
      );
    }, [
      staffMembers,
      searchTerm,
      roleFilter,
      organizationFilter,
      assignmentFilter,
    ]);

  const handleInputChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target;

    if (name === "organizationId") {
      setFormData(
        (currentForm) => ({
          ...currentForm,
          organizationId:
            value,

          departmentId:
            "",
        })
      );

      return;
    }

    setFormData(
      (currentForm) => ({
        ...currentForm,
        [name]: value,
      })
    );
  };

  const handleEdit = (staff) => {
    clearAlerts();

    setFormData({
      userId:
        String(staff.userId),

      role:
        staff.staffRole,

      fullName:
        staff.fullName ?? "",

      email:
        staff.email ?? "",

      organizationId:
        staff.organizationId != null
          ? String(
              staff.organizationId
            )
          : "",

      departmentId:
        staff.departmentId != null
          ? String(
              staff.departmentId
            )
          : "",

      jobTitle:
        staff.jobTitle ?? "",

      phoneNumber:
        staff.phoneNumber ?? "",

      professionalSummary:
        staff.professionalSummary ??
        "",

      linkedInUrl:
        staff.linkedInUrl ?? "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const resetForm = () => {
    setFormData(emptyForm);
  };

  const validateForm = () => {
    if (!formData.userId) {
      setError(
        "Select a staff member first."
      );

      return false;
    }

    const hasOrganization =
      Boolean(
        formData.organizationId
      );

    const hasDepartment =
      Boolean(
        formData.departmentId
      );

    if (
      hasOrganization !==
      hasDepartment
    ) {
      setError(
        "Organization and department must be selected together."
      );

      return false;
    }

    return true;
  };

  const getProfileBasePath = (
    role
  ) => {
    return role === "Recruiter"
      ? "/RecruiterProfiles"
      : "/HiringManagerProfiles";
  };

  const handleSave = async (
    event
  ) => {
    event.preventDefault();
    clearAlerts();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      const basePath =
        getProfileBasePath(
          formData.role
        );

      const requestBody = {
        organizationId:
          formData.organizationId
            ? Number(
                formData.organizationId
              )
            : null,

        departmentId:
          formData.departmentId
            ? Number(
                formData.departmentId
              )
            : null,

        jobTitle:
          formData.jobTitle
            .trim() || null,

        phoneNumber:
          formData.phoneNumber
            .trim() || null,

        professionalSummary:
          formData.professionalSummary
            .trim() || null,

        linkedInUrl:
          formData.linkedInUrl
            .trim() || null,
      };

      const response =
        await axiosInstance.put(
          `${basePath}/user/${formData.userId}`,
          requestBody
        );

      setMessage(
        response.data?.message ||
        "Staff profile updated successfully."
      );

      resetForm();

      await fetchStaffProfiles();
      await fetchDepartments();
    } catch (requestError) {
      setError(
        getErrorMessage(requestError)
      );
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveAssignment =
    async (staff) => {
      clearAlerts();

      const confirmed =
        window.confirm(
          `Remove the organization and department assignment from ${staff.fullName}?`
        );

      if (!confirmed) {
        return;
      }

      const actionKey =
        `${staff.staffRole}-${staff.userId}`;

      try {
        setActionLoadingKey(
          actionKey
        );

        const basePath =
          getProfileBasePath(
            staff.staffRole
          );

        const response =
          await axiosInstance.put(
            `${basePath}/user/${staff.userId}/remove-assignment`
          );

        setMessage(
          response.data?.message ||
          "Staff assignment removed successfully."
        );

        if (
          String(staff.userId) ===
            formData.userId &&
          staff.staffRole ===
            formData.role
        ) {
          resetForm();
        }

        await fetchStaffProfiles();
        await fetchDepartments();
      } catch (requestError) {
        setError(
          getErrorMessage(requestError)
        );
      } finally {
        setActionLoadingKey("");
      }
    };

  return (
    <div className="staff-assignment-page">
      <section className="staff-assignment-heading">
        <div>
          <p className="staff-assignment-eyebrow">
            Administration
          </p>

          <h2>
            Staff Assignment Management
          </h2>

          <p>
            Assign Recruiters and Hiring
            Managers to organizations and
            matching departments.
          </p>
        </div>

        <button
          type="button"
          className="staff-refresh-button"
          onClick={fetchAllData}
          disabled={loading}
        >
          {loading
            ? "Refreshing..."
            : "Refresh"}
        </button>
      </section>

      <section className="staff-summary-grid">
        <article className="staff-summary-card">
          <span>
            Total Staff Profiles
          </span>

          <strong>
            {summary.totalStaff}
          </strong>
        </article>

        <article className="staff-summary-card">
          <span>Recruiters</span>

          <strong>
            {summary.totalRecruiters}
          </strong>
        </article>

        <article className="staff-summary-card">
          <span>
            Hiring Managers
          </span>

          <strong>
            {
              summary.totalHiringManagers
            }
          </strong>
        </article>

        <article className="staff-summary-card">
          <span>Assigned Staff</span>

          <strong>
            {summary.assignedStaff}
          </strong>
        </article>

        <article className="staff-summary-card">
          <span>Unassigned Staff</span>

          <strong>
            {summary.unassignedStaff}
          </strong>
        </article>
      </section>

      {message && (
        <div
          className="staff-alert success"
          role="status"
        >
          {message}
        </div>
      )}

      {error && (
        <div
          className="staff-alert error"
          role="alert"
        >
          {error}
        </div>
      )}

      <section className="staff-form-card">
        <div className="staff-section-heading">
          <div>
            <h3>
              {isEditing
                ? "Update Staff Profile"
                : "Select a Staff Member"}
            </h3>

            <p>
              Use the Edit button in the
              table to manage a staff
              profile.
            </p>
          </div>

          {isEditing && (
            <button
              type="button"
              className="staff-secondary-button"
              onClick={() => {
                resetForm();
                clearAlerts();
              }}
            >
              Cancel Edit
            </button>
          )}
        </div>

        {!isEditing ? (
          <div className="staff-empty-form">
            Select a Recruiter or Hiring
            Manager from the table below.
          </div>
        ) : (
          <form
            className="staff-form"
            onSubmit={handleSave}
          >
            <div className="staff-field">
              <label>
                Staff Member
              </label>

              <input
                type="text"
                value={
                  formData.fullName
                }
                disabled
              />
            </div>

            <div className="staff-field">
              <label>Role</label>

              <input
                type="text"
                value={
                  formData.role ===
                  "HiringManager"
                    ? "Hiring Manager"
                    : formData.role
                }
                disabled
              />
            </div>

            <div className="staff-field full-width">
              <label>Email</label>

              <input
                type="email"
                value={formData.email}
                disabled
              />
            </div>

            <div className="staff-field">
              <label htmlFor="staff-organization">
                Organization
              </label>

              <select
                id="staff-organization"
                name="organizationId"
                value={
                  formData.organizationId
                }
                onChange={
                  handleInputChange
                }
              >
                <option value="">
                  Not Assigned
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

            <div className="staff-field">
              <label htmlFor="staff-department">
                Department
              </label>

              <select
                id="staff-department"
                name="departmentId"
                value={
                  formData.departmentId
                }
                onChange={
                  handleInputChange
                }
                disabled={
                  !formData.organizationId
                }
              >
                <option value="">
                  {!formData.organizationId
                    ? "Select organization first"
                    : "Not Assigned"}
                </option>

                {availableDepartments.map(
                  (department) => (
                    <option
                      key={
                        department.departmentId
                      }
                      value={
                        department.departmentId
                      }
                    >
                      {department.name}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="staff-field">
              <label htmlFor="staff-job-title">
                Job Title
              </label>

              <input
                id="staff-job-title"
                type="text"
                name="jobTitle"
                value={
                  formData.jobTitle
                }
                onChange={
                  handleInputChange
                }
                maxLength={120}
                placeholder="Example: Senior Technical Recruiter"
              />
            </div>

            <div className="staff-field">
              <label htmlFor="staff-phone-number">
                Phone Number
              </label>

              <input
                id="staff-phone-number"
                type="tel"
                name="phoneNumber"
                value={
                  formData.phoneNumber
                }
                onChange={
                  handleInputChange
                }
                maxLength={30}
                placeholder="+94 77 123 4567"
              />
            </div>

            <div className="staff-field full-width">
              <label htmlFor="staff-linkedin">
                LinkedIn URL
              </label>

              <input
                id="staff-linkedin"
                type="url"
                name="linkedInUrl"
                value={
                  formData.linkedInUrl
                }
                onChange={
                  handleInputChange
                }
                maxLength={200}
                placeholder="https://www.linkedin.com/in/example"
              />
            </div>

            <div className="staff-field full-width">
              <label htmlFor="staff-summary">
                Professional Summary
              </label>

              <textarea
                id="staff-summary"
                name="professionalSummary"
                value={
                  formData.professionalSummary
                }
                onChange={
                  handleInputChange
                }
                maxLength={500}
                rows={4}
                placeholder="Enter a short professional summary"
              />
            </div>

            <div className="staff-form-actions full-width">
              <button
                type="submit"
                className="staff-primary-button"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : "Save Profile"}
              </button>

              <button
                type="button"
                className="staff-secondary-button"
                onClick={resetForm}
                disabled={saving}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="staff-list-card">
        <div className="staff-section-heading staff-list-heading">
          <div>
            <h3>
              Staff Profiles
            </h3>

            <p>
              {filteredStaff.length} result
              {filteredStaff.length === 1
                ? ""
                : "s"}
            </p>
          </div>

          <div className="staff-filters">
            <label>
              <span className="staff-visually-hidden">
                Search staff
              </span>

              <input
                type="search"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value
                  )
                }
                placeholder="Search staff"
              />
            </label>

            <label>
              <span className="staff-visually-hidden">
                Filter by role
              </span>

              <select
                value={roleFilter}
                onChange={(event) =>
                  setRoleFilter(
                    event.target.value
                  )
                }
              >
                <option value="All">
                  All Roles
                </option>

                <option value="Recruiter">
                  Recruiters
                </option>

                <option value="HiringManager">
                  Hiring Managers
                </option>
              </select>
            </label>

            <label>
              <span className="staff-visually-hidden">
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
              <span className="staff-visually-hidden">
                Filter by assignment
              </span>

              <select
                value={
                  assignmentFilter
                }
                onChange={(event) =>
                  setAssignmentFilter(
                    event.target.value
                  )
                }
              >
                <option value="All">
                  All Assignments
                </option>

                <option value="Assigned">
                  Assigned
                </option>

                <option value="Unassigned">
                  Unassigned
                </option>
              </select>
            </label>
          </div>
        </div>

        {loading ? (
          <div className="staff-state">
            Loading staff profiles...
          </div>
        ) : filteredStaff.length ===
          0 ? (
          <div className="staff-state">
            No staff profiles match the
            selected filters.
          </div>
        ) : (
          <div className="staff-table-wrapper">
            <table className="staff-table">
              <thead>
                <tr>
                  <th>Staff Member</th>
                  <th>Role</th>
                  <th>Organization</th>
                  <th>Department</th>
                  <th>Job Title</th>
                  <th>Account</th>
                  <th>Assignment</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredStaff.map(
                  (staff) => {
                    const isAssigned =
                      staff.organizationId !=
                        null &&
                      staff.departmentId !=
                        null;

                    const actionKey =
                      `${staff.staffRole}-${staff.userId}`;

                    const isActionLoading =
                      actionLoadingKey ===
                      actionKey;

                    return (
                      <tr key={actionKey}>
                        <td>
                          <div className="staff-name-cell">
                            <strong>
                              {staff.fullName}
                            </strong>

                            <span>
                              {staff.email}
                            </span>
                          </div>
                        </td>

                        <td>
                          <span className="staff-role-badge">
                            {staff.staffRole ===
                            "HiringManager"
                              ? "Hiring Manager"
                              : "Recruiter"}
                          </span>
                        </td>

                        <td>
                          {staff.organizationName ||
                            "Not Assigned"}
                        </td>

                        <td>
                          {staff.departmentName ||
                            "Not Assigned"}
                        </td>

                        <td>
                          {staff.jobTitle ||
                            "Not Provided"}
                        </td>

                        <td>
                          <span
                            className={
                              staff.accountIsActive
                                ? "staff-status active"
                                : "staff-status inactive"
                            }
                          >
                            {staff.accountIsActive
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </td>

                        <td>
                          <span
                            className={
                              isAssigned
                                ? "staff-assignment-status assigned"
                                : "staff-assignment-status unassigned"
                            }
                          >
                            {isAssigned
                              ? "Assigned"
                              : "Unassigned"}
                          </span>
                        </td>

                        <td>
                          <div className="staff-action-buttons">
                            <button
                              type="button"
                              className="staff-table-button edit"
                              onClick={() =>
                                handleEdit(
                                  staff
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
                              className="staff-table-button remove"
                              onClick={() =>
                                handleRemoveAssignment(
                                  staff
                                )
                              }
                              disabled={
                                !isAssigned ||
                                isActionLoading
                              }
                            >
                              {isActionLoading
                                ? "Removing..."
                                : "Remove Assignment"}
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

export default StaffAssignmentManagement;