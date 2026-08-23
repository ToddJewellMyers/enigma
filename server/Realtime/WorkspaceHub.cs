using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using server.Auth;
using server.Data;

namespace server.Realtime;

[Authorize]
public sealed class WorkspaceHub(AppDbContext context) : Hub
{
    public async Task JoinWorkspace(Guid workspaceId)
    {
        if (!await WorkspaceAuthorization.CanView(context, workspaceId, Context.User!.GetUserId()))
            throw new HubException("You do not have access to this workspace.");

        await Groups.AddToGroupAsync(Context.ConnectionId, GroupName(workspaceId));
    }

    public Task LeaveWorkspace(Guid workspaceId) =>
        Groups.RemoveFromGroupAsync(Context.ConnectionId, GroupName(workspaceId));

    internal static string GroupName(Guid workspaceId) => $"workspace:{workspaceId:N}";
}
