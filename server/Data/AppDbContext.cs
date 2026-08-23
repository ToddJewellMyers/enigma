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
    public DbSet<WorkspaceMember> WorkspaceMembers => Set<WorkspaceMember>();
    public DbSet<WorkspaceInvitation> WorkspaceInvitations => Set<WorkspaceInvitation>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AppUser>().HasIndex(user => user.Email).IsUnique();
        modelBuilder.Entity<WorkspaceMember>().HasKey(member => new { member.WorkspaceId, member.UserId });
        modelBuilder.Entity<WorkspaceMember>().HasIndex(member => member.UserId);
        modelBuilder.Entity<WorkspaceMember>()
            .HasOne(member => member.Workspace).WithMany(workspace => workspace.Members)
            .HasForeignKey(member => member.WorkspaceId).OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<WorkspaceMember>()
            .HasOne(member => member.User).WithMany(user => user.WorkspaceMemberships)
            .HasForeignKey(member => member.UserId).OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<WorkspaceInvitation>().HasIndex(invitation => invitation.TokenHash).IsUnique();
        modelBuilder.Entity<WorkspaceInvitation>().HasIndex(invitation => new { invitation.WorkspaceId, invitation.Email }).IsUnique();
        modelBuilder.Entity<WorkspaceInvitation>()
            .HasOne(invitation => invitation.Workspace).WithMany(workspace => workspace.Invitations)
            .HasForeignKey(invitation => invitation.WorkspaceId).OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<WorkspaceInvitation>()
            .HasOne(invitation => invitation.InvitedByUser).WithMany()
            .HasForeignKey(invitation => invitation.InvitedByUserId).OnDelete(DeleteBehavior.Restrict);
        modelBuilder.Entity<KanbanCard>()
            .HasOne(card => card.Assignee).WithMany()
            .HasForeignKey(card => card.AssigneeUserId).OnDelete(DeleteBehavior.SetNull);
    }
}
