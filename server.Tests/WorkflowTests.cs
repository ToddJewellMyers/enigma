using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Xunit;

namespace server.Tests;

public class WorkflowTests : IClassFixture<KanbanApiFactory>
{
    private readonly KanbanApiFactory _factory;
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public WorkflowTests(KanbanApiFactory factory) => _factory = factory;

    private async Task<HttpClient> CreateAuthenticatedClient()
    {
        var client = _factory.CreateClient();
        var email = $"test-{Guid.NewGuid()}@example.com";
        var response = await client.PostAsJsonAsync("/api/auth/register", new { email, password = "TestPassword123!" });
        response.EnsureSuccessStatusCode();
        var auth = await response.Content.ReadFromJsonAsync<AuthResponse>(JsonOptions);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth!.Token);
        return client;
    }

    [Fact]
    public async Task Registration_creates_clean_production_onboarding_data()
    {
        using var client = await CreateAuthenticatedClient();
        var workspaces = await client.GetFromJsonAsync<List<WorkspaceDto>>("/api/workspaces", JsonOptions);
        var workspace = Assert.Single(workspaces!);
        Assert.Equal("My Workspace", workspace.Name);

        var boards = await client.GetFromJsonAsync<List<BoardDto>>($"/api/boards/{workspace.Id}", JsonOptions);
        var board = Assert.Single(boards!);
        Assert.Equal("Getting Started", board.Name);

        var columns = await client.GetFromJsonAsync<List<ColumnDto>>($"/api/columns/{board.Id}", JsonOptions);
        var seededColumns = Assert.IsType<List<ColumnDto>>(columns);
        Assert.Equal(new[] { "To Do", "In Progress", "Done" }, seededColumns.Select(column => column.Name));

        var cards = new List<CardDto>();
        foreach (var column in seededColumns)
            cards.AddRange((await client.GetFromJsonAsync<List<CardDto>>($"/api/cards/{column.Id}", JsonOptions))!);

        Assert.Equal(4, cards.Count);
        Assert.DoesNotContain(cards, card => card.Title.Contains("test", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task Workspace_workflow_is_owned_validated_and_deletable()
    {
        using var anonymous = _factory.CreateClient();
        Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.GetAsync("/api/workspaces")).StatusCode);

        using var client = await CreateAuthenticatedClient();
        var invalid = await client.PostAsJsonAsync("/api/workspaces", new { name = "" });
        Assert.Equal(HttpStatusCode.BadRequest, invalid.StatusCode);

        var created = await CreateAsync<WorkspaceDto>(client, "/api/workspaces", new { name = "Product" });
        var workspaces = await client.GetFromJsonAsync<List<WorkspaceDto>>("/api/workspaces", JsonOptions);
        Assert.Contains(workspaces!, workspace => workspace.Id == created.Id);

        Assert.Equal(HttpStatusCode.NoContent, (await client.DeleteAsync($"/api/workspaces/{created.Id}")).StatusCode);
        workspaces = await client.GetFromJsonAsync<List<WorkspaceDto>>("/api/workspaces", JsonOptions);
        Assert.DoesNotContain(workspaces!, workspace => workspace.Id == created.Id);
    }

    [Fact]
    public async Task Board_workflow_creates_lists_and_cascade_deletes()
    {
        using var client = await CreateAuthenticatedClient();
        var workspace = await CreateAsync<WorkspaceDto>(client, "/api/workspaces", new { name = "Engineering" });
        var board = await CreateAsync<BoardDto>(client, "/api/boards", new { workspaceId = workspace.Id, name = "Release" });
        var column = await CreateAsync<ColumnDto>(client, "/api/columns", new { boardId = board.Id, name = "Backlog", position = 1 });

        var boards = await client.GetFromJsonAsync<List<BoardDto>>($"/api/boards/{workspace.Id}", JsonOptions);
        Assert.Contains(boards!, item => item.Id == board.Id);
        Assert.Equal(HttpStatusCode.NoContent, (await client.DeleteAsync($"/api/boards/{board.Id}")).StatusCode);
        Assert.Empty((await client.GetFromJsonAsync<List<ColumnDto>>($"/api/columns/{board.Id}", JsonOptions))!);
    }

    [Fact]
    public async Task Column_workflow_validates_position_and_preserves_order()
    {
        using var client = await CreateAuthenticatedClient();
        var workspace = await CreateAsync<WorkspaceDto>(client, "/api/workspaces", new { name = "Design" });
        var board = await CreateAsync<BoardDto>(client, "/api/boards", new { workspaceId = workspace.Id, name = "Roadmap" });
        var invalid = await client.PostAsJsonAsync("/api/columns", new { boardId = board.Id, name = "Invalid", position = 0 });
        Assert.Equal(HttpStatusCode.BadRequest, invalid.StatusCode);
        await CreateAsync<ColumnDto>(client, "/api/columns", new { boardId = board.Id, name = "Done", position = 2 });
        await CreateAsync<ColumnDto>(client, "/api/columns", new { boardId = board.Id, name = "Ready", position = 1 });
        var columns = await client.GetFromJsonAsync<List<ColumnDto>>($"/api/columns/{board.Id}", JsonOptions);
        Assert.Equal(new[] { "Ready", "Done" }, columns!.Select(column => column.Name));
    }

    [Fact]
    public async Task Card_workflow_creates_updates_moves_reorders_and_deletes()
    {
        using var client = await CreateAuthenticatedClient();
        var workspace = await CreateAsync<WorkspaceDto>(client, "/api/workspaces", new { name = "Delivery" });
        var board = await CreateAsync<BoardDto>(client, "/api/boards", new { workspaceId = workspace.Id, name = "Sprint" });
        var backlog = await CreateAsync<ColumnDto>(client, "/api/columns", new { boardId = board.Id, name = "Backlog", position = 1 });
        var done = await CreateAsync<ColumnDto>(client, "/api/columns", new { boardId = board.Id, name = "Done", position = 2 });
        var first = await CreateAsync<CardDto>(client, "/api/cards", new { kanbanColumnId = backlog.Id, title = "First", position = 1, priority = "Normal" });
        var second = await CreateAsync<CardDto>(client, "/api/cards", new { kanbanColumnId = backlog.Id, title = "Second", position = 2, priority = "High" });

        var update = await client.PutAsJsonAsync($"/api/cards/{first.Id}", new { title = "First updated", description = "Verified", priority = "Urgent", dueDate = "2026-08-01T00:00:00Z" });
        update.EnsureSuccessStatusCode();
        var move = await client.PutAsJsonAsync($"/api/cards/{second.Id}/move", new { kanbanColumnId = done.Id, position = 1 });
        move.EnsureSuccessStatusCode();

        var backlogCards = await client.GetFromJsonAsync<List<CardDto>>($"/api/cards/{backlog.Id}", JsonOptions);
        var doneCards = await client.GetFromJsonAsync<List<CardDto>>($"/api/cards/{done.Id}", JsonOptions);
        Assert.Equal("First updated", Assert.Single(backlogCards!).Title);
        Assert.Equal(second.Id, Assert.Single(doneCards!).Id);
        Assert.Equal(HttpStatusCode.NoContent, (await client.DeleteAsync($"/api/cards/{second.Id}")).StatusCode);
        Assert.Empty((await client.GetFromJsonAsync<List<CardDto>>($"/api/cards/{done.Id}", JsonOptions))!);
    }

    private static async Task<T> CreateAsync<T>(HttpClient client, string url, object body)
    {
        var response = await client.PostAsJsonAsync(url, body);
        response.EnsureSuccessStatusCode();
        return (await response.Content.ReadFromJsonAsync<T>(JsonOptions))!;
    }

    private record AuthResponse(string Token, string Email);
    private record WorkspaceDto(Guid Id, string Name);
    private record BoardDto(Guid Id, Guid WorkspaceId, string Name);
    private record ColumnDto(Guid Id, Guid BoardId, string Name, int Position);
    private record CardDto(Guid Id, Guid KanbanColumnId, string Title, int Position, string Priority);
}
