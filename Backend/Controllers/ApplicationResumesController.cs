using jobmart.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace jobmart.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "HiringManager,Recruiter,Admin")]
    public class ApplicationResumesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _environment;

        public ApplicationResumesController(
            ApplicationDbContext context,
            IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;
        }

        // View resume information for an application
        // GET: /api/ApplicationResumes/application/1
        [HttpGet("application/{applicationId}")]
        public async Task<IActionResult> GetResumeDetails(
            int applicationId)
        {
            var application = await _context.JobApplications
                .Include(a => a.CandidateProfile)
                    .ThenInclude(profile => profile!.User)
                .Include(a => a.JobPosting)
                .FirstOrDefaultAsync(a =>
                    a.JobApplicationId == applicationId);

            if (application == null)
            {
                return NotFound(new
                {
                    message = "Job application not found."
                });
            }

            var resume = await _context.Resumes
                .Where(r =>
                    r.CandidateProfileId ==
                    application.CandidateProfileId)
                .OrderByDescending(r => r.IsPrimary)
                .ThenByDescending(r => r.UploadedAt)
                .FirstOrDefaultAsync();

            if (resume == null)
            {
                return NotFound(new
                {
                    message =
                        "The candidate has not uploaded a resume."
                });
            }

            return Ok(new
            {
                application.JobApplicationId,

                candidate = new
                {
                    candidateProfileId =
                        application.CandidateProfileId,

                    fullName =
                        application.CandidateProfile?.User?.FullName,

                    email =
                        application.CandidateProfile?.User?.Email
                },

                job = new
                {
                    application.JobId,
                    title = application.JobPosting?.Title
                },

                resume = new
                {
                    resume.ResumeId,
                    resume.OriginalFileName,
                    resume.ContentType,
                    resume.FileSize,
                    resume.IsPrimary,
                    resume.UploadedAt,

                    downloadUrl =
                        $"/api/ApplicationResumes/application/{applicationId}/download"
                }
            });
        }

        // Download candidate resume using the application ID
        // GET: /api/ApplicationResumes/application/1/download
        [HttpGet("application/{applicationId}/download")]
        public async Task<IActionResult> DownloadResume(
            int applicationId)
        {
            var application = await _context.JobApplications
                .FirstOrDefaultAsync(a =>
                    a.JobApplicationId == applicationId);

            if (application == null)
            {
                return NotFound(new
                {
                    message = "Job application not found."
                });
            }

            // Select primary resume first.
            // If no primary resume exists, select the latest resume.
            var resume = await _context.Resumes
                .Where(r =>
                    r.CandidateProfileId ==
                    application.CandidateProfileId)
                .OrderByDescending(r => r.IsPrimary)
                .ThenByDescending(r => r.UploadedAt)
                .FirstOrDefaultAsync();

            if (resume == null)
            {
                return NotFound(new
                {
                    message =
                        "The candidate has not uploaded a resume."
                });
            }

            string webRootPath =
                _environment.WebRootPath ??
                Path.Combine(
                    _environment.ContentRootPath,
                    "wwwroot");

            string fullFilePath = Path.Combine(
                webRootPath,
                "uploads",
                "resumes",
                resume.StoredFileName);

            if (!System.IO.File.Exists(fullFilePath))
            {
                return NotFound(new
                {
                    message =
                        "The resume record exists, but the physical file was not found."
                });
            }

            byte[] fileBytes =
                await System.IO.File.ReadAllBytesAsync(
                    fullFilePath);

            return File(
                fileBytes,
                resume.ContentType,
                resume.OriginalFileName);
        }
    }
}