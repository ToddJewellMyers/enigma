using System.Text.Json.Serialization;
using System.ComponentModel.DataAnnotations;

namespace server.Models;

public class KanbanCard
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid KanbanColumnId { get; set; }

    [JsonIgnore]
    public KanbanColumn? KanbanColumn { get; set; }

    [Required(ErrorMessage = "Card title is required.")]
    [StringLength(200, ErrorMessage = "Card title must be 200 characters or fewer.")]
    public string Title { get; set; } = string.Empty;

    [StringLength(4000, ErrorMessage = "Card description must be 4000 characters or fewer.")]
    public string? Description { get; set; }

    [Range(1, 100000, ErrorMessage = "Card position must be positive.")]
    public int Position { get; set; }

    [Required]
    [RegularExpression("^(Low|Normal|High|Urgent)$", ErrorMessage = "Priority must be Low, Normal, High, or Urgent.")]
    public string Priority { get; set; } = "Normal";

    public DateTime? DueDate { get; set; }

    public Guid? AssigneeUserId { get; set; }

    [JsonIgnore]
    public AppUser? Assignee { get; set; }

    public string? AssigneeEmail => Assignee?.Email;

    public List<CardAttachment> Attachments { get; set; } = new();

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
