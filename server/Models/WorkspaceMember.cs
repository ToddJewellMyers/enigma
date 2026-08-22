using System.Text.Json.Serialization;

namespace server.Models;

public static class WorkspaceRoles
{
    public const string Owner = "Owner";
    public const string Editor = "Editor";
    public const string Viewer = "Viewer";

    public static bool IsCollaboratorRole(string role) => role is Editor or Viewer;
}

public class WorkspaceMember
{
    public Guid WorkspaceId { get; set; }
    [JsonIgnore]
    public Workspace Workspace { get; set; } = null!;
    public Guid UserId { get; set; }
    [JsonIgnore]
    public AppUser User { get; set; } = null!;
    public string Role { get; set; } = WorkspaceRoles.Viewer;
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
}
