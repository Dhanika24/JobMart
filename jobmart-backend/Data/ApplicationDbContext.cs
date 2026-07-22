using jobmart.Models;
using Microsoft.EntityFrameworkCore;

namespace jobmart.Data
{
    public class ApplicationDbContext :
        DbContext
    {
        public ApplicationDbContext(
            DbContextOptions<
                ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; } =
            null!;

        public DbSet<CandidateProfile>
            CandidateProfiles
        { get; set; } =
            null!;

        public DbSet<RecruiterProfile>
            RecruiterProfiles
        { get; set; } =
            null!;

        public DbSet<HiringManagerProfile>
            HiringManagerProfiles
        { get; set; } =
            null!;

        public DbSet<Organization>
            Organizations
        { get; set; } =
            null!;

        public DbSet<Department>
            Departments
        { get; set; } =
            null!;

        public DbSet<JobPosting>
            JobPostings
        { get; set; } =
            null!;

        public DbSet<JobApplication>
            JobApplications
        { get; set; } =
            null!;

        public DbSet<Interview>
            Interviews
        { get; set; } =
            null!;

        public DbSet<CandidateEvaluation>
            CandidateEvaluations
        { get; set; } =
            null!;

        public DbSet<Resume>
            Resumes
        { get; set; } =
            null!;

        public DbSet<CandidateDocument>
            CandidateDocuments
        { get; set; } =
            null!;

        public DbSet<Notification>
            Notifications
        { get; set; } =
            null!;

        public DbSet<AuditLog>
            AuditLogs
        { get; set; } =
            null!;

        protected override void OnModelCreating(
            ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // --------------------------------------------------
            // USER
            // --------------------------------------------------

            modelBuilder.Entity<User>()
                .HasIndex(user =>
                    user.Email)
                .IsUnique();

            // --------------------------------------------------
            // CANDIDATE PROFILE
            // --------------------------------------------------

            modelBuilder.Entity<CandidateProfile>()
                .HasOne(profile =>
                    profile.User)
                .WithOne(user =>
                    user.CandidateProfile)
                .HasForeignKey<CandidateProfile>(
                    profile =>
                        profile.UserId)
                .OnDelete(
                    DeleteBehavior.Cascade);

            // --------------------------------------------------
            // ORGANIZATION
            // --------------------------------------------------

            modelBuilder.Entity<Organization>()
                .HasIndex(organization =>
                    organization.Name)
                .IsUnique();

            // --------------------------------------------------
            // DEPARTMENT
            // --------------------------------------------------

            modelBuilder.Entity<Department>()
                .HasOne(department =>
                    department.Organization)
                .WithMany(organization =>
                    organization.Departments)
                .HasForeignKey(department =>
                    department.OrganizationId)
                .OnDelete(
                    DeleteBehavior.Restrict);

            modelBuilder.Entity<Department>()
                .HasIndex(department => new
                {
                    department.OrganizationId,
                    department.Name
                })
                .IsUnique();

            // --------------------------------------------------
            // RECRUITER PROFILE
            // --------------------------------------------------

            modelBuilder.Entity<RecruiterProfile>()
                .HasOne(profile =>
                    profile.User)
                .WithOne(user =>
                    user.RecruiterProfile)
                .HasForeignKey<RecruiterProfile>(
                    profile =>
                        profile.UserId)
                .OnDelete(
                    DeleteBehavior.Cascade);

            modelBuilder.Entity<RecruiterProfile>()
                .HasIndex(profile =>
                    profile.UserId)
                .IsUnique();

            modelBuilder.Entity<RecruiterProfile>()
                .HasOne(profile =>
                    profile.Organization)
                .WithMany(organization =>
                    organization.RecruiterProfiles)
                .HasForeignKey(profile =>
                    profile.OrganizationId)
                .OnDelete(
                    DeleteBehavior.Restrict);

            modelBuilder.Entity<RecruiterProfile>()
                .HasOne(profile =>
                    profile.Department)
                .WithMany(department =>
                    department.RecruiterProfiles)
                .HasForeignKey(profile =>
                    profile.DepartmentId)
                .OnDelete(
                    DeleteBehavior.Restrict);

            // --------------------------------------------------
            // HIRING MANAGER PROFILE
            // --------------------------------------------------

            modelBuilder
                .Entity<HiringManagerProfile>()
                .HasOne(profile =>
                    profile.User)
                .WithOne(user =>
                    user.HiringManagerProfile)
                .HasForeignKey<
                    HiringManagerProfile>(
                    profile =>
                        profile.UserId)
                .OnDelete(
                    DeleteBehavior.Cascade);

            modelBuilder
                .Entity<HiringManagerProfile>()
                .HasIndex(profile =>
                    profile.UserId)
                .IsUnique();

            modelBuilder
                .Entity<HiringManagerProfile>()
                .HasOne(profile =>
                    profile.Organization)
                .WithMany(organization =>
                    organization
                        .HiringManagerProfiles)
                .HasForeignKey(profile =>
                    profile.OrganizationId)
                .OnDelete(
                    DeleteBehavior.Restrict);

            modelBuilder
                .Entity<HiringManagerProfile>()
                .HasOne(profile =>
                    profile.Department)
                .WithMany(department =>
                    department
                        .HiringManagerProfiles)
                .HasForeignKey(profile =>
                    profile.DepartmentId)
                .OnDelete(
                    DeleteBehavior.Restrict);

            // --------------------------------------------------
            // JOB POSTING
            // --------------------------------------------------

            modelBuilder.Entity<JobPosting>()
                .HasOne(job =>
                    job.Organization)
                .WithMany(organization =>
                    organization.JobPostings)
                .HasForeignKey(job =>
                    job.OrganizationId)
                .OnDelete(
                    DeleteBehavior.Restrict);

            modelBuilder.Entity<JobPosting>()
                .HasOne(job =>
                    job.Department)
                .WithMany(department =>
                    department.JobPostings)
                .HasForeignKey(job =>
                    job.DepartmentId)
                .OnDelete(
                    DeleteBehavior.Restrict);

            modelBuilder.Entity<JobPosting>()
                .HasOne(job =>
                    job.Recruiter)
                .WithMany(user =>
                    user.CreatedJobPostings)
                .HasForeignKey(job =>
                    job.RecruiterId)
                .OnDelete(
                    DeleteBehavior.Restrict);

            modelBuilder.Entity<JobPosting>()
                .Property(job =>
                    job.SalaryMin)
                .HasPrecision(18, 2);

            modelBuilder.Entity<JobPosting>()
                .Property(job =>
                    job.SalaryMax)
                .HasPrecision(18, 2);

            // --------------------------------------------------
            // JOB APPLICATION
            // --------------------------------------------------

            modelBuilder.Entity<JobApplication>()
                .HasOne(application =>
                    application.JobPosting)
                .WithMany()
                .HasForeignKey(application =>
                    application.JobId)
                .OnDelete(
                    DeleteBehavior.Restrict);

            modelBuilder.Entity<JobApplication>()
                .HasOne(application =>
                    application.CandidateProfile)
                .WithMany()
                .HasForeignKey(application =>
                    application
                        .CandidateProfileId)
                .OnDelete(
                    DeleteBehavior.Restrict);

            modelBuilder.Entity<JobApplication>()
                .HasIndex(application => new
                {
                    application.JobId,
                    application.CandidateProfileId
                })
                .IsUnique();

            // --------------------------------------------------
            // INTERVIEW
            // --------------------------------------------------

            modelBuilder.Entity<Interview>()
                .HasOne(interview =>
                    interview.JobApplication)
                .WithMany()
                .HasForeignKey(interview =>
                    interview.JobApplicationId)
                .OnDelete(
                    DeleteBehavior.Cascade);

            // --------------------------------------------------
            // CANDIDATE EVALUATION
            // --------------------------------------------------

            modelBuilder
                .Entity<CandidateEvaluation>()
                .HasOne(evaluation =>
                    evaluation.JobApplication)
                .WithMany()
                .HasForeignKey(evaluation =>
                    evaluation.JobApplicationId)
                .OnDelete(
                    DeleteBehavior.Cascade);

            modelBuilder
                .Entity<CandidateEvaluation>()
                .HasOne(evaluation =>
                    evaluation.HiringManager)
                .WithMany()
                .HasForeignKey(evaluation =>
                    evaluation.HiringManagerId)
                .OnDelete(
                    DeleteBehavior.Restrict);

            modelBuilder
                .Entity<CandidateEvaluation>()
                .HasIndex(evaluation => new
                {
                    evaluation.JobApplicationId,
                    evaluation.HiringManagerId
                })
                .IsUnique();

            modelBuilder
                .Entity<CandidateEvaluation>()
                .Property(evaluation =>
                    evaluation.OverallScore)
                .HasPrecision(5, 2);

            // --------------------------------------------------
            // RESUME
            // --------------------------------------------------

            modelBuilder.Entity<Resume>()
                .HasOne(resume =>
                    resume.CandidateProfile)
                .WithMany()
                .HasForeignKey(resume =>
                    resume.CandidateProfileId)
                .OnDelete(
                    DeleteBehavior.Cascade);

            modelBuilder.Entity<Resume>()
                .HasIndex(resume => new
                {
                    resume.CandidateProfileId,
                    resume.IsPrimary
                });

            modelBuilder.Entity<Resume>()
                .HasIndex(resume =>
                    resume.UploadedAt);

            // --------------------------------------------------
            // CANDIDATE DOCUMENT
            // --------------------------------------------------

            modelBuilder.Entity<CandidateDocument>()
                .HasOne(document =>
                    document.CandidateProfile)
                .WithMany()
                .HasForeignKey(document =>
                    document.CandidateProfileId)
                .OnDelete(
                    DeleteBehavior.Cascade);

            modelBuilder.Entity<CandidateDocument>()
                .HasIndex(document => new
                {
                    document.CandidateProfileId,
                    document.DocumentType
                });

            modelBuilder.Entity<CandidateDocument>()
                .HasIndex(document =>
                    document.UploadedAt);

            // --------------------------------------------------
            // NOTIFICATION
            // --------------------------------------------------

            modelBuilder.Entity<Notification>()
                .HasOne(notification =>
                    notification.User)
                .WithMany()
                .HasForeignKey(notification =>
                    notification.UserId)
                .OnDelete(
                    DeleteBehavior.Cascade);

            modelBuilder.Entity<Notification>()
                .HasOne(notification =>
                    notification.JobApplication)
                .WithMany()
                .HasForeignKey(notification =>
                    notification.JobApplicationId)
                .OnDelete(
                    DeleteBehavior.NoAction);

            modelBuilder.Entity<Notification>()
                .HasIndex(notification => new
                {
                    notification.UserId,
                    notification.IsRead,
                    notification.CreatedAt
                });

            // --------------------------------------------------
            // AUDIT LOG
            // --------------------------------------------------

            modelBuilder.Entity<AuditLog>()
                .HasOne(log =>
                    log.User)
                .WithMany()
                .HasForeignKey(log =>
                    log.UserId)
                .OnDelete(
                    DeleteBehavior.SetNull);

            modelBuilder.Entity<AuditLog>()
                .HasIndex(log =>
                    log.CreatedAt);

            modelBuilder.Entity<AuditLog>()
                .HasIndex(log => new
                {
                    log.Action,
                    log.CreatedAt
                });

            modelBuilder.Entity<AuditLog>()
                .HasIndex(log => new
                {
                    log.UserId,
                    log.CreatedAt
                });

            modelBuilder.Entity<AuditLog>()
                .HasIndex(log => new
                {
                    log.EntityType,
                    log.EntityId
                });
        }
    }
}