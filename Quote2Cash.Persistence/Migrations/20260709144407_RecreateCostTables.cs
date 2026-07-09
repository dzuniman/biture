using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Quote2Cash.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RecreateCostTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Costs_Clients_ClientId",
                table: "Costs");

            migrationBuilder.DropForeignKey(
                name: "FK_Costs_JobCards_JobCardId",
                table: "Costs");

            migrationBuilder.DropIndex(
                name: "IX_Costs_ClientId",
                table: "Costs");

            migrationBuilder.DropIndex(
                name: "IX_Costs_JobCardId",
                table: "Costs");

            migrationBuilder.DropColumn(
                name: "Amount",
                table: "Costs");

            migrationBuilder.DropColumn(
                name: "Category",
                table: "Costs");

            migrationBuilder.DropColumn(
                name: "ClientId",
                table: "Costs");

            migrationBuilder.DropColumn(
                name: "JobCardId",
                table: "Costs");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Costs");

            migrationBuilder.RenameColumn(
                name: "IncurredAt",
                table: "Costs",
                newName: "Date");



            migrationBuilder.AddColumn<decimal>(
                name: "Margin",
                table: "Costs",
                type: "numeric(5,2)",
                precision: 5,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.CreateTable(
                name: "CostQuoteItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CostId = table.Column<Guid>(type: "uuid", nullable: false),
                    ItemNumber = table.Column<int>(type: "integer", nullable: false),
                    Quantity = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    Uom = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    UnitPrice = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    SupplierName = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    SupplierDescription = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    SupplierCost = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    OtherName = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    OtherDescription = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    OtherCost = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CostQuoteItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CostQuoteItems_Costs_CostId",
                        column: x => x.CostId,
                        principalTable: "Costs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CostQuoteItems_CostId",
                table: "CostQuoteItems",
                column: "CostId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CostQuoteItems");



            migrationBuilder.DropColumn(
                name: "Margin",
                table: "Costs");

            migrationBuilder.RenameColumn(
                name: "Date",
                table: "Costs",
                newName: "IncurredAt");

            migrationBuilder.AddColumn<decimal>(
                name: "Amount",
                table: "Costs",
                type: "numeric(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "Category",
                table: "Costs",
                type: "character varying(150)",
                maxLength: 150,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<Guid>(
                name: "ClientId",
                table: "Costs",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "JobCardId",
                table: "Costs",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "Costs",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_Costs_ClientId",
                table: "Costs",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_Costs_JobCardId",
                table: "Costs",
                column: "JobCardId");

            migrationBuilder.AddForeignKey(
                name: "FK_Costs_Clients_ClientId",
                table: "Costs",
                column: "ClientId",
                principalTable: "Clients",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Costs_JobCards_JobCardId",
                table: "Costs",
                column: "JobCardId",
                principalTable: "JobCards",
                principalColumn: "Id");
        }
    }
}
