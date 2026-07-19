using System.Text.Json.Serialization;
using System.ComponentModel.DataAnnotations;

namespace server.Models;

public class Workspace
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required(ErrorMessage = "Workspace name is required.")]
    [StringLength(100, ErrorMessage = "Workspace name must be 100 characters or fewer.")]
    public string Name { get; set; } = string.Empty;

    public Guid? UserId { get; set; }

    [JsonIgnore]
    public AppUser? User { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [JsonIgnore]
    public List<Board> Boards { get; set; } = new();
}
