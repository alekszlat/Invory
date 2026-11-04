using Invory.Db;
using Invory.Models.BDModels;
using Invory.Models.HelperClasses;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Runtime.InteropServices;
using System.Security.Claims;

namespace Invory.Endpoints
{
    public static class AssetsEndpoints
    {

        public static void MapAssetsEndpoints(this IEndpointRouteBuilder app)
        {


            app.MapPost("/workspaces/{workspaceId}/createAsset", async Task<Results<Created<Asset>,NotFound<string>>> (int workspaceId,AppDbContext context) =>
            {

                Asset asset = new Asset();

                WorkSpace wp =await context.WorkSpaces.AsNoTracking().Where(workspace => workspace.Id == workspaceId).FirstOrDefaultAsync();
                if (wp == null)
                {

                    return TypedResults.NotFound("not found");
                }

                asset.WorkspaceId = wp.Id;

                await context.Assets.AddAsync(asset);
                await context.SaveChangesAsync();

                return TypedResults.Created($"/assets/{asset.Id}",asset);
            }
            ).RequireAuthorization().WithDescription("Creates a new asset inside a specific workspace");
        }


    }

}
