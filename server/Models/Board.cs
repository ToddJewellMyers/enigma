using System.Text.Json.Serialization;
using System.ComponentModel.DataAnnotations;

namespace server.Models;

public class Board
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid WorkspaceId { get; set; }

    [JsonIgnore]
    public Workspace? Workspace { get; set; }

    [Required(ErrorMessage = "Board name is required.")]
    [StringLength(100, ErrorMessage = "Board name must be 100 characters or fewer.")]
    public string Name { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [JsonIgnore]
    public List<KanbanColumn> Columns { get; set; } = new();
}
