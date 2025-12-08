using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class ConfigureCourseMajorTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CourseMajors_Courses_CourseId",
                table: "CourseMajors");

            migrationBuilder.DropPrimaryKey(
                name: "PK_CourseMajors",
                table: "CourseMajors");

            migrationBuilder.RenameTable(
                name: "CourseMajors",
                newName: "courseMajors");

            migrationBuilder.RenameIndex(
                name: "IX_CourseMajors_CourseId",
                table: "courseMajors",
                newName: "IX_courseMajors_CourseId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_courseMajors",
                table: "courseMajors",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_courseMajors_Courses_CourseId",
                table: "courseMajors",
                column: "CourseId",
                principalTable: "Courses",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_courseMajors_Courses_CourseId",
                table: "courseMajors");

            migrationBuilder.DropPrimaryKey(
                name: "PK_courseMajors",
                table: "courseMajors");

            migrationBuilder.RenameTable(
                name: "courseMajors",
                newName: "CourseMajors");

            migrationBuilder.RenameIndex(
                name: "IX_courseMajors_CourseId",
                table: "CourseMajors",
                newName: "IX_CourseMajors_CourseId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_CourseMajors",
                table: "CourseMajors",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_CourseMajors_Courses_CourseId",
                table: "CourseMajors",
                column: "CourseId",
                principalTable: "Courses",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
