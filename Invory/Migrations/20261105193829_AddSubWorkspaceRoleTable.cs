using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Invory.Migrations
{
    /// <inheritdoc />
    public partial class AddSubWorkspaceRoleTable : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SubWorkSpaceUser");

            migrationBuilder.RenameColumn(
                name: "Role",
                table: "WorkspaceRoleUserTables",
                newName: "workspaceRole");

            migrationBuilder.AlterColumn<string>(
                name: "UserName",
                table: "User",
                type: "nvarchar(16)",
                maxLength: 16,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(256)",
                oldMaxLength: 256,
                oldNullable: true);

            migrationBuilder.CreateTable(
                name: "SubWorkspaceRoleUserTable",
                columns: table => new
                {
                    UserId = table.Column<int>(type: "int", nullable: false),
                    SubWorkSpaceId = table.Column<int>(type: "int", nullable: false),
                    subWorkspaceRole = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SubWorkspaceRoleUserTable", x => new { x.UserId, x.SubWorkSpaceId });
                    table.ForeignKey(
                        name: "FK_SubWorkspaceRoleUserTable_SubWorkSpaces_SubWorkSpaceId",
                        column: x => x.SubWorkSpaceId,
                        principalTable: "SubWorkSpaces",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SubWorkspaceRoleUserTable_User_UserId",
                        column: x => x.UserId,
                        principalTable: "User",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.AddCheckConstraint(
                name: "CK_User_UserName_MinLength",
                table: "User",
                sql: "LEN(UserName) >= 6");

            migrationBuilder.CreateIndex(
                name: "IX_SubWorkspaceRoleUserTable_SubWorkSpaceId",
                table: "SubWorkspaceRoleUserTable",
                column: "SubWorkSpaceId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SubWorkspaceRoleUserTable");

            migrationBuilder.DropCheckConstraint(
                name: "CK_User_UserName_MinLength",
                table: "User");

            migrationBuilder.RenameColumn(
                name: "workspaceRole",
                table: "WorkspaceRoleUserTables",
                newName: "Role");

            migrationBuilder.AlterColumn<string>(
                name: "UserName",
                table: "User",
                type: "nvarchar(256)",
                maxLength: 256,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(16)",
                oldMaxLength: 16,
                oldNullable: true);

            migrationBuilder.CreateTable(
                name: "SubWorkSpaceUser",
                columns: table => new
                {
                    SubWorkSpacesId = table.Column<int>(type: "int", nullable: false),
                    UsersId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SubWorkSpaceUser", x => new { x.SubWorkSpacesId, x.UsersId });
                    table.ForeignKey(
                        name: "FK_SubWorkSpaceUser_SubWorkSpaces_SubWorkSpacesId",
                        column: x => x.SubWorkSpacesId,
                        principalTable: "SubWorkSpaces",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SubWorkSpaceUser_User_UsersId",
                        column: x => x.UsersId,
                        principalTable: "User",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SubWorkSpaceUser_UsersId",
                table: "SubWorkSpaceUser",
                column: "UsersId");
        }
    }
}
