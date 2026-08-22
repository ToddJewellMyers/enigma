using System.ComponentModel.DataAnnotations;

namespace server.Models;

public class WorkspaceInvitation
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid WorkspaceId { get; set; }
    public Workspace Workspace { get; set; } = null!;
    [MaxLength(320)]
    public string Email { get; set; } = string.Empty;
    [MaxLength(20)]
    public string Role { get; set; } = WorkspaceRoles.Editor;
    [MaxLength(64)]
    public string TokenHash { get; set; } = string.Empty;
    public Guid InvitedByUserId { get; set; }
    public AppUser InvitedByUser { get; set; } = null!;
    public DateTime ExpiresAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
