using Invory.Db;
using Microsoft.AspNetCore.Authorization;

namespace Invory.AuthHandler
{

    public class SubWorkspaceContributorRequirement : IAuthorizationRequirement { }

    public class SubWorkspaceContributorCheck : BaseSubWorkspaceAuthorizationHandler<SubWorkspaceContributorRequirement>
    {
        public SubWorkspaceContributorCheck(IServiceScopeFactory scopeFactory) : base(scopeFactory)
        {
        }

        protected override async Task<bool> AuthorizeAsync(AppDbContext dbContext, int userId, int workspaceId, int subWorkspaceId)
        {
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
