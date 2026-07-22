using System.Text;
using DocumentFormat.OpenXml.Packaging;
using jobmart.Interfaces;
using UglyToad.PdfPig;

namespace jobmart.Services
{
    public class ResumeParsingService :
        IResumeParsingService
    {
        private static readonly string[]
            KnownSkills =
        {
            "C#",
            ".NET",
            "ASP.NET Core",
            "Entity Framework Core",
            "Java",
            "Spring Boot",
            "Python",
            "Django",
            "Flask",
            "JavaScript",
            "TypeScript",
            "React",
            "Angular",
            "Vue",
            "HTML",
            "CSS",
            "Bootstrap",
            "Tailwind CSS",
            "SQL",
            "SQL Server",
            "MySQL",
            "PostgreSQL",
            "MongoDB",
            "Firebase",
            "REST API",
            "REST APIs",
            "GraphQL",
            "Git",
            "GitHub",
            "GitLab",
            "Docker",
            "Kubernetes",
            "Azure",
            "AWS",
            "Google Cloud",
            "CI/CD",
            "DevOps",
            "Machine Learning",
            "Artificial Intelligence",
            "Data Analysis",
            "Power BI",
            "Figma",
            "UI/UX",
            "Agile",
            "Scrum",
            "Problem Solving",
            "Communication"
        };

        private static readonly string[]
            EducationKeywords =
        {
            "Bachelor",
            "BSc",
            "B.Sc",
            "Bachelor of Science",
            "Bachelor of Information Technology",
            "Bachelor of Software Engineering",
            "Degree",
            "Diploma",
            "Higher National Diploma",
            "HND",
            "Master",
            "MSc",
            "M.Sc",
            "PhD",
            "University",
            "College",
            "Institute"
        };

        private static readonly string[]
            ExperienceKeywords =
        {
            "Work Experience",
            "Professional Experience",
            "Employment History",
            "Internship",
            "Intern",
            "Software Engineer",
            "Developer",
            "Quality Assurance",
            "QA Engineer",
            "Project",
            "Years of Experience"
        };

        public async Task<ResumeParsingResult>
            ParseResumeAsync(
                string fullFilePath)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(
                        fullFilePath))
                {
                    return CreateFailureResult(
                        "Resume file path is missing.");
                }

                if (!File.Exists(fullFilePath))
                {
                    return CreateFailureResult(
                        "Resume file could not be found.");
                }

                string extension =
                    Path.GetExtension(fullFilePath)
                        .ToLowerInvariant();

                string extractedText;

                switch (extension)
                {
                    case ".pdf":
                        extractedText =
                            ExtractTextFromPdf(
                                fullFilePath);
                        break;

                    case ".docx":
                        extractedText =
                            ExtractTextFromDocx(
                                fullFilePath);
                        break;

                    case ".doc":
                        return CreateFailureResult(
                            "Automatic parsing is not supported for old DOC files. Upload a PDF or DOCX resume.");

                    default:
                        return CreateFailureResult(
                            "Unsupported resume file type.");
                }

                extractedText =
                    CleanExtractedText(
                        extractedText);

                if (string.IsNullOrWhiteSpace(
                        extractedText))
                {
                    return CreateFailureResult(
                        "No readable text was found in the resume. The file may contain scanned images only.");
                }

                List<string> skills =
                    ExtractSkills(
                        extractedText);

                string? education =
                    ExtractEducation(
                        extractedText);

                string? experience =
                    ExtractExperience(
                        extractedText);

                await Task.CompletedTask;

                return new ResumeParsingResult
                {
                    Success =
                        true,

                    ExtractedText =
                        extractedText,

                    Skills =
                        skills,

                    Education =
                        education,

                    Experience =
                        experience,

                    ErrorMessage =
                        null
                };
            }
            catch (Exception exception)
            {
                return CreateFailureResult(
                    $"Resume parsing failed: {exception.Message}");
            }
        }

        public List<string> ExtractSkills(
            string resumeText)
        {
            if (string.IsNullOrWhiteSpace(
                    resumeText))
            {
                return new List<string>();
            }

            var detectedSkills =
                new List<string>();

            foreach (string skill in KnownSkills)
            {
                if (ContainsSkill(
                        resumeText,
                        skill))
                {
                    detectedSkills.Add(skill);
                }
            }

            return detectedSkills
                .Distinct(
                    StringComparer
                        .OrdinalIgnoreCase)
                .OrderBy(skill =>
                    skill)
                .ToList();
        }

        public string? ExtractEducation(
            string resumeText)
        {
            return ExtractRelevantLines(
                resumeText,
                EducationKeywords,
                maximumLines: 6);
        }

        public string? ExtractExperience(
            string resumeText)
        {
            return ExtractRelevantLines(
                resumeText,
                ExperienceKeywords,
                maximumLines: 8);
        }

        private static string
            ExtractTextFromPdf(
                string fullFilePath)
        {
            var textBuilder =
                new StringBuilder();

            using PdfDocument document =
                PdfDocument.Open(
                    fullFilePath);

            foreach (var page in document
                         .GetPages())
            {
                if (!string.IsNullOrWhiteSpace(
                        page.Text))
                {
                    textBuilder.AppendLine(
                        page.Text);
                }
            }

            return textBuilder.ToString();
        }

        private static string
            ExtractTextFromDocx(
                string fullFilePath)
        {
            using WordprocessingDocument
                document =
                    WordprocessingDocument.Open(
                        fullFilePath,
                        false);

            string text =
                document.MainDocumentPart?
                    .Document?
                    .Body?
                    .InnerText
                ?? string.Empty;

            return text;
        }

        private static bool ContainsSkill(
            string text,
            string skill)
        {
            if (string.IsNullOrWhiteSpace(
                    text) ||
                string.IsNullOrWhiteSpace(
                    skill))
            {
                return false;
            }

            return text.Contains(
                skill,
                StringComparison
                    .OrdinalIgnoreCase);
        }

        private static string?
            ExtractRelevantLines(
                string resumeText,
                IEnumerable<string> keywords,
                int maximumLines)
        {
            if (string.IsNullOrWhiteSpace(
                    resumeText))
            {
                return null;
            }

            string[] lines =
                resumeText
                    .Split(
                        new[]
                        {
                            "\r\n",
                            "\n",
                            "\r"
                        },
                        StringSplitOptions
                            .RemoveEmptyEntries)
                    .Select(line =>
                        line.Trim())
                    .Where(line =>
                        !string.IsNullOrWhiteSpace(
                            line))
                    .ToArray();

            var matchingLines =
                new List<string>();

            foreach (string line in lines)
            {
                bool containsKeyword =
                    keywords.Any(keyword =>
                        line.Contains(
                            keyword,
                            StringComparison
                                .OrdinalIgnoreCase));

                if (!containsKeyword)
                {
                    continue;
                }

                matchingLines.Add(line);

                if (matchingLines.Count >=
                    maximumLines)
                {
                    break;
                }
            }

            if (matchingLines.Count == 0)
            {
                return null;
            }

            return string.Join(
                Environment.NewLine,
                matchingLines);
        }

        private static string
            CleanExtractedText(
                string text)
        {
            if (string.IsNullOrWhiteSpace(
                    text))
            {
                return string.Empty;
            }

            string[] lines =
                text.Split(
                    new[]
                    {
                        "\r\n",
                        "\n",
                        "\r"
                    },
                    StringSplitOptions.None);

            var cleanedLines =
                lines
                    .Select(line =>
                        line.Trim())
                    .Where(line =>
                        !string.IsNullOrWhiteSpace(
                            line));

            return string.Join(
                Environment.NewLine,
                cleanedLines);
        }

        private static ResumeParsingResult
            CreateFailureResult(
                string errorMessage)
        {
            return new ResumeParsingResult
            {
                Success =
                    false,

                ErrorMessage =
                    errorMessage,

                ExtractedText =
                    string.Empty,

                Skills =
                    new List<string>()
            };
        }
    }
}