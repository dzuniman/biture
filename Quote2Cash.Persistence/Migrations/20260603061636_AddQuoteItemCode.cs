using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Quote2Cash.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddQuoteItemCode : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Code",
                table: "QuoteItems",
                type: "character varying(150)",
                maxLength: 150,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Code",
                table: "QuoteItems");
        }
    }
}
