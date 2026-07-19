using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using server.Data;

#nullable disable

namespace server.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20260719113000_AddColumnCreatedAt")]
public class AddColumnCreatedAt : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<DateTime>(
            name: "CreatedAt",
            table: "KanbanColumns",
            type: "TEXT",
            nullable: false,
            defaultValueSql: "CURRENT_TIMESTAMP");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "CreatedAt",
            table: "KanbanColumns");
    }
}
