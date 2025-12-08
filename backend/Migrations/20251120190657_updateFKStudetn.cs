using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class updateFKStudetn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CourseRegistrations_AspNetUsers_StudentCode",
                table: "CourseRegistrations");

            migrationBuilder.RenameColumn(
                name: "StudentCode",
                table: "CourseRegistrations",
                newName: "StudentId");

            migrationBuilder.RenameIndex(
                name: "IX_CourseRegistrations_StudentCode",
                table: "CourseRegistrations",
                newName: "IX_CourseRegistrations_StudentId");

            migrationBuilder.AddForeignKey(
                name: "FK_CourseRegistrations_AspNetUsers_StudentId",
                table: "CourseRegistrations",
                column: "StudentId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CourseRegistrations_AspNetUsers_StudentId",
                table: "CourseRegistrations");

            migrationBuilder.RenameColumn(
                name: "StudentId",
                table: "CourseRegistrations",
                newName: "StudentCode");

            migrationBuilder.RenameIndex(
                name: "IX_CourseRegistrations_StudentId",
                table: "CourseRegistrations",
                newName: "IX_CourseRegistrations_StudentCode");

            migrationBuilder.AddForeignKey(
                name: "FK_CourseRegistrations_AspNetUsers_StudentCode",
                table: "CourseRegistrations",
                column: "StudentCode",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
