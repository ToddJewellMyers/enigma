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
            .Where(c => c.BoardId == boardId && c.Board!.Workspace!.UserId == User.GetUserId())
            .OrderBy(c => c.Position)
            .ToListAsync();
    }

    [HttpPost]
    public async Task<ActionResult<KanbanColumn>> CreateColumn(KanbanColumn column)
    {
        var ownsBoard = await _context.Boards.AnyAsync(board => board.Id == column.BoardId && board.Workspace!.UserId == User.GetUserId());
        if (!ownsBoard) return NotFound();
        _context.KanbanColumns.Add(column);
        await _context.SaveChangesAsync();

        return Ok(column);
    }
}
