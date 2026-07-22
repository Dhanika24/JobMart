using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace jobmart.Migrations
{
    /// <inheritdoc />
    public partial class UpdateJobPostingFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "SalaryMax",
                table: "JobPostings",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "SalaryMin",
                table: "JobPostings",
                type: "decimal(18,2)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SalaryMax",
                table: "JobPostings");

            migrationBuilder.DropColumn(
                name: "SalaryMin",
                table: "JobPostings");
        }
    }
}
