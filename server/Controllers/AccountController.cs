using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.Auth;
using server.Data;
using server.Models;
using server.Contracts;

namespace server.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class AccountController(AppDbContext context) : ControllerBase
{
    private readonly PasswordHasher<AppUser> _passwordHasher = new();

    [HttpGet("export")]
    public async Task<ActionResult<AccountExport>> Export()
    {
        var userId = User.GetUserId();
        var user = await context.Users
            .AsNoTracking()
            .Include(item => item.Workspaces)
                .ThenInclude(workspace => workspace.Boards)
                    .ThenInclude(board => board.Columns)
                        .ThenInclude(column => column.Cards)
            .SingleAsync(item => item.Id == userId);

        var export = new AccountExport(
            "Sweet Mahogany Boards account export",
            DateTime.UtcNow,
            new AccountProfile(user.Email, user.CreatedAt, user.EmailVerifiedAt),
            user.Workspaces
                .OrderBy(workspace => workspace.CreatedAt)
                .Select(workspace => new WorkspaceExport(
                    workspace.Id,
                    workspace.Name,
                    workspace.CreatedAt,
                    workspace.Boards.OrderBy(board => board.CreatedAt).Select(board => new BoardExport(
                        board.Id,
                        board.Name,
                        board.CreatedAt,
                        board.Columns.OrderBy(column => column.Position).Select(column => new ColumnExport(
                            column.Id,
                            column.Name,
                            column.Position,
                            column.CreatedAt,
                            column.Cards.OrderBy(card => card.Position).Select(card => new CardExport(
                                card.Id,
                                card.Title,
                                card.Description,
                                card.Position,
                                card.Priority,
                                card.DueDate,
                                card.CreatedAt)).ToList())).ToList())).ToList())).ToList());

        Response.Headers.ContentDisposition = $"attachment; filename=\"sweet-mahogany-boards-export-{DateTime.UtcNow:yyyy-MM-dd}.json\"";
        return Ok(export);
    }

    [HttpDelete]
    public async Task<IActionResult> Delete(DeleteAccountRequest request)
    {
        var user = await context.Users.SingleAsync(item => item.Id == User.GetUserId());
        if (_passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password) == PasswordVerificationResult.Failed)
            return BadRequest("The password is incorrect.");
        if (!string.Equals(request.Confirmation, "DELETE", StringComparison.Ordinal))
            return BadRequest("Type DELETE to confirm permanent account deletion.");

        var workspaces = await context.Workspaces.Where(workspace => workspace.UserId == user.Id).ToListAsync();
        context.Workspaces.RemoveRange(workspaces);
        context.Users.Remove(user);
        await context.SaveChangesAsync();
        return NoContent();
    }
}
