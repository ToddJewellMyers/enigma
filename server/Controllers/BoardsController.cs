using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.Data;
using server.Models;
using Microsoft.AspNetCore.Authorization;
using server.Auth;
using server.Realtime;

namespace server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BoardsController(AppDbContext context, WorkspaceRealtimeNotifier realtime) : ControllerBase
{
    private static readonly string[] DefaultColumnNames = ["Backlog", "Ready", "In Progress", "Testing", "Done"];

    [HttpGet("{workspaceId}")]
    public async Task<ActionResult<List<Board>>> GetBoards(Guid workspaceId)
    {
        return await context.Boards
            .Where(b => b.WorkspaceId == workspaceId && (b.Workspace!.UserId == User.GetUserId() || b.Workspace.Members.Any(member => member.UserId == User.GetUserId())))
            .ToListAsync();
    }

    [HttpPost]
    public async Task<ActionResult<Board>> CreateBoard(Board board, [FromQuery] bool includeDefaultColumns = false)
    {
        if (!await WorkspaceAuthorization.CanEdit(context, board.WorkspaceId, User.GetUserId())) return Forbid();
        context.Boards.Add(board);
        if (includeDefaultColumns)
        {
            for (var index = 0; index < DefaultColumnNames.Length; index++)
            {
                board.Columns.Add(new KanbanColumn
                {
                    Name = DefaultColumnNames[index],
                    Position = index + 1,
                });
            }
        }
        await context.SaveChangesAsync();
        await realtime.NotifyAsync(board.WorkspaceId, "board-created", board.Id, HttpContext.RequestAborted);

        return Ok(board);
    }

    [HttpDelete("{boardId}")]
    public async Task<IActionResult> DeleteBoard(Guid boardId)
    {
        var userId = User.GetUserId();
        var board = await context.Boards.SingleOrDefaultAsync(item => item.Id == boardId);

        if (board is null)
        {
            return NotFound();
        }
        if (!await WorkspaceAuthorization.CanEdit(context, board.WorkspaceId, userId)) return Forbid();

        context.Boards.Remove(board);
        await context.SaveChangesAsync();
        await realtime.NotifyAsync(board.WorkspaceId, "board-deleted", boardId, HttpContext.RequestAborted);

        return NoContent();
    }
}
