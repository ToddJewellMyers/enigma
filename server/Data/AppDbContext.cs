using Microsoft.EntityFrameworkCore;
using server.Models;

namespace server.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<Workspace> Workspaces => Set<Workspace>();
    public DbSet<AppUser> Users => Set<AppUser>();
    public DbSet<Board> Boards => Set<Board>();
    public DbSet<KanbanColumn> KanbanColumns => Set<KanbanColumn>();
    public DbSet<KanbanCard> KanbanCards => Set<KanbanCard>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AppUser>().HasIndex(user => user.Email).IsUnique();
    }
}
