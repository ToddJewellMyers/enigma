using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.Data;
using server.Models;
using Microsoft.AspNetCore.Authorization;
using server.Auth;

namespace server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ColumnsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ColumnsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("{boardId}")]
    public async Task<ActionResult<List<KanbanColumn>>> GetColumns(Guid boardId)
    {
        return await _context.KanbanColumns
            .Where(c => c.BoardId == boardId && (c.Board!.Workspace!.UserId == User.GetUserId() || c.Board.Workspace.Members.Any(member => member.UserId == User.GetUserId())))
            .OrderBy(c => c.Position)
            .ToListAsync();
    }

    [HttpPost]
    public async Task<ActionResult<KanbanColumn>> CreateColumn(KanbanColumn column)
    {
        var workspaceId = await _context.Boards.Where(board => board.Id == column.BoardId).Select(board => (Guid?)board.WorkspaceId).SingleOrDefaultAsync();
        if (workspaceId is null) return NotFound();
        if (!await WorkspaceAuthorization.CanEdit(_context, workspaceId.Value, User.GetUserId())) return Forbid();
        _context.KanbanColumns.Add(column);
        await _context.SaveChangesAsync();

        return Ok(column);
    }
}
