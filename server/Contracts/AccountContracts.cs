using System.ComponentModel.DataAnnotations;

namespace server.Contracts;

public record DeleteAccountRequest([Required, MaxLength(128)] string Password, [Required, MaxLength(20)] string Confirmation);
public record AccountExport(string Product, DateTime ExportedAt, AccountProfile Account, List<WorkspaceExport> Workspaces);
public record AccountProfile(string Email, DateTime CreatedAt, DateTime? EmailVerifiedAt);
public record WorkspaceExport(Guid Id, string Name, DateTime CreatedAt, List<BoardExport> Boards);
public record BoardExport(Guid Id, string Name, DateTime CreatedAt, List<ColumnExport> Columns);
public record ColumnExport(Guid Id, string Name, int Position, DateTime CreatedAt, List<CardExport> Cards);
public record CardExport(Guid Id, string Title, string? Description, int Position, string Priority, DateTime? DueDate, DateTime CreatedAt);
