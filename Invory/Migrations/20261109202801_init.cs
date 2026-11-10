using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Invory.Migrations
{
    /// <inheritdoc />
    public partial class init : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SubWorkspaceRoleUserTable_SubWorkSpaces_SubWorkSpaceId",
                table: "SubWorkspaceRoleUserTable");

            migrationBuilder.DropForeignKey(
                name: "FK_SubWorkspaceRoleUserTable_User_UserId",
                table: "SubWorkspaceRoleUserTable");

            migrationBuilder.DropPrimaryKey(
                name: "PK_SubWorkspaceRoleUserTable",
                table: "SubWorkspaceRoleUserTable");

            migrationBuilder.RenameTable(
                name: "SubWorkspaceRoleUserTable",
                newName: "SubWorkspaceRoleUserTables");

            migrationBuilder.RenameIndex(
                name: "IX_SubWorkspaceRoleUserTable_SubWorkSpaceId",
                table: "SubWorkspaceRoleUserTables",
                newName: "IX_SubWorkspaceRoleUserTables_SubWorkSpaceId");

            migrationBuilder.AddColumn<string>(
                name: "SubWorkspaceName",
                table: "SubWorkSpaces",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AlterColumn<DateTime>(
                name: "AcquiredOn",
                table: "Assets",
                type: "datetime2",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "subWorkspaceRole",
                table: "SubWorkspaceRoleUserTables",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AddPrimaryKey(
                name: "PK_SubWorkspaceRoleUserTables",
                table: "SubWorkspaceRoleUserTables",
                columns: new[] { "UserId", "SubWorkSpaceId" });

            migrationBuilder.AddForeignKey(
                name: "FK_SubWorkspaceRoleUserTables_SubWorkSpaces_SubWorkSpaceId",
                table: "SubWorkspaceRoleUserTables",
                column: "SubWorkSpaceId",
                principalTable: "SubWorkSpaces",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SubWorkspaceRoleUserTables_User_UserId",
                table: "SubWorkspaceRoleUserTables",
                column: "UserId",
                principalTable: "User",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SubWorkspaceRoleUserTables_SubWorkSpaces_SubWorkSpaceId",
                table: "SubWorkspaceRoleUserTables");

            migrationBuilder.DropForeignKey(
                name: "FK_SubWorkspaceRoleUserTables_User_UserId",
                table: "SubWorkspaceRoleUserTables");

            migrationBuilder.DropPrimaryKey(
                name: "PK_SubWorkspaceRoleUserTables",
                table: "SubWorkspaceRoleUserTables");

            migrationBuilder.DropColumn(
                name: "SubWorkspaceName",
                table: "SubWorkSpaces");

            migrationBuilder.RenameTable(
                name: "SubWorkspaceRoleUserTables",
                newName: "SubWorkspaceRoleUserTable");

            migrationBuilder.RenameIndex(
                name: "IX_SubWorkspaceRoleUserTables_SubWorkSpaceId",
                table: "SubWorkspaceRoleUserTable",
                newName: "IX_SubWorkspaceRoleUserTable_SubWorkSpaceId");

            migrationBuilder.AlterColumn<string>(
                name: "AcquiredOn",
                table: "Assets",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "datetime2",
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "subWorkspaceRole",
                table: "SubWorkspaceRoleUserTable",
                type: "int",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AddPrimaryKey(
                name: "PK_SubWorkspaceRoleUserTable",
                table: "SubWorkspaceRoleUserTable",
                columns: new[] { "UserId", "SubWorkSpaceId" });

            migrationBuilder.AddForeignKey(
                name: "FK_SubWorkspaceRoleUserTable_SubWorkSpaces_SubWorkSpaceId",
                table: "SubWorkspaceRoleUserTable",
                column: "SubWorkSpaceId",
                principalTable: "SubWorkSpaces",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SubWorkspaceRoleUserTable_User_UserId",
                table: "SubWorkspaceRoleUserTable",
                column: "UserId",
                principalTable: "User",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
