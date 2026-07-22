import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance.js";
import "./JobRecommendations.css";

function JobRecommendations() {
  const navigate = useNavigate();

  const [recommendations, setRecommendations] = useState([]);
  const [candidateInformation, setCandidateInformation] =
    useState({
      candidateName: "",
      candidateSkills: "",
      experienceYears: 0,
      education: "",
      totalRecommendations: 0,
      excellentMatches: 0,
      goodMatches: 0,
    });

  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    setLoading(true);
    setMessage("");
    setIsError(false);

    try {
      const response = await axiosInstance.get(
        "/JobRecommendations/my"
      );

      const data = response.data;

      setCandidateInformation({
        candidateName: data.candidateName ?? "",
        candidateSkills: data.candidateSkills ?? "",
        experienceYears: data.experienceYears ?? 0,
        education: data.education ?? "",
        totalRecommendations:
          data.totalRecommendations ?? 0,
        excellentMatches: data.excellentMatches ?? 0,
        goodMatches: data.goodMatches ?? 0,
      });

      setRecommendations(data.recommendations ?? []);
    } catch (error) {
      console.error(
        "Job recommendations loading error:",
        error
      );

      setIsError(true);
      setMessage(
        error.response?.data?.message ??
          "Unable to load job recommendations."
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredRecommendations = useMemo(() => {
    if (filter === "Excellent") {
      return recommendations.filter(
        (job) => job.totalScore >= 80
      );
    }

    if (filter === "Good") {
      return recommendations.filter(
        (job) =>
          job.totalScore >= 65 &&
          job.totalScore < 80
      );
    }

    if (filter === "Not Applied") {
      return recommendations.filter(
        (job) => !job.hasApplied
      );
    }

    if (filter === "Applied") {
      return recommendations.filter(
        (job) => job.hasApplied
      );
    }

    return recommendations;
  }, [recommendations, filter]);

  const formatSalary = (minimum, maximum) => {
    if (!minimum && !maximum) {
      return "Salary not specified";
    }

    const formatter = new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
      maximumFractionDigits: 0,
    });

    if (minimum && maximum) {
      return `${formatter.format(
        minimum
      )} - ${formatter.format(maximum)}`;
    }

    if (minimum) {
      return `From ${formatter.format(minimum)}`;
    }

    return `Up to ${formatter.format(maximum)}`;
  };

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "Not specified";
    }

    return new Date(dateValue).toLocaleDateString(
      "en-LK",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    );
  };

  const getScoreClass = (score) => {
    if (score >= 80) {
      return "excellent";
    }

    if (score >= 65) {
      return "good";
    }

    if (score >= 50) {
      return "average";
    }

    return "low";
  };

  const goToBrowseJobs = () => {
    navigate("/candidate/jobs");
  };

  if (loading) {
    return (
      <div className="recommendations-state-card">
        <h2>Calculating recommendations...</h2>
        <p>
          JobMart is comparing your profile with available
          jobs.
        </p>
      </div>
    );
  }

  return (
    <div className="job-recommendations-page">
      <section className="recommendations-header">
        <div>
          <span className="recommendations-label">
            AI-Powered Matching
          </span>

          <h2>Job Recommendations</h2>

          <p>
            Jobs ranked using your skills, education and
            experience.
          </p>
        </div>

        <div className="recommendations-summary">
          <div>
            <strong>
              {
                candidateInformation
                  .totalRecommendations
              }
            </strong>
            <span>Total Jobs</span>
          </div>

          <div>
            <strong>
              {
                candidateInformation
                  .excellentMatches
              }
            </strong>
            <span>Excellent</span>
          </div>

          <div>
            <strong>
              {candidateInformation.goodMatches}
            </strong>
            <span>Good</span>
          </div>
        </div>
      </section>

      {message && (
        <div
          className={
            isError
              ? "recommendations-message error"
              : "recommendations-message success"
          }
        >
          {message}
        </div>
      )}

      <section className="candidate-match-profile">
        <div>
          <h3>
            Recommendations for{" "}
            {candidateInformation.candidateName}
          </h3>

          <p>
            The AI score is calculated from profile skills,
            experience and education.
          </p>
        </div>

        <div className="candidate-match-details">
          <span>
            <strong>Experience:</strong>{" "}
            {candidateInformation.experienceYears} years
          </span>

          <span>
            <strong>Education:</strong>{" "}
            {candidateInformation.education ||
              "Not specified"}
          </span>
        </div>

        <div className="candidate-skills-summary">
          <strong>Your skills</strong>

          <p>
            {candidateInformation.candidateSkills ||
              "No skills added"}
          </p>
        </div>
      </section>

      <section className="recommendations-toolbar">
        <div className="recommendation-filters">
          {[
            "All",
            "Excellent",
            "Good",
            "Not Applied",
            "Applied",
          ].map((filterValue) => (
            <button
              type="button"
              key={filterValue}
              className={
                filter === filterValue
                  ? "recommendation-filter active"
                  : "recommendation-filter"
              }
              onClick={() => setFilter(filterValue)}
            >
              {filterValue}
            </button>
          ))}
        </div>

        <button
          type="button"
          className="recommendations-refresh-button"
          onClick={loadRecommendations}
        >
          Recalculate
        </button>
      </section>

      {filteredRecommendations.length === 0 ? (
        <div className="recommendations-state-card">
          <h3>No matching jobs found</h3>

          <p>
            No jobs match the selected recommendation
            filter.
          </p>
        </div>
      ) : (
        <section className="recommendations-grid">
          {filteredRecommendations.map((job) => (
            <article
              key={job.jobId}
              className="recommendation-card"
            >
              <div className="recommendation-card-top">
                <div>
                  <span className="recommendation-job-id">
                    Job #{job.jobId}
                  </span>

                  <h3>{job.title}</h3>

                  <div className="recommendation-job-meta">
                    <span>
                      {job.location ||
                        "Location not specified"}
                    </span>

                    <span>
                      {job.employmentType ||
                        "Employment type not specified"}
                    </span>
                  </div>
                </div>

                <div
                  className={`recommendation-score ${getScoreClass(
                    job.totalScore
                  )}`}
                >
                  <strong>{job.totalScore}%</strong>
                  <span>{job.matchLevel}</span>
                </div>
              </div>

              <p className="recommendation-description">
                {job.description}
              </p>

              <div className="recommendation-info-grid">
                <div>
                  <span>Salary</span>

                  <strong>
                    {formatSalary(
                      job.salaryMin,
                      job.salaryMax
                    )}
                  </strong>
                </div>

                <div>
                  <span>Deadline</span>

                  <strong>
                    {formatDate(job.deadline)}
                  </strong>
                </div>
              </div>

              <div className="score-breakdown">
                <div>
                  <span>Skills</span>

                  <div className="score-progress">
                    <div
                      style={{
                        width: `${
                          (job.skillsScore / 50) * 100
                        }%`,
                      }}
                    />
                  </div>

                  <strong>{job.skillsScore}/50</strong>
                </div>

                <div>
                  <span>Experience</span>

                  <div className="score-progress">
                    <div
                      style={{
                        width: `${
                          (job.experienceScore / 30) *
                          100
                        }%`,
                      }}
                    />
                  </div>

                  <strong>
                    {job.experienceScore}/30
                  </strong>
                </div>

                <div>
                  <span>Education</span>

                  <div className="score-progress">
                    <div
                      style={{
                        width: `${
                          (job.educationScore / 20) *
                          100
                        }%`,
                      }}
                    />
                  </div>

                  <strong>
                    {job.educationScore}/20
                  </strong>
                </div>
              </div>

              <div className="skills-comparison">
                <div>
                  <h4>Matched Skills</h4>

                  <div className="skill-tag-list">
                    {job.matchedSkills?.length > 0 ? (
                      job.matchedSkills.map((skill) => (
                        <span
                          key={`${job.jobId}-matched-${skill}`}
                          className="skill-tag matched"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="skills-empty-text">
                        No direct skill matches
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h4>Missing Skills</h4>

                  <div className="skill-tag-list">
                    {job.missingSkills?.length > 0 ? (
                      job.missingSkills.map((skill) => (
                        <span
                          key={`${job.jobId}-missing-${skill}`}
                          className="skill-tag missing"
                        >
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="skills-empty-text">
                        No missing skills
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="recommendation-card-actions">
                {job.hasApplied ? (
                  <div className="already-applied-box">
                    <span>Application submitted</span>

                    <strong>
                      {job.applicationStatus ??
                        "Applied"}
                    </strong>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="recommendation-apply-button"
                    onClick={goToBrowseJobs}
                  >
                    View Job and Apply
                  </button>
                )}
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

export default JobRecommendations;