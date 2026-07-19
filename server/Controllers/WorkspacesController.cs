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
public class WorkspacesController : ControllerBase
{
    private readonly AppDbContext _context;

    public WorkspacesController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<List<Workspace>>> GetWorkspaces()
    {
        return await _context.Workspaces
            .Where(workspace => workspace.UserId == User.GetUserId())
            .ToListAsync();
    }

    [HttpPost]
    public async Task<ActionResult<Workspace>> CreateWorkspace(Workspace workspace)
    {
        workspace.UserId = User.GetUserId();
        _context.Workspaces.Add(workspace);
        await _context.SaveChangesAsync();

        return Ok(workspace);
    }

    [HttpDelete("{workspaceId}")]
    public async Task<IActionResult> DeleteWorkspace(Guid workspaceId)
    {
        var userId = User.GetUserId();
        var workspace = await _context.Workspaces.SingleOrDefaultAsync(item => item.Id == workspaceId && item.UserId == userId);

        if (workspace is null)
        {
            return NotFound();
        }

        _context.Workspaces.Remove(workspace);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
