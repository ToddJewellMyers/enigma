using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace server.Migrations
{
    /// <inheritdoc />
    public partial class AddCardAssignees : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "AssigneeUserId",
                table: "KanbanCards",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_KanbanCards_AssigneeUserId",
                table: "KanbanCards",
                column: "AssigneeUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_KanbanCards_Users_AssigneeUserId",
                table: "KanbanCards",
                column: "AssigneeUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_KanbanCards_Users_AssigneeUserId",
                table: "KanbanCards");

            migrationBuilder.DropIndex(
                name: "IX_KanbanCards_AssigneeUserId",
                table: "KanbanCards");

            migrationBuilder.DropColumn(
                name: "AssigneeUserId",
                table: "KanbanCards");
        }
    }
}
