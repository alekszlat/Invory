using Invory.Db;
using Invory.Models.enums;
using Invory.Db;
using Invory.Models.enums;
using Microsoft.AspNetCore.Authorization;

namespace Invory.AuthHandler
{
    public class SubWorkspaceMemberOrAdminRequirement : IAuthorizationRequirement { }

    public class SubWorkspaceMemberOrAdminCheck : BaseSubWorkspaceAuthorizationHandler<SubWorkspaceMemberOrAdminRequirement>
    {
        public SubWorkspaceMemberOrAdminCheck(IServiceScopeFactory scopeFactory) : base(scopeFactory) { }

        protected override async Task<bool> AuthorizeAsync(AppDbContext dbContext, int userId, int workspaceId, int subWorkspaceId)
        {
            bool isAdmin = await IsWorkspaceAdminAsync(dbContext, userId, workspaceId);
            if (isAdmin)
            {
                return true;
            }

            var isMember = await GetSubWorkspaceRoleAsync(dbContext, userId, subWorkspaceId);
            if (isMember == null)
            {
                return false;
            }

            return true;
        }
    }
}