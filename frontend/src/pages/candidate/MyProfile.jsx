import { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance.js";
import "./MyProfile.css";

const initialFormData = {
  phone: "",
  bio: "",
  experienceYears: 0,
  education: "",
  skills: "",
  currentJobTitle: "",
  linkedInUrl: "",
  portfolioUrl: "",
  address: "",
};

function MyProfile() {
  const [formData, setFormData] = useState(initialFormData);

  const [profileInformation, setProfileInformation] = useState({
    candidateProfileId: null,
    fullName: "",
    email: "",
    role: "",
    updatedAt: null,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    setMessage("");
    setIsError(false);

    try {
      const response =
        await axiosInstance.get("/CandidateProfiles/me");

      const profile = response.data;

      setProfileInformation({
        candidateProfileId:
          profile.candidateProfileId,
        fullName:
          profile.fullName ?? "",
        email:
          profile.email ?? "",
        role:
          profile.role ?? "",
        updatedAt:
          profile.updatedAt ?? null,
      });

      setFormData({
        phone:
          profile.phone ?? "",
        bio:
          profile.bio ?? "",
        experienceYears:
          profile.experienceYears ?? 0,
        education:
          profile.education ?? "",
        skills:
          profile.skills ?? "",
        currentJobTitle:
          profile.currentJobTitle ?? "",
        linkedInUrl:
          profile.linkedInUrl ?? "",
        portfolioUrl:
          profile.portfolioUrl ?? "",
        address:
          profile.address ?? "",
      });
    } catch (error) {
      console.error("Profile loading error:", error);

      setIsError(true);
      setMessage(
        error.response?.data?.message ??
          "Unable to load your profile."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]:
        name === "experienceYears"
          ? Number(value)
          : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setIsError(false);

    try {
      const response =
        await axiosInstance.put(
          "/CandidateProfiles/me",
          {
            phone: formData.phone.trim(),
            bio: formData.bio.trim(),
            experienceYears:
              Number(formData.experienceYears),
            education: formData.education.trim(),
            skills: formData.skills.trim(),
            currentJobTitle:
              formData.currentJobTitle.trim(),
            linkedInUrl:
              formData.linkedInUrl.trim(),
            portfolioUrl:
              formData.portfolioUrl.trim(),
            address:
              formData.address.trim(),
          }
        );

      setMessage(
        response.data?.message ??
          "Profile updated successfully."
      );

      setProfileInformation(
        (previousInformation) => ({
          ...previousInformation,
          updatedAt:
            response.data?.profile?.updatedAt ??
            new Date().toISOString(),
        })
      );
    } catch (error) {
      console.error("Profile update error:", error);

      const responseData = error.response?.data;

      let errorMessage =
        responseData?.message ??
        "Unable to update your profile.";

      if (responseData?.errors) {
        const validationMessages =
          Object.values(responseData.errors)
            .flat()
            .join(" ");

        if (validationMessages) {
          errorMessage = validationMessages;
        }
      }

      setIsError(true);
      setMessage(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "Not updated yet";
    }

    return new Date(dateValue).toLocaleString("en-LK", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="profile-state-card">
        <h2>Loading profile...</h2>
        <p>Please wait while your profile is loaded.</p>
      </div>
    );
  }

  return (
    <div className="my-profile-page">
      <section className="profile-header">
        <div>
          <span className="profile-label">
            Candidate Information
          </span>

          <h2>My Profile</h2>

          <p>
            Update your skills, education, experience and
            professional details.
          </p>
        </div>

        <div className="profile-header-summary">
          <div className="profile-avatar-large">
            {profileInformation.fullName
              .charAt(0)
              .toUpperCase() || "C"}
          </div>

          <div>
            <strong>
              {profileInformation.fullName ||
                "Candidate"}
            </strong>

            <span>
              {profileInformation.email}
            </span>
          </div>
        </div>
      </section>

      {message && (
        <div
          className={
            isError
              ? "profile-message error"
              : "profile-message success"
          }
        >
          {message}
        </div>
      )}

      <div className="profile-layout-grid">
        <aside className="profile-summary-card">
          <h3>Account Details</h3>

          <div className="profile-summary-item">
            <span>Full name</span>
            <strong>
              {profileInformation.fullName}
            </strong>
          </div>

          <div className="profile-summary-item">
            <span>Email</span>
            <strong>
              {profileInformation.email}
            </strong>
          </div>

          <div className="profile-summary-item">
            <span>Role</span>
            <strong>
              {profileInformation.role}
            </strong>
          </div>

          <div className="profile-summary-item">
            <span>Profile ID</span>
            <strong>
              #
              {profileInformation.candidateProfileId ??
                "N/A"}
            </strong>
          </div>

          <div className="profile-summary-item">
            <span>Last updated</span>
            <strong>
              {formatDate(
                profileInformation.updatedAt
              )}
            </strong>
          </div>

          <p className="profile-summary-note">
            Your name and email are managed through your
            JobMart account.
          </p>
        </aside>

        <form
          className="profile-form-card"
          onSubmit={handleSubmit}
        >
          <div className="profile-form-section">
            <div className="profile-section-title">
              <h3>Personal Information</h3>
              <p>
                Add your contact details and professional
                summary.
              </p>
            </div>

            <div className="profile-form-grid">
              <div className="profile-form-group">
                <label htmlFor="phone">
                  Phone number
                </label>

                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  maxLength="20"
                  placeholder="0771234567"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="profile-form-group">
                <label htmlFor="currentJobTitle">
                  Current job title
                </label>

                <input
                  id="currentJobTitle"
                  name="currentJobTitle"
                  type="text"
                  maxLength="150"
                  placeholder="Junior Software Developer"
                  value={formData.currentJobTitle}
                  onChange={handleChange}
                />
              </div>

              <div className="profile-form-group full-width">
                <label htmlFor="address">
                  Address
                </label>

                <input
                  id="address"
                  name="address"
                  type="text"
                  maxLength="500"
                  placeholder="Colombo, Sri Lanka"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>

              <div className="profile-form-group full-width">
                <label htmlFor="bio">
                  Professional bio
                </label>

                <textarea
                  id="bio"
                  name="bio"
                  rows="5"
                  maxLength="1000"
                  placeholder="Write a short professional introduction..."
                  value={formData.bio}
                  onChange={handleChange}
                />

                <span className="profile-character-count">
                  {formData.bio.length}/1000
                </span>
              </div>
            </div>
          </div>

          <div className="profile-form-section">
            <div className="profile-section-title">
              <h3>Qualifications</h3>
              <p>
                These details are used by the AI candidate
                ranking system.
              </p>
            </div>

            <div className="profile-form-grid">
              <div className="profile-form-group">
                <label htmlFor="experienceYears">
                  Years of experience
                </label>

                <input
                  id="experienceYears"
                  name="experienceYears"
                  type="number"
                  min="0"
                  max="60"
                  value={formData.experienceYears}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="profile-form-group">
                <label htmlFor="education">
                  Education
                </label>

                <input
                  id="education"
                  name="education"
                  type="text"
                  maxLength="500"
                  placeholder="BSc in Software Engineering"
                  value={formData.education}
                  onChange={handleChange}
                />
              </div>

              <div className="profile-form-group full-width">
                <label htmlFor="skills">
                  Skills
                </label>

                <textarea
                  id="skills"
                  name="skills"
                  rows="4"
                  maxLength="1000"
                  placeholder="C#, ASP.NET Core, React, SQL Server, Azure"
                  value={formData.skills}
                  onChange={handleChange}
                />

                <span className="profile-character-count">
                  {formData.skills.length}/1000
                </span>
              </div>
            </div>
          </div>

          <div className="profile-form-section">
            <div className="profile-section-title">
              <h3>Professional Links</h3>
              <p>
                Add links to your professional profiles and
                portfolio.
              </p>
            </div>

            <div className="profile-form-grid">
              <div className="profile-form-group">
                <label htmlFor="linkedInUrl">
                  LinkedIn URL
                </label>

                <input
                  id="linkedInUrl"
                  name="linkedInUrl"
                  type="url"
                  maxLength="500"
                  placeholder="https://linkedin.com/in/username"
                  value={formData.linkedInUrl}
                  onChange={handleChange}
                />
              </div>

              <div className="profile-form-group">
                <label htmlFor="portfolioUrl">
                  Portfolio URL
                </label>

                <input
                  id="portfolioUrl"
                  name="portfolioUrl"
                  type="url"
                  maxLength="500"
                  placeholder="https://yourportfolio.com"
                  value={formData.portfolioUrl}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="profile-form-actions">
            <button
              type="button"
              className="profile-refresh-button"
              onClick={loadProfile}
              disabled={saving}
            >
              Reset Changes
            </button>

            <button
              type="submit"
              className="profile-save-button"
              disabled={saving}
            >
              {saving
                ? "Saving..."
                : "Save Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MyProfile;