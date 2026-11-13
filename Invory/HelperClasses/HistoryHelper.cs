using Invory.Db;
using Invory.Models.BDModels;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Invory.HelperClasses
{
    public static class HistoryHelper
    {
    
            public static async Task AddHistoryAsync(
                int workspaceId,
                string title,
                string description,
                AppDbContext dbContext, ClaimsPrincipal userPr)
            {
            if (!int.TryParse(userPr.FindFirstValue(ClaimTypes.NameIdentifier), out int userId) || userId <= 0) ;
          
            var user = await dbContext.Users
                    .AsNoTracking()
                    .FirstOrDefaultAsync(u => u.Id == userId);

                if (user == null) return;

                var history = new History
                {
                    WorkspaceId = workspaceId,
                    Title = title,
                    Description = description,
                    UserId = user.Id,
                    UserUsername = user.UserName,
                    UserEmail = user.Email,
                    At = DateTime.UtcNow
                };

                await dbContext.WorkspaceHistory.AddAsync(history);
            }
        
    }
}
