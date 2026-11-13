using Invory.Db;
using Invory.Models.BDModels;
using Microsoft.EntityFrameworkCore;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace Invory.HelperClasses
{
    public static class InvitationValidationHelper
    {

        public static async Task<(WorkspaceInvitation? Invitation, IResult? ErrorResult)> ValidateAndGetAsync(
            AppDbContext dbContext,
            string token)
        {

            var invitation = await dbContext.WorkspaceInvitations.FirstOrDefaultAsync(i => i.Token == token);

            if (invitation == null)
            {
                return (null, TypedResults.NotFound("Invitation link not found or invalid."));
            }

            if (invitation.IsUsed)
            {
                return (null, TypedResults.BadRequest("This invitation link has already been used."));
            }

            if (invitation.ExpiresAt < DateTime.UtcNow)
            {
                dbContext.WorkspaceInvitations.Remove(invitation);
                await dbContext.SaveChangesAsync();

                return (null, TypedResults.BadRequest("Invitation link has expired."));
            }

            return (invitation, null);
        }

        public static async Task<IResult?> CanReadInviteToken(JwtSecurityTokenHandler handler,
          string token)
            {
            if (!handler.CanReadToken(token))
            {
                return TypedResults.BadRequest("Invalid token format.");
            }
            return null;


        }
        public static IResult? GetWorkspaceIdFromToken(JwtSecurityToken jwtToken, out int workspaceId)
        {
            workspaceId = 0; 
            var workspaceIdClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == "WorkspaceId")?.Value;

            if (workspaceIdClaim == null || !int.TryParse(workspaceIdClaim, out workspaceId))
            {
                return TypedResults.BadRequest("Invalid invitation payload.");
            }

            return null; 
        }

        public static IResult? GetCurrentUserId(ClaimsPrincipal currentUser, out int userId)
        {
            userId = 0; 
            if (!int.TryParse(currentUser.FindFirstValue(ClaimTypes.NameIdentifier), out userId) || userId <= 0)
            {
                return TypedResults.BadRequest("User ID is invalid or missing.");
            }

            return null; // Няма грешка
        }

    }
}