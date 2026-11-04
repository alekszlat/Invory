using Invory.Db;
using Invory.DTO;
using Invory.Models.BDModels;
using Invory.Models.HelperClasses;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Org.BouncyCastle.Asn1.Ocsp;
using Org.BouncyCastle.Utilities;
using System.Security.Claims;

namespace Invory.Endpoints
{
    public static class WorkspaceEndpoints
    {

        public static void MapWorkspaceEndpoints(this IEndpointRouteBuilder app)
        {


            app.MapPost("/createWorkspace", async Task <Results<UnauthorizedHttpResult, Created<WorkSpace>>>(ClaimsPrincipal user, UserManager<User> userManager, AppDbContext context,
                CreateWorkspaceDto workspaceDto) =>
            {

                var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                {
                    return TypedResults.Unauthorized();
                }


                WorkSpace workSpace = new WorkSpace();

                workSpace.WorkspaceName = workspaceDto.name;

                WorkspaceRoleUserTable newConenction = new WorkspaceRoleUserTable();

                await context.WorkSpaces.AddAsync(workSpace);
                await context.SaveChangesAsync();


                newConenction.WorkspaceId = workSpace.Id;

                newConenction.UserId = userId;
                
                newConenction.Role = WorkspaceRole.Admin;

                await context.WorkspaceRoleUserTables.AddAsync(newConenction);
                await context.SaveChangesAsync();

                var resourceUrl = $"/workspaces/{workSpace.Id}";

                return TypedResults.Created(resourceUrl, workSpace);
            })

          .RequireAuthorization();


            app.MapGet("/workspaces/{id}", async (int id, AppDbContext context) => {

              var workspace= await context.WorkSpaces.AsNoTracking().Where(workspace => workspace.Id == id).FirstOrDefaultAsync();

                if (workspace == null) {
                    return Results.NotFound();
                }

                return Results.Ok(workspace);
            }
            ).RequireAuthorization().WithDescription("returns a workspace from a specific id");


           


            app.MapGet("/profile", async (ClaimsPrincipal user, UserManager<User> userManager, AppDbContext context) =>
            {
                // 1. Взимаме конкретен клейм по неговия тип (например User ID от "sub" или ClaimTypes.NameIdentifier)
                var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                await context.Users.Where(user => user.Id.ToString() == userId).Include(u => u.Workspaces).FirstOrDefaultAsync();

                





            })
            .RequireAuthorization();



        }
    }

}
