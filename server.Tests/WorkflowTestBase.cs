using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace server.Tests;

public abstract class WorkflowTestBase(KanbanApiFactory factory)
{
    protected KanbanApiFactory Factory { get; } = factory;
    protected static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    protected async Task<HttpClient> CreateAuthenticatedClient(string? email = null)
    {
        var client = Factory.CreateClient();
        email ??= $"test-{Guid.NewGuid()}@example.com";
        var registration = await client.PostAsJsonAsync("/api/auth/register", new { email, password = "TestPassword123!" });
        Assert.Equal(HttpStatusCode.Accepted, registration.StatusCode);
        var token = GetQueryValue(Factory.EmailSender.VerificationUrls[email], "verifyToken");
        var verification = await client.PostAsJsonAsync("/api/auth/verify-email", new { token });
        verification.EnsureSuccessStatusCode();
        var auth = await verification.Content.ReadFromJsonAsync<AuthResponse>(JsonOptions);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth!.Token);
        return client;
    }

    protected static async Task<T> CreateAsync<T>(HttpClient client, string url, object body)
    {
        var response = await client.PostAsJsonAsync(url, body);
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<T>(JsonOptions))!;
    }

    protected static string GetQueryValue(string url, string name)
    {
        var pair = new Uri(url).Query.TrimStart('?').Split('&')
            .Select(item => item.Split('=', 2)).Single(item => item[0] == name);
        return Uri.UnescapeDataString(pair[1]);
    }

    protected record AuthResponse(string Token, string Email);
    protected record WorkspaceDto(Guid Id, string Name, string Role = "Owner", int MemberCount = 1);
    protected record WorkspaceMemberDto(Guid UserId, string Email, string Role, DateTime JoinedAt);
    protected record WorkspaceInvitationDto(Guid Id, string Email, string Role, DateTime ExpiresAt, string? InviteUrl, bool EmailSent);
    protected record BoardDto(Guid Id, Guid WorkspaceId, string Name);
    protected record ColumnDto(Guid Id, Guid BoardId, string Name, int Position);
    protected record CardDto(Guid Id, Guid KanbanColumnId, string Title, int Position, string Priority, Guid? AssigneeUserId = null, string? AssigneeEmail = null, List<CardAttachmentDto>? Attachments = null);
    protected record CardAttachmentDto(Guid Id, Guid KanbanCardId, string FileName, string ContentType, int Size, DateTime CreatedAt);
    protected record AccountExportDto(string Product, List<WorkspaceDto> Workspaces);
}
