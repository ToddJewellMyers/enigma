using Microsoft.AspNetCore.SignalR;

namespace server.Realtime;

public sealed record WorkspaceChangedEvent(string Kind, Guid WorkspaceId, Guid? EntityId = null);

public sealed class WorkspaceRealtimeNotifier(IHubContext<WorkspaceHub> hub)
{
    public Task NotifyAsync(Guid workspaceId, string kind, Guid? entityId = null, CancellationToken cancellationToken = default) =>
        hub.Clients.Group(WorkspaceHub.GroupName(workspaceId))
            .SendAsync("WorkspaceChanged", new WorkspaceChangedEvent(kind, workspaceId, entityId), cancellationToken);
}
