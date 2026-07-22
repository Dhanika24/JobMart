import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useSearchParams,
} from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import "./CandidateEvaluations.css";

const emptyForm = {
  technicalScore: 0,
  communicationScore: 0,
  experienceScore: 0,
  problemSolvingScore: 0,
  cultureFitScore: 0,
  feedback: "",
  recommendation: "Consider",
  decision: "Pending",
};

function CandidateEvaluations() {
  const [searchParams, setSearchParams] =
    useSearchParams();

  const applicationIdFromUrl =
    searchParams.get("applicationId");

  const [candidates, setCandidates] =
    useState([]);

  const [evaluations, setEvaluations] =
    useState([]);

  const [
    selectedApplicationId,
    setSelectedApplicationId,
  ] = useState("");

  const [formData, setFormData] =
    useState(emptyForm);

  const [searchText, setSearchText] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [isError, setIsError] =
    useState(false);

  useEffect(() => {
    loadPageData();
  }, []);

  useEffect(() => {
    if (
      !loading &&
      applicationIdFromUrl &&
      candidates.length > 0
    ) {
      const applicationExists =
        candidates.some(
          (candidate) =>
            String(candidate.applicationId) ===
            String(applicationIdFromUrl)
        );

      if (applicationExists) {
        selectCandidate(applicationIdFromUrl);
      }
    }
  }, [
    loading,
    applicationIdFromUrl,
    candidates,
  ]);

  const loadPageData = async () => {
    setLoading(true);
    setMessage("");
    setIsError(false);

    try {
      const [
        candidatesResponse,
        evaluationsResponse,
      ] = await Promise.all([
        axiosInstance.get(
          "/Applications/manager/candidates"
        ),

        axiosInstance.get(
          "/CandidateEvaluations"
        ),
      ]);

      const candidateData =
        candidatesResponse.data?.candidates ??
        candidatesResponse.data ??
        [];

      const evaluationData =
        evaluationsResponse.data?.evaluations ??
        evaluationsResponse.data ??
        [];

      setCandidates(
        Array.isArray(candidateData)
          ? candidateData
          : []
      );

      setEvaluations(
        Array.isArray(evaluationData)
          ? evaluationData
          : []
      );
    } catch (error) {
      console.error(
        "Candidate evaluations page error:",
        error
      );

      setIsError(true);

      setMessage(
        error.response?.data?.message ??
          "Unable to load candidate evaluations."
      );
    } finally {
      setLoading(false);
    }
  };

  const selectedCandidate = useMemo(() => {
    return (
      candidates.find(
        (candidate) =>
          String(candidate.applicationId) ===
          String(selectedApplicationId)
      ) ?? null
    );
  }, [
    candidates,
    selectedApplicationId,
  ]);

  const selectedEvaluation = useMemo(() => {
    if (!selectedApplicationId) {
      return null;
    }

    return (
      evaluations.find(
        (evaluation) =>
          String(
            evaluation.jobApplicationId
          ) ===
          String(selectedApplicationId)
      ) ?? null
    );
  }, [
    evaluations,
    selectedApplicationId,
  ]);

  const overallScore = useMemo(() => {
    const scores = [
      Number(formData.technicalScore),
      Number(formData.communicationScore),
      Number(formData.experienceScore),
      Number(formData.problemSolvingScore),
      Number(formData.cultureFitScore),
    ];

    const total = scores.reduce(
      (sum, score) => sum + score,
      0
    );

    return (total / scores.length).toFixed(2);
  }, [formData]);

  const filteredCandidates = useMemo(() => {
    const normalizedSearch =
      searchText.trim().toLowerCase();

    if (!normalizedSearch) {
      return candidates;
    }

    return candidates.filter((candidate) => {
      const candidateText = [
        candidate.candidateName,
        candidate.candidateEmail,
        candidate.jobTitle,
        candidate.currentJobTitle,
        candidate.skills,
        candidate.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return candidateText.includes(
        normalizedSearch
      );
    });
  }, [candidates, searchText]);

  const completedEvaluationCount =
    evaluations.length;

  const pendingEvaluationCount =
    candidates.filter(
      (candidate) =>
        !evaluations.some(
          (evaluation) =>
            String(
              evaluation.jobApplicationId
            ) ===
            String(candidate.applicationId)
        )
    ).length;

  const selectedDecisionCount =
    evaluations.filter(
      (evaluation) =>
        evaluation.decision === "Selected"
    ).length;

  const formatStatus = (status) => {
    if (status === "UnderReview") {
      return "Under Review";
    }

    if (status === "InterviewScheduled") {
      return "Interview Scheduled";
    }

    if (status === "InterviewCompleted") {
      return "Interview Completed";
    }

    if (status === "Hired") {
      return "Selected";
    }

    return status || "Unknown";
  };

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "Not available";
    }

    return new Date(
      dateValue
    ).toLocaleDateString("en-LK", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getScoreClass = (score) => {
    const numericScore =
      Number(score ?? 0);

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

  const selectCandidate = (
    applicationId
  ) => {
    const selectedId =
      String(applicationId);

    setSelectedApplicationId(
      selectedId
    );

    setSearchParams({
      applicationId: selectedId,
    });

    const existingEvaluation =
      evaluations.find(
        (evaluation) =>
          String(
            evaluation.jobApplicationId
          ) === selectedId
      );

    if (existingEvaluation) {
      setFormData({
        technicalScore:
          existingEvaluation
            .technicalScore ?? 0,

        communicationScore:
          existingEvaluation
            .communicationScore ?? 0,

        experienceScore:
          existingEvaluation
            .experienceScore ?? 0,

        problemSolvingScore:
          existingEvaluation
            .problemSolvingScore ?? 0,

        cultureFitScore:
          existingEvaluation
            .cultureFitScore ?? 0,

        feedback:
          existingEvaluation.feedback ??
          "",

        recommendation:
          existingEvaluation
            .recommendation ??
          "Consider",

        decision:
          existingEvaluation.decision ??
          "Pending",
      });
    } else {
      setFormData(emptyForm);
    }

    setMessage("");
    setIsError(false);
  };

  const handleInputChange = (
    event
  ) => {
    const { name, value } =
      event.target;

    const scoreFields = [
      "technicalScore",
      "communicationScore",
      "experienceScore",
      "problemSolvingScore",
      "cultureFitScore",
    ];

    setFormData(
      (previousFormData) => ({
        ...previousFormData,

        [name]: scoreFields.includes(name)
          ? Math.min(
              10,
              Math.max(0, Number(value))
            )
          : value,
      })
    );
  };

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault();

    if (!selectedApplicationId) {
      setIsError(true);

      setMessage(
        "Select a candidate before saving an evaluation."
      );

      return;
    }

    setSaving(true);
    setMessage("");
    setIsError(false);

    const requestBody = {
      technicalScore:
        Number(
          formData.technicalScore
        ),

      communicationScore:
        Number(
          formData.communicationScore
        ),

      experienceScore:
        Number(
          formData.experienceScore
        ),

      problemSolvingScore:
        Number(
          formData.problemSolvingScore
        ),

      cultureFitScore:
        Number(
          formData.cultureFitScore
        ),

      feedback:
        formData.feedback.trim(),

      recommendation:
        formData.recommendation,

      decision:
        formData.decision,
    };

    try {
      if (selectedEvaluation) {
        await axiosInstance.put(
          `/CandidateEvaluations/${selectedEvaluation.evaluationId}`,
          requestBody
        );

        setMessage(
          "Candidate evaluation updated successfully."
        );
      } else {
        await axiosInstance.post(
          "/CandidateEvaluations",
          {
            jobApplicationId:
              Number(
                selectedApplicationId
              ),

            ...requestBody,
          }
        );

        setMessage(
          "Candidate evaluation created successfully."
        );
      }

      await loadPageData();

      setSelectedApplicationId(
        String(selectedApplicationId)
      );

      setSearchParams({
        applicationId:
          String(
            selectedApplicationId
          ),
      });
    } catch (error) {
      console.error(
        "Save evaluation error:",
        error
      );

      setIsError(true);

      setMessage(
        error.response?.data?.message ??
          "Unable to save this evaluation."
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteEvaluation =
    async () => {
      if (!selectedEvaluation) {
        return;
      }

      const confirmed =
        window.confirm(
          `Delete the evaluation for ${
            selectedCandidate
              ?.candidateName ??
            "this candidate"
          }?`
        );

      if (!confirmed) {
        return;
      }

      setDeleting(true);
      setMessage("");
      setIsError(false);

      try {
        await axiosInstance.delete(
          `/CandidateEvaluations/${selectedEvaluation.evaluationId}`
        );

        setMessage(
          "Candidate evaluation deleted successfully."
        );

        setSelectedApplicationId("");
        setSearchParams({});
        setFormData(emptyForm);

        await loadPageData();
      } catch (error) {
        console.error(
          "Delete evaluation error:",
          error
        );

        setIsError(true);

        setMessage(
          error.response?.data?.message ??
            "Unable to delete this evaluation."
        );
      } finally {
        setDeleting(false);
      }
    };

  const resetForm = () => {
    if (selectedEvaluation) {
      selectCandidate(
        selectedApplicationId
      );
    } else {
      setFormData(emptyForm);
    }

    setMessage("");
    setIsError(false);
  };

  if (loading) {
    return (
      <section className="evaluation-loading-state">
        <h2>
          Loading candidate evaluations...
        </h2>

        <p>
          Please wait while evaluation
          information is loaded.
        </p>
      </section>
    );
  }

  return (
    <div className="candidate-evaluations-page">
      <section className="evaluation-page-heading">
        <div>
          <span>
            Candidate Assessment
          </span>

          <h2>
            Candidate Evaluations
          </h2>

          <p>
            Score candidates, record
            feedback and make hiring
            recommendations.
          </p>
        </div>

        <button
          type="button"
          onClick={loadPageData}
        >
          Refresh Evaluations
        </button>
      </section>

      {message && (
        <div
          className={
            isError
              ? "evaluation-message error"
              : "evaluation-message success"
          }
        >
          {message}
        </div>
      )}

      <section className="evaluation-summary-grid">
        <article>
          <span>
            Review Candidates
          </span>

          <strong>
            {candidates.length}
          </strong>
        </article>

        <article>
          <span>
            Completed Evaluations
          </span>

          <strong>
            {completedEvaluationCount}
          </strong>
        </article>

        <article>
          <span>
            Pending Evaluations
          </span>

          <strong>
            {pendingEvaluationCount}
          </strong>
        </article>

        <article>
          <span>
            Selected Candidates
          </span>

          <strong>
            {selectedDecisionCount}
          </strong>
        </article>
      </section>

      <section className="evaluation-workspace">
        <aside className="evaluation-candidate-panel">
          <div className="evaluation-panel-heading">
            <div>
              <h3>
                Candidates
              </h3>

              <p>
                Select a candidate to
                evaluate.
              </p>
            </div>

            <span>
              {
                filteredCandidates.length
              }
            </span>
          </div>

          <input
            className="evaluation-candidate-search"
            type="search"
            placeholder="Search candidates or jobs"
            value={searchText}
            onChange={(event) =>
              setSearchText(
                event.target.value
              )
            }
          />

          <div className="evaluation-candidate-list">
            {filteredCandidates.length ===
            0 ? (
              <div className="evaluation-empty-list">
                No candidates found.
              </div>
            ) : (
              filteredCandidates.map(
                (candidate) => {
                  const candidateEvaluation =
                    evaluations.find(
                      (evaluation) =>
                        String(
                          evaluation
                            .jobApplicationId
                        ) ===
                        String(
                          candidate
                            .applicationId
                        )
                    );

                  const isActive =
                    String(
                      selectedApplicationId
                    ) ===
                    String(
                      candidate
                        .applicationId
                    );

                  return (
                    <button
                      type="button"
                      key={
                        candidate
                          .applicationId
                      }
                      className={
                        isActive
                          ? "evaluation-candidate-item active"
                          : "evaluation-candidate-item"
                      }
                      onClick={() =>
                        selectCandidate(
                          candidate
                            .applicationId
                        )
                      }
                    >
                      <div className="evaluation-candidate-avatar">
                        {candidate
                          .candidateName
                          ?.charAt(0)
                          .toUpperCase() ??
                          "C"}
                      </div>

                      <div className="evaluation-candidate-information">
                        <strong>
                          {candidate
                            .candidateName ??
                            "Unknown Candidate"}
                        </strong>

                        <span>
                          {candidate
                            .jobTitle ??
                            "Unknown Job"}
                        </span>

                        <small>
                          {formatStatus(
                            candidate
                              .status
                          )}
                        </small>
                      </div>

                      <div className="evaluation-candidate-result">
                        {candidateEvaluation ? (
                          <>
                            <strong>
                              {
                                candidateEvaluation
                                  .overallScore
                              }
                              /10
                            </strong>

                            <span>
                              {
                                candidateEvaluation
                                  .decision
                              }
                            </span>
                          </>
                        ) : (
                          <span className="not-evaluated">
                            Pending
                          </span>
                        )}
                      </div>
                    </button>
                  );
                }
              )
            )}
          </div>
        </aside>

        <main className="evaluation-form-panel">
          {!selectedCandidate ? (
            <div className="evaluation-select-state">
              <div>
                <span>01</span>

                <h2>
                  Select a candidate
                </h2>

                <p>
                  Choose a candidate from
                  the left panel to create
                  or update an evaluation.
                </p>
              </div>
            </div>
          ) : (
            <>
              <section className="evaluation-selected-candidate">
                <div className="evaluation-selected-profile">
                  <div className="evaluation-large-avatar">
                    {selectedCandidate
                      .candidateName
                      ?.charAt(0)
                      .toUpperCase() ??
                      "C"}
                  </div>

                  <div>
                    <span>
                      Candidate
                    </span>

                    <h2>
                      {
                        selectedCandidate
                          .candidateName
                      }
                    </h2>

                    <p>
                      {
                        selectedCandidate
                          .candidateEmail
                      }
                    </p>
                  </div>
                </div>

                <div className="evaluation-selected-details">
                  <article>
                    <span>
                      Position
                    </span>

                    <strong>
                      {
                        selectedCandidate
                          .jobTitle
                      }
                    </strong>
                  </article>

                  <article>
                    <span>
                      AI Score
                    </span>

                    <strong>
                      {Math.round(
                        Number(
                          selectedCandidate
                            .aiScore ??
                            0
                        )
                      )}
                      %
                    </strong>
                  </article>

                  <article>
                    <span>
                      Experience
                    </span>

                    <strong>
                      {
                        selectedCandidate
                          .experienceYears
                      }{" "}
                      years
                    </strong>
                  </article>

                  <article>
                    <span>
                      Status
                    </span>

                    <strong>
                      {formatStatus(
                        selectedCandidate
                          .status
                      )}
                    </strong>
                  </article>
                </div>

                {selectedCandidate.skills && (
                  <div className="evaluation-candidate-skills">
                    <span>
                      Candidate Skills
                    </span>

                    <p>
                      {
                        selectedCandidate
                          .skills
                      }
                    </p>
                  </div>
                )}
              </section>

              <form
                className="evaluation-form"
                onSubmit={
                  handleSubmit
                }
              >
                <section className="evaluation-score-section">
                  <div className="evaluation-section-heading">
                    <div>
                      <h3>
                        Evaluation Scores
                      </h3>

                      <p>
                        Enter a score
                        between 0 and 10
                        for each category.
                      </p>
                    </div>

                    <div
                      className={`evaluation-overall-score ${getScoreClass(
                        overallScore
                      )}`}
                    >
                      <span>
                        Overall Score
                      </span>

                      <strong>
                        {overallScore}
                        /10
                      </strong>
                    </div>
                  </div>

                  <div className="evaluation-score-grid">
                    <div className="evaluation-score-field">
                      <label htmlFor="technicalScore">
                        Technical Skills
                      </label>

                      <div>
                        <input
                          id="technicalScore"
                          name="technicalScore"
                          type="range"
                          min="0"
                          max="10"
                          step="1"
                          value={
                            formData
                              .technicalScore
                          }
                          onChange={
                            handleInputChange
                          }
                        />

                        <input
                          name="technicalScore"
                          type="number"
                          min="0"
                          max="10"
                          value={
                            formData
                              .technicalScore
                          }
                          onChange={
                            handleInputChange
                          }
                        />
                      </div>
                    </div>

                    <div className="evaluation-score-field">
                      <label htmlFor="communicationScore">
                        Communication
                      </label>

                      <div>
                        <input
                          id="communicationScore"
                          name="communicationScore"
                          type="range"
                          min="0"
                          max="10"
                          step="1"
                          value={
                            formData
                              .communicationScore
                          }
                          onChange={
                            handleInputChange
                          }
                        />

                        <input
                          name="communicationScore"
                          type="number"
                          min="0"
                          max="10"
                          value={
                            formData
                              .communicationScore
                          }
                          onChange={
                            handleInputChange
                          }
                        />
                      </div>
                    </div>

                    <div className="evaluation-score-field">
                      <label htmlFor="experienceScore">
                        Experience
                      </label>

                      <div>
                        <input
                          id="experienceScore"
                          name="experienceScore"
                          type="range"
                          min="0"
                          max="10"
                          step="1"
                          value={
                            formData
                              .experienceScore
                          }
                          onChange={
                            handleInputChange
                          }
                        />

                        <input
                          name="experienceScore"
                          type="number"
                          min="0"
                          max="10"
                          value={
                            formData
                              .experienceScore
                          }
                          onChange={
                            handleInputChange
                          }
                        />
                      </div>
                    </div>

                    <div className="evaluation-score-field">
                      <label htmlFor="problemSolvingScore">
                        Problem Solving
                      </label>

                      <div>
                        <input
                          id="problemSolvingScore"
                          name="problemSolvingScore"
                          type="range"
                          min="0"
                          max="10"
                          step="1"
                          value={
                            formData
                              .problemSolvingScore
                          }
                          onChange={
                            handleInputChange
                          }
                        />

                        <input
                          name="problemSolvingScore"
                          type="number"
                          min="0"
                          max="10"
                          value={
                            formData
                              .problemSolvingScore
                          }
                          onChange={
                            handleInputChange
                          }
                        />
                      </div>
                    </div>

                    <div className="evaluation-score-field full-width">
                      <label htmlFor="cultureFitScore">
                        Culture Fit
                      </label>

                      <div>
                        <input
                          id="cultureFitScore"
                          name="cultureFitScore"
                          type="range"
                          min="0"
                          max="10"
                          step="1"
                          value={
                            formData
                              .cultureFitScore
                          }
                          onChange={
                            handleInputChange
                          }
                        />

                        <input
                          name="cultureFitScore"
                          type="number"
                          min="0"
                          max="10"
                          value={
                            formData
                              .cultureFitScore
                          }
                          onChange={
                            handleInputChange
                          }
                        />
                      </div>
                    </div>
                  </div>
                </section>

                <section className="evaluation-feedback-section">
                  <div className="evaluation-form-field full-width">
                    <label htmlFor="feedback">
                      Evaluation Feedback
                    </label>

                    <textarea
                      id="feedback"
                      name="feedback"
                      rows="6"
                      maxLength="2000"
                      placeholder="Describe the candidate's strengths, weaknesses and interview performance..."
                      value={
                        formData.feedback
                      }
                      onChange={
                        handleInputChange
                      }
                    />

                    <small>
                      {
                        formData
                          .feedback
                          .length
                      }
                      /2000
                    </small>
                  </div>

                  <div className="evaluation-form-grid">
                    <div className="evaluation-form-field">
                      <label htmlFor="recommendation">
                        Recommendation
                      </label>

                      <select
                        id="recommendation"
                        name="recommendation"
                        value={
                          formData
                            .recommendation
                        }
                        onChange={
                          handleInputChange
                        }
                        required
                      >
                        <option value="Strongly Recommend">
                          Strongly Recommend
                        </option>

                        <option value="Recommend">
                          Recommend
                        </option>

                        <option value="Consider">
                          Consider
                        </option>

                        <option value="Do Not Recommend">
                          Do Not Recommend
                        </option>
                      </select>
                    </div>

                    <div className="evaluation-form-field">
                      <label htmlFor="decision">
                        Hiring Decision
                      </label>

                      <select
                        id="decision"
                        name="decision"
                        value={
                          formData
                            .decision
                        }
                        onChange={
                          handleInputChange
                        }
                      >
                        <option value="Pending">
                          Pending
                        </option>

                        <option value="Under Review">
                          Under Review
                        </option>

                        <option value="Shortlisted">
                          Shortlisted
                        </option>

                        <option value="Selected">
                          Selected
                        </option>

                        <option value="Rejected">
                          Rejected
                        </option>
                      </select>
                    </div>
                  </div>
                </section>

                <section className="evaluation-form-actions">
                  <div>
                    <button
                      type="button"
                      className="evaluation-secondary-button"
                      onClick={
                        resetForm
                      }
                      disabled={
                        saving ||
                        deleting
                      }
                    >
                      Reset
                    </button>

                    {selectedEvaluation && (
                      <button
                        type="button"
                        className="evaluation-delete-button"
                        onClick={
                          deleteEvaluation
                        }
                        disabled={
                          saving ||
                          deleting
                        }
                      >
                        {deleting
                          ? "Deleting..."
                          : "Delete Evaluation"}
                      </button>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="evaluation-save-button"
                    disabled={
                      saving ||
                      deleting
                    }
                  >
                    {saving
                      ? "Saving..."
                      : selectedEvaluation
                        ? "Update Evaluation"
                        : "Create Evaluation"}
                  </button>
                </section>

                {selectedEvaluation && (
                  <div className="evaluation-record-information">
                    <span>
                      Evaluation created{" "}
                      {formatDate(
                        selectedEvaluation
                          .createdAt
                      )}
                    </span>

                    <span>
                      Last updated{" "}
                      {formatDate(
                        selectedEvaluation
                          .updatedAt
                      )}
                    </span>

                    <span>
                      Manager:{" "}
                      {
                        selectedEvaluation
                          .hiringManagerName
                      }
                    </span>
                  </div>
                )}
              </form>
            </>
          )}
        </main>
      </section>
    </div>
  );
}

export default CandidateEvaluations;