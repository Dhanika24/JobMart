using jobmart.DTOs;
using jobmart.Models;

namespace jobmart.Interfaces
{
    public interface ICandidateMatchingService
    {
        CandidateRankingResultDto CalculateScore(
            JobApplication application,
            CandidateProfile candidate,
            JobPosting job);

        JobRecommendationResultDto CalculateJobRecommendation(
            CandidateProfile candidate,
            JobPosting job,
            JobApplication? existingApplication);
    }
}