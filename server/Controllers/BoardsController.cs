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
public class BoardsController : ControllerBase
{
    private readonly AppDbContext _context;

    public BoardsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("{workspaceId}")]
    public async Task<ActionResult<List<Board>>> GetBoards(Guid workspaceId)
    {
        return await _context.Boards
            .Where(b => b.WorkspaceId == workspaceId && b.Workspace!.UserId == User.GetUserId())
            .ToListAsync();
    }

    [HttpPost]
    public async Task<ActionResult<Board>> CreateBoard(Board board)
    {
        var ownsWorkspace = await _context.Workspaces.AnyAsync(workspace => workspace.Id == board.WorkspaceId && workspace.UserId == User.GetUserId());
        if (!ownsWorkspace) return NotFound();
        _context.Boards.Add(board);
        await _context.SaveChangesAsync();

        return Ok(board);
    }

    [HttpDelete("{boardId}")]
    public async Task<IActionResult> DeleteBoard(Guid boardId)
    {
        var userId = User.GetUserId();
        var board = await _context.Boards.SingleOrDefaultAsync(item => item.Id == boardId && item.Workspace!.UserId == userId);

        if (board is null)
        {
            return NotFound();
        }

        _context.Boards.Remove(board);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
