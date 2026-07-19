using System.Text.Json.Serialization;
using System.ComponentModel.DataAnnotations;

namespace server.Models;

public class KanbanColumn
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid BoardId { get; set; }

    [JsonIgnore]
    public Board? Board { get; set; }

    [Required(ErrorMessage = "Column name is required.")]
    [StringLength(100, ErrorMessage = "Column name must be 100 characters or fewer.")]
    public string Name { get; set; } = string.Empty;

    [Range(1, 10000, ErrorMessage = "Column position must be positive.")]
    public int Position { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [JsonIgnore]
    public List<KanbanCard> Cards { get; set; } = new();
}
