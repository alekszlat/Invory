using Invory.Db;
using Microsoft.AspNetCore.Authorization;

namespace Invory.AuthHandler
{
    public class SubWorkspaceNormalUserReqierment : IAuthorizationRequirement { }

    public class SubWorkspaceNormalUserCheck : BaseSubWorkspaceAuthorizationHandler<SubWorkspaceMemberOrAdminRequirement>
    {
        public SubWorkspaceNormalUserCheck(IServiceScopeFactory scopeFactory) : base(scopeFactory) { }

        protected override async Task<bool> AuthorizeAsync(AppDbContext dbContext, int userId, int workspaceId, int subWorkspaceId)
        {
            bool isAdmin = await IsWorkspaceAdminAsync(dbContext, userId, workspaceId);
            if (isAdmin)
            {
                return false;
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

