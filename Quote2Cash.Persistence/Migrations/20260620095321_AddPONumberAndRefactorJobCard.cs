using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Quote2Cash.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPONumberAndRefactorJobCard : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_JobCards_Clients_ClientId",
                table: "JobCards");

            migrationBuilder.DropIndex(
                name: "IX_JobCards_ClientId",
                table: "JobCards");

            migrationBuilder.DropColumn(
                name: "ClientId",
                table: "JobCards");

            migrationBuilder.DropColumn(
                name: "EndDate",
                table: "JobCards");

            migrationBuilder.DropColumn(
                name: "StartDate",
                table: "JobCards");

            migrationBuilder.DropColumn(
                name: "TotalCost",
                table: "JobCards");

            migrationBuilder.RenameColumn(
                name: "Status",
                table: "JobCards",
                newName: "QuoteNumber");

            migrationBuilder.RenameColumn(
                name: "JobNumber",
                table: "JobCards",
                newName: "JobCardNumber");

            migrationBuilder.AddColumn<string>(
                name: "PONumber",
                table: "Quotes",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "JobCards",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(1000)",
                oldMaxLength: 1000);

            migrationBuilder.AddColumn<string>(
                name: "Reference",
                table: "JobCards",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PONumber",
                table: "Quotes");

            migrationBuilder.DropColumn(
                name: "Reference",
                table: "JobCards");

            migrationBuilder.RenameColumn(
                name: "QuoteNumber",
                table: "JobCards",
                newName: "Status");

            migrationBuilder.RenameColumn(
                name: "JobCardNumber",
                table: "JobCards",
                newName: "JobNumber");

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "JobCards",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(2000)",
                oldMaxLength: 2000);

            migrationBuilder.AddColumn<Guid>(
                name: "ClientId",
                table: "JobCards",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "EndDate",
                table: "JobCards",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "StartDate",
                table: "JobCards",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "TotalCost",
                table: "JobCards",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.CreateIndex(
                name: "IX_JobCards_ClientId",
                table: "JobCards",
                column: "ClientId");

            migrationBuilder.AddForeignKey(
                name: "FK_JobCards_Clients_ClientId",
                table: "JobCards",
                column: "ClientId",
                principalTable: "Clients",
                principalColumn: "Id");
        }
    }
}
