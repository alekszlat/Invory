using Invory.Db;
using Invory.Models.enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;

namespace Invory.AuthHandler
{
    public abstract class BaseAuthHandler<TRequirement> : AuthorizationHandler<TRequirement>
          where TRequirement : IAuthorizationRequirement
    {
        protected readonly IServiceScopeFactory ScopeFactory;

        protected BaseAuthHandler(IServiceScopeFactory scopeFactory)
        {
            ScopeFactory = scopeFactory;
        }

        protected static bool TryGetWorkspaceId(HttpContext httpContext, out int workspaceId)
        {
            workspaceId = 0;
            var routeValues = httpContext.Request.RouteValues;

            string key = "registerId";
            if (routeValues.TryGetValue(key, out var idObj) && int.TryParse(idObj?.ToString(), out workspaceId))
            {
                return true;
            }

            return false;
        }
        protected static async Task<WorkspaceRole?> GetUserWorkspaceRoleAsync(AppDbContext dbContext, int userId, int workspaceId)
        {
            return await dbContext.WorkspaceRoleUserTables
                .Where(rut => rut.WorkspaceId == workspaceId && rut.UserId == userId)
                .Select(rut => (WorkspaceRole?)rut.workspaceRole)
                .FirstOrDefaultAsync();
        }

        protected static async Task<bool> IsWorkspaceAdminAsync(AppDbContext dbContext, int userId, int workspaceId)
        {
            var role = await GetUserWorkspaceRoleAsync(dbContext, userId, workspaceId);
            return role == WorkspaceRole.Admin;
        }
    }
}