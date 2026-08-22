using System.Net;
using System.Net.Http.Json;
using Xunit;

namespace server.Tests;

public class CollaborationTests(KanbanApiFactory factory) : WorkflowTestBase(factory), IClassFixture<KanbanApiFactory>
{
    [Fact]
    public async Task Owner_can_invite_editor_who_can_collaborate_but_not_administer_workspace()
    {
        using var owner = await CreateAuthenticatedClient();
        var workspace = await CreateAsync<WorkspaceDto>(owner, "/api/workspaces", new { name = "StoopidGames Projects" });
        var editorEmail = $"editor-{Guid.NewGuid()}@example.com";

        var invite = await owner.PostAsJsonAsync($"/api/workspaces/{workspace.Id}/invitations", new { email = editorEmail, role = "Editor" });
        invite.EnsureSuccessStatusCode();
        var token = GetQueryValue(Factory.EmailSender.InvitationUrls[editorEmail], "inviteToken");

        using var editor = await CreateAuthenticatedClient(editorEmail);
        var accepted = await editor.PostAsJsonAsync("/api/workspaces/invitations/accept", new { token });
        accepted.EnsureSuccessStatusCode();
        var editorWorkspaces = await editor.GetFromJsonAsync<List<WorkspaceDto>>("/api/workspaces", JsonOptions);
        Assert.Contains(editorWorkspaces!, item => item.Id == workspace.Id && item.Role == "Editor");

        var board = await CreateAsync<BoardDto>(editor, "/api/boards", new { workspaceId = workspace.Id, name = "Game Launch" });
        Assert.Equal(workspace.Id, board.WorkspaceId);
        Assert.Equal(HttpStatusCode.Forbidden, (await editor.DeleteAsync($"/api/workspaces/{workspace.Id}")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await editor.PostAsJsonAsync($"/api/workspaces/{workspace.Id}/invitations", new { email = "other@example.com", role = "Editor" })).StatusCode);

        var members = await owner.GetFromJsonAsync<List<WorkspaceMemberDto>>($"/api/workspaces/{workspace.Id}/members", JsonOptions);
        Assert.Contains(members!, member => member.Email == editorEmail && member.Role == "Editor");
    }

    [Fact]
    public async Task Viewer_is_read_only_until_owner_promotes_them()
    {
        using var owner = await CreateAuthenticatedClient();
        var workspace = await CreateAsync<WorkspaceDto>(owner, "/api/workspaces", new { name = "Art Pipeline" });
        var viewerEmail = $"viewer-{Guid.NewGuid()}@example.com";
        (await owner.PostAsJsonAsync($"/api/workspaces/{workspace.Id}/invitations", new { email = viewerEmail, role = "Viewer" })).EnsureSuccessStatusCode();
        var token = GetQueryValue(Factory.EmailSender.InvitationUrls[viewerEmail], "inviteToken");
        using var viewer = await CreateAuthenticatedClient(viewerEmail);
        (await viewer.PostAsJsonAsync("/api/workspaces/invitations/accept", new { token })).EnsureSuccessStatusCode();

        Assert.Equal(HttpStatusCode.Forbidden, (await viewer.PostAsJsonAsync("/api/boards", new { workspaceId = workspace.Id, name = "Blocked" })).StatusCode);
        var member = Assert.Single((await owner.GetFromJsonAsync<List<WorkspaceMemberDto>>($"/api/workspaces/{workspace.Id}/members", JsonOptions))!, item => item.Email == viewerEmail);
        (await owner.PatchAsJsonAsync($"/api/workspaces/{workspace.Id}/members/{member.UserId}", new { role = "Editor" })).EnsureSuccessStatusCode();
        (await viewer.PostAsJsonAsync("/api/boards", new { workspaceId = workspace.Id, name = "Now editable" })).EnsureSuccessStatusCode();

        Assert.Equal(HttpStatusCode.NoContent, (await owner.DeleteAsync($"/api/workspaces/{workspace.Id}/members/{member.UserId}")).StatusCode);
        Assert.DoesNotContain((await viewer.GetFromJsonAsync<List<WorkspaceDto>>("/api/workspaces", JsonOptions))!, item => item.Id == workspace.Id);
    }
}
