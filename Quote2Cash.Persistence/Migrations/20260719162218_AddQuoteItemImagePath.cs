using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Quote2Cash.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddQuoteItemImagePath : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ImagePath",
                table: "QuoteItems",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ImagePath",
                table: "QuoteItems");
        }
    }
}
