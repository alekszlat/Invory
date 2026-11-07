using Invory.Db;
using Invory.Models.enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace Invory.AuthHandler
{

    public class WorkspaceAdminRequirement : IAuthorizationRequirement { }
    public class WorkspaceAdminHandler : BaseWorkspaceAuthorizationHandler<WorkspaceAdminRequirement>
    {
        public WorkspaceAdminHandler(IServiceScopeFactory scopeFactory) : base(scopeFactory) { }

        protected override async Task<bool> AuthorizeAsync(AppDbContext dbContext, int userId, int workspaceId)
        {
            var userRole = await dbContext.WorkspaceRoleUserTables
                .Where(rut => rut.WorkspaceId == workspaceId && rut.UserId == userId)
                .Select(rut => (WorkspaceRole?)rut.workspaceRole).FirstOrDefaultAsync();

            return userRole == WorkspaceRole.Admin;
        }
    }
}
