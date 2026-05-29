using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Quote2Cash.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class SyncModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "VendorNumber",
                table: "Quotes");

            migrationBuilder.AlterColumn<string>(
                name: "QuoteNumber",
                table: "Quotes",
                type: "character varying(32)",
                maxLength: 32,
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddColumn<string>(
                name: "VendorNumber",
                table: "Clients",
                type: "character varying(150)",
                maxLength: 150,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "QuoteDescriptions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Value = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuoteDescriptions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "QuoteUoms",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Value = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuoteUoms", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_QuoteDescriptions_Value",
                table: "QuoteDescriptions",
                column: "Value",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_QuoteUoms_Value",
                table: "QuoteUoms",
                column: "Value",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "QuoteDescriptions");

            migrationBuilder.DropTable(
                name: "QuoteUoms");

            migrationBuilder.DropColumn(
                name: "VendorNumber",
                table: "Clients");

            migrationBuilder.AlterColumn<int>(
                name: "QuoteNumber",
                table: "Quotes",
                type: "integer",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(32)",
                oldMaxLength: 32);

            migrationBuilder.AddColumn<string>(
                name: "VendorNumber",
                table: "Quotes",
                type: "character varying(150)",
                maxLength: 150,
                nullable: false,
                defaultValue: "");
        }
    }
}
