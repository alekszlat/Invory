using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Invory.Migrations
{
    /// <inheritdoc />
    public partial class newMg : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AssetName",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "Мeasurement",
                table: "Assets");

            migrationBuilder.RenameColumn(
                name: "status",
                table: "Assets",
                newName: "Status");

            migrationBuilder.RenameColumn(
                name: "DateOfAcquisition",
                table: "Assets",
                newName: "UpdatedAt");

            migrationBuilder.AlterColumn<string>(
                name: "WorkspaceName",
                table: "WorkSpaces",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "WorkSpaces",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "WorkSpaces",
                type: "nvarchar(300)",
                maxLength: 300,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "WorkSpaces",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AlterColumn<decimal>(
                name: "Quantity",
                table: "Assets",
                type: "decimal(18,2)",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AlterColumn<string>(
                name: "Location",
                table: "Assets",
                type: "nvarchar(120)",
                maxLength: 120,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AddColumn<string>(
                name: "AcquiredOn",
                table: "Assets",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ArchivedAt",
                table: "Assets",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "Assets",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "Custodian",
                table: "Assets",
                type: "nvarchar(120)",
                maxLength: 120,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "InventoryNumber",
                table: "Assets",
                type: "nvarchar(60)",
                maxLength: 60,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Name",
                table: "Assets",
                type: "nvarchar(150)",
                maxLength: 150,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SourceDocument",
                table: "Assets",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Unit",
                table: "Assets",
                type: "nvarchar(12)",
                maxLength: 12,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "Version",
                table: "Assets",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "WorkSpaces");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "WorkSpaces");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "WorkSpaces");

            migrationBuilder.DropColumn(
                name: "AcquiredOn",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "ArchivedAt",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "Custodian",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "InventoryNumber",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "Name",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "SourceDocument",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "Unit",
                table: "Assets");

            migrationBuilder.DropColumn(
                name: "Version",
                table: "Assets");

            migrationBuilder.RenameColumn(
                name: "Status",
                table: "Assets",
                newName: "status");

            migrationBuilder.RenameColumn(
                name: "UpdatedAt",
                table: "Assets",
                newName: "DateOfAcquisition");

            migrationBuilder.AlterColumn<string>(
                name: "WorkspaceName",
                table: "WorkSpaces",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(100)",
                oldMaxLength: 100);

            migrationBuilder.AlterColumn<int>(
                name: "Quantity",
                table: "Assets",
                type: "int",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)");

            migrationBuilder.AlterColumn<string>(
                name: "Location",
                table: "Assets",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(120)",
                oldMaxLength: 120);

            migrationBuilder.AddColumn<string>(
                name: "AssetName",
                table: "Assets",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Мeasurement",
                table: "Assets",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }
    }
}
