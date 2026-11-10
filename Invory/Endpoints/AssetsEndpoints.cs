using FluentValidation;
using Invory.Db;
using Invory.DTO;
using Invory.HelperClasses;
using Invory.Models.BDModels;
using Invory.Models.enums;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Invory.Endpoints
{
    public static class AssetsEndpoints
    {
        public static void MapAssetsEndpoints(this IEndpointRouteBuilder app)
        {
            // 1. Връща всички активи в регистъра (Само за администратори)
            app.MapGet("/registers/{registerId:int}/assets", async Task<IResult> (
                int registerId, string? name, string? inventoryNumber, string? location,
                int? quantity, string? custodian, DateTime? acquiredOn, string? unit,
                AssetStatus? assetStatus, string? sourceDocument, ClaimsPrincipal user,
                AppDbContext context, bool includeArchived = false, int page=1, int pageSize=20) =>
            {
                if (!int.TryParse(user.FindFirstValue(ClaimTypes.NameIdentifier), out int userId) || userId <= 0)
                {
                    return TypedResults.BadRequest("User ID is invalid or missing.");
                }



                var assetsQuery = context.Assets
                    .AsNoTracking()
                    .Where(a => a.WorkspaceId == registerId);

                var pagedResult = await EndpointsHelperStaticFunctions.GetPagedAssetsAsync(
                    assetsQuery, registerId, name, inventoryNumber, location, quantity,
                    custodian, acquiredOn, unit, assetStatus, sourceDocument,
                    includeArchived, page, pageSize);

                return TypedResults.Ok(pagedResult);

            }).RequireAuthorization("WorkspaceAdminPolicy")
              .WithDescription("Returns EVERY asset from a workspace - ADMIN only");





            // 2. Връща активи от конкретен подрегистър (За членове)
            app.MapGet("/registers/{registerId:int}/subregisters/{subregisterId:int}/assets", async Task<IResult> (
                int registerId, int subregisterId, string? name, string? inventoryNumber, string? location,
                int? quantity, string? custodian, DateTime? acquiredOn, string? unit,
                AssetStatus? assetStatus, string? sourceDocument, ClaimsPrincipal user,
                AppDbContext context, bool includeArchived = false, int page = 1, int pageSize = 20) =>
            {
                if (!int.TryParse(user.FindFirstValue(ClaimTypes.NameIdentifier), out int userId) || userId <= 0)
                {
                    return TypedResults.BadRequest("User ID is invalid or missing.");
                }

                bool workspaceExists = await context.WorkSpaces
                    .AsNoTracking()
                    .AnyAsync(w => w.Id == registerId);

                if (!workspaceExists)
                {
                    return TypedResults.NotFound();
                }

                var assetsQuery = context.Assets
                    .AsNoTracking()
                    .Where(a => a.WorkspaceId == registerId &&
                                a.SubWorkspaceId == subregisterId &&
                                a.SubWorkspace.Users.Any(subWUser => subWUser.Id == userId));


                var pagedResult = await EndpointsHelperStaticFunctions.GetPagedAssetsAsync(
                    assetsQuery, registerId, name, inventoryNumber, location, quantity,
                    custodian, acquiredOn, unit, assetStatus, sourceDocument,
                    includeArchived, page, pageSize);

                
                return TypedResults.Ok(pagedResult);

            }).RequireAuthorization("WorkspaceMemberPolicy")
              .WithDescription("Returns ONLY ASSETS DISTRIBUTED TO THIS SUB_WORKSPACE for NORMAL MEMBERS ONLY ");



            // 3. Създаване на нов асет (Само за администратори)
            app.MapPost("/registers/{registerId:int}/assets", async Task<IResult> (
                int registerId, AppDbContext dbContext, CreateAssetDto createAssetDto,ClaimsPrincipal user, IValidator<CreateAssetDto> validator) =>
            {

                bool workspaceExists = await dbContext.WorkSpaces.AnyAsync(w => w.Id == registerId);
                if (!workspaceExists)
                {
                    return TypedResults.BadRequest("Register doesn't exist");
                }
                var validationResult = await validator.ValidateAsync(createAssetDto);
                if (!validationResult.IsValid)
                {
                
                    return TypedResults.ValidationProblem(validationResult.ToDictionary());
                }

                Asset asset = new Asset
                {
                    Name = createAssetDto.Name,
                    InventoryNumber = createAssetDto.InventoryNumber,
                    Location = createAssetDto.Location,
                    Quantity = createAssetDto.Quantity,
                    Custodian = user.FindFirstValue(ClaimTypes.Name),
                    AcquiredOn = createAssetDto.AcquiredOn,
                    Unit = createAssetDto.Unit,
                    Status = createAssetDto.Status,
                    SourceDocument = createAssetDto.SourceDocument,
                    Version = 1,
                    CreatedAt = DateTime.UtcNow,
                    WorkspaceId = registerId,
                    UpdatedAt = DateTime.UtcNow,
                    ArchivedAt = null
                };
                
                dbContext.Assets.Add(asset);
               await dbContext.SaveChangesAsync();

                var assetDto = await dbContext.Assets
                .AsNoTracking()
                .Where(ass => ass.Id == asset.Id) 
                .Select(ass => new AssetDtoPageDto(
                    Id: ass.Id,
                    RegisterId: registerId,
                    Name: ass.Name,
                    InventoryNumber: ass.InventoryNumber,
                    Location: ass.Location,
                    Custodian: ass.Custodian,
                    AcquiredOn: ass.AcquiredOn,
                    Unit: ass.Unit,
                    Quantity: ass.Quantity,
                    Status: ass.Status.ToString(),
                    SourceDocument: ass.SourceDocument,
                    ArchivedAt: ass.ArchivedAt,
                    Version: ass.Version,
                    CreatedAt: ass.CreatedAt,
                    UpdatedAt: ass.UpdatedAt
                ))
                .FirstOrDefaultAsync();
                return TypedResults.Created($"/registers/{registerId}/assets/{asset.Id}", assetDto);

            }).RequireAuthorization("WorkspaceAdminPolicy")
              .WithDescription("For admins only, to create an asset");


            // 4. Взимане на конкретен асет по ID (С проверка за достъп)
            app.MapGet("/registers/{registerId:int}/assets/{assetId:int}", async Task<IResult> (
                int registerId, int assetId, AppDbContext dbContext, ClaimsPrincipal user) =>
            {
                if (!int.TryParse(user.FindFirstValue(ClaimTypes.NameIdentifier), out int userId) || userId <= 0)
                {
                    return TypedResults.Unauthorized();
                }

                var connection = await dbContext.WorkspaceRoleUserTables
                    .Where(wu => wu.UserId == userId && wu.WorkspaceId == registerId)
                    .FirstOrDefaultAsync();

                if (connection == null)
                {
                    return TypedResults.Unauthorized();
                }

                if (connection.workspaceRole != WorkspaceRole.Admin)
                {
                    var subWp = await dbContext.SubWorkSpaces
                        .Where(sWp => sWp.WorkspaceId == registerId && sWp.Assets.Any(a => a.Id == assetId))
                        .FirstOrDefaultAsync();

                    if (subWp == null)
                    {
                        return TypedResults.NotFound();
                    }

                    bool hasSubAccess = await dbContext.SubWorkspaceRoleUserTables
                        .AnyAsync(sWpMjdTablica => sWpMjdTablica.UserId == userId && sWpMjdTablica.SubWorkSpaceId == subWp.Id);

                    if (!hasSubAccess)
                    {
                        return TypedResults.Unauthorized();
                    }
                }

                var assetDto = await dbContext.Assets
            .AsNoTracking()
            .Where(a => a.Id == assetId && a.WorkspaceId == registerId) 
            .Select(ass => new AssetDtoPageDto(                        
                Id: ass.Id,
                RegisterId: registerId,
                Name: ass.Name,
                InventoryNumber: ass.InventoryNumber,
                Location: ass.Location,
                Custodian: ass.Custodian,
                AcquiredOn: ass.AcquiredOn,
                Unit: ass.Unit,
                Quantity: ass.Quantity,
                Status: ass.Status.ToString(),
                SourceDocument: ass.SourceDocument,
                ArchivedAt: ass.ArchivedAt,
                Version: ass.Version,
                CreatedAt: ass.CreatedAt,
                UpdatedAt: ass.UpdatedAt
            ))
            .FirstOrDefaultAsync();

                if (assetDto == null)
                {
                    return TypedResults.NotFound();
                }

                return TypedResults.Ok(assetDto);

            }).RequireAuthorization()
              .WithDescription("A person has access to an item if is an admin or part of a subworkspace containing the item");


            // 5. Редактиране на асет (PATCH)
            app.MapPatch("/registers/{registerId:int}/assets/{assetId:int}", async Task<IResult> (
                int registerId, int assetId, AppDbContext dbContext, UpdateAssetDto updateAssetDto) =>
            {
                var asset = await dbContext.Assets
                    .FirstOrDefaultAsync(ass => ass.Id == assetId && ass.WorkspaceId == registerId);

                if (asset == null)
                {
                    return TypedResults.NotFound(new { error = "Asset not found" });
                }

                if (updateAssetDto.Name != null) asset.Name = updateAssetDto.Name;
                if (updateAssetDto.InventoryNumber != null) asset.InventoryNumber = updateAssetDto.InventoryNumber;
                if (updateAssetDto.Location != null) asset.Location = updateAssetDto.Location;
                if (updateAssetDto.Quantity.HasValue) asset.Quantity = updateAssetDto.Quantity.Value;
                if (updateAssetDto.Custodian != null) asset.Custodian = updateAssetDto.Custodian;
                if (updateAssetDto.AcquiredOn.HasValue) asset.AcquiredOn = updateAssetDto.AcquiredOn.Value;
                if (updateAssetDto.Unit != null) asset.Unit = updateAssetDto.Unit;
                if (updateAssetDto.Status.HasValue) asset.Status = updateAssetDto.Status.Value;
                if (updateAssetDto.SourceDocument != null) asset.SourceDocument = updateAssetDto.SourceDocument;

                if (updateAssetDto.ExpectedVersion.HasValue && updateAssetDto.ExpectedVersion != asset.Version)
                {
                    return TypedResults.Conflict();
                }

                asset.UpdatedAt = DateTime.UtcNow;
                asset.Version += 1;

                await dbContext.SaveChangesAsync();

                var assetDto = new AssetDtoPageDto(
                Id: asset.Id,
                RegisterId: registerId,
                Name: asset.Name,
                InventoryNumber: asset.InventoryNumber,
                Location: asset.Location,
                Custodian: asset.Custodian,
                AcquiredOn: asset.AcquiredOn,
                Unit: asset.Unit,
                Quantity: asset.Quantity,
                Status: asset.Status.ToString(),
                SourceDocument: asset.SourceDocument,
                ArchivedAt: asset.ArchivedAt,
                Version: asset.Version,
                CreatedAt: asset.CreatedAt,
                UpdatedAt: asset.UpdatedAt
            );

                return TypedResults.Ok(assetDto);

            }).RequireAuthorization("WorkspaceAdminPolicy");



            app.MapDelete("/registers/{registerId:int}/assets/{assetId:int}", async Task<IResult> (
                int registerId, int assetId, AppDbContext dbContext) =>
            {
                var asset = await dbContext.Assets
                    .FirstOrDefaultAsync(ass => ass.Id == assetId && ass.WorkspaceId == registerId);

                if (asset == null)
                {
                    return TypedResults.NotFound();
                }

                asset.Status = AssetStatus.Archived;
                asset.ArchivedAt = DateTime.UtcNow;

                await dbContext.SaveChangesAsync();
                var assetDto = new AssetDtoPageDto(
                    Id: asset.Id,
                    RegisterId: registerId,
                    Name: asset.Name,
                    InventoryNumber: asset.InventoryNumber,
                    Location: asset.Location,
                    Custodian: asset.Custodian,
                    AcquiredOn: asset.AcquiredOn,
                    Unit: asset.Unit,
                    Quantity: asset.Quantity,
                    Status: asset.Status.ToString(),
                    SourceDocument: asset.SourceDocument,
                    ArchivedAt: asset.ArchivedAt,
                    Version: asset.Version,
                    CreatedAt: asset.CreatedAt,
                    UpdatedAt: asset.UpdatedAt
                );

                return TypedResults.Ok(assetDto);


            }).RequireAuthorization("WorkspaceAdminPolicy");


         

        }
    }
}