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
    public class DepartmentsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public DepartmentsController(
            ApplicationDbContext context)
        {
            _context = context;
        }

        // --------------------------------------------------
        // GET ALL DEPARTMENTS
        // GET: /api/Departments
        // --------------------------------------------------
        [HttpGet]
        public async Task<IActionResult> GetDepartments()
        {
            var departments =
                await _context.Departments
                    .OrderBy(department =>
                        department.Organization!.Name)
                    .ThenBy(department =>
                        department.Name)
                    .Select(department => new
                    {
                        department.DepartmentId,
                        department.Name,
                        department.Description,
                        department.IsActive,
                        department.CreatedAt,
                        department.UpdatedAt,

                        department.OrganizationId,

                        organizationName =
                            department.Organization != null
                                ? department.Organization.Name
                                : "Unknown Organization",

                        organizationIsActive =
                            department.Organization != null &&
                            department.Organization.IsActive,

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
                    })
                    .ToListAsync();

            return Ok(new
            {
                totalDepartments =
                    departments.Count,

                activeDepartments =
                    departments.Count(
                        department =>
                            department.IsActive),

                inactiveDepartments =
                    departments.Count(
                        department =>
                            !department.IsActive),

                departments
            });
        }

        // --------------------------------------------------
        // GET ONE DEPARTMENT
        // GET: /api/Departments/1
        // --------------------------------------------------
        [HttpGet("{departmentId}")]
        public async Task<IActionResult> GetDepartment(
            int departmentId)
        {
            var department =
                await _context.Departments
                    .Where(item =>
                        item.DepartmentId ==
                        departmentId)
                    .Select(item => new
                    {
                        item.DepartmentId,
                        item.Name,
                        item.Description,
                        item.IsActive,
                        item.CreatedAt,
                        item.UpdatedAt,

                        item.OrganizationId,

                        organization =
                            item.Organization == null
                                ? null
                                : new
                                {
                                    item.Organization
                                        .OrganizationId,

                                    item.Organization.Name,

                                    item.Organization
                                        .Description,

                                    item.Organization.IsActive
                                },

                        recruiters =
                            item.RecruiterProfiles
                                .OrderBy(profile =>
                                    profile.User!.FullName)
                                .Select(profile => new
                                {
                                    profile
                                        .RecruiterProfileId,

                                    profile.UserId,

                                    fullName =
                                        profile.User != null
                                            ? profile.User.FullName
                                            : "Unknown Recruiter",

                                    email =
                                        profile.User != null
                                            ? profile.User.Email
                                            : string.Empty,

                                    profile.JobTitle
                                }),

                        hiringManagers =
                            item.HiringManagerProfiles
                                .OrderBy(profile =>
                                    profile.User!.FullName)
                                .Select(profile => new
                                {
                                    profile
                                        .HiringManagerProfileId,

                                    profile.UserId,

                                    fullName =
                                        profile.User != null
                                            ? profile.User.FullName
                                            : "Unknown Hiring Manager",

                                    email =
                                        profile.User != null
                                            ? profile.User.Email
                                            : string.Empty,

                                    profile.JobTitle
                                }),

                        jobs =
                            item.JobPostings
                                .OrderByDescending(job =>
                                    job.CreatedAt)
                                .Select(job => new
                                {
                                    job.JobId,
                                    job.Title,
                                    job.Status,
                                    job.Location,
                                    job.EmploymentType,
                                    job.Deadline
                                })
                    })
                    .FirstOrDefaultAsync();

            if (department == null)
            {
                return NotFound(new
                {
                    message =
                        "Department not found."
                });
            }

            return Ok(department);
        }

        // --------------------------------------------------
        // GET DEPARTMENTS BY ORGANIZATION
        // GET: /api/Departments/organization/1
        // --------------------------------------------------
        [HttpGet("organization/{organizationId}")]
        public async Task<IActionResult>
            GetDepartmentsByOrganization(
                int organizationId)
        {
            bool organizationExists =
                await _context.Organizations
                    .AnyAsync(organization =>
                        organization.OrganizationId ==
                        organizationId);

            if (!organizationExists)
            {
                return NotFound(new
                {
                    message =
                        "Organization not found."
                });
            }

            var departments =
                await _context.Departments
                    .Where(department =>
                        department.OrganizationId ==
                        organizationId)
                    .OrderBy(department =>
                        department.Name)
                    .Select(department => new
                    {
                        department.DepartmentId,
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
                    })
                    .ToListAsync();

            return Ok(new
            {
                organizationId,

                totalDepartments =
                    departments.Count,

                departments
            });
        }

        // --------------------------------------------------
        // CREATE DEPARTMENT
        // POST: /api/Departments
        // --------------------------------------------------
        [HttpPost]
        public async Task<IActionResult> CreateDepartment(
            CreateDepartmentDto request)
        {
            string departmentName =
                request.Name.Trim();

            if (string.IsNullOrWhiteSpace(
                    departmentName))
            {
                return BadRequest(new
                {
                    message =
                        "Department name is required."
                });
            }

            var organization =
                await _context.Organizations
                    .FirstOrDefaultAsync(item =>
                        item.OrganizationId ==
                        request.OrganizationId);

            if (organization == null)
            {
                return BadRequest(new
                {
                    message =
                        "The selected organization does not exist."
                });
            }

            if (!organization.IsActive)
            {
                return BadRequest(new
                {
                    message =
                        "A department cannot be created inside an inactive organization."
                });
            }

            bool nameExists =
                await _context.Departments
                    .AnyAsync(department =>
                        department.OrganizationId ==
                            request.OrganizationId &&
                        department.Name.ToLower() ==
                            departmentName.ToLower());

            if (nameExists)
            {
                return BadRequest(new
                {
                    message =
                        "A department with this name already exists in the selected organization."
                });
            }

            var department =
                new Department
                {
                    Name =
                        departmentName,

                    Description =
                        CleanOptionalText(
                            request.Description),

                    OrganizationId =
                        request.OrganizationId,

                    IsActive =
                        true,

                    CreatedAt =
                        DateTime.UtcNow
                };

            _context.Departments.Add(
                department);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Department created successfully.",

                department =
                    new
                    {
                        department.DepartmentId,
                        department.Name,
                        department.Description,
                        department.OrganizationId,

                        organizationName =
                            organization.Name,

                        department.IsActive,
                        department.CreatedAt
                    }
            });
        }

        // --------------------------------------------------
        // UPDATE DEPARTMENT
        // PUT: /api/Departments/1
        // --------------------------------------------------
        [HttpPut("{departmentId}")]
        public async Task<IActionResult> UpdateDepartment(
            int departmentId,
            UpdateDepartmentDto request)
        {
            var department =
                await _context.Departments
                    .FirstOrDefaultAsync(item =>
                        item.DepartmentId ==
                        departmentId);

            if (department == null)
            {
                return NotFound(new
                {
                    message =
                        "Department not found."
                });
            }

            string departmentName =
                request.Name.Trim();

            if (string.IsNullOrWhiteSpace(
                    departmentName))
            {
                return BadRequest(new
                {
                    message =
                        "Department name is required."
                });
            }

            var organization =
                await _context.Organizations
                    .FirstOrDefaultAsync(item =>
                        item.OrganizationId ==
                        request.OrganizationId);

            if (organization == null)
            {
                return BadRequest(new
                {
                    message =
                        "The selected organization does not exist."
                });
            }

            if (!organization.IsActive)
            {
                return BadRequest(new
                {
                    message =
                        "The selected organization is inactive."
                });
            }

            bool nameExists =
                await _context.Departments
                    .AnyAsync(item =>
                        item.DepartmentId !=
                            departmentId &&
                        item.OrganizationId ==
                            request.OrganizationId &&
                        item.Name.ToLower() ==
                            departmentName.ToLower());

            if (nameExists)
            {
                return BadRequest(new
                {
                    message =
                        "Another department with this name already exists in the selected organization."
                });
            }

            bool organizationChanged =
                department.OrganizationId !=
                request.OrganizationId;

            if (organizationChanged)
            {
                bool hasAssignedRecords =
                    await _context.RecruiterProfiles
                        .AnyAsync(profile =>
                            profile.DepartmentId ==
                            departmentId) ||

                    await _context
                        .HiringManagerProfiles
                        .AnyAsync(profile =>
                            profile.DepartmentId ==
                            departmentId) ||

                    await _context.JobPostings
                        .AnyAsync(job =>
                            job.DepartmentId ==
                            departmentId);

                if (hasAssignedRecords)
                {
                    return BadRequest(new
                    {
                        message =
                            "This department cannot be moved to another organization while staff profiles or job postings are assigned to it."
                    });
                }
            }

            department.Name =
                departmentName;

            department.Description =
                CleanOptionalText(
                    request.Description);

            department.OrganizationId =
                request.OrganizationId;

            department.UpdatedAt =
                DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Department updated successfully.",

                department =
                    new
                    {
                        department.DepartmentId,
                        department.Name,
                        department.Description,
                        department.OrganizationId,

                        organizationName =
                            organization.Name,

                        department.IsActive,
                        department.CreatedAt,
                        department.UpdatedAt
                    }
            });
        }

        // --------------------------------------------------
        // ACTIVATE DEPARTMENT
        // PUT: /api/Departments/1/activate
        // --------------------------------------------------
        [HttpPut("{departmentId}/activate")]
        public async Task<IActionResult>
            ActivateDepartment(int departmentId)
        {
            var department =
                await _context.Departments
                    .Include(item =>
                        item.Organization)
                    .FirstOrDefaultAsync(item =>
                        item.DepartmentId ==
                        departmentId);

            if (department == null)
            {
                return NotFound(new
                {
                    message =
                        "Department not found."
                });
            }

            if (department.Organization == null ||
                !department.Organization.IsActive)
            {
                return BadRequest(new
                {
                    message =
                        "This department cannot be activated because its organization is inactive."
                });
            }

            if (department.IsActive)
            {
                return BadRequest(new
                {
                    message =
                        "This department is already active."
                });
            }

            department.IsActive = true;

            department.UpdatedAt =
                DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Department activated successfully.",

                department.DepartmentId,
                department.IsActive,
                department.UpdatedAt
            });
        }

        // --------------------------------------------------
        // DEACTIVATE DEPARTMENT
        // PUT: /api/Departments/1/deactivate
        // --------------------------------------------------
        [HttpPut("{departmentId}/deactivate")]
        public async Task<IActionResult>
            DeactivateDepartment(int departmentId)
        {
            var department =
                await _context.Departments
                    .FirstOrDefaultAsync(item =>
                        item.DepartmentId ==
                        departmentId);

            if (department == null)
            {
                return NotFound(new
                {
                    message =
                        "Department not found."
                });
            }

            if (!department.IsActive)
            {
                return BadRequest(new
                {
                    message =
                        "This department is already inactive."
                });
            }

            department.IsActive = false;

            department.UpdatedAt =
                DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Department deactivated successfully.",

                department.DepartmentId,
                department.IsActive,
                department.UpdatedAt
            });
        }

        // --------------------------------------------------
        // DELETE DEPARTMENT
        // DELETE: /api/Departments/1
        // --------------------------------------------------
        [HttpDelete("{departmentId}")]
        public async Task<IActionResult> DeleteDepartment(
            int departmentId)
        {
            var department =
                await _context.Departments
                    .Include(item =>
                        item.RecruiterProfiles)
                    .Include(item =>
                        item.HiringManagerProfiles)
                    .Include(item =>
                        item.JobPostings)
                    .FirstOrDefaultAsync(item =>
                        item.DepartmentId ==
                        departmentId);

            if (department == null)
            {
                return NotFound(new
                {
                    message =
                        "Department not found."
                });
            }

            bool hasRelatedRecords =
                department
                    .RecruiterProfiles.Any() ||
                department
                    .HiringManagerProfiles.Any() ||
                department
                    .JobPostings.Any();

            if (hasRelatedRecords)
            {
                return BadRequest(new
                {
                    message =
                        "This department cannot be deleted because staff profiles or job postings are assigned to it. Deactivate it instead."
                });
            }

            _context.Departments.Remove(
                department);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message =
                    "Department deleted successfully."
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

    public class CreateDepartmentDto
    {
        [Required]
        [MaxLength(120)]
        public string Name { get; set; } =
            string.Empty;

        [MaxLength(500)]
        public string? Description { get; set; }

        [Required]
        public int OrganizationId { get; set; }
    }

    public class UpdateDepartmentDto
    {
        [Required]
        [MaxLength(120)]
        public string Name { get; set; } =
            string.Empty;

        [MaxLength(500)]
        public string? Description { get; set; }

        [Required]
        public int OrganizationId { get; set; }
    }
}