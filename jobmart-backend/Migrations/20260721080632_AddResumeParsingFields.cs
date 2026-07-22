using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace jobmart.Migrations
{
    /// <inheritdoc />
    public partial class AddResumeParsingFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ExtractedEducation",
                table: "Resumes",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ExtractedExperience",
                table: "Resumes",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ExtractedSkills",
                table: "Resumes",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ExtractedText",
                table: "Resumes",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ParsedAt",
                table: "Resumes",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ParsingError",
                table: "Resumes",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ParsingStatus",
                table: "Resumes",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ExtractedEducation",
                table: "Resumes");

            migrationBuilder.DropColumn(
                name: "ExtractedExperience",
                table: "Resumes");

            migrationBuilder.DropColumn(
                name: "ExtractedSkills",
                table: "Resumes");

            migrationBuilder.DropColumn(
                name: "ExtractedText",
                table: "Resumes");

            migrationBuilder.DropColumn(
                name: "ParsedAt",
                table: "Resumes");

            migrationBuilder.DropColumn(
                name: "ParsingError",
                table: "Resumes");

            migrationBuilder.DropColumn(
                name: "ParsingStatus",
                table: "Resumes");
        }
    }
}
