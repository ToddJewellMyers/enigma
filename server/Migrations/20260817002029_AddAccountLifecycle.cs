using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;
using server.Data;

#nullable disable

namespace server.Migrations;

[DbContext(typeof(AppDbContext))]
[Migration("20260817002029_AddAccountLifecycle")]
public partial class AddAccountLifecycle : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<DateTime>(
            name: "EmailVerifiedAt",
            table: "Users",
            type: "timestamp with time zone",
            nullable: true);
        migrationBuilder.AddColumn<string>(
            name: "EmailVerificationTokenHash",
            table: "Users",
            type: "text",
            nullable: true);
        migrationBuilder.AddColumn<DateTime>(
            name: "EmailVerificationTokenExpiresAt",
            table: "Users",
            type: "timestamp with time zone",
            nullable: true);
        migrationBuilder.AddColumn<string>(
            name: "PasswordResetTokenHash",
            table: "Users",
            type: "text",
            nullable: true);
        migrationBuilder.AddColumn<DateTime>(
            name: "PasswordResetTokenExpiresAt",
            table: "Users",
            type: "timestamp with time zone",
            nullable: true);
        migrationBuilder.AddColumn<Guid>(
            name: "SecurityStamp",
            table: "Users",
            type: "uuid",
            nullable: false,
            defaultValue: Guid.Empty);

        // Existing accounts predate verification and must not be locked out during rollout.
        migrationBuilder.Sql("UPDATE \"Users\" SET \"EmailVerifiedAt\" = NOW(), \"SecurityStamp\" = gen_random_uuid();");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "EmailVerifiedAt", table: "Users");
        migrationBuilder.DropColumn(name: "EmailVerificationTokenHash", table: "Users");
        migrationBuilder.DropColumn(name: "EmailVerificationTokenExpiresAt", table: "Users");
        migrationBuilder.DropColumn(name: "PasswordResetTokenHash", table: "Users");
        migrationBuilder.DropColumn(name: "PasswordResetTokenExpiresAt", table: "Users");
        migrationBuilder.DropColumn(name: "SecurityStamp", table: "Users");
    }
}
