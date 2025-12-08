using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddCourseMajorTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CourseMajor_Courses_CourseId",
                table: "CourseMajor");

            migrationBuilder.DropPrimaryKey(
                name: "PK_CourseMajor",
                table: "CourseMajor");

            migrationBuilder.RenameTable(
                name: "CourseMajor",
                newName: "CourseMajors");

            migrationBuilder.RenameIndex(
                name: "IX_CourseMajor_CourseId",
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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CourseMajors_Courses_CourseId",
                table: "CourseMajors");

            migrationBuilder.DropPrimaryKey(
                name: "PK_CourseMajors",
                table: "CourseMajors");

            migrationBuilder.RenameTable(
                name: "CourseMajors",
                newName: "CourseMajor");

            migrationBuilder.RenameIndex(
                name: "IX_CourseMajors_CourseId",
                table: "CourseMajor",
                newName: "IX_CourseMajor_CourseId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_CourseMajor",
                table: "CourseMajor",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_CourseMajor_Courses_CourseId",
                table: "CourseMajor",
                column: "CourseId",
                principalTable: "Courses",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
