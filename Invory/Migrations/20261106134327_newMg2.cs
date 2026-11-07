using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Invory.Migrations
{
    /// <inheritdoc />
    public partial class newMg2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Assets_WorkspaceId",
                table: "Assets");

            migrationBuilder.CreateIndex(
                name: "IX_Assets_WorkspaceId_InventoryNumber",
                table: "Assets",
                columns: new[] { "WorkspaceId", "InventoryNumber" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Assets_WorkspaceId_InventoryNumber",
                table: "Assets");

            migrationBuilder.CreateIndex(
                name: "IX_Assets_WorkspaceId",
                table: "Assets",
                column: "WorkspaceId");
        }
    }
}
