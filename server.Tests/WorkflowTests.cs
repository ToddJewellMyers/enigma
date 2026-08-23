using System.Net;
using System.Net.Http.Json;
using Xunit;

namespace server.Tests;

public class WorkflowTests(KanbanApiFactory factory) : WorkflowTestBase(factory), IClassFixture<KanbanApiFactory>
{
    [Fact]
    public async Task Registration_creates_clean_production_onboarding_data()
    {
        using var client = await CreateAuthenticatedClient();
        var workspace = Assert.Single((await client.GetFromJsonAsync<List<WorkspaceDto>>("/api/workspaces", JsonOptions))!);
        Assert.Equal("My Workspace", workspace.Name);
        var board = Assert.Single((await client.GetFromJsonAsync<List<BoardDto>>($"/api/boards/{workspace.Id}", JsonOptions))!);
        Assert.Equal("Getting Started", board.Name);
        var columns = (await client.GetFromJsonAsync<List<ColumnDto>>($"/api/columns/{board.Id}", JsonOptions))!;
        Assert.Equal(new[] { "To Do", "In Progress", "Done" }, columns.Select(column => column.Name));
        var cards = new List<CardDto>();
        foreach (var column in columns) cards.AddRange((await client.GetFromJsonAsync<List<CardDto>>($"/api/cards/{column.Id}", JsonOptions))!);
        Assert.Equal(4, cards.Count);
        Assert.DoesNotContain(cards, card => card.Title.Contains("test", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task Workspace_workflow_is_owned_validated_and_deletable()
    {
        using var anonymous = Factory.CreateClient();
        Assert.Equal(HttpStatusCode.Unauthorized, (await anonymous.GetAsync("/api/workspaces")).StatusCode);
        using var client = await CreateAuthenticatedClient();
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync("/api/workspaces", new { name = "" })).StatusCode);
        var created = await CreateAsync<WorkspaceDto>(client, "/api/workspaces", new { name = "Product" });
        Assert.Contains((await client.GetFromJsonAsync<List<WorkspaceDto>>("/api/workspaces", JsonOptions))!, item => item.Id == created.Id);
        Assert.Equal(HttpStatusCode.NoContent, (await client.DeleteAsync($"/api/workspaces/{created.Id}")).StatusCode);
    }

    [Fact]
    public async Task Board_workflow_creates_lists_and_cascade_deletes()
    {
        using var client = await CreateAuthenticatedClient();
        var workspace = await CreateAsync<WorkspaceDto>(client, "/api/workspaces", new { name = "Engineering" });
        var board = await CreateAsync<BoardDto>(client, "/api/boards", new { workspaceId = workspace.Id, name = "Release" });
        await CreateAsync<ColumnDto>(client, "/api/columns", new { boardId = board.Id, name = "Backlog", position = 1 });
        Assert.Equal(HttpStatusCode.NoContent, (await client.DeleteAsync($"/api/boards/{board.Id}")).StatusCode);
        Assert.Empty((await client.GetFromJsonAsync<List<ColumnDto>>($"/api/columns/{board.Id}", JsonOptions))!);
    }

    [Fact]
    public async Task Column_workflow_validates_position_and_preserves_order()
    {
        using var client = await CreateAuthenticatedClient();
        var workspace = await CreateAsync<WorkspaceDto>(client, "/api/workspaces", new { name = "Design" });
        var board = await CreateAsync<BoardDto>(client, "/api/boards", new { workspaceId = workspace.Id, name = "Roadmap" });
        Assert.Equal(HttpStatusCode.BadRequest, (await client.PostAsJsonAsync("/api/columns", new { boardId = board.Id, name = "Invalid", position = 0 })).StatusCode);
        await CreateAsync<ColumnDto>(client, "/api/columns", new { boardId = board.Id, name = "Done", position = 2 });
        await CreateAsync<ColumnDto>(client, "/api/columns", new { boardId = board.Id, name = "Ready", position = 1 });
        var columns = await client.GetFromJsonAsync<List<ColumnDto>>($"/api/columns/{board.Id}", JsonOptions);
        Assert.Equal(new[] { "Ready", "Done" }, columns!.Select(column => column.Name));
        var ready = columns!.Single(column => column.Name == "Ready");
        Assert.Equal(HttpStatusCode.NoContent, (await client.DeleteAsync($"/api/columns/{ready.Id}")).StatusCode);
        columns = await client.GetFromJsonAsync<List<ColumnDto>>($"/api/columns/{board.Id}", JsonOptions);
        var remaining = Assert.Single(columns!);
        Assert.Equal("Done", remaining.Name);
        Assert.Equal(1, remaining.Position);
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
        (await client.PutAsJsonAsync($"/api/cards/{first.Id}", new { title = "First updated", description = "Verified", priority = "Urgent", dueDate = "2026-08-01" })).EnsureSuccessStatusCode();
        (await client.PutAsJsonAsync($"/api/cards/{second.Id}/move", new { kanbanColumnId = done.Id, position = 1 })).EnsureSuccessStatusCode();
        Assert.Equal(HttpStatusCode.NoContent, (await client.DeleteAsync($"/api/cards/{second.Id}")).StatusCode);
        Assert.Empty((await client.GetFromJsonAsync<List<CardDto>>($"/api/cards/{done.Id}", JsonOptions))!);
    }
}
