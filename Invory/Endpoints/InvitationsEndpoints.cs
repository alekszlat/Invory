using Invory.Db;
using Invory.DTO;
using Invory.HelperClasses;
using Invory.Models;
using Invory.Models.BDModels;
using Invory.Models.enums;
using Invory.Token;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Invory.Endpoints
{
    public static class InvitationsEndpoints
    {
        public static void MapInvitationsEndpoints(this IEndpointRouteBuilder app)
        {

            app.MapPost("/registers/{registerId:int}/invitations", async Task<IResult> (
           int registerId,
           TokenProvider tokenProvider,
           AppDbContext dbContext) =>
            {
                var tokenExpDate = tokenProvider.CreateWorkspaceInvitationToken(registerId);

                // Създаваме записа в базата данни
                var invitation = new WorkspaceInvitation
                {
                    WorkspaceId = registerId,
                    Token = tokenExpDate.token,
                    ExpiresAt = tokenExpDate.expirationDate,
                    CreatedAt = DateTime.UtcNow,
                    IsUsed = false
                };

                dbContext.WorkspaceInvitations.Add(invitation);
                await dbContext.SaveChangesAsync();

                var inviteLink = $"http://localhost:5207/api/v1/registers/accept-invite?token={tokenExpDate.token}";
                WorkspaceInvitationResponseDto inviteDto = new WorkspaceInvitationResponseDto(invitation.Id,registerId,inviteLink,tokenExpDate.token,invitation.ExpiresAt);
                return Results.Ok(inviteDto);
            })
       .RequireAuthorization("WorkspaceAdminPolicy")
       .WithDescription("Create an invitation link to a workspace");
       
            //Проверка за Поканата дали е валидна и неизползвана
                   app.MapGet("/registers/accept-invite", async Task<IResult> (
                string token,
                ClaimsPrincipal currentUser,
                AppDbContext dbContext
            ) =>
            {
                var (invitation, errorResult) = await InvitationValidationHelper.ValidateAndGetAsync(dbContext, token);

                if (errorResult != null)
                {
                    return errorResult;
                }


                try
                {
                   
                    var handler = new JwtSecurityTokenHandler();

                    if (!handler.CanReadToken(token))
                    {
                        return TypedResults.BadRequest("Invalid token format.");
                    }

                    var jwtToken = handler.ReadJwtToken(token);

         
                    var workspaceIdClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == "WorkspaceId")?.Value;

                    if (workspaceIdClaim == null)
                    {
                        return TypedResults.BadRequest("Invalid invitation payload.");
                    }

                    int workspaceId = int.Parse(workspaceIdClaim);

                    if (!int.TryParse(currentUser.FindFirstValue(ClaimTypes.NameIdentifier), out int userId) || userId <= 0)
                    {
                        return TypedResults.BadRequest("User ID is invalid or missing.");
                    }


                    bool alreadyInWp = await dbContext.WorkspaceRoleUserTables
                        .AnyAsync(s => s.WorkspaceId == workspaceId && s.UserId == userId);

                    if (alreadyInWp)
                    {
                        return TypedResults.BadRequest("User is already in the workspace!");
                    }

           
                    var workspaceConnection = new WorkspaceRoleUserTable
                    {
                        UserId = userId,
                        WorkspaceId = workspaceId,
                        workspaceRole = WorkspaceRole.Member //автоматично като member
                    };

                    dbContext.WorkspaceRoleUserTables.Add(workspaceConnection);

                    invitation.IsUsed = true;
                    invitation.InvokedAt = DateTime.UtcNow;
                    string username = await dbContext.Users.Where(us => us.Id == userId).Select(us=>us.UserName).FirstOrDefaultAsync();
                    string description= username+" has joined the workspace";

                    await HistoryHelper.AddHistoryAsync(workspaceId, "New User joined workspace", description, dbContext, currentUser);

                    await dbContext.SaveChangesAsync();

                    return Results.Ok(new { Message = "Successfully joined the workspace!" });
                }
                catch (Exception)
                {
                    return TypedResults.BadRequest("Failed to process the invitation token.");
                }
            })
            .RequireAuthorization();



            app.MapGet("/registers/subregister/accept-invite", async Task<IResult> (
      string token,
      ClaimsPrincipal currentUser,
      AppDbContext dbContext
  ) =>
            {
                if (string.IsNullOrWhiteSpace(token))
                {
                    return TypedResults.BadRequest("Token is missing.");
                }

                if (!int.TryParse(currentUser.FindFirstValue(ClaimTypes.NameIdentifier), out int userId) || userId <= 0)
                {
                    return TypedResults.BadRequest("User ID is invalid or missing.");
                }

                var (baseInvitation, errorResult) = await InvitationValidationHelper.ValidateAndGetAsync(dbContext, token);
                if (errorResult != null)
                {
                    return errorResult;
                }

                if (baseInvitation is not SubWorkspaceInvitation invitation)
                {
                    return TypedResults.BadRequest("Invalid invitation type for this endpoint.");
                }

                using var transaction = await dbContext.Database.BeginTransactionAsync();
                try
                {
                    var handler = new JwtSecurityTokenHandler();

                    var errorRes = await InvitationValidationHelper.CanReadInviteToken(handler, token);
                    if (errorRes != null)
                    {
                        return errorRes;
                    }

                    var jwtToken = handler.ReadJwtToken(token);

                    var workspaceIdClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == "WorkspaceId")?.Value;
                    var subWorkspaceIdClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == "SubWorkspaceId")?.Value;
                    var subWorkspaceRoleClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == "WorkspaceRole")?.Value;

                    if (workspaceIdClaim == null || subWorkspaceIdClaim == null || subWorkspaceRoleClaim == null)
                    {
                        return TypedResults.BadRequest("Invalid invitation payload.");
                    }

                    int workspaceId = int.Parse(workspaceIdClaim);
                    int subWorkspaceId = int.Parse(subWorkspaceIdClaim);

                    if (!Enum.TryParse<SubWorkspaceRoles>(subWorkspaceRoleClaim, true, out var role))
                    {
                        role = SubWorkspaceRoles.Viewer;
                    }

                    bool isInWp = await dbContext.WorkspaceRoleUserTables
                        .AnyAsync(s => s.WorkspaceId == workspaceId && s.UserId == userId);

                    string description = "";
                    string username = await dbContext.Users
                        .Where(us => us.Id == userId)
                        .Select(us => us.UserName)
                        .FirstOrDefaultAsync() ?? "User";

                    if (!isInWp)
                    {
                        var workspaceConnection = new WorkspaceRoleUserTable
                        {
                            UserId = userId,
                            WorkspaceId = workspaceId,
                            workspaceRole = WorkspaceRole.Member
                        };
                        dbContext.WorkspaceRoleUserTables.Add(workspaceConnection);
                        description = username + " has joined the workspace and the sub-workspace with role- " + subWorkspaceRoleClaim;
                    }
                    else
                    {
                        description += username + $" has joined the sub-workspace with role- {role}";
                    }

                    bool isInSubWp = await dbContext.SubWorkspaceRoleUserTables
                        .AnyAsync(s => s.SubWorkSpaceId == subWorkspaceId && s.UserId == userId);

                    if (isInSubWp)
                    {
                        return TypedResults.BadRequest("User is already a member of this sub-workspace!");
                    }

                    var subWorkspaceConnection = new SubWorkspaceRoleUserTable
                    {
                        UserId = userId,
                        SubWorkSpaceId = subWorkspaceId,
                        subWorkspaceRole = role
                    };
                    dbContext.SubWorkspaceRoleUserTables.Add(subWorkspaceConnection);

                    invitation.IsUsed = true;
                    invitation.InvokedAt = DateTime.UtcNow;

                    await HistoryHelper.AddHistoryAsync(workspaceId, "New User joined sub-workspace", description, dbContext, currentUser);

                    await dbContext.SaveChangesAsync();

                    await transaction.CommitAsync();

                    return Results.Ok(new { Message = "Successfully joined the sub-workspace!" });
                }
                catch (Exception)
                {
                    await transaction.RollbackAsync();
                    return TypedResults.BadRequest("Failed to process the invitation token.");
                }
            })
  .RequireAuthorization();




            app.MapPost("/registers/{registerId:int}/subregisters/{subregisterId:int}/invitations", async Task<IResult> (
         int registerId,int subregisterId,
         TokenProvider tokenProvider,SubWorkspaceRoles subWorkspaceRole,
         AppDbContext dbContext) =>
            {
                var tokenExpDate = tokenProvider.CreateSubWorkspaceInvitationToken(registerId,subregisterId,subWorkspaceRole);

                var invitation = new Models.SubWorkspaceInvitation
                {
                    WorkspaceId = registerId,
                    Token = tokenExpDate.token,
                    SubWorkspaceId=subregisterId,
                    InvitedAsRole = subWorkspaceRole,
                    ExpiresAt = tokenExpDate.expirationDate,
                    CreatedAt = DateTime.UtcNow,
                    IsUsed = false
                };

                dbContext.SubWorkspaceInvitations.Add(invitation);
                await dbContext.SaveChangesAsync();

                var inviteLink = $"http://localhost:5207/api/v1/registers/subregister/accept-invite?token={tokenExpDate.token}";
                WorkspaceInvitationResponseDto inviteDto = new WorkspaceInvitationResponseDto(invitation.Id, registerId, inviteLink, tokenExpDate.token, invitation.ExpiresAt);
                return Results.Ok(inviteDto);
            })
     .RequireAuthorization("WorkspaceAdminPolicy").WithDescription("Create an invitation link to a sub-workspace");




             app.MapPost("/registers/{registerId:int}/subregisters/{subregisterId:int}/memberships", async Task<IResult> (
             int registerId,
             int subregisterId,
             SubWorkspaceRoles subWorkspaceRole,
             AppDbContext dbContext,
             ClaimsPrincipal currentUser
         ) =>
                {
                 
                    if (!int.TryParse(currentUser.FindFirstValue(ClaimTypes.NameIdentifier), out int userId) || userId <= 0)
                    {
                        return TypedResults.BadRequest("Bad user id");
                    }

                    var r = await dbContext.SubWorkspaceRoleUserTables
                        .Where(suR => suR.UserId == userId && suR.SubWorkSpaceId == subregisterId)
                        .FirstOrDefaultAsync();

                    if (r == null)
                    {
                        return TypedResults.Forbid();
                    }

                    if (r.subWorkspaceRole == subWorkspaceRole)
                    {
                        return TypedResults.BadRequest("User is already role: " + subWorkspaceRole.ToString());
                    }

                    var user = await dbContext.Users
                        .Where(u => u.Id == userId)
                        .FirstOrDefaultAsync();

                    r.subWorkspaceRole = subWorkspaceRole;

                    string username = user?.UserName ?? "User";
                    string description = $"{username} is now role {subWorkspaceRole} in Subworkspace - ID: {subregisterId}";

                    await HistoryHelper.AddHistoryAsync(
                        registerId,
                        "Updated role for subWorkspace",
                        description,
                        dbContext,
                        currentUser
                    );

               
                    await dbContext.SaveChangesAsync();

                    return Results.Ok(new { Message = "Role successfully updated!" });
                })
         .RequireAuthorization("WorkspaceAdminPolicy")
         .WithDescription("Update user role in a sub-workspace");
        }
    }
}
