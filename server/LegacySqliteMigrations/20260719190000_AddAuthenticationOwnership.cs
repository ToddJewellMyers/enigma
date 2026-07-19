using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using server.Data;

#nullable disable

namespace server.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20260719190000_AddAuthenticationOwnership")]
public class AddAuthenticationOwnership : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "Users",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "TEXT", nullable: false),
                Email = table.Column<string>(type: "TEXT", nullable: false),
                PasswordHash = table.Column<string>(type: "TEXT", nullable: false),
                CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
            },
            constraints: table => table.PrimaryKey("PK_Users", item => item.Id));

        migrationBuilder.AddColumn<Guid>(name: "UserId", table: "Workspaces", type: "TEXT", nullable: true);
        migrationBuilder.CreateIndex(name: "IX_Workspaces_UserId", table: "Workspaces", column: "UserId");
        migrationBuilder.CreateIndex(name: "IX_Users_Email", table: "Users", column: "Email", unique: true);
        migrationBuilder.AddForeignKey(name: "FK_Workspaces_Users_UserId", table: "Workspaces", column: "UserId", principalTable: "Users", principalColumn: "Id", onDelete: ReferentialAction.Cascade);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropForeignKey(name: "FK_Workspaces_Users_UserId", table: "Workspaces");
        migrationBuilder.DropTable(name: "Users");
        migrationBuilder.DropIndex(name: "IX_Workspaces_UserId", table: "Workspaces");
        migrationBuilder.DropColumn(name: "UserId", table: "Workspaces");
    }
}
