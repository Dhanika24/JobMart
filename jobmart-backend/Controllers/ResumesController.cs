using System.Security.Claims;
using jobmart.Data;
using jobmart.DTOs;
using jobmart.Interfaces;
using jobmart.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace jobmart.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ResumesController : ControllerBase
    {
        private const long MaximumFileSize =
            5 * 1024 * 1024;

        private static readonly string[] AllowedExtensions =
        {
            ".pdf",
            ".doc",
            ".docx"
        };

        private static readonly string[] AllowedContentTypes =
        {
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        };

        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _environment;
        private readonly IResumeParsingService _resumeParsingService;
        private readonly IAuditLogService _auditLogService;

        public ResumesController(
            ApplicationDbContext context,
            IWebHostEnvironment environment,
            IResumeParsingService resumeParsingService,
            IAuditLogService auditLogService)
        {
            _context = context;
            _environment = environment;
            _resumeParsingService = resumeParsingService;
            _auditLogService = auditLogService;
        }

        // --------------------------------------------------
        // CANDIDATE UPLOADS A RESUME
        // POST: /api/Resumes/upload
        // --------------------------------------------------
        [Authorize(Roles = "Candidate")]
        [HttpPost("upload")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UploadResume(
            [FromForm] UploadResumeDto request)
        {
            int? userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized(new
                {
                    message = "Invalid user token."
                });
            }

            IFormFile file = request.File;

            if (file == null || file.Length == 0)
            {
                return BadRequest(new
                {
                    message = "Please select a resume file."
                });
            }

            if (file.Length > MaximumFileSize)
            {
                return BadRequest(new
                {
                    message = "The maximum allowed file size is 5 MB."
                });
            }

            string extension = Path
                .GetExtension(file.FileName)
                .ToLowerInvariant();

            if (!AllowedExtensions.Contains(extension))
            {
                return BadRequest(new
                {
                    message = "Only PDF, DOC and DOCX files are allowed."
                });
            }

            if (!AllowedContentTypes.Contains(file.ContentType))
            {
                return BadRequest(new
                {
                    message = "The uploaded file type is not supported."
                });
            }

            var candidateProfile =
                await _context.CandidateProfiles
                    .FirstOrDefaultAsync(profile =>
                        profile.UserId == userId.Value);

            if (candidateProfile == null)
            {
                candidateProfile = new CandidateProfile
                {
                    UserId = userId.Value,
                    ExperienceYears = 0,
                    UpdatedAt = DateTime.UtcNow
                };

                _context.CandidateProfiles.Add(
                    candidateProfile);

                await _context.SaveChangesAsync();
            }

            string webRootPath =
                _environment.WebRootPath ??
                Path.Combine(
                    _environment.ContentRootPath,
                    "wwwroot");

            string uploadFolder = Path.Combine(
                webRootPath,
                "uploads",
                "resumes");

            Directory.CreateDirectory(uploadFolder);

            string storedFileName =
                $"{Guid.NewGuid()}{extension}";

            string fullFilePath = Path.Combine(
                uploadFolder,
                storedFileName);

            try
            {
                await using var stream = new FileStream(
                    fullFilePath,
                    FileMode.Create);

                await file.CopyToAsync(stream);
            }
            catch
            {
                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    new
                    {
                        message = "Unable to save the resume file."
                    });
            }

            if (request.IsPrimary)
            {
                var existingPrimaryResumes =
                    await _context.Resumes
                        .Where(resume =>
                            resume.CandidateProfileId ==
                                candidateProfile.CandidateProfileId &&
                            resume.IsPrimary)
                        .ToListAsync();

                foreach (var existingResume in existingPrimaryResumes)
                {
                    existingResume.IsPrimary = false;
                }
            }

            var resume = new Resume
            {
                CandidateProfileId =
                    candidateProfile.CandidateProfileId,

                OriginalFileName =
                    Path.GetFileName(file.FileName),

                StoredFileName =
                    storedFileName,

                FilePath =
                    $"/uploads/resumes/{storedFileName}",

                ContentType =
                    file.ContentType,

                FileSize =
                    file.Length,

                IsPrimary =
                    request.IsPrimary,

                ParsingStatus =
                    "Processing",

                UploadedAt =
                    DateTime.UtcNow
            };

            _context.Resumes.Add(resume);
            await _context.SaveChangesAsync();

            await ParseAndSaveResumeAsync(
                resume,
                candidateProfile,
                fullFilePath);

            await SafeAuditLogAsync(
                action: "Resume Uploaded",
                entityType: "Resume",
                entityId: resume.ResumeId.ToString(),
                details:
                    $"Resume '{resume.OriginalFileName}' was uploaded. Parsing status: {resume.ParsingStatus}.");

            return Ok(new
            {
                message = resume.ParsingStatus == "Completed"
                    ? "Resume uploaded and parsed successfully."
                    : "Resume uploaded successfully, but automatic parsing could not be completed.",

                resume = CreateResponse(resume)
            });
        }

        // --------------------------------------------------
        // CANDIDATE VIEWS OWN RESUMES
        // GET: /api/Resumes/my
        // --------------------------------------------------
        [Authorize(Roles = "Candidate")]
        [HttpGet("my")]
        public async Task<IActionResult> GetMyResumes()
        {
            int? userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized(new
                {
                    message = "Invalid user token."
                });
            }

            var resumes =
                await _context.Resumes
                    .Include(resume =>
                        resume.CandidateProfile)
                    .Where(resume =>
                        resume.CandidateProfile != null &&
                        resume.CandidateProfile.UserId ==
                            userId.Value)
                    .OrderByDescending(resume =>
                        resume.IsPrimary)
                    .ThenByDescending(resume =>
                        resume.UploadedAt)
                    .Select(resume =>
                        new ResumeResponseDto
                        {
                            ResumeId =
                                resume.ResumeId,

                            OriginalFileName =
                                resume.OriginalFileName,

                            ContentType =
                                resume.ContentType,

                            FileSize =
                                resume.FileSize,

                            IsPrimary =
                                resume.IsPrimary,

                            ParsingStatus =
                                resume.ParsingStatus,

                            ExtractedSkills =
                                resume.ExtractedSkills,

                            ExtractedEducation =
                                resume.ExtractedEducation,

                            ExtractedExperience =
                                resume.ExtractedExperience,

                            ParsingError =
                                resume.ParsingError,

                            UploadedAt =
                                resume.UploadedAt,

                            ParsedAt =
                                resume.ParsedAt,

                            DownloadUrl =
                                $"/api/Resumes/{resume.ResumeId}/download"
                        })
                    .ToListAsync();

            return Ok(resumes);
        }

        // --------------------------------------------------
        // CANDIDATE RE-PARSES OWN RESUME
        // POST: /api/Resumes/1/parse
        // --------------------------------------------------
        [Authorize(Roles = "Candidate")]
        [HttpPost("{id:int}/parse")]
        public async Task<IActionResult> ParseResume(int id)
        {
            int? userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized(new
                {
                    message = "Invalid user token."
                });
            }

            var resume =
                await _context.Resumes
                    .Include(item =>
                        item.CandidateProfile)
                    .FirstOrDefaultAsync(item =>
                        item.ResumeId == id &&
                        item.CandidateProfile != null &&
                        item.CandidateProfile.UserId ==
                            userId.Value);

            if (resume == null)
            {
                return NotFound(new
                {
                    message = "Resume not found."
                });
            }

            string fullFilePath =
                GetResumeFullFilePath(
                    resume.StoredFileName);

            resume.ParsingStatus = "Processing";
            resume.ParsingError = null;
            resume.ParsedAt = null;

            await _context.SaveChangesAsync();

            await ParseAndSaveResumeAsync(
                resume,
                resume.CandidateProfile!,
                fullFilePath);

            await SafeAuditLogAsync(
                action: "Resume Parsed",
                entityType: "Resume",
                entityId: resume.ResumeId.ToString(),
                details:
                    $"Resume '{resume.OriginalFileName}' was parsed again. Status: {resume.ParsingStatus}.");

            return Ok(new
            {
                message = resume.ParsingStatus == "Completed"
                    ? "Resume parsed successfully."
                    : "Resume parsing failed.",

                resume = CreateResponse(resume)
            });
        }

        // --------------------------------------------------
        // CANDIDATE DOWNLOADS OWN RESUME
        // GET: /api/Resumes/1/download
        // --------------------------------------------------
        [Authorize(Roles = "Candidate")]
        [HttpGet("{id:int}/download")]
        public async Task<IActionResult>
            DownloadResume(int id)
        {
            int? userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized(new
                {
                    message = "Invalid user token."
                });
            }

            var resume =
                await _context.Resumes
                    .Include(item =>
                        item.CandidateProfile)
                    .FirstOrDefaultAsync(item =>
                        item.ResumeId == id &&
                        item.CandidateProfile != null &&
                        item.CandidateProfile.UserId ==
                            userId.Value);

            if (resume == null)
            {
                return NotFound(new
                {
                    message = "Resume not found."
                });
            }

            return await CreateResumeFileResponse(resume);
        }

        // --------------------------------------------------
        // RECRUITER / HIRING MANAGER / ADMIN
        // DOWNLOADS A CANDIDATE RESUME
        // GET: /api/Resumes/recruiter/1/download
        // --------------------------------------------------
        [Authorize(
            Roles =
                "Recruiter,HiringManager,Admin")]
        [HttpGet("recruiter/{id:int}/download")]
        public async Task<IActionResult>
            DownloadCandidateResume(int id)
        {
            var resume =
                await _context.Resumes
                    .FirstOrDefaultAsync(item =>
                        item.ResumeId == id);

            if (resume == null)
            {
                return NotFound(new
                {
                    message = "Resume not found."
                });
            }

            return await CreateResumeFileResponse(resume);
        }

        // --------------------------------------------------
        // CANDIDATE SETS PRIMARY RESUME
        // PUT: /api/Resumes/1/primary
        // --------------------------------------------------
        [Authorize(Roles = "Candidate")]
        [HttpPut("{id:int}/primary")]
        public async Task<IActionResult>
            SetPrimaryResume(int id)
        {
            int? userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized(new
                {
                    message = "Invalid user token."
                });
            }

            var selectedResume =
                await _context.Resumes
                    .Include(resume =>
                        resume.CandidateProfile)
                    .FirstOrDefaultAsync(resume =>
                        resume.ResumeId == id &&
                        resume.CandidateProfile != null &&
                        resume.CandidateProfile.UserId ==
                            userId.Value);

            if (selectedResume == null)
            {
                return NotFound(new
                {
                    message = "Resume not found."
                });
            }

            var candidateResumes =
                await _context.Resumes
                    .Where(resume =>
                        resume.CandidateProfileId ==
                        selectedResume.CandidateProfileId)
                    .ToListAsync();

            foreach (var resume in candidateResumes)
            {
                resume.IsPrimary =
                    resume.ResumeId == id;
            }

            await _context.SaveChangesAsync();

            await SafeAuditLogAsync(
                action: "Primary Resume Changed",
                entityType: "Resume",
                entityId: selectedResume.ResumeId.ToString(),
                details:
                    $"Resume '{selectedResume.OriginalFileName}' was set as the primary resume.");

            return Ok(new
            {
                message =
                    "Primary resume updated successfully.",

                resumeId =
                    selectedResume.ResumeId
            });
        }

        // --------------------------------------------------
        // CANDIDATE DELETES OWN RESUME
        // DELETE: /api/Resumes/1
        // --------------------------------------------------
        [Authorize(Roles = "Candidate")]
        [HttpDelete("{id:int}")]
        public async Task<IActionResult>
            DeleteResume(int id)
        {
            int? userId = GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized(new
                {
                    message = "Invalid user token."
                });
            }

            var resume =
                await _context.Resumes
                    .Include(item =>
                        item.CandidateProfile)
                    .FirstOrDefaultAsync(item =>
                        item.ResumeId == id &&
                        item.CandidateProfile != null &&
                        item.CandidateProfile.UserId ==
                            userId.Value);

            if (resume == null)
            {
                return NotFound(new
                {
                    message = "Resume not found."
                });
            }

            string originalFileName =
                resume.OriginalFileName;

            string fullFilePath =
                GetResumeFullFilePath(
                    resume.StoredFileName);

            if (System.IO.File.Exists(fullFilePath))
            {
                System.IO.File.Delete(fullFilePath);
            }

            _context.Resumes.Remove(resume);
            await _context.SaveChangesAsync();

            await SafeAuditLogAsync(
                action: "Resume Deleted",
                entityType: "Resume",
                entityId: id.ToString(),
                details:
                    $"Resume '{originalFileName}' was deleted.");

            return Ok(new
            {
                message = "Resume deleted successfully."
            });
        }

        // --------------------------------------------------
        // PARSE AND SAVE RESUME RESULTS
        // --------------------------------------------------
        private async Task ParseAndSaveResumeAsync(
            Resume resume,
            CandidateProfile candidateProfile,
            string fullFilePath)
        {
            ResumeParsingResult result =
                await _resumeParsingService
                    .ParseResumeAsync(fullFilePath);

            if (!result.Success)
            {
                resume.ParsingStatus = "Failed";
                resume.ParsingError =
                    string.IsNullOrWhiteSpace(result.ErrorMessage)
                        ? "Resume parsing failed."
                        : Truncate(result.ErrorMessage, 1000);

                resume.ExtractedText = null;
                resume.ExtractedSkills = null;
                resume.ExtractedEducation = null;
                resume.ExtractedExperience = null;
                resume.ParsedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                return;
            }

            resume.ExtractedText =
                result.ExtractedText;

            resume.ExtractedSkills =
                result.Skills.Count == 0
                    ? null
                    : string.Join(", ", result.Skills);

            resume.ExtractedEducation =
                result.Education;

            resume.ExtractedExperience =
                result.Experience;

            resume.ParsingStatus = "Completed";
            resume.ParsingError = null;
            resume.ParsedAt = DateTime.UtcNow;

            if (result.Skills.Count > 0)
            {
                candidateProfile.Skills =
                    MergeCommaSeparatedValues(
                        candidateProfile.Skills,
                        result.Skills,
                        1000);
            }

            if (!string.IsNullOrWhiteSpace(result.Education))
            {
                candidateProfile.Education =
                    Truncate(
                        result.Education,
                        500);
            }

            candidateProfile.UpdatedAt =
                DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }

        // --------------------------------------------------
        // CREATE RESUME RESPONSE DTO
        // --------------------------------------------------
        private static ResumeResponseDto CreateResponse(
            Resume resume)
        {
            return new ResumeResponseDto
            {
                ResumeId =
                    resume.ResumeId,

                OriginalFileName =
                    resume.OriginalFileName,

                ContentType =
                    resume.ContentType,

                FileSize =
                    resume.FileSize,

                IsPrimary =
                    resume.IsPrimary,

                ParsingStatus =
                    resume.ParsingStatus,

                ExtractedSkills =
                    resume.ExtractedSkills,

                ExtractedEducation =
                    resume.ExtractedEducation,

                ExtractedExperience =
                    resume.ExtractedExperience,

                ParsingError =
                    resume.ParsingError,

                UploadedAt =
                    resume.UploadedAt,

                ParsedAt =
                    resume.ParsedAt,

                DownloadUrl =
                    $"/api/Resumes/{resume.ResumeId}/download"
            };
        }

        // --------------------------------------------------
        // CREATE FILE DOWNLOAD RESPONSE
        // --------------------------------------------------
        private async Task<IActionResult>
            CreateResumeFileResponse(Resume resume)
        {
            string fullFilePath =
                GetResumeFullFilePath(
                    resume.StoredFileName);

            if (!System.IO.File.Exists(fullFilePath))
            {
                return NotFound(new
                {
                    message =
                        "Resume file could not be found."
                });
            }

            byte[] fileBytes =
                await System.IO.File
                    .ReadAllBytesAsync(fullFilePath);

            return File(
                fileBytes,
                resume.ContentType,
                resume.OriginalFileName);
        }

        // --------------------------------------------------
        // GET FULL RESUME FILE PATH
        // --------------------------------------------------
        private string GetResumeFullFilePath(
            string storedFileName)
        {
            string webRootPath =
                _environment.WebRootPath ??
                Path.Combine(
                    _environment.ContentRootPath,
                    "wwwroot");

            return Path.Combine(
                webRootPath,
                "uploads",
                "resumes",
                storedFileName);
        }

        // --------------------------------------------------
        // SAFE AUDIT LOGGING
        // --------------------------------------------------
        private async Task SafeAuditLogAsync(
            string action,
            string entityType,
            string? entityId,
            string details)
        {
            try
            {
                int? userId =
                    GetCurrentUserId();

                string? userName =
                    User.FindFirstValue(
                        ClaimTypes.Name);

                string? email =
                    User.FindFirstValue(
                        ClaimTypes.Email);

                string? role =
                    User.FindFirstValue(
                        ClaimTypes.Role);

                await _auditLogService.LogAsync(
                    userId,
                    !string.IsNullOrWhiteSpace(userName)
                        ? userName
                        : email,
                    role,
                    action,
                    entityType,
                    entityId,
                    details);
            }
            catch
            {
                // Resume operation should not fail because
                // audit logging failed.
            }
        }

        // --------------------------------------------------
        // GET CURRENT USER ID FROM JWT
        // --------------------------------------------------
        private int? GetCurrentUserId()
        {
            string? userIdValue =
                User.FindFirstValue(
                    ClaimTypes.NameIdentifier);

            if (int.TryParse(
                    userIdValue,
                    out int userId))
            {
                return userId;
            }

            return null;
        }

        private static string MergeCommaSeparatedValues(
            string? currentValues,
            IEnumerable<string> newValues,
            int maximumLength)
        {
            var values = new HashSet<string>(
                StringComparer.OrdinalIgnoreCase);

            if (!string.IsNullOrWhiteSpace(currentValues))
            {
                foreach (string value in currentValues.Split(','))
                {
                    string cleanedValue = value.Trim();

                    if (!string.IsNullOrWhiteSpace(cleanedValue))
                    {
                        values.Add(cleanedValue);
                    }
                }
            }

            foreach (string value in newValues)
            {
                if (!string.IsNullOrWhiteSpace(value))
                {
                    values.Add(value.Trim());
                }
            }

            string mergedValues =
                string.Join(", ", values.OrderBy(value => value));

            return Truncate(mergedValues, maximumLength);
        }

        private static string Truncate(
            string value,
            int maximumLength)
        {
            if (value.Length <= maximumLength)
            {
                return value;
            }

            return value[..maximumLength];
        }
    }
}