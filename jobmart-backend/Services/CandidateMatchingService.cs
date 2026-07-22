using jobmart.DTOs;
using jobmart.Interfaces;
using jobmart.Models;

namespace jobmart.Services
{
    public class CandidateMatchingService
        : ICandidateMatchingService
    {
        public CandidateRankingResultDto CalculateScore(
            JobApplication application,
            CandidateProfile candidate,
            JobPosting job)
        {
            double skillsScore = CalculateSkillsScore(
                candidate.Skills,
                job.Requirements);

            double experienceScore = CalculateExperienceScore(
                candidate.ExperienceYears,
                job.Requirements);

            double educationScore = CalculateEducationScore(
                candidate.Education,
                job.Requirements);

            double totalScore =
                skillsScore +
                experienceScore +
                educationScore;

            totalScore = Math.Round(totalScore, 2);

            return new CandidateRankingResultDto
            {
                ApplicationId =
                    application.JobApplicationId,

                CandidateProfileId =
                    candidate.CandidateProfileId,

                CandidateName =
                    candidate.User?.FullName
                    ?? "Unknown Candidate",

                CandidateEmail =
                    candidate.User?.Email
                    ?? string.Empty,

                JobTitle = job.Title,

                SkillsScore =
                    Math.Round(skillsScore, 2),

                ExperienceScore =
                    Math.Round(experienceScore, 2),

                EducationScore =
                    Math.Round(educationScore, 2),

                TotalScore = totalScore,

                MatchLevel =
                    GetMatchLevel(totalScore),

                ApplicationStatus =
                    application.Status
            };
        }

        public JobRecommendationResultDto
            CalculateJobRecommendation(
                CandidateProfile candidate,
                JobPosting job,
                JobApplication? existingApplication)
        {
            double skillsScore = CalculateSkillsScore(
                candidate.Skills,
                job.Requirements);

            double experienceScore = CalculateExperienceScore(
                candidate.ExperienceYears,
                job.Requirements);

            double educationScore = CalculateEducationScore(
                candidate.Education,
                job.Requirements);

            double totalScore =
                skillsScore +
                experienceScore +
                educationScore;

            totalScore = Math.Round(totalScore, 2);

            List<string> candidateSkills =
                ConvertTextToWords(candidate.Skills);

            List<string> requirementWords =
                ConvertTextToWords(job.Requirements);

            List<string> matchedSkills =
                requirementWords
                    .Where(requirement =>
                        candidateSkills.Any(skill =>
                            skill.Equals(
                                requirement,
                                StringComparison
                                    .OrdinalIgnoreCase)))
                    .Distinct(
                        StringComparer.OrdinalIgnoreCase)
                    .OrderBy(skill => skill)
                    .ToList();

            List<string> missingSkills =
                requirementWords
                    .Where(requirement =>
                        !candidateSkills.Any(skill =>
                            skill.Equals(
                                requirement,
                                StringComparison
                                    .OrdinalIgnoreCase)))
                    .Distinct(
                        StringComparer.OrdinalIgnoreCase)
                    .OrderBy(skill => skill)
                    .ToList();

            return new JobRecommendationResultDto
            {
                JobId = job.JobId,

                Title = job.Title,

                Description = job.Description,

                Requirements =
                    job.Requirements ?? string.Empty,

                Location =
                    job.Location ?? "Not specified",

                EmploymentType =
                    job.EmploymentType ?? "Not specified",

                SalaryMin = job.SalaryMin,

                SalaryMax = job.SalaryMax,

                Deadline = job.Deadline,

                Status = job.Status,

                SkillsScore =
                    Math.Round(skillsScore, 2),

                ExperienceScore =
                    Math.Round(experienceScore, 2),

                EducationScore =
                    Math.Round(educationScore, 2),

                TotalScore = totalScore,

                MatchLevel =
                    GetMatchLevel(totalScore),

                MatchedSkills = matchedSkills,

                MissingSkills = missingSkills,

                HasApplied =
                    existingApplication != null,

                ApplicationId =
                    existingApplication?
                        .JobApplicationId,

                ApplicationStatus =
                    existingApplication?.Status
            };
        }

        private static double CalculateSkillsScore(
            string? candidateSkills,
            string? jobRequirements)
        {
            const double maximumScore = 50;

            List<string> candidateSkillList =
                ConvertTextToWords(candidateSkills);

            List<string> requirementWords =
                ConvertTextToWords(jobRequirements);

            if (requirementWords.Count == 0)
            {
                return maximumScore;
            }

            if (candidateSkillList.Count == 0)
            {
                return 0;
            }

            int matches =
                requirementWords.Count(requirement =>
                    candidateSkillList.Any(skill =>
                        skill.Equals(
                            requirement,
                            StringComparison
                                .OrdinalIgnoreCase)));

            double percentage =
                (double)matches /
                requirementWords.Count;

            return percentage * maximumScore;
        }

        private static double CalculateExperienceScore(
            int experienceYears,
            string? requirements)
        {
            const double maximumScore = 30;

            int requiredYears =
                ExtractRequiredExperience(requirements);

            if (requiredYears <= 0)
            {
                return maximumScore;
            }

            if (experienceYears <= 0)
            {
                return 0;
            }

            double ratio =
                (double)experienceYears /
                requiredYears;

            ratio = Math.Min(ratio, 1);

            return ratio * maximumScore;
        }

        private static double CalculateEducationScore(
            string? candidateEducation,
            string? requirements)
        {
            const double maximumScore = 20;

            if (string.IsNullOrWhiteSpace(requirements))
            {
                return maximumScore;
            }

            if (string.IsNullOrWhiteSpace(
                    candidateEducation))
            {
                return 0;
            }

            string candidate =
                candidateEducation.ToLowerInvariant();

            string required =
                requirements.ToLowerInvariant();

            int candidateLevel =
                GetEducationLevel(candidate);

            int requiredLevel =
                GetEducationLevel(required);

            if (requiredLevel == 0)
            {
                return maximumScore;
            }

            return candidateLevel >= requiredLevel
                ? maximumScore
                : 0;
        }

        private static int ExtractRequiredExperience(
            string? requirements)
        {
            if (string.IsNullOrWhiteSpace(requirements))
            {
                return 0;
            }

            string[] words = requirements.Split(
                new[]
                {
                    ' ',
                    ',',
                    '.',
                    '-',
                    ';',
                    ':',
                    '/'
                },
                StringSplitOptions.RemoveEmptyEntries);

            for (int index = 0;
                 index < words.Length;
                 index++)
            {
                if (!int.TryParse(
                        words[index],
                        out int years))
                {
                    continue;
                }

                bool nearbyExperienceWord =
                    words
                        .Skip(index + 1)
                        .Take(3)
                        .Any(word =>
                            word.Contains(
                                "year",
                                StringComparison
                                    .OrdinalIgnoreCase) ||
                            word.Contains(
                                "experience",
                                StringComparison
                                    .OrdinalIgnoreCase));

                if (nearbyExperienceWord)
                {
                    return years;
                }
            }

            return 0;
        }

        private static List<string> ConvertTextToWords(
            string? text)
        {
            if (string.IsNullOrWhiteSpace(text))
            {
                return new List<string>();
            }

            string[] ignoredWords =
            {
                "and",
                "or",
                "the",
                "with",
                "for",
                "of",
                "in",
                "to",
                "a",
                "an",
                "is",
                "are",
                "years",
                "year",
                "experience",
                "required",
                "preferred",
                "knowledge",
                "skills",
                "skill",
                "ability",
                "using",
                "good",
                "strong",
                "minimum"
            };

            return text
                .Split(
                    new[]
                    {
                        ' ',
                        ',',
                        ';',
                        '|',
                        '.',
                        ':',
                        '/',
                        '\\',
                        '-',
                        '(',
                        ')',
                        '\r',
                        '\n'
                    },
                    StringSplitOptions
                        .RemoveEmptyEntries)
                .Select(word =>
                    word.Trim().ToLowerInvariant())
                .Where(word =>
                    word.Length > 1 &&
                    !ignoredWords.Contains(word))
                .Distinct()
                .ToList();
        }

        private static int GetEducationLevel(
            string education)
        {
            if (education.Contains("phd") ||
                education.Contains("doctorate"))
            {
                return 5;
            }

            if (education.Contains("master") ||
                education.Contains("msc") ||
                education.Contains("mba"))
            {
                return 4;
            }

            if (education.Contains("bachelor") ||
                education.Contains("degree") ||
                education.Contains("bsc"))
            {
                return 3;
            }

            if (education.Contains("diploma") ||
                education.Contains("hnd"))
            {
                return 2;
            }

            if (education.Contains("certificate") ||
                education.Contains("advanced level") ||
                education.Contains("a/l"))
            {
                return 1;
            }

            return 0;
        }

        private static string GetMatchLevel(
            double totalScore)
        {
            if (totalScore >= 80)
            {
                return "Excellent Match";
            }

            if (totalScore >= 65)
            {
                return "Good Match";
            }

            if (totalScore >= 50)
            {
                return "Average Match";
            }

            return "Low Match";
        }
    }
}