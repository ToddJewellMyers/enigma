using System.ComponentModel.DataAnnotations;

namespace server.Contracts;

public record WorkspaceResponse(Guid Id, string Name, DateTime CreatedAt, string Role, int MemberCount);
public record WorkspaceMemberResponse(Guid UserId, string Email, string Role, DateTime JoinedAt);
public record WorkspaceInvitationResponse(
    Guid Id,
    string Email,
    string Role,
    DateTime ExpiresAt,
    string? InviteUrl = null,
    bool EmailSent = true);

public class CreateWorkspaceRequest
{
    [Required, StringLength(100)]
    public string Name { get; set; } = string.Empty;
}

public class InviteWorkspaceMemberRequest
{
    [Required, EmailAddress, StringLength(320)]
    public string Email { get; set; } = string.Empty;
    [Required, StringLength(20)]
    public string Role { get; set; } = string.Empty;
}

public class AcceptWorkspaceInvitationRequest
{
    [Required]
    public string Token { get; set; } = string.Empty;
}

public class UpdateWorkspaceMemberRoleRequest
{
    [Required, StringLength(20)]
    public string Role { get; set; } = string.Empty;
}
