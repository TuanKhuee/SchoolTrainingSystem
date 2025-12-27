using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddRecipientIdToTransactionLog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "RecipientId",
                table: "TransactionLogs",
                type: "nvarchar(450)",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_TransactionLogs_RecipientId",
                table: "TransactionLogs",
                column: "RecipientId");

            migrationBuilder.AddForeignKey(
                name: "FK_TransactionLogs_AspNetUsers_RecipientId",
                table: "TransactionLogs",
                column: "RecipientId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TransactionLogs_AspNetUsers_RecipientId",
                table: "TransactionLogs");

            migrationBuilder.DropIndex(
                name: "IX_TransactionLogs_RecipientId",
                table: "TransactionLogs");

            migrationBuilder.DropColumn(
                name: "RecipientId",
                table: "TransactionLogs");
        }
    }
}
