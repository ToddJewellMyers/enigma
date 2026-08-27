using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace server.Models;

public class CardAttachment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid KanbanCardId { get; set; }

    [JsonIgnore]
    public KanbanCard KanbanCard { get; set; } = null!;

    [Required, MaxLength(255)]
    public string FileName { get; set; } = string.Empty;

    [Required, MaxLength(50)]
    public string ContentType { get; set; } = string.Empty;

    public int Size { get; set; }

    [JsonIgnore]
    public byte[] Data { get; set; } = [];

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
