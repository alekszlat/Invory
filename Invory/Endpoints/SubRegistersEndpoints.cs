using Invory.Db;
using Invory.DTO;
using Invory.Models.BDModels;
using Invory.Models.enums;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Invory.Endpoints
{
    public static class SubRegistersEndpoints
    {

        public static void MapSubRegistersEndpoints(this IEndpointRouteBuilder app)
        {
            //POST /registers/{registerId}/subregisters
            app.MapPost("/registers/{registerId:int}/subregisters", async Task<IResult> (int registerId, AppDbContext dbContext, string name) =>
            {
                SubWorkSpace subWorkspace = new SubWorkSpace();
                subWorkspace.SubWorkspaceName = name;
                subWorkspace.WorkspaceId = registerId;
                bool nameExists = await dbContext.SubWorkSpaces
                .AnyAsync(sb => sb.SubWorkspaceName == name && sb.WorkspaceId == registerId);

                if (nameExists)
                {
                    return TypedResults.BadRequest("There is already a subWorkspace with the same name.");
                }

                dbContext.SubWorkSpaces.Add(subWorkspace);
                await dbContext.SaveChangesAsync();

                CreatedSubWorkspaceDTO subRegisterDTo = new CreatedSubWorkspaceDTO(subWorkspace.Id, subWorkspace.SubWorkspaceName, registerId);
                return TypedResults.Ok(subRegisterDTo);

            }).RequireAuthorization("WorkspaceAdminPolicy").WithDescription("Create a subRegister -ADMIN ONLY");
            //EditSubWorkspaceDto
            app.MapGet("/registers/{registerId:int}/subregisters", async Task<IResult> (
int registerId,
AppDbContext dbContext,
ClaimsPrincipal userPr
) =>
            {
                if (!int.TryParse(userPr.FindFirstValue(ClaimTypes.NameIdentifier), out int userId) || userId <= 0)
                {
                    return TypedResults.BadRequest("User ID is invalid or missing.");
                }

                bool userExists = await dbContext.Users.AnyAsync(user => user.Id == userId);
                if (!userExists)
                {
                    return TypedResults.BadRequest("User not found.");
                }

                var connection = await dbContext.WorkspaceRoleUserTables
                    .AsNoTracking()
                    .FirstOrDefaultAsync(wp => wp.UserId == userId && wp.WorkspaceId == registerId);

                if (connection == null)
                {
                    return TypedResults.Forbid();
                }

                WorkspaceRole role = connection.workspaceRole;

                var query = dbContext.SubWorkSpaces
                    .AsNoTracking()
                    .Where(sb => sb.WorkspaceId == registerId);

                if (role != WorkspaceRole.Admin)
                {
                    query = query.Where(sb => sb.Users.Any(us => us.Id == userId));
                }

                var result = await query
          .Select(sb => new CreatedSubWorkspaceDto(
                  sb.Id,
                  sb.SubWorkspaceName,
                  sb.WorkspaceId,
                  sb.Assets.Select(a => a.Name).ToList(),      
                  sb.Users.Select(u => u.UserName).ToList()    
              ))
          .ToListAsync();
                return TypedResults.Ok(result);
            })
        .RequireAuthorization()
        .WithDescription("Returns all subregisters for Workspace Admins, or only the ones the user participates in for Members.");



            app.MapPatch("/registers/{registerId:int}/subregisters/{subregisterId:int}", async Task<IResult> (
                 int registerId,
                 int subregisterId,
                 AppDbContext dbContext,
                 [FromBody] UpdateSubWorkspaceDto dto
             ) =>
            {
                if (!string.IsNullOrWhiteSpace(dto.Name))
                {
                    bool nameExists = await dbContext.SubWorkSpaces
                        .AnyAsync(sb => sb.SubWorkspaceName == dto.Name && sb.WorkspaceId == registerId && sb.Id != subregisterId);

                    if (nameExists)
                    {
                        return TypedResults.BadRequest("There is already a subWorkspace with the same name.");
                    }
                }

                var subRegister = await dbContext.SubWorkSpaces
                    .FirstOrDefaultAsync(subW => subW.Id == subregisterId && subW.WorkspaceId == registerId);

                if (subRegister == null)
                {
                    return TypedResults.NotFound("SubWorkspace not found or does not belong to this register.");
                }

                bool hasChanges = false;

               
                
                    subRegister.SubWorkspaceName = dto.Name;
                    hasChanges = true;
                

                if (dto.AssetIds != null && dto.AssetIds.Any())
                {
                    var assetsToAssign = await dbContext.Assets
                        .Where(ass => dto.AssetIds.Contains(ass.Id) && ass.WorkspaceId == registerId)
                        .ToListAsync();

                    if (assetsToAssign.Count != dto.AssetIds.Count)
                    {
                        return TypedResults.BadRequest("Not all assets belong to this workspace.");
                    }

                    foreach (var asset in assetsToAssign)
                    {
                        asset.SubWorkspaceId = subregisterId;
                    }

                    hasChanges = true;
                }

                if (!hasChanges)
                {
                    return TypedResults.BadRequest("No valid data provided for update or assignment.");
                }

                await dbContext.SaveChangesAsync();

                return TypedResults.Ok(new
                {
                    Message = "Sub-workspace updated and assets assigned successfully!"
                });
            }).RequireAuthorization("WorkspaceAdminPolicy")
             .WithDescription("Update sub-register details and/or assign assets - ADMIN ONLY");


        }
    }
}
