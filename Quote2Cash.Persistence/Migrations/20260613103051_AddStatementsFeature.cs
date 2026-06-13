using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Quote2Cash.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddStatementsFeature : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Period",
                table: "Statements");

            migrationBuilder.RenameColumn(
                name: "Status",
                table: "Statements",
                newName: "InvoiceNumber");

            migrationBuilder.RenameColumn(
                name: "Balance",
                table: "Statements",
                newName: "PaymentAmount");

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "Statements",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "InvoiceId",
                table: "Statements",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<DateTime>(
                name: "PaymentDate",
                table: "Statements",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.CreateIndex(
                name: "IX_Statements_InvoiceId",
                table: "Statements",
                column: "InvoiceId");

            migrationBuilder.AddForeignKey(
                name: "FK_Statements_Invoices_InvoiceId",
                table: "Statements",
                column: "InvoiceId",
                principalTable: "Invoices",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Statements_Invoices_InvoiceId",
                table: "Statements");

            migrationBuilder.DropIndex(
                name: "IX_Statements_InvoiceId",
                table: "Statements");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "Statements");

            migrationBuilder.DropColumn(
                name: "InvoiceId",
                table: "Statements");

            migrationBuilder.DropColumn(
                name: "PaymentDate",
                table: "Statements");

            migrationBuilder.RenameColumn(
                name: "PaymentAmount",
                table: "Statements",
                newName: "Balance");

            migrationBuilder.RenameColumn(
                name: "InvoiceNumber",
                table: "Statements",
                newName: "Status");

            migrationBuilder.AddColumn<string>(
                name: "Period",
                table: "Statements",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");
        }
    }
}
