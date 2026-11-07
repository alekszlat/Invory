namespace Invory.AuthHandler
{
    using Invory.Db;
    using Microsoft.AspNetCore.Authorization;
    using Microsoft.EntityFrameworkCore;
    using System.Security.Claims;

    public abstract class BaseWorkspaceAuthorizationHandler<TRequirement> : AuthorizationHandler<TRequirement>
        where TRequirement : IAuthorizationRequirement
    {
        protected readonly IServiceScopeFactory ScopeFactory;

        protected BaseWorkspaceAuthorizationHandler(IServiceScopeFactory scopeFactory)
        {
            ScopeFactory = scopeFactory;
        }

        protected override async Task HandleRequirementAsync(AuthorizationHandlerContext context, TRequirement requirement)
        {
            // 1. Проверяваме за валиден HttpContext
            if (context.Resource is not HttpContext httpContext) return;

            // 2. Извличаме ID-то на потребителя
            var userIdString = httpContext.User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdString, out int currentUserId)) return;

            // 3. Извличаме ID-то на уъркспейса/регистъра от руут параметрите
            if (!TryGetWorkspaceId(httpContext, out int workspaceId)) return;

            // 4. Създаваме scope и взимаме DbContext
            using var scope = ScopeFactory.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            // 5. Извикваме конкретната проверка, имплементирана в наследниците
            if (await AuthorizeAsync(dbContext, currentUserId, workspaceId))
            {
                context.Succeed(requirement);
            }
        }

        // Абстрактен метод, който всеки конкретен хендлър ще попълни със своя специфичен заявъчен филтър
        protected abstract Task<bool> AuthorizeAsync(AppDbContext dbContext, int userId, int workspaceId);

        private static bool TryGetWorkspaceId(HttpContext httpContext, out int workspaceId)
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
    }
}

