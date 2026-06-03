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
            migrationBuilder.AddColumn<string>(
                name: "Code",
                table: "QuoteDescriptions",
                type: "character varying(150)",
                maxLength: 150,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Uom",
                table: "QuoteDescriptions",
                type: "character varying(150)",
                maxLength: 150,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "QuoteDescriptions",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.Sql(
                @"UPDATE ""QuoteDescriptions"" SET ""Code"" = COALESCE(NULLIF(""Value"", ''), 'legacy-' || ""Id""::text);");
            migrationBuilder.Sql(
                @"UPDATE ""QuoteDescriptions"" SET ""Uom"" = COALESCE(""Uom"", '');");
            migrationBuilder.Sql(
                @"UPDATE ""QuoteDescriptions"" SET ""Description"" = COALESCE(""Description"", '');");

            migrationBuilder.AlterColumn<string>(
                name: "Code",
                table: "QuoteDescriptions",
                type: "character varying(150)",
                maxLength: 150,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "character varying(150)",
                oldMaxLength: 150,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Uom",
                table: "QuoteDescriptions",
                type: "character varying(150)",
                maxLength: 150,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "character varying(150)",
                oldMaxLength: 150,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Description",
                table: "QuoteDescriptions",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "character varying(1000)",
                oldMaxLength: 1000,
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_QuoteDescriptions_Code",
                table: "QuoteDescriptions",
                column: "Code",
                unique: true);

            migrationBuilder.DropColumn(
                name: "Value",
                table: "QuoteDescriptions");
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
