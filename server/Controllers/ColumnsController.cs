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
public class ColumnsController(AppDbContext context, WorkspaceRealtimeNotifier realtime) : ControllerBase
{
    [HttpGet("{boardId}")]
    public async Task<ActionResult<List<KanbanColumn>>> GetColumns(Guid boardId)
    {
        return await context.KanbanColumns
            .Where(c => c.BoardId == boardId && (c.Board!.Workspace!.UserId == User.GetUserId() || c.Board.Workspace.Members.Any(member => member.UserId == User.GetUserId())))
            .OrderBy(c => c.Position)
            .ToListAsync();
    }

    [HttpPost]
    public async Task<ActionResult<KanbanColumn>> CreateColumn(KanbanColumn column)
    {
        var workspaceId = await context.Boards.Where(board => board.Id == column.BoardId).Select(board => (Guid?)board.WorkspaceId).SingleOrDefaultAsync();
        if (workspaceId is null) return NotFound();
        if (!await WorkspaceAuthorization.CanEdit(context, workspaceId.Value, User.GetUserId())) return Forbid();
        context.KanbanColumns.Add(column);
        await context.SaveChangesAsync();
        await realtime.NotifyAsync(workspaceId.Value, "column-created", column.Id, HttpContext.RequestAborted);

        return Ok(column);
    }
}
