using Invory.Db;
using Microsoft.AspNetCore.Authorization;

namespace Invory.AuthHandler
{

    public class SubWorkspaceContributorOrAdminRequirement : IAuthorizationRequirement { }

    public class SubWorkspaceContributorOrAdminCheck : BaseSubWorkspaceAuthorizationHandler<SubWorkspaceContributorOrAdminRequirement>
    {
        public SubWorkspaceContributorOrAdminCheck(IServiceScopeFactory scopeFactory) : base(scopeFactory)
        {
        }

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
            if (isMember.Value == Models.enums.SubWorkspaceRoles.Contributor) { return true; }

            return false;
        }
    }
}
