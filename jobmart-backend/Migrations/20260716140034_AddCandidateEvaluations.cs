using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace jobmart.Migrations
{
    /// <inheritdoc />
    public partial class AddCandidateEvaluations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_JobApplications_CandidateProfiles_CandidateProfileId",
                table: "JobApplications");

            migrationBuilder.DropForeignKey(
                name: "FK_JobApplications_JobPostings_JobId",
                table: "JobApplications");

            migrationBuilder.DropIndex(
                name: "IX_JobApplications_JobId",
                table: "JobApplications");

            migrationBuilder.DropIndex(
                name: "IX_CandidateProfiles_UserId",
                table: "CandidateProfiles");

            migrationBuilder.CreateTable(
                name: "CandidateEvaluations",
                columns: table => new
                {
                    EvaluationId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    JobApplicationId = table.Column<int>(type: "int", nullable: false),
                    HiringManagerId = table.Column<int>(type: "int", nullable: false),
                    TechnicalScore = table.Column<int>(type: "int", nullable: false),
                    CommunicationScore = table.Column<int>(type: "int", nullable: false),
                    ExperienceScore = table.Column<int>(type: "int", nullable: false),
                    ProblemSolvingScore = table.Column<int>(type: "int", nullable: false),
                    CultureFitScore = table.Column<int>(type: "int", nullable: false),
                    OverallScore = table.Column<double>(type: "float(5)", precision: 5, scale: 2, nullable: false),
                    Feedback = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    Recommendation = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CandidateEvaluations", x => x.EvaluationId);
                    table.ForeignKey(
                        name: "FK_CandidateEvaluations_JobApplications_JobApplicationId",
                        column: x => x.JobApplicationId,
                        principalTable: "JobApplications",
                        principalColumn: "JobApplicationId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CandidateEvaluations_Users_HiringManagerId",
                        column: x => x.HiringManagerId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Users_Email",
                table: "Users",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_JobApplications_JobId_CandidateProfileId",
                table: "JobApplications",
                columns: new[] { "JobId", "CandidateProfileId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CandidateProfiles_UserId",
                table: "CandidateProfiles",
                column: "UserId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_CandidateEvaluations_HiringManagerId",
                table: "CandidateEvaluations",
                column: "HiringManagerId");

            migrationBuilder.CreateIndex(
                name: "IX_CandidateEvaluations_JobApplicationId",
                table: "CandidateEvaluations",
                column: "JobApplicationId");

            migrationBuilder.AddForeignKey(
                name: "FK_JobApplications_CandidateProfiles_CandidateProfileId",
                table: "JobApplications",
                column: "CandidateProfileId",
                principalTable: "CandidateProfiles",
                principalColumn: "CandidateProfileId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_JobApplications_JobPostings_JobId",
                table: "JobApplications",
                column: "JobId",
                principalTable: "JobPostings",
                principalColumn: "JobId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_JobApplications_CandidateProfiles_CandidateProfileId",
                table: "JobApplications");

            migrationBuilder.DropForeignKey(
                name: "FK_JobApplications_JobPostings_JobId",
                table: "JobApplications");

            migrationBuilder.DropTable(
                name: "CandidateEvaluations");

            migrationBuilder.DropIndex(
                name: "IX_Users_Email",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_JobApplications_JobId_CandidateProfileId",
                table: "JobApplications");

            migrationBuilder.DropIndex(
                name: "IX_CandidateProfiles_UserId",
                table: "CandidateProfiles");

            migrationBuilder.CreateIndex(
                name: "IX_JobApplications_JobId",
                table: "JobApplications",
                column: "JobId");

            migrationBuilder.CreateIndex(
                name: "IX_CandidateProfiles_UserId",
                table: "CandidateProfiles",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_JobApplications_CandidateProfiles_CandidateProfileId",
                table: "JobApplications",
                column: "CandidateProfileId",
                principalTable: "CandidateProfiles",
                principalColumn: "CandidateProfileId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_JobApplications_JobPostings_JobId",
                table: "JobApplications",
                column: "JobId",
                principalTable: "JobPostings",
                principalColumn: "JobId",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
