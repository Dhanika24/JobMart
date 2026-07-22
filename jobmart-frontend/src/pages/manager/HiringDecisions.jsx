import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import "./HiringDecisions.css";

function HiringDecisions() {
  const navigate = useNavigate();

  const [evaluations, setEvaluations] = useState([]);
  const [selectedEvaluation, setSelectedEvaluation] =
    useState(null);

  const [searchText, setSearchText] = useState("");
  const [decisionFilter, setDecisionFilter] =
    useState("All");
  const [recommendationFilter, setRecommendationFilter] =
    useState("All");

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    loadEvaluations();
  }, []);

  const loadEvaluations = async () => {
    setLoading(true);
    setMessage("");
    setIsError(false);

    try {
      const response = await axiosInstance.get(
        "/CandidateEvaluations"
      );

      const evaluationData =
        response.data?.evaluations ??
        response.data ??
        [];

      setEvaluations(
        Array.isArray(evaluationData)
          ? evaluationData
          : []
      );

      setSelectedEvaluation((currentEvaluation) => {
        if (!currentEvaluation) {
          return null;
        }

        return (
          evaluationData.find(
            (evaluation) =>
              evaluation.evaluationId ===
              currentEvaluation.evaluationId
          ) ?? null
        );
      });
    } catch (error) {
      console.error(
        "Hiring decisions loading error:",
        error
      );

      setIsError(true);

      setMessage(
        error.response?.data?.message ??
          "Unable to load hiring decisions."
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "Not available";
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

  const formatDecision = (decision) => {
    if (decision === "UnderReview") {
      return "Under Review";
    }

    if (decision === "Hired") {
      return "Selected";
    }

    return decision || "Pending";
  };

  const getDecisionClass = (decision) => {
    return formatDecision(decision)
      .toLowerCase()
      .replaceAll(" ", "-");
  };

  const getScoreClass = (score) => {
    const numericScore = Number(score ?? 0);

    if (numericScore >= 8) {
      return "excellent";
    }

    if (numericScore >= 6) {
      return "good";
    }

    if (numericScore >= 4) {
      return "average";
    }

    return "low";
  };

  const decisionOptions = useMemo(() => {
    const availableDecisions = evaluations
      .map((evaluation) =>
        formatDecision(evaluation.decision)
      )
      .filter(Boolean);

    return [
      "All",
      ...new Set(availableDecisions),
    ];
  }, [evaluations]);

  const recommendationOptions = useMemo(() => {
    const availableRecommendations = evaluations
      .map((evaluation) => evaluation.recommendation)
      .filter(Boolean);

    return [
      "All",
      ...new Set(availableRecommendations),
    ];
  }, [evaluations]);

  const filteredEvaluations = useMemo(() => {
    const normalizedSearch =
      searchText.trim().toLowerCase();

    return evaluations.filter((evaluation) => {
      const displayedDecision =
        formatDecision(evaluation.decision);

      const matchesDecision =
        decisionFilter === "All" ||
        displayedDecision === decisionFilter;

      const matchesRecommendation =
        recommendationFilter === "All" ||
        evaluation.recommendation ===
          recommendationFilter;

      const searchableText = [
        evaluation.candidateName,
        evaluation.candidateEmail,
        evaluation.jobTitle,
        evaluation.hiringManagerName,
        evaluation.recommendation,
        displayedDecision,
        evaluation.feedback,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        normalizedSearch.length === 0 ||
        searchableText.includes(normalizedSearch);

      return (
        matchesDecision &&
        matchesRecommendation &&
        matchesSearch
      );
    });
  }, [
    evaluations,
    searchText,
    decisionFilter,
    recommendationFilter,
  ]);

  const summary = useMemo(() => {
    const countDecision = (decision) =>
      evaluations.filter(
        (evaluation) =>
          formatDecision(evaluation.decision) ===
          decision
      ).length;

    return {
      total: evaluations.length,
      pending: countDecision("Pending"),
      underReview: countDecision("Under Review"),
      shortlisted: countDecision("Shortlisted"),
      selected: countDecision("Selected"),
      rejected: countDecision("Rejected"),
    };
  }, [evaluations]);

  const averageScore = useMemo(() => {
    if (evaluations.length === 0) {
      return "0.00";
    }

    const totalScore = evaluations.reduce(
      (total, evaluation) =>
        total +
        Number(evaluation.overallScore ?? 0),
      0
    );

    return (
      totalScore / evaluations.length
    ).toFixed(2);
  }, [evaluations]);

  const openEvaluation = (evaluation) => {
    navigate(
      `/manager/evaluations?applicationId=${evaluation.jobApplicationId}`
    );
  };

  const openCandidate = (evaluation) => {
    navigate(
      `/manager/candidates?applicationId=${evaluation.jobApplicationId}`
    );
  };

  if (loading) {
    return (
      <section className="hiring-decisions-state">
        <h2>Loading hiring decisions...</h2>

        <p>
          Please wait while candidate evaluations are
          loaded.
        </p>
      </section>
    );
  }

  return (
    <div className="hiring-decisions-page">
      <section className="hiring-decisions-heading">
        <div>
          <span>Final Review</span>

          <h2>Hiring Decisions</h2>

          <p>
            Compare candidate scores, recommendations,
            feedback and final hiring decisions.
          </p>
        </div>

        <button
          type="button"
          onClick={loadEvaluations}
        >
          Refresh Decisions
        </button>
      </section>

      {message && (
        <div
          className={
            isError
              ? "hiring-decisions-message error"
              : "hiring-decisions-message success"
          }
        >
          {message}
        </div>
      )}

      <section className="hiring-decisions-summary">
        <article>
          <span>Total Evaluations</span>

          <strong>{summary.total}</strong>
        </article>

        <article>
          <span>Average Score</span>

          <strong>{averageScore}/10</strong>
        </article>

        <article>
          <span>Under Review</span>

          <strong>
            {summary.pending + summary.underReview}
          </strong>
        </article>

        <article>
          <span>Shortlisted</span>

          <strong>{summary.shortlisted}</strong>
        </article>

        <article>
          <span>Selected</span>

          <strong>{summary.selected}</strong>
        </article>

        <article>
          <span>Rejected</span>

          <strong>{summary.rejected}</strong>
        </article>
      </section>

      <section className="hiring-decisions-filters">
        <div className="hiring-decisions-search">
          <label htmlFor="hiringDecisionSearch">
            Search evaluations
          </label>

          <input
            id="hiringDecisionSearch"
            type="search"
            placeholder="Search candidate, job or manager"
            value={searchText}
            onChange={(event) =>
              setSearchText(event.target.value)
            }
          />
        </div>

        <div>
          <label htmlFor="decisionFilter">
            Decision
          </label>

          <select
            id="decisionFilter"
            value={decisionFilter}
            onChange={(event) =>
              setDecisionFilter(event.target.value)
            }
          >
            {decisionOptions.map((decision) => (
              <option
                key={decision}
                value={decision}
              >
                {decision}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="recommendationFilter">
            Recommendation
          </label>

          <select
            id="recommendationFilter"
            value={recommendationFilter}
            onChange={(event) =>
              setRecommendationFilter(
                event.target.value
              )
            }
          >
            {recommendationOptions.map(
              (recommendation) => (
                <option
                  key={recommendation}
                  value={recommendation}
                >
                  {recommendation}
                </option>
              )
            )}
          </select>
        </div>
      </section>

      {filteredEvaluations.length === 0 ? (
        <section className="hiring-decisions-state">
          <h2>No hiring decisions found</h2>

          <p>
            No evaluations match the selected search and
            filters.
          </p>
        </section>
      ) : (
        <section className="hiring-decisions-grid">
          {filteredEvaluations.map((evaluation) => (
            <article
              className="hiring-decision-card"
              key={evaluation.evaluationId}
            >
              <div className="hiring-decision-card-header">
                <div className="hiring-decision-avatar">
                  {evaluation.candidateName
                    ?.charAt(0)
                    .toUpperCase() ?? "C"}
                </div>

                <div className="hiring-decision-candidate-info">
                  <h3>
                    {evaluation.candidateName ??
                      "Unknown Candidate"}
                  </h3>

                  <p>
                    {evaluation.candidateEmail ||
                      "No email available"}
                  </p>

                  <span>
                    {evaluation.jobTitle ??
                      "Unknown Position"}
                  </span>
                </div>

                <span
                  className={`hiring-decision-status ${getDecisionClass(
                    evaluation.decision
                  )}`}
                >
                  {formatDecision(
                    evaluation.decision
                  )}
                </span>
              </div>

              <div className="hiring-decision-score-section">
                <div
                  className={`hiring-decision-overall-score ${getScoreClass(
                    evaluation.overallScore
                  )}`}
                >
                  <span>Overall Score</span>

                  <strong>
                    {Number(
                      evaluation.overallScore ?? 0
                    ).toFixed(2)}
                    /10
                  </strong>
                </div>

                <div className="hiring-decision-ai-score">
                  <span>AI Score</span>

                  <strong>
                    {Math.round(
                      Number(evaluation.aiScore ?? 0)
                    )}
                    %
                  </strong>
                </div>
              </div>

              <div className="hiring-decision-scores">
                <article>
                  <span>Technical</span>

                  <strong>
                    {evaluation.technicalScore ?? 0}/10
                  </strong>
                </article>

                <article>
                  <span>Communication</span>

                  <strong>
                    {evaluation.communicationScore ?? 0}
                    /10
                  </strong>
                </article>

                <article>
                  <span>Experience</span>

                  <strong>
                    {evaluation.experienceScore ?? 0}/10
                  </strong>
                </article>

                <article>
                  <span>Problem Solving</span>

                  <strong>
                    {evaluation.problemSolvingScore ?? 0}
                    /10
                  </strong>
                </article>

                <article>
                  <span>Culture Fit</span>

                  <strong>
                    {evaluation.cultureFitScore ?? 0}/10
                  </strong>
                </article>
              </div>

              <div className="hiring-decision-recommendation">
                <span>Recommendation</span>

                <strong>
                  {evaluation.recommendation ||
                    "Consider"}
                </strong>
              </div>

              <div className="hiring-decision-feedback">
                <span>Manager Feedback</span>

                <p>
                  {evaluation.feedback ||
                    "No evaluation feedback has been added."}
                </p>
              </div>

              <div className="hiring-decision-meta">
                <span>
                  Manager:{" "}
                  {evaluation.hiringManagerName ||
                    "Unknown"}
                </span>

                <span>
                  Evaluated:{" "}
                  {formatDate(evaluation.createdAt)}
                </span>

                <span>
                  Updated:{" "}
                  {formatDate(evaluation.updatedAt)}
                </span>
              </div>

              <div className="hiring-decision-actions">
                <button
                  type="button"
                  className="primary"
                  onClick={() =>
                    openEvaluation(evaluation)
                  }
                >
                  Edit Evaluation
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedEvaluation(evaluation)
                  }
                >
                  View Details
                </button>

                <button
                  type="button"
                  onClick={() =>
                    openCandidate(evaluation)
                  }
                >
                  View Candidate
                </button>
              </div>
            </article>
          ))}
        </section>
      )}

      {selectedEvaluation && (
        <div
          className="hiring-decision-modal-overlay"
          role="presentation"
          onClick={() =>
            setSelectedEvaluation(null)
          }
        >
          <section
            className="hiring-decision-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="hiringDecisionDetailsTitle"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="hiring-decision-modal-header">
              <div>
                <span>Hiring Decision Details</span>

                <h2 id="hiringDecisionDetailsTitle">
                  {selectedEvaluation.candidateName}
                </h2>

                <p>
                  {selectedEvaluation.jobTitle}
                </p>
              </div>

              <button
                type="button"
                aria-label="Close hiring decision"
                onClick={() =>
                  setSelectedEvaluation(null)
                }
              >
                ×
              </button>
            </div>

            <div className="hiring-decision-modal-summary">
              <article>
                <span>Overall Score</span>

                <strong>
                  {Number(
                    selectedEvaluation.overallScore ?? 0
                  ).toFixed(2)}
                  /10
                </strong>
              </article>

              <article>
                <span>AI Score</span>

                <strong>
                  {Math.round(
                    Number(
                      selectedEvaluation.aiScore ?? 0
                    )
                  )}
                  %
                </strong>
              </article>

              <article>
                <span>Recommendation</span>

                <strong>
                  {selectedEvaluation.recommendation}
                </strong>
              </article>

              <article>
                <span>Decision</span>

                <strong>
                  {formatDecision(
                    selectedEvaluation.decision
                  )}
                </strong>
              </article>
            </div>

            <div className="hiring-decision-modal-scores">
              <article>
                <span>Technical Skills</span>

                <strong>
                  {selectedEvaluation.technicalScore ?? 0}
                  /10
                </strong>
              </article>

              <article>
                <span>Communication</span>

                <strong>
                  {selectedEvaluation.communicationScore ??
                    0}
                  /10
                </strong>
              </article>

              <article>
                <span>Experience</span>

                <strong>
                  {selectedEvaluation.experienceScore ?? 0}
                  /10
                </strong>
              </article>

              <article>
                <span>Problem Solving</span>

                <strong>
                  {selectedEvaluation.problemSolvingScore ??
                    0}
                  /10
                </strong>
              </article>

              <article>
                <span>Culture Fit</span>

                <strong>
                  {selectedEvaluation.cultureFitScore ?? 0}
                  /10
                </strong>
              </article>
            </div>

            <div className="hiring-decision-modal-section">
              <h3>Evaluation Feedback</h3>

              <p>
                {selectedEvaluation.feedback ||
                  "No feedback has been added."}
              </p>
            </div>

            <div className="hiring-decision-modal-section">
              <h3>Evaluation Record</h3>

              <p>
                Hiring Manager:{" "}
                {selectedEvaluation.hiringManagerName ||
                  "Unknown"}
              </p>

              <p>
                Created:{" "}
                {formatDate(selectedEvaluation.createdAt)}
              </p>

              <p>
                Last Updated:{" "}
                {formatDate(selectedEvaluation.updatedAt)}
              </p>
            </div>

            <div className="hiring-decision-modal-actions">
              <button
                type="button"
                className="primary"
                onClick={() =>
                  openEvaluation(selectedEvaluation)
                }
              >
                Edit Candidate Evaluation
              </button>

              <button
                type="button"
                onClick={() =>
                  setSelectedEvaluation(null)
                }
              >
                Close
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default HiringDecisions;