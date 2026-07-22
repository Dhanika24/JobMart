using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace jobmart.Migrations
{
    /// <inheritdoc />
    public partial class AddCandidateDocuments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Resumes_CandidateProfileId",
                table: "Resumes");

            migrationBuilder.CreateTable(
                name: "CandidateDocuments",
                columns: table => new
                {
                    CandidateDocumentId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CandidateProfileId = table.Column<int>(type: "int", nullable: false),
                    DocumentType = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    OriginalFileName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    StoredFileName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    FilePath = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    ContentType = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    FileSize = table.Column<long>(type: "bigint", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    UploadedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CandidateDocuments", x => x.CandidateDocumentId);
                    table.ForeignKey(
                        name: "FK_CandidateDocuments_CandidateProfiles_CandidateProfileId",
                        column: x => x.CandidateProfileId,
                        principalTable: "CandidateProfiles",
                        principalColumn: "CandidateProfileId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Resumes_CandidateProfileId_IsPrimary",
                table: "Resumes",
                columns: new[] { "CandidateProfileId", "IsPrimary" });

            migrationBuilder.CreateIndex(
                name: "IX_Resumes_UploadedAt",
                table: "Resumes",
                column: "UploadedAt");

            migrationBuilder.CreateIndex(
                name: "IX_CandidateDocuments_CandidateProfileId_DocumentType",
                table: "CandidateDocuments",
                columns: new[] { "CandidateProfileId", "DocumentType" });

            migrationBuilder.CreateIndex(
                name: "IX_CandidateDocuments_UploadedAt",
                table: "CandidateDocuments",
                column: "UploadedAt");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CandidateDocuments");

            migrationBuilder.DropIndex(
                name: "IX_Resumes_CandidateProfileId_IsPrimary",
                table: "Resumes");

            migrationBuilder.DropIndex(
                name: "IX_Resumes_UploadedAt",
                table: "Resumes");

            migrationBuilder.CreateIndex(
                name: "IX_Resumes_CandidateProfileId",
                table: "Resumes",
                column: "CandidateProfileId");
        }
    }
}
