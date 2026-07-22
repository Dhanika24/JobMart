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
    public class CandidateDocumentsController :
        ControllerBase
    {
        private const long MaximumFileSize =
            5 * 1024 * 1024;

        private static readonly string[]
            AllowedExtensions =
        {
            ".pdf",
            ".doc",
            ".docx",
            ".jpg",
            ".jpeg",
            ".png"
        };

        private static readonly string[]
            AllowedContentTypes =
        {
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "image/jpeg",
            "image/png"
        };

        private static readonly string[]
            AllowedDocumentTypes =
        {
            "Certificate",
            "Degree Transcript",
            "Portfolio",
            "Cover Letter",
            "Other"
        };

        private readonly ApplicationDbContext
            _context;

        private readonly IWebHostEnvironment
            _environment;

        private readonly IAuditLogService
            _auditLogService;

        public CandidateDocumentsController(
            ApplicationDbContext context,
            IWebHostEnvironment environment,
            IAuditLogService auditLogService)
        {
            _context = context;
            _environment = environment;
            _auditLogService = auditLogService;
        }

        // --------------------------------------------------
        // CANDIDATE UPLOADS A DOCUMENT
        // POST: /api/CandidateDocuments/upload
        // --------------------------------------------------
        [Authorize(Roles = "Candidate")]
        [HttpPost("upload")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult>
            UploadDocument(
                [FromForm]
                UploadCandidateDocumentDto request)
        {
            int? userId =
                GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized(new
                {
                    message =
                        "Invalid user token."
                });
            }

            if (request.File == null ||
                request.File.Length == 0)
            {
                return BadRequest(new
                {
                    message =
                        "Please select a document file."
                });
            }

            if (request.File.Length >
                MaximumFileSize)
            {
                return BadRequest(new
                {
                    message =
                        "The maximum allowed file size is 5 MB."
                });
            }

            string? normalizedDocumentType =
                NormalizeDocumentType(
                    request.DocumentType);

            if (normalizedDocumentType == null)
            {
                return BadRequest(new
                {
                    message =
                        "Invalid document type.",

                    allowedDocumentTypes =
                        AllowedDocumentTypes
                });
            }

            string extension =
                Path.GetExtension(
                        request.File.FileName)
                    .ToLowerInvariant();

            if (!AllowedExtensions.Contains(
                    extension))
            {
                return BadRequest(new
                {
                    message =
                        "Only PDF, DOC, DOCX, JPG, JPEG and PNG files are allowed."
                });
            }

            if (!AllowedContentTypes.Contains(
                    request.File.ContentType))
            {
                return BadRequest(new
                {
                    message =
                        "The uploaded file type is not supported."
                });
            }

            var candidateProfile =
                await _context
                    .CandidateProfiles
                    .FirstOrDefaultAsync(profile =>
                        profile.UserId ==
                        userId.Value);

            if (candidateProfile == null)
            {
                candidateProfile =
                    new CandidateProfile
                    {
                        UserId =
                            userId.Value,

                        ExperienceYears =
                            0,

                        UpdatedAt =
                            DateTime.UtcNow
                    };

                _context.CandidateProfiles.Add(
                    candidateProfile);

                await _context.SaveChangesAsync();
            }

            string uploadFolder =
                GetUploadFolder();

            Directory.CreateDirectory(
                uploadFolder);

            string storedFileName =
                $"{Guid.NewGuid()}{extension}";

            string fullFilePath =
                Path.Combine(
                    uploadFolder,
                    storedFileName);

            try
            {
                await using var stream =
                    new FileStream(
                        fullFilePath,
                        FileMode.Create);

                await request.File
                    .CopyToAsync(stream);
            }
            catch
            {
                return StatusCode(
                    StatusCodes
                        .Status500InternalServerError,
                    new
                    {
                        message =
                            "The document file could not be saved."
                    });
            }

            var document =
                new CandidateDocument
                {
                    CandidateProfileId =
                        candidateProfile
                            .CandidateProfileId,

                    DocumentType =
                        normalizedDocumentType,

                    OriginalFileName =
                        Path.GetFileName(
                            request.File.FileName),

                    StoredFileName =
                        storedFileName,

                    FilePath =
                        $"/uploads/candidate-documents/{storedFileName}",

                    ContentType =
                        request.File.ContentType,

                    FileSize =
                        request.File.Length,

                    Description =
                        CleanOptionalText(
                            request.Description),

                    UploadedAt =
                        DateTime.UtcNow
                };

            try
            {
                _context.CandidateDocuments.Add(
                    document);

                await _context.SaveChangesAsync();
            }
            catch
            {
                if (System.IO.File.Exists(
                        fullFilePath))
                {
                    System.IO.File.Delete(
                        fullFilePath);
                }

                return StatusCode(
                    StatusCodes
                        .Status500InternalServerError,
                    new
                    {
                        message =
                            "The document record could not be created."
                    });
            }

            await SafeAuditLogAsync(
                action:
                    "Candidate Document Uploaded",

                entityType:
                    "CandidateDocument",

                entityId:
                    document
                        .CandidateDocumentId
                        .ToString(),

                details:
                    $"{normalizedDocumentType} '{document.OriginalFileName}' was uploaded.");

            return Ok(new
            {
                message =
                    "Candidate document uploaded successfully.",

                document =
                    CreateResponse(document)
            });
        }

        // --------------------------------------------------
        // CANDIDATE VIEWS OWN DOCUMENTS
        // GET: /api/CandidateDocuments/my
        // --------------------------------------------------
        [Authorize(Roles = "Candidate")]
        [HttpGet("my")]
        public async Task<IActionResult>
            GetMyDocuments()
        {
            int? userId =
                GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized(new
                {
                    message =
                        "Invalid user token."
                });
            }

            var documents =
                await _context
                    .CandidateDocuments
                    .AsNoTracking()
                    .Include(document =>
                        document.CandidateProfile)
                    .Where(document =>
                        document.CandidateProfile !=
                            null &&
                        document.CandidateProfile
                            .UserId ==
                        userId.Value)
                    .OrderByDescending(document =>
                        document.UploadedAt)
                    .Select(document =>
                        new CandidateDocumentResponseDto
                        {
                            CandidateDocumentId =
                                document
                                    .CandidateDocumentId,

                            DocumentType =
                                document.DocumentType,

                            OriginalFileName =
                                document
                                    .OriginalFileName,

                            ContentType =
                                document.ContentType,

                            FileSize =
                                document.FileSize,

                            Description =
                                document.Description,

                            UploadedAt =
                                document.UploadedAt,

                            DownloadUrl =
                                $"/api/CandidateDocuments/{document.CandidateDocumentId}/download"
                        })
                    .ToListAsync();

            return Ok(new
            {
                totalDocuments =
                    documents.Count,

                documents
            });
        }

        // --------------------------------------------------
        // CANDIDATE DOWNLOADS OWN DOCUMENT
        // GET: /api/CandidateDocuments/1/download
        // --------------------------------------------------
        [Authorize(Roles = "Candidate")]
        [HttpGet("{id:int}/download")]
        public async Task<IActionResult>
            DownloadOwnDocument(int id)
        {
            int? userId =
                GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized(new
                {
                    message =
                        "Invalid user token."
                });
            }

            var document =
                await _context
                    .CandidateDocuments
                    .Include(item =>
                        item.CandidateProfile)
                    .FirstOrDefaultAsync(item =>
                        item.CandidateDocumentId ==
                            id &&
                        item.CandidateProfile !=
                            null &&
                        item.CandidateProfile
                            .UserId ==
                        userId.Value);

            if (document == null)
            {
                return NotFound(new
                {
                    message =
                        "Candidate document not found."
                });
            }

            return await CreateDocumentFileResponse(
                document);
        }

        // --------------------------------------------------
        // STAFF DOWNLOADS CANDIDATE DOCUMENT
        // GET: /api/CandidateDocuments/staff/1/download
        // --------------------------------------------------
        [Authorize(
            Roles =
                "Recruiter,HiringManager,Admin")]
        [HttpGet("staff/{id:int}/download")]
        public async Task<IActionResult>
            DownloadCandidateDocument(int id)
        {
            var document =
                await _context
                    .CandidateDocuments
                    .FirstOrDefaultAsync(item =>
                        item.CandidateDocumentId ==
                        id);

            if (document == null)
            {
                return NotFound(new
                {
                    message =
                        "Candidate document not found."
                });
            }

            return await CreateDocumentFileResponse(
                document);
        }

        // --------------------------------------------------
        // CANDIDATE DELETES OWN DOCUMENT
        // DELETE: /api/CandidateDocuments/1
        // --------------------------------------------------
        [Authorize(Roles = "Candidate")]
        [HttpDelete("{id:int}")]
        public async Task<IActionResult>
            DeleteDocument(int id)
        {
            int? userId =
                GetCurrentUserId();

            if (userId == null)
            {
                return Unauthorized(new
                {
                    message =
                        "Invalid user token."
                });
            }

            var document =
                await _context
                    .CandidateDocuments
                    .Include(item =>
                        item.CandidateProfile)
                    .FirstOrDefaultAsync(item =>
                        item.CandidateDocumentId ==
                            id &&
                        item.CandidateProfile !=
                            null &&
                        item.CandidateProfile
                            .UserId ==
                        userId.Value);

            if (document == null)
            {
                return NotFound(new
                {
                    message =
                        "Candidate document not found."
                });
            }

            string originalFileName =
                document.OriginalFileName;

            string documentType =
                document.DocumentType;

            string fullFilePath =
                GetDocumentFullFilePath(
                    document.StoredFileName);

            _context.CandidateDocuments.Remove(
                document);

            await _context.SaveChangesAsync();

            if (System.IO.File.Exists(
                    fullFilePath))
            {
                System.IO.File.Delete(
                    fullFilePath);
            }

            await SafeAuditLogAsync(
                action:
                    "Candidate Document Deleted",

                entityType:
                    "CandidateDocument",

                entityId:
                    id.ToString(),

                details:
                    $"{documentType} '{originalFileName}' was deleted.");

            return Ok(new
            {
                message =
                    "Candidate document deleted successfully."
            });
        }

        // --------------------------------------------------
        // CREATE DOCUMENT RESPONSE
        // --------------------------------------------------
        private static
            CandidateDocumentResponseDto
            CreateResponse(
                CandidateDocument document)
        {
            return new CandidateDocumentResponseDto
            {
                CandidateDocumentId =
                    document.CandidateDocumentId,

                DocumentType =
                    document.DocumentType,

                OriginalFileName =
                    document.OriginalFileName,

                ContentType =
                    document.ContentType,

                FileSize =
                    document.FileSize,

                Description =
                    document.Description,

                UploadedAt =
                    document.UploadedAt,

                DownloadUrl =
                    $"/api/CandidateDocuments/{document.CandidateDocumentId}/download"
            };
        }

        // --------------------------------------------------
        // CREATE FILE RESPONSE
        // --------------------------------------------------
        private async Task<IActionResult>
            CreateDocumentFileResponse(
                CandidateDocument document)
        {
            string fullFilePath =
                GetDocumentFullFilePath(
                    document.StoredFileName);

            if (!System.IO.File.Exists(
                    fullFilePath))
            {
                return NotFound(new
                {
                    message =
                        "Candidate document file could not be found."
                });
            }

            byte[] fileBytes =
                await System.IO.File
                    .ReadAllBytesAsync(
                        fullFilePath);

            return File(
                fileBytes,
                document.ContentType,
                document.OriginalFileName);
        }

        // --------------------------------------------------
        // UPLOAD FOLDER
        // --------------------------------------------------
        private string GetUploadFolder()
        {
            string webRootPath =
                _environment.WebRootPath ??
                Path.Combine(
                    _environment.ContentRootPath,
                    "wwwroot");

            return Path.Combine(
                webRootPath,
                "uploads",
                "candidate-documents");
        }

        // --------------------------------------------------
        // FULL FILE PATH
        // --------------------------------------------------
        private string
            GetDocumentFullFilePath(
                string storedFileName)
        {
            return Path.Combine(
                GetUploadFolder(),
                storedFileName);
        }

        // --------------------------------------------------
        // CURRENT USER ID
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

        // --------------------------------------------------
        // AUDIT LOG
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

                string? fullName =
                    User.FindFirstValue(
                        ClaimTypes.Name);

                string? email =
                    User.FindFirstValue(
                        ClaimTypes.Email);

                string? role =
                    User.FindFirstValue(
                        ClaimTypes.Role);

                string actorName =
                    !string.IsNullOrWhiteSpace(
                        fullName)
                        ? fullName
                        : !string.IsNullOrWhiteSpace(
                            email)
                            ? email
                            : "Unknown User";

                await _auditLogService.LogAsync(
                    userId,
                    actorName,
                    role,
                    action,
                    entityType,
                    entityId,
                    details);
            }
            catch
            {
                // Document action should not fail because
                // audit logging failed.
            }
        }

        private static string?
            NormalizeDocumentType(
                string? documentType)
        {
            if (string.IsNullOrWhiteSpace(
                    documentType))
            {
                return null;
            }

            string normalized =
                documentType.Trim()
                    .ToLowerInvariant();

            return normalized switch
            {
                "certificate" =>
                    "Certificate",

                "degree transcript" =>
                    "Degree Transcript",

                "transcript" =>
                    "Degree Transcript",

                "portfolio" =>
                    "Portfolio",

                "cover letter" =>
                    "Cover Letter",

                "coverletter" =>
                    "Cover Letter",

                "other" =>
                    "Other",

                _ =>
                    null
            };
        }

        private static string?
            CleanOptionalText(
                string? value)
        {
            return string.IsNullOrWhiteSpace(
                    value)
                ? null
                : value.Trim();
        }
    }

    public class UploadCandidateDocumentDto
    {
        [FromForm(Name = "File")]
        public IFormFile File { get; set; } =
            null!;

        [FromForm(Name = "DocumentType")]
        public string DocumentType { get; set; } =
            string.Empty;

        [FromForm(Name = "Description")]
        public string? Description { get; set; }
    }
}