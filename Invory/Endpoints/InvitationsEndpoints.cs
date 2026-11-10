using Invory.Db;
using Invory.DTO;
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

                return Results.Ok(invitation);
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
                if (string.IsNullOrWhiteSpace(token))
                {
                    return TypedResults.BadRequest("Token is missing.");
                }

                var invitation = await dbContext.WorkspaceInvitations
                    .FirstOrDefaultAsync(i => i.Token == token);

                if (invitation == null)
                {
                    return TypedResults.NotFound("Invitation link not found or invalid.");
                }

                if (invitation.IsUsed)
                {
                    return TypedResults.BadRequest("This invitation link has already been used.");
                }

                if (invitation.ExpiresAt < DateTime.UtcNow)
                {
                    dbContext.WorkspaceInvitations.Remove(invitation);
                    await dbContext.SaveChangesAsync();

                    return TypedResults.BadRequest("Invitation link has expired.");
                }


                try
                {
                    //проверки дали токена е валиден
                    
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



                    // Проверяваме в правилната таблица (WorkspaceRoleUserTables) дали потребителят вече е в този уъркспейс
                    bool alreadyInWp = await dbContext.WorkspaceRoleUserTables
                        .AnyAsync(s => s.WorkspaceId == workspaceId && s.UserId == userId);

                    if (alreadyInWp)
                    {
                        return TypedResults.BadRequest("User is already in the workspace!");
                    }

                    // Създаваме връзката с фиксирана роля Member
                    var workspaceConnection = new WorkspaceRoleUserTable
                    {
                        UserId = userId,
                        WorkspaceId = workspaceId,
                        workspaceRole = WorkspaceRole.Member //автоматично като member
                    };

                    dbContext.WorkspaceRoleUserTables.Add(workspaceConnection);

                    invitation.IsUsed = true;
                    invitation.InvokedAt = DateTime.UtcNow;

                    await dbContext.SaveChangesAsync();

                    return Results.Ok(new { Message = "Successfully joined the workspace!" });
                }
                catch (Exception)
                {
                    return TypedResults.BadRequest("Failed to process the invitation token.");
                }
            })
            .RequireAuthorization();


        }
    }
}
