using FluentValidation;
using Invory.Db;
using Invory.DTO;
using Invory.HelperClasses;
using Invory.Models.BDModels;
using Invory.Models.enums;
using Invory.Validators;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Org.BouncyCastle.Bcpg;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;

namespace Invory.Endpoints
{
    public static class SubRegistersEndpoints
    {

        public static void MapSubRegistersEndpoints(this IEndpointRouteBuilder app)
        {
            app.MapPost("/registers/{registerId:int}/subregisters", async Task<IResult> (int registerId, AppDbContext dbContext, string name, ClaimsPrincipal userPr) =>
            {

                Int32.TryParse(userPr.FindFirstValue(ClaimTypes.NameIdentifier), out int userId);
                if (name.IsWhiteSpace()) 
                {
                    return TypedResults.BadRequest("SubWorkspace name is required");
                 
                }
                if (name.Count() > 100)
                {
                    return TypedResults.BadRequest("SubWorkspace name must not exceed 100 characters.");
                }
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


                await HistoryHelper.AddHistoryAsync(registerId, "Created a new Sub Workspace", "Created sub-workspace: "+ name, dbContext, userPr);


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
        .RequireAuthorization("WorkspaceMemberPolicy")
        .WithDescription("Returns all subregisters for Workspace Admins, or only the ones the user participates in for Members.");




            app.MapPatch("/registers/{registerId:int}/subregisters/{subregisterId:int}", async Task<IResult> (
                 int registerId,
                 int subregisterId,
                 AppDbContext dbContext,
                 [FromBody] UpdateSubWorkspaceDto dto,IValidator<UpdateSubWorkspaceDto> validator, ClaimsPrincipal userPr
             ) =>
            {

                string description = "";

                var validationResult = await validator.ValidateAsync(dto);
                if (!validationResult.IsValid)
                {
                    return TypedResults.ValidationProblem(validationResult.ToDictionary());
                }
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


                if (!string.IsNullOrWhiteSpace(dto.Name))
                {
                    description += "Changed subWorkspace name from " + subRegister.SubWorkspaceName + " to "+dto.Name+"\n";

                    subRegister.SubWorkspaceName = dto.Name;
                }

                if (dto.AssetIds != null && dto.AssetIds.Any())
                {
                    var assetsToAssign = await dbContext.Assets
                        .Where(ass => dto.AssetIds.Contains(ass.Id) && ass.WorkspaceId == registerId)
                        .ToListAsync();

                    if (assetsToAssign.Count != dto.AssetIds.Count)
                    {
                        return TypedResults.BadRequest("Not all assets belong to this workspace.");
                    }
                    description += "Adding assets with ID's ";

                    foreach (var asset in assetsToAssign)
                    {
                        description += asset.Id + " ";
                        asset.SubWorkspaceId = subregisterId;
                    }

                  
                }

                if (string.IsNullOrWhiteSpace(description))
                {
                    return TypedResults.BadRequest("No valid data provided for update or assignment.");
                }


                await HistoryHelper.AddHistoryAsync(registerId,"Edited a subWorkspace", description, dbContext, userPr);


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
