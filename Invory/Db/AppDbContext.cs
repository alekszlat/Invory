using Invory.HelperClasses;
using Invory.Models;
using Invory.Models.BDModels;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Invory.Db
{
    public class AppDbContext : IdentityDbContext<User, IdentityRole<int>, int>
    {
        //public DbSet<PersonBookcs> PersonBookcs { get; set; }

        public DbSet<WorkSpace> WorkSpaces { get; set; }
        public DbSet<SubWorkSpace> SubWorkSpaces { get; set; }
        public DbSet<Asset> Assets { get; set; }
        public DbSet<WorkspaceRoleUserTable> WorkspaceRoleUserTables { get; set; }
        public DbSet<RefreshToken> RefreshTokens { get; set; }
        public DbSet<SubWorkspaceRoleUserTable> SubWorkspaceRoleUserTables { get; set; }
        public DbSet<WorkspaceInvitation> WorkspaceInvitations { get; set; }
        public DbSet<SubWorkspaceInvitation> SubWorkspaceInvitations { get; set; }

        public DbSet<History> WorkspaceHistory { get; set; }
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)


        {


        }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);


            modelBuilder.Entity<User>().ToTable("User");

            //прави го композитен ключ
            modelBuilder.Entity<WorkspaceRoleUserTable>().HasKey(wu => new { wu.UserId, wu.WorkspaceId });


            modelBuilder.Entity<WorkSpace>()
            .HasMany(Workspace => Workspace.Users)
            .WithMany(Users => Users.Workspaces)
            .UsingEntity<WorkspaceRoleUserTable>();

            modelBuilder.Entity<Asset>().HasIndex(a => new { a.WorkspaceId, a.InventoryNumber })
                .IsUnique();
            modelBuilder.Entity<Asset>()
                .Property(ass => ass.Status)
                .HasConversion<string>();




            modelBuilder.Entity<SubWorkspaceRoleUserTable>().HasKey(wu => new { wu.UserId, wu.SubWorkSpaceId });

            modelBuilder.Entity<SubWorkSpace>()
           .HasMany(SubWorkSpace => SubWorkSpace.Users)
           .WithMany(Users => Users.SubWorkSpaces)
           .UsingEntity<SubWorkspaceRoleUserTable>();


            modelBuilder.Entity<SubWorkspaceRoleUserTable>()
           .Property(wu => wu.subWorkspaceRole)
           .HasConversion<string>();


            // Конвертиране на Enum ролята към текст в базата данни 
            modelBuilder.Entity<WorkspaceRoleUserTable>()
                .Property(wu => wu.workspaceRole)
                .HasConversion<string>();


            modelBuilder.Entity<Asset>()
           .HasIndex(a => new { a.WorkspaceId, a.InventoryNumber })
           .IsUnique();


            modelBuilder.Entity<Asset>()
           .Property(asset => asset.Status)
           .HasConversion<string>();

            modelBuilder.Entity<User>(entity =>
            {
                entity.Property(u => u.UserName).HasMaxLength(16);

                entity.HasCheckConstraint("CK_User_UserName_MinLength", "LEN(UserName) >= 6");
            });


            modelBuilder.Entity<WorkspaceInvitation>()
        .HasDiscriminator<string>("InvitationType") 
        .HasValue<WorkspaceInvitation>("WorkspaceInvitation")
        .HasValue<SubWorkspaceInvitation>("SubWorkspaceInvitation");

            modelBuilder.Entity<SubWorkspaceInvitation>().Property(w=>w.InvitedAsRole).HasConversion<string>(); 

        }
    }
}
