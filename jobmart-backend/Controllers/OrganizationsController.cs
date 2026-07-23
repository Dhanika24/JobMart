using System.ComponentModel.DataAnnotations;
using jobmart.Data;
using jobmart.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace jobmart.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class OrganizationsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public OrganizationsController(
            ApplicationDbContext context)
        {
            _context = context;
        }

        // --------------------------------------------------
        // GET ALL ORGANIZATIONS
        // GET: /api/Organizations
        // --------------------------------------------------
        [HttpGet]
        public async Task<IActionResult>
            GetOrganizations()
        {
            var organizations =
                await _context.Organizations
                    .OrderBy(organization =>
                        organization.Name)
                    .Select(organization => new
                    {
                        organization.OrganizationId,
                        organization.Name,
                        organization.Description,
                        organization.Address,
                        organization.PhoneNumber,
                        organization.Email,
                        organization.Website,
                        organization.IsActive,
                        organization.CreatedAt,
                        organization.UpdatedAt,

                        totalDepartments =
                            organization.Departments.Count,

                        activeDepartments =
                            organization.Departments.Count(
                                department =>
                                    department.IsActive),

                        totalRecruiters =
                            organization
                                .RecruiterProfiles
                                .Count,

                        totalHiringManagers =
                            organization
                                .HiringManagerProfiles
                                .Count,

                        totalJobs =
                            organization
                                .JobPostings
                                .Count
                    })
                    .ToListAsync();

            return Ok(new
            {
                totalOrganizations =
                    organizations.Count,

                activeOrganizations =
                    organizations.Count(
                        organization =>
                            organization.IsActive),

                inactiveOrganizations =
                    organizations.Count(
                        organization =>
                            !organization.IsActive),

                organizations
            });
        }

        // --------------------------------------------------
        // GET ONE ORGANIZATION
        // GET: /api/Organizations/1
        // --------------------------------------------------
        [HttpGet("{organizationId}")]
        public async Task<IActionResult>
            GetOrganization(int organizationId)
        {
            var organization =
                await _context.Organizations
                    .Where(item =>
                        item.OrganizationId ==
                        organizationId)
                    .Select(item => new
                    {
                        item.OrganizationId,
                        item.Name,
                        item.Description,
                        item.Address,
                        item.PhoneNumber,
                        item.Email,
                        item.Website,
                        item.IsActive,
                        item.CreatedAt,
                        item.UpdatedAt,

                        departments =
                            item.Departments
                                .OrderBy(department =>
                                    department.Name)
                                .Select(department =>
                                    new
                                    {
                                        department
                                            .DepartmentId,

                                        department.Name,
                                        department.Description,
                                        department.IsActive,
                                        department.CreatedAt,
                                        department.UpdatedAt,

                                        totalRecruiters =
                                            department
                                                .RecruiterProfiles
                                                .Count,

                                        totalHiringManagers =
                                            department
                                                .HiringManagerProfiles
                                                .Count,

                                        totalJobs =
                                            department
                                                .JobPostings
                                                .Count
                                    }),

                        totalRecruiters =
                            item.RecruiterProfiles.Count,

                        totalHiringManagers =
                            item.HiringManagerProfiles.Count,

                        totalJobs =
                            item.JobPostings.Count
                    })
                    .FirstOrDefaultAsync();

            if (organization == null)
            {
                return NotFound(new
                {
                    message =
                        "Organization not found."
                });
            }

            return Ok(organization);
        }

        // --------------------------------------------------
        // CREATE ORGANIZATION
        // POST: /api/Organizations
        // --------------------------------------------------
        [HttpPost]
        public async Task<IActionResult>
            CreateOrganization(
                CreateOrganizationDto request)
        {
            string organizationName =
                request.Name.Trim();

            if (string.IsNullOrWhiteSpace(
                    organizationName))
            {
                return BadRequest(new
                {
                    message =
                        "Organization name is required."
                });
            }

            bool nameExists =
                await _context.Organizations
                    .AnyAsync(organization =>
                        organization.Name
                            .ToLower() ==
                        organizationName
                            .ToLower());

            if (nameExists)
            {
                return BadRequest(new
                {
                    message =
                        "An organization with this name already exists."
                });
            }

            var organization =
                new Organization
                {
                    Name =
                        organizationName,

                    Description =
                        CleanOptionalText(
                            request.Description),

                    Address =
                        CleanOptionalText(
                            request.Address),

                    PhoneNumber =
                        CleanOptionalText(
                            request.PhoneNumber),

                    Email =
                        CleanOptionalText(
                            request.Email)
                            ?.ToLowerInvariant(),

                    Website =
                        CleanOptionalText(
                            request.Website),

                    IsActive =
                        true,

                    CreatedAt =
                        DateTime.UtcNow
                };

            _context.Organizations.Add(
                organization);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Organization created successfully.",

                organization =
                    new
                    {
                        organization.OrganizationId,
                        organization.Name,
                        organization.Description,
                        organization.Address,
                        organization.PhoneNumber,
                        organization.Email,
                        organization.Website,
                        organization.IsActive,
                        organization.CreatedAt
                    }
            });
        }

        // --------------------------------------------------
        // UPDATE ORGANIZATION
        // PUT: /api/Organizations/1
        // --------------------------------------------------
        [HttpPut("{organizationId}")]
        public async Task<IActionResult>
            UpdateOrganization(
                int organizationId,
                UpdateOrganizationDto request)
        {
            var organization =
                await _context.Organizations
                    .FirstOrDefaultAsync(item =>
                        item.OrganizationId ==
                        organizationId);

            if (organization == null)
            {
                return NotFound(new
                {
                    message =
                        "Organization not found."
                });
            }

            string organizationName =
                request.Name.Trim();

            if (string.IsNullOrWhiteSpace(
                    organizationName))
            {
                return BadRequest(new
                {
                    message =
                        "Organization name is required."
                });
            }

            bool nameExists =
                await _context.Organizations
                    .AnyAsync(item =>
                        item.OrganizationId !=
                            organizationId &&
                        item.Name.ToLower() ==
                            organizationName
                                .ToLower());

            if (nameExists)
            {
                return BadRequest(new
                {
                    message =
                        "Another organization already uses this name."
                });
            }

            organization.Name =
                organizationName;

            organization.Description =
                CleanOptionalText(
                    request.Description);

            organization.Address =
                CleanOptionalText(
                    request.Address);

            organization.PhoneNumber =
                CleanOptionalText(
                    request.PhoneNumber);

            organization.Email =
                CleanOptionalText(
                    request.Email)
                    ?.ToLowerInvariant();

            organization.Website =
                CleanOptionalText(
                    request.Website);

            organization.UpdatedAt =
                DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Organization updated successfully.",

                organization =
                    new
                    {
                        organization.OrganizationId,
                        organization.Name,
                        organization.Description,
                        organization.Address,
                        organization.PhoneNumber,
                        organization.Email,
                        organization.Website,
                        organization.IsActive,
                        organization.CreatedAt,
                        organization.UpdatedAt
                    }
            });
        }

        // --------------------------------------------------
        // ACTIVATE ORGANIZATION
        // PUT: /api/Organizations/1/activate
        // --------------------------------------------------
        [HttpPut("{organizationId}/activate")]
        public async Task<IActionResult>
            ActivateOrganization(
                int organizationId)
        {
            var organization =
                await _context.Organizations
                    .FirstOrDefaultAsync(item =>
                        item.OrganizationId ==
                        organizationId);

            if (organization == null)
            {
                return NotFound(new
                {
                    message =
                        "Organization not found."
                });
            }

            if (organization.IsActive)
            {
                return BadRequest(new
                {
                    message =
                        "This organization is already active."
                });
            }

            organization.IsActive = true;

            organization.UpdatedAt =
                DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Organization activated successfully.",

                organization.OrganizationId,
                organization.IsActive,
                organization.UpdatedAt
            });
        }

        // --------------------------------------------------
        // DEACTIVATE ORGANIZATION
        // PUT: /api/Organizations/1/deactivate
        // --------------------------------------------------
        [HttpPut("{organizationId}/deactivate")]
        public async Task<IActionResult>
            DeactivateOrganization(
                int organizationId)
        {
            var organization =
                await _context.Organizations
                    .Include(item =>
                        item.Departments)
                    .FirstOrDefaultAsync(item =>
                        item.OrganizationId ==
                        organizationId);

            if (organization == null)
            {
                return NotFound(new
                {
                    message =
                        "Organization not found."
                });
            }

            if (!organization.IsActive)
            {
                return BadRequest(new
                {
                    message =
                        "This organization is already inactive."
                });
            }

            organization.IsActive = false;

            organization.UpdatedAt =
                DateTime.UtcNow;

            foreach (
                var department
                in organization.Departments)
            {
                department.IsActive = false;

                department.UpdatedAt =
                    DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Organization and its departments were deactivated successfully.",

                organization.OrganizationId,
                organization.IsActive,

                deactivatedDepartments =
                    organization.Departments.Count
            });
        }

        // --------------------------------------------------
        // DELETE ORGANIZATION
        // DELETE: /api/Organizations/1
        // --------------------------------------------------
        [HttpDelete("{organizationId}")]
        public async Task<IActionResult>
            DeleteOrganization(
                int organizationId)
        {
            var organization =
                await _context.Organizations
                    .Include(item =>
                        item.Departments)
                    .Include(item =>
                        item.RecruiterProfiles)
                    .Include(item =>
                        item.HiringManagerProfiles)
                    .Include(item =>
                        item.JobPostings)
                    .FirstOrDefaultAsync(item =>
                        item.OrganizationId ==
                        organizationId);

            if (organization == null)
            {
                return NotFound(new
                {
                    message =
                        "Organization not found."
                });
            }

            bool hasRelatedRecords =
                organization.Departments.Any() ||
                organization
                    .RecruiterProfiles.Any() ||
                organization
                    .HiringManagerProfiles.Any() ||
                organization
                    .JobPostings.Any();

            if (hasRelatedRecords)
            {
                return BadRequest(new
                {
                    message =
                        "This organization cannot be deleted because it has departments, staff profiles, or job postings. Deactivate it instead."
                });
            }

            _context.Organizations.Remove(
                organization);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Organization deleted successfully."
            });
        }

        private static string?
            CleanOptionalText(string? value)
        {
            return string.IsNullOrWhiteSpace(value)
                ? null
                : value.Trim();
        }
    }

    public class CreateOrganizationDto
    {
        [Required]
        [MaxLength(150)]
        public string Name { get; set; } =
            string.Empty;

        [MaxLength(500)]
        public string? Description { get; set; }

        [MaxLength(250)]
        public string? Address { get; set; }

        [MaxLength(30)]
        public string? PhoneNumber { get; set; }

        [EmailAddress]
        [MaxLength(150)]
        public string? Email { get; set; }

        [MaxLength(200)]
        public string? Website { get; set; }
    }

    public class UpdateOrganizationDto
    {
        [Required]
        [MaxLength(150)]
        public string Name { get; set; } =
            string.Empty;

        [MaxLength(500)]
        public string? Description { get; set; }

        [MaxLength(250)]
        public string? Address { get; set; }

        [MaxLength(30)]
        public string? PhoneNumber { get; set; }

        [EmailAddress]
        [MaxLength(150)]
        public string? Email { get; set; }

        [MaxLength(200)]
        public string? Website { get; set; }
    }
}