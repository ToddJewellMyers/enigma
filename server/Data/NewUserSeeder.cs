using server.Models;

namespace server.Data;

/// <summary>
/// Creates the production onboarding board for a newly registered account.
/// This seed is scoped to that user and is never applied to an existing account.
/// </summary>
public static class NewUserSeeder
{
    public static Workspace CreateOnboardingWorkspace(AppUser user)
    {
        var workspace = new Workspace
        {
            Name = "My Workspace",
            UserId = user.Id,
            User = user
        };

        var board = new Board
        {
            Name = "Getting Started",
            WorkspaceId = workspace.Id,
            Workspace = workspace
        };

        var toDo = CreateColumn(board, "To Do", 1);
        var inProgress = CreateColumn(board, "In Progress", 2);
        var done = CreateColumn(board, "Done", 3);

        toDo.Cards.Add(CreateCard(
            toDo,
            "Create your first card",
            "Add a task, set its priority, and include a due date when useful.",
            1));
        toDo.Cards.Add(CreateCard(
            toDo,
            "Customize your workflow",
            "Rename this board or create another one for your next project.",
            2));
        inProgress.Cards.Add(CreateCard(
            inProgress,
            "Move cards between columns",
            "Drag cards to keep the board current as work progresses.",
            1));
        done.Cards.Add(CreateCard(
            done,
            "Set up your workspace",
            "This starter board is ready to rename, customize, or delete.",
            1));

        board.Columns.Add(toDo);
        board.Columns.Add(inProgress);
        board.Columns.Add(done);
        workspace.Boards.Add(board);
        return workspace;
    }

    private static KanbanColumn CreateColumn(Board board, string name, int position) => new()
    {
        BoardId = board.Id,
        Board = board,
        Name = name,
        Position = position
    };

    private static KanbanCard CreateCard(
        KanbanColumn column,
        string title,
        string description,
        int position) => new()
    {
        KanbanColumnId = column.Id,
        KanbanColumn = column,
        Title = title,
        Description = description,
        Position = position,
        Priority = "Normal"
    };
}
