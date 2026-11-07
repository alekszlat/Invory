using Invory.Db;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace Invory.AuthHandler
{
    public class WorkspaceMemberRequirement : IAuthorizationRequirement { }

    // Изискване: Потребителят трябва да е Admin или Owner
    public class WorkspaceMemberHandler : BaseWorkspaceAuthorizationHandler<WorkspaceMemberRequirement>
    {
        public WorkspaceMemberHandler(IServiceScopeFactory scopeFactory) : base(scopeFactory) { }

        protected override async Task<bool> AuthorizeAsync(AppDbContext dbContext, int userId, int workspaceId)
        {
            return await dbContext.WorkspaceRoleUserTables.AnyAsync(rut => rut.WorkspaceId == workspaceId && rut.UserId == userId);
        }
    }
}
