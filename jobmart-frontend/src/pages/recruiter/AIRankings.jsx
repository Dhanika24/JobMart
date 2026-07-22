import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import axiosInstance from "../../api/axiosInstance.js";
import "./AIRankings.css";

function AIRankings() {
  const [jobs, setJobs] =
    useState([]);

  const [
    selectedJobId,
    setSelectedJobId,
  ] = useState("");

  const [
    rankingData,
    setRankingData,
  ] = useState(null);

  const [
    selectedRanking,
    setSelectedRanking,
  ] = useState(null);

  const [
    searchText,
    setSearchText,
  ] = useState("");

  const [
    minimumScore,
    setMinimumScore,
  ] = useState("0");

  const [
    loadingJobs,
    setLoadingJobs,
  ] = useState(true);

  const [
    loadingRankings,
    setLoadingRankings,
  ] = useState(false);

  const [
    calculating,
    setCalculating,
  ] = useState(false);

  const [
    loadingDetailsId,
    setLoadingDetailsId,
  ] = useState(null);

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    isError,
    setIsError,
  ] = useState(false);

  const getErrorMessage = (
    error,
    fallbackMessage
  ) => {
    const responseData =
      error.response?.data;

    if (responseData?.errors) {
      const validationErrors =
        Object.values(
          responseData.errors
        )
          .flat()
          .join(" ");

      if (validationErrors) {
        return validationErrors;
      }
    }

    return (
      responseData?.message ||
      fallbackMessage
    );
  };

  const loadRankings =
    useCallback(
      async (
        jobId,
        showError = true
      ) => {
        if (!jobId) {
          setRankingData(null);
          return;
        }

        setLoadingRankings(true);
        setSelectedRanking(null);

        if (showError) {
          setMessage("");
          setIsError(false);
        }

        try {
          const response =
            await axiosInstance.get(
              `/Ranking/job/${jobId}`
            );

          setRankingData(
            response.data ?? null
          );
        } catch (error) {
          console.error(
            "Ranking loading error:",
            error
          );

          setRankingData(null);

          if (showError) {
            setIsError(true);

            setMessage(
              getErrorMessage(
                error,
                "Unable to load candidate rankings."
              )
            );
          }
        } finally {
          setLoadingRankings(false);
        }
      },
      []
    );

  const loadJobs =
    useCallback(async () => {
      setLoadingJobs(true);
      setMessage("");
      setIsError(false);

      try {
        const response =
          await axiosInstance.get(
            "/Jobs/my"
          );

        const availableJobs =
          response.data?.jobs ?? [];

        setJobs(
          Array.isArray(
            availableJobs
          )
            ? availableJobs
            : []
        );

        if (
          Array.isArray(
            availableJobs
          ) &&
          availableJobs.length > 0
        ) {
          const firstJobId =
            String(
              availableJobs[0]
                .jobId
            );

          setSelectedJobId(
            firstJobId
          );

          await loadRankings(
            firstJobId,
            false
          );
        } else {
          setSelectedJobId("");
          setRankingData(null);
        }
      } catch (error) {
        console.error(
          "Job loading error:",
          error
        );

        setJobs([]);
        setSelectedJobId("");
        setRankingData(null);
        setIsError(true);

        setMessage(
          getErrorMessage(
            error,
            "Unable to load your job postings."
          )
        );
      } finally {
        setLoadingJobs(false);
      }
    }, [loadRankings]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const handleJobChange =
    async (event) => {
      const jobId =
        event.target.value;

      setSelectedJobId(jobId);
      setSearchText("");
      setMinimumScore("0");

      await loadRankings(jobId);
    };

  const calculateRankings =
    async () => {
      if (!selectedJobId) {
        setIsError(true);

        setMessage(
          "Please select a job first."
        );

        return;
      }

      setCalculating(true);
      setMessage("");
      setIsError(false);
      setSelectedRanking(null);

      try {
        const response =
          await axiosInstance.post(
            `/Ranking/job/${selectedJobId}/calculate`
          );

        setRankingData(
          response.data ?? null
        );

        setMessage(
          response.data?.message ||
            "Candidate rankings calculated successfully."
        );
      } catch (error) {
        console.error(
          "Ranking calculation error:",
          error
        );

        setIsError(true);

        setMessage(
          getErrorMessage(
            error,
            "Unable to calculate candidate rankings."
          )
        );
      } finally {
        setCalculating(false);
      }
    };

  const loadApplicationDetails =
    async (applicationId) => {
      if (!applicationId) {
        return;
      }

      setLoadingDetailsId(
        applicationId
      );

      setMessage("");
      setIsError(false);

      try {
        const response =
          await axiosInstance.get(
            `/Ranking/application/${applicationId}`
          );

        setSelectedRanking(
          response.data ?? null
        );
      } catch (error) {
        console.error(
          "Ranking detail error:",
          error
        );

        setIsError(true);

        setMessage(
          getErrorMessage(
            error,
            "Unable to load the AI score breakdown."
          )
        );
      } finally {
        setLoadingDetailsId(null);
      }
    };

  const filteredRankings =
    useMemo(() => {
      const rankings =
        rankingData?.rankings ??
        [];

      const normalizedSearch =
        searchText
          .trim()
          .toLowerCase();

      const scoreLimit =
        Number(minimumScore) || 0;

      return rankings.filter(
        (ranking) => {
          const score = Number(
            ranking.totalScore ??
              ranking.aiScore ??
              0
          );

          const matchesSearch =
            !normalizedSearch ||
            ranking.candidateName
              ?.toLowerCase()
              .includes(
                normalizedSearch
              ) ||
            ranking.candidateEmail
              ?.toLowerCase()
              .includes(
                normalizedSearch
              ) ||
            ranking.skills
              ?.toLowerCase()
              .includes(
                normalizedSearch
              ) ||
            ranking.education
              ?.toLowerCase()
              .includes(
                normalizedSearch
              );

          return (
            matchesSearch &&
            score >= scoreLimit
          );
        }
      );
    }, [
      rankingData,
      searchText,
      minimumScore,
    ]);

  const rankingSummary =
    useMemo(() => {
      const rankings =
        rankingData?.rankings ??
        [];

      if (
        rankings.length === 0
      ) {
        return {
          total: 0,
          excellent: 0,
          averageScore: 0,
          topScore: 0,
        };
      }

      const scores =
        rankings.map(
          (ranking) =>
            Number(
              ranking.totalScore ??
                ranking.aiScore ??
                0
            )
        );

      const totalScore =
        scores.reduce(
          (total, score) =>
            total + score,
          0
        );

      return {
        total:
          rankings.length,

        excellent:
          scores.filter(
            (score) =>
              score >= 80
          ).length,

        averageScore:
          Math.round(
            totalScore /
              scores.length
          ),

        topScore:
          Math.max(...scores),
      };
    }, [rankingData]);

  const getScore = (
    ranking
  ) =>
    Number(
      ranking.totalScore ??
        ranking.aiScore ??
        0
    );

  const getScoreClass = (
    score
  ) => {
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

  const getScoreLabel = (
    score
  ) => {
    if (score >= 80) {
      return "Excellent Match";
    }

    if (score >= 65) {
      return "Good Match";
    }

    if (score >= 50) {
      return "Average Match";
    }

    return "Low Match";
  };

  const formatStatus = (
    status
  ) => {
    if (!status) {
      return "Not available";
    }

    if (
      status === "UnderReview"
    ) {
      return "Under Review";
    }

    if (
      status ===
      "InterviewScheduled"
    ) {
      return "Interview Scheduled";
    }

    return status;
  };

  const formatDate = (
    dateValue
  ) => {
    if (!dateValue) {
      return "Not available";
    }

    return new Date(
      dateValue
    ).toLocaleDateString(
      "en-LK",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    );
  };

  const renderDetailValue = (
    value
  ) => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "Not available";
    }

    if (Array.isArray(value)) {
      return value.length > 0
        ? value.join(", ")
        : "Not available";
    }

    if (
      typeof value ===
      "object"
    ) {
      return JSON.stringify(
        value,
        null,
        2
      );
    }

    return String(value);
  };

  const detailEntries =
    selectedRanking
      ? Object.entries(
          selectedRanking
        ).filter(
          ([key]) =>
            ![
              "candidateName",
              "candidateEmail",
              "totalScore",
              "aiScore",
            ].includes(key)
        )
      : [];

  if (loadingJobs) {
    return (
      <div className="ai-rankings-state-card">
        <h2>
          Loading AI Rankings...
        </h2>

        <p>
          Please wait while your
          job postings are loaded.
        </p>
      </div>
    );
  }

  return (
    <div className="ai-rankings-page">
      <section className="ai-rankings-header">
        <div>
          <span>
            AI Candidate Screening
          </span>

          <h2>AI Rankings</h2>

          <p>
            Calculate and compare
            candidate compatibility
            scores for your job postings.
          </p>
        </div>

        <button
          type="button"
          className="calculate-rankings-button"
          onClick={
            calculateRankings
          }
          disabled={
            !selectedJobId ||
            calculating
          }
        >
          {calculating
            ? "Calculating..."
            : "Calculate Rankings"}
        </button>
      </section>

      {message && (
        <div
          className={
            isError
              ? "ai-rankings-message error"
              : "ai-rankings-message success"
          }
          role={
            isError
              ? "alert"
              : "status"
          }
        >
          {message}
        </div>
      )}

      <section className="ranking-job-selector-card">
        <div>
          <label htmlFor="ranking-job">
            Select your job posting
          </label>

          <select
            id="ranking-job"
            value={selectedJobId}
            onChange={
              handleJobChange
            }
          >
            {jobs.length === 0 && (
              <option value="">
                No job postings available
              </option>
            )}

            {jobs.map((job) => (
              <option
                key={job.jobId}
                value={String(
                  job.jobId
                )}
              >
                {job.title} —{" "}
                {job.status}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() =>
            loadRankings(
              selectedJobId
            )
          }
          disabled={
            !selectedJobId ||
            loadingRankings
          }
        >
          {loadingRankings
            ? "Refreshing..."
            : "Refresh Results"}
        </button>
      </section>

      {rankingData && (
        <>
          <section className="ranking-job-information">
            <div>
              <span>
                Selected Job
              </span>

              <h3>
                {rankingData.jobTitle}
              </h3>
            </div>

            <div>
              <span>
                Job Requirements
              </span>

              <p>
                {rankingData.requirements ||
                  "No job requirements provided."}
              </p>
            </div>
          </section>

          <section className="ranking-summary-grid">
            <article>
              <span>
                Total Candidates
              </span>

              <strong>
                {rankingSummary.total}
              </strong>
            </article>

            <article>
              <span>
                Excellent Matches
              </span>

              <strong>
                {
                  rankingSummary.excellent
                }
              </strong>
            </article>

            <article>
              <span>
                Average Score
              </span>

              <strong>
                {
                  rankingSummary.averageScore
                }
                %
              </strong>
            </article>

            <article>
              <span>
                Highest Score
              </span>

              <strong>
                {
                  rankingSummary.topScore
                }
                %
              </strong>
            </article>
          </section>

          <section className="ranking-filter-card">
            <input
              type="search"
              placeholder="Search candidate, email, skill or education"
              value={searchText}
              onChange={(event) =>
                setSearchText(
                  event.target.value
                )
              }
            />

            <select
              value={minimumScore}
              onChange={(event) =>
                setMinimumScore(
                  event.target.value
                )
              }
            >
              <option value="0">
                All AI scores
              </option>

              <option value="50">
                50% and above
              </option>

              <option value="65">
                65% and above
              </option>

              <option value="80">
                80% and above
              </option>
            </select>
          </section>
        </>
      )}

      {loadingRankings ? (
        <div className="ai-rankings-state-card">
          <h3>
            Loading candidate
            rankings...
          </h3>
        </div>
      ) : jobs.length === 0 ? (
        <div className="ai-rankings-state-card">
          <h3>
            No Recruiter jobs found
          </h3>

          <p>
            Create a job posting before
            calculating AI rankings.
          </p>
        </div>
      ) : filteredRankings.length ===
        0 ? (
        <div className="ai-rankings-state-card">
          <h3>
            No ranking results found
          </h3>

          <p>
            Select a job with applications
            and click Calculate Rankings.
          </p>
        </div>
      ) : (
        <section className="ai-ranking-list">
          {filteredRankings.map(
            (ranking, index) => {
              const score =
                getScore(ranking);

              return (
                <article
                  key={
                    ranking.applicationId ??
                    ranking.candidateProfileId ??
                    index
                  }
                  className="ai-ranking-card"
                >
                  <div className="ranking-position">
                    <span>Rank</span>

                    <strong>
                      #{index + 1}
                    </strong>
                  </div>

                  <div className="ranking-candidate-content">
                    <div className="ranking-candidate-header">
                      <div>
                        <h3>
                          {ranking.candidateName ||
                            "Unknown Candidate"}
                        </h3>

                        <p>
                          {ranking.candidateEmail ||
                            "Email not available"}
                        </p>
                      </div>

                      <div
                        className={`ranking-score-badge ${getScoreClass(
                          score
                        )}`}
                      >
                        <strong>
                          {score}%
                        </strong>

                        <span>
                          {getScoreLabel(
                            score
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="ranking-information-grid">
                      <div>
                        <span>
                          Experience
                        </span>

                        <strong>
                          {ranking.experienceYears ??
                            0}{" "}
                          years
                        </strong>
                      </div>

                      <div>
                        <span>
                          Status
                        </span>

                        <strong>
                          {formatStatus(
                            ranking.status
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Applied
                        </span>

                        <strong>
                          {formatDate(
                            ranking.appliedAt
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Current Role
                        </span>

                        <strong>
                          {ranking.currentJobTitle ||
                            "Not specified"}
                        </strong>
                      </div>
                    </div>

                    <div className="ranking-text-section">
                      <span>
                        Skills
                      </span>

                      <p>
                        {ranking.skills ||
                          "No skills provided."}
                      </p>
                    </div>

                    <div className="ranking-text-section">
                      <span>
                        Education
                      </span>

                      <p>
                        {ranking.education ||
                          "No education details provided."}
                      </p>
                    </div>

                    <div className="ranking-card-actions">
                      <button
                        type="button"
                        onClick={() =>
                          loadApplicationDetails(
                            ranking.applicationId
                          )
                        }
                        disabled={
                          !ranking.applicationId ||
                          loadingDetailsId ===
                            ranking.applicationId
                        }
                      >
                        {loadingDetailsId ===
                        ranking.applicationId
                          ? "Loading..."
                          : "View Score Breakdown"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            }
          )}
        </section>
      )}

      {selectedRanking && (
        <div className="ranking-modal-overlay">
          <section className="ranking-details-modal">
            <div className="ranking-modal-header">
              <div>
                <span>
                  AI Score Analysis
                </span>

                <h3>
                  {selectedRanking.candidateName ||
                    "Candidate Ranking Details"}
                </h3>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedRanking(
                    null
                  )
                }
              >
                Close
              </button>
            </div>

            <div className="ranking-modal-score">
              <strong>
                {selectedRanking.totalScore ??
                  selectedRanking.aiScore ??
                  0}
                %
              </strong>

              <span>
                Overall AI Match Score
              </span>
            </div>

            <div className="ranking-detail-list">
              {detailEntries.map(
                ([key, value]) => (
                  <div key={key}>
                    <span>
                      {key
                        .replace(
                          /([A-Z])/g,
                          " $1"
                        )
                        .replace(
                          /^./,
                          (letter) =>
                            letter.toUpperCase()
                        )}
                    </span>

                    {typeof value ===
                      "object" &&
                    value !== null ? (
                      <pre>
                        {renderDetailValue(
                          value
                        )}
                      </pre>
                    ) : (
                      <strong>
                        {renderDetailValue(
                          value
                        )}
                      </strong>
                    )}
                  </div>
                )
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default AIRankings;