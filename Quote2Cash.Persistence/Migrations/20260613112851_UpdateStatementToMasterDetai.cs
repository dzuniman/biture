using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Quote2Cash.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class UpdateStatementToMasterDetai : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Statements_Clients_ClientId",
                table: "Statements");

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
                name: "PaymentAmount",
                table: "Statements");

            migrationBuilder.DropColumn(
                name: "PaymentDate",
                table: "Statements");

            migrationBuilder.RenameColumn(
                name: "InvoiceNumber",
                table: "Statements",
                newName: "StatementNumber");

            migrationBuilder.AlterColumn<Guid>(
                name: "ClientId",
                table: "Statements",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.CreateTable(
                name: "StatementItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    StatementId = table.Column<Guid>(type: "uuid", nullable: false),
                    InvoiceId = table.Column<Guid>(type: "uuid", nullable: false),
                    PaymentAmount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    PaymentDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StatementItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StatementItems_Invoices_InvoiceId",
                        column: x => x.InvoiceId,
                        principalTable: "Invoices",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_StatementItems_Statements_StatementId",
                        column: x => x.StatementId,
                        principalTable: "Statements",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_StatementItems_InvoiceId",
                table: "StatementItems",
                column: "InvoiceId");

            migrationBuilder.CreateIndex(
                name: "IX_StatementItems_StatementId",
                table: "StatementItems",
                column: "StatementId");

            migrationBuilder.AddForeignKey(
                name: "FK_Statements_Clients_ClientId",
                table: "Statements",
                column: "ClientId",
                principalTable: "Clients",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Statements_Clients_ClientId",
                table: "Statements");

            migrationBuilder.DropTable(
                name: "StatementItems");

            migrationBuilder.RenameColumn(
                name: "StatementNumber",
                table: "Statements",
                newName: "InvoiceNumber");

            migrationBuilder.AlterColumn<Guid>(
                name: "ClientId",
                table: "Statements",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

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

            migrationBuilder.AddColumn<decimal>(
                name: "PaymentAmount",
                table: "Statements",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

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
                name: "FK_Statements_Clients_ClientId",
                table: "Statements",
                column: "ClientId",
                principalTable: "Clients",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Statements_Invoices_InvoiceId",
                table: "Statements",
                column: "InvoiceId",
                principalTable: "Invoices",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
