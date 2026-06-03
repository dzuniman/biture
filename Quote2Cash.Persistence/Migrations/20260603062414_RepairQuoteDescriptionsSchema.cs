using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Quote2Cash.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class RepairQuoteDescriptionsSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Value",
                table: "QuoteDescriptions");

            migrationBuilder.AddColumn<string>(
                name: "Code",
                table: "QuoteDescriptions",
                type: "character varying(150)",
                maxLength: 150,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Uom",
                table: "QuoteDescriptions",
                type: "character varying(150)",
                maxLength: 150,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "QuoteDescriptions",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_QuoteDescriptions_Code",
                table: "QuoteDescriptions",
                column: "Code",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_QuoteDescriptions_Code",
                table: "QuoteDescriptions");

            migrationBuilder.DropColumn(
                name: "Code",
                table: "QuoteDescriptions");

            migrationBuilder.DropColumn(
                name: "Uom",
                table: "QuoteDescriptions");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "QuoteDescriptions");

            migrationBuilder.AddColumn<string>(
                name: "Value",
                table: "QuoteDescriptions",
                type: "character varying",
                nullable: true);
        }
    }
}
