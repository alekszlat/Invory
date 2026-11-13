using Invory.Db;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Invory.AuthHandler
{
    public abstract class BaseWorkspaceAuthorizationHandler<TRequirement> : BaseAuthHandler<TRequirement>
        where TRequirement : IAuthorizationRequirement
    {
        protected BaseWorkspaceAuthorizationHandler(IServiceScopeFactory scopeFactory) : base(scopeFactory)
        {
        }

        protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, TRequirement requirement)
        {
            if (context.Resource is not HttpContext httpContext) return;

            var userIdString = httpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdString, out int currentUserId)) return;

            if (!TryGetWorkspaceId(httpContext, out int workspaceId)) return;

            using var scope = ScopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            // Извикваме метода с правилните 3 параметъра
            if (await AuthorizeAsync(dbContext, currentUserId, workspaceId))
            {
                context.Succeed(requirement);
            }
        }

        protected abstract Task<bool> AuthorizeAsync(AppDbContext dbContext, int userId, int workspaceId);
    }
}