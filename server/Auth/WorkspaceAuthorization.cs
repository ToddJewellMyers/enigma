using Microsoft.EntityFrameworkCore;
using server.Data;
using server.Models;

namespace server.Auth;

public static class WorkspaceAuthorization
{
    public static Task<bool> CanView(AppDbContext context, Guid workspaceId, Guid userId) =>
        context.Workspaces.AnyAsync(workspace => workspace.Id == workspaceId &&
            (workspace.UserId == userId || workspace.Members.Any(member => member.UserId == userId)));

    public static Task<bool> CanEdit(AppDbContext context, Guid workspaceId, Guid userId) =>
        context.Workspaces.AnyAsync(workspace => workspace.Id == workspaceId &&
            (workspace.UserId == userId || workspace.Members.Any(member => member.UserId == userId &&
                (member.Role == WorkspaceRoles.Owner || member.Role == WorkspaceRoles.Editor))));

    public static Task<bool> IsOwner(AppDbContext context, Guid workspaceId, Guid userId) =>
        context.Workspaces.AnyAsync(workspace => workspace.Id == workspaceId &&
            (workspace.UserId == userId || workspace.Members.Any(member => member.UserId == userId && member.Role == WorkspaceRoles.Owner)));
}
