using System.ComponentModel.DataAnnotations;

namespace server.Contracts;

public record MoveCardRequest(Guid KanbanColumnId, [Range(1, 100000)] int Position);
public record UpdateCardRequest(
    [Required, StringLength(200)] string Title,
    [StringLength(4000)] string? Description,
    [Required, RegularExpression("^(Low|Normal|High|Urgent)$")] string Priority,
    DateTime? DueDate);
