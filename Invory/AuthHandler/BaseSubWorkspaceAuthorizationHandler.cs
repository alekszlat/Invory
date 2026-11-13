using Invory.Db;
using Invory.Models.enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Invory.AuthHandler
{
    public abstract class BaseSubWorkspaceAuthorizationHandler<TRequirement> : BaseAuthHandler<TRequirement>
       where TRequirement : IAuthorizationRequirement
    {
        protected BaseSubWorkspaceAuthorizationHandler(IServiceScopeFactory scopeFactory) : base(scopeFactory)
        {
        }

        protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, TRequirement requirement)
        {
            if (context.Resource is not HttpContext httpContext) return;

            var userIdString = httpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdString, out int currentUserId)) return;

            if (!TryGetWorkspaceId(httpContext, out int workspaceId)) return;
            if (!TryGetSubWorkspaceId(httpContext, out int subWorkspaceId)) return;

            using var scope = ScopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            if (await AuthorizeAsync(dbContext, currentUserId, workspaceId, subWorkspaceId))
            {
                context.Succeed(requirement);
            }
        }

        private static bool TryGetSubWorkspaceId(HttpContext httpContext, out int subWorkspaceId)
        {
            subWorkspaceId = 0;
            var routeValues = httpContext.Request.RouteValues;

            string key = "subregisterId";
            if (routeValues.TryGetValue(key, out var idObj) && int.TryParse(idObj?.ToString(), out subWorkspaceId))
            {
                return true;
            }

            return false;
        }

        protected static async Task<SubWorkspaceRoles?> GetSubWorkspaceRoleAsync(AppDbContext dbContext, int userId, int subWorkspaceId)
        {
            return await dbContext.SubWorkspaceRoleUserTables
                .Where(sRut => sRut.SubWorkSpaceId == subWorkspaceId && sRut.UserId == userId)
                .Select(sRut => (SubWorkspaceRoles?)sRut.subWorkspaceRole)
                .FirstOrDefaultAsync();
        }
        protected abstract Task<bool> AuthorizeAsync(AppDbContext dbContext, int userId, int workspaceId, int subWorkspaceId);
    }
}