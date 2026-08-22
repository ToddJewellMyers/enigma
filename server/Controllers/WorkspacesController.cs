using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.Auth;
using server.Contracts;
using server.Data;
using server.Email;
using server.Models;

namespace server.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class WorkspacesController(AppDbContext context, IConfiguration configuration, IEmailSender emailSender) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<WorkspaceResponse>>> GetWorkspaces()
    {
        var userId = User.GetUserId();
        return await context.Workspaces
            .Where(workspace => workspace.UserId == userId || workspace.Members.Any(member => member.UserId == userId))
            .OrderBy(workspace => workspace.CreatedAt)
            .Select(workspace => new WorkspaceResponse(
                workspace.Id, workspace.Name, workspace.CreatedAt,
                workspace.UserId == userId ? WorkspaceRoles.Owner : workspace.Members.Where(member => member.UserId == userId).Select(member => member.Role).First(),
                workspace.Members.Count))
            .ToListAsync();
    }

    [HttpPost]
    public async Task<ActionResult<WorkspaceResponse>> CreateWorkspace(CreateWorkspaceRequest request)
    {
        var userId = User.GetUserId();
        var workspace = new Workspace { Name = request.Name.Trim(), UserId = userId };
        workspace.Members.Add(new WorkspaceMember { WorkspaceId = workspace.Id, UserId = userId, Role = WorkspaceRoles.Owner });
        context.Workspaces.Add(workspace);
        await context.SaveChangesAsync();
        return Ok(new WorkspaceResponse(workspace.Id, workspace.Name, workspace.CreatedAt, WorkspaceRoles.Owner, 1));
    }

    [HttpGet("{workspaceId}/members")]
    public async Task<ActionResult<List<WorkspaceMemberResponse>>> GetMembers(Guid workspaceId)
    {
        var userId = User.GetUserId();
        if (!await WorkspaceAuthorization.CanView(context, workspaceId, userId)) return NotFound();
        return await context.WorkspaceMembers.Where(member => member.WorkspaceId == workspaceId)
            .OrderBy(member => member.JoinedAt)
            .Select(member => new WorkspaceMemberResponse(member.UserId, member.User.Email, member.Role, member.JoinedAt)).ToListAsync();
    }

    [HttpGet("{workspaceId}/invitations")]
    public async Task<ActionResult<List<WorkspaceInvitationResponse>>> GetInvitations(Guid workspaceId)
    {
        var userId = User.GetUserId();
        if (!await WorkspaceAuthorization.IsOwner(context, workspaceId, userId)) return Forbid();
        return await context.WorkspaceInvitations
            .Where(invitation => invitation.WorkspaceId == workspaceId && invitation.ExpiresAt > DateTime.UtcNow)
            .OrderBy(invitation => invitation.CreatedAt)
            .Select(invitation => new WorkspaceInvitationResponse(invitation.Id, invitation.Email, invitation.Role, invitation.ExpiresAt)).ToListAsync();
    }

    [HttpPost("{workspaceId}/invitations")]
    public async Task<ActionResult<WorkspaceInvitationResponse>> InviteMember(Guid workspaceId, InviteWorkspaceMemberRequest request)
    {
        var inviterId = User.GetUserId();
        if (!await WorkspaceAuthorization.IsOwner(context, workspaceId, inviterId)) return Forbid();
        if (!WorkspaceRoles.IsCollaboratorRole(request.Role)) return BadRequest("Role must be Editor or Viewer.");

        var email = request.Email.Trim().ToLowerInvariant();
        var workspace = await context.Workspaces.SingleAsync(item => item.Id == workspaceId);
        var existingUserId = await context.Users.Where(user => user.Email == email).Select(user => (Guid?)user.Id).SingleOrDefaultAsync();
        if (existingUserId is not null && await context.WorkspaceMembers.AnyAsync(member => member.WorkspaceId == workspaceId && member.UserId == existingUserId))
            return Conflict("This person is already a workspace member.");
        var existing = await context.WorkspaceInvitations.SingleOrDefaultAsync(invitation => invitation.WorkspaceId == workspaceId && invitation.Email == email);
        if (existing is not null) context.WorkspaceInvitations.Remove(existing);

        var token = AccountTokenService.CreateToken();
        var invitation = new WorkspaceInvitation
        {
            WorkspaceId = workspaceId, Email = email, Role = request.Role,
            TokenHash = AccountTokenService.HashToken(token), InvitedByUserId = inviterId,
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        };
        context.WorkspaceInvitations.Add(invitation);
        await context.SaveChangesAsync();
        var publicUrl = configuration["PublicAppUrl"]?.TrimEnd('/') ?? throw new InvalidOperationException("PublicAppUrl is missing.");
        var invitationUrl = $"{publicUrl}/?inviteToken={Uri.EscapeDataString(token)}";
        try
        {
            await emailSender.SendWorkspaceInvitationAsync(email, workspace.Name, User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? "A teammate", invitationUrl, request.Role);
        }
        catch
        {
            context.WorkspaceInvitations.Remove(invitation);
            await context.SaveChangesAsync();
            return Problem(statusCode: StatusCodes.Status503ServiceUnavailable, detail: "The invitation email could not be sent. Please try again later.");
        }
        return Ok(new WorkspaceInvitationResponse(invitation.Id, invitation.Email, invitation.Role, invitation.ExpiresAt));
    }

    [HttpPost("invitations/accept")]
    public async Task<ActionResult<WorkspaceResponse>> AcceptInvitation(AcceptWorkspaceInvitationRequest request)
    {
        var userId = User.GetUserId();
        var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
        var hash = AccountTokenService.HashToken(request.Token);
        var invitation = await context.WorkspaceInvitations.Include(item => item.Workspace).SingleOrDefaultAsync(item => item.TokenHash == hash);
        if (invitation is null || invitation.ExpiresAt <= DateTime.UtcNow || !AccountTokenService.Matches(request.Token, invitation.TokenHash))
            return BadRequest("This invitation is invalid or has expired.");
        if (!string.Equals(invitation.Email, email, StringComparison.OrdinalIgnoreCase)) return Forbid();
        if (!await context.WorkspaceMembers.AnyAsync(member => member.WorkspaceId == invitation.WorkspaceId && member.UserId == userId))
            context.WorkspaceMembers.Add(new WorkspaceMember { WorkspaceId = invitation.WorkspaceId, UserId = userId, Role = invitation.Role });
        context.WorkspaceInvitations.Remove(invitation);
        await context.SaveChangesAsync();
        var memberCount = await context.WorkspaceMembers.CountAsync(member => member.WorkspaceId == invitation.WorkspaceId);
        return Ok(new WorkspaceResponse(invitation.WorkspaceId, invitation.Workspace.Name, invitation.Workspace.CreatedAt, invitation.Role, memberCount));
    }

    [HttpPatch("{workspaceId}/members/{memberUserId}")]
    public async Task<IActionResult> UpdateMemberRole(Guid workspaceId, Guid memberUserId, UpdateWorkspaceMemberRoleRequest request)
    {
        var userId = User.GetUserId();
        if (!await WorkspaceAuthorization.IsOwner(context, workspaceId, userId)) return Forbid();
        if (!WorkspaceRoles.IsCollaboratorRole(request.Role)) return BadRequest("Role must be Editor or Viewer.");
        var member = await context.WorkspaceMembers.SingleOrDefaultAsync(item => item.WorkspaceId == workspaceId && item.UserId == memberUserId);
        if (member is null) return NotFound();
        if (member.Role == WorkspaceRoles.Owner) return BadRequest("The workspace owner role cannot be changed.");
        member.Role = request.Role;
        await context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{workspaceId}/members/{memberUserId}")]
    public async Task<IActionResult> RemoveMember(Guid workspaceId, Guid memberUserId)
    {
        var userId = User.GetUserId();
        if (!await WorkspaceAuthorization.IsOwner(context, workspaceId, userId)) return Forbid();
        var member = await context.WorkspaceMembers.SingleOrDefaultAsync(item => item.WorkspaceId == workspaceId && item.UserId == memberUserId);
        if (member is null) return NotFound();
        if (member.Role == WorkspaceRoles.Owner) return BadRequest("The workspace owner cannot be removed.");
        context.WorkspaceMembers.Remove(member);
        await context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{workspaceId}")]
    public async Task<IActionResult> DeleteWorkspace(Guid workspaceId)
    {
        var userId = User.GetUserId();
        if (!await WorkspaceAuthorization.IsOwner(context, workspaceId, userId)) return Forbid();
        var workspace = await context.Workspaces.SingleOrDefaultAsync(item => item.Id == workspaceId);
        if (workspace is null) return NotFound();
        context.Workspaces.Remove(workspace);
        await context.SaveChangesAsync();
        return NoContent();
    }
}
