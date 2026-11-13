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





            app.MapGet("/registers/{registerId:int}/subregisters/{subregisterId:int}/assets", async Task<IResult> (
                int registerId, int subregisterId, string? name, string? inventoryNumber, string? location,
                int? quantity, string? custodian, DateTime? acquiredOn, string? unit,
                AssetStatus? assetStatus, string? sourceDocument,
                AppDbContext context, bool includeArchived = false, int page = 1, int pageSize = 20) =>
            {


                var assetsQuery = context.Assets.AsNoTracking()
           .Where(a => a.WorkspaceId == registerId && a.SubWorkspaceId == subregisterId);

                var pagedResult = await EndpointsHelperStaticFunctions.GetPagedAssetsAsync(
                    assetsQuery, registerId, name, inventoryNumber, location, quantity,
                    custodian, acquiredOn, unit, assetStatus, sourceDocument,
                    includeArchived, page, pageSize);


                return TypedResults.Ok(pagedResult);

            })
            .RequireAuthorization("SubWorkspaceMemberOrAdminPolicy") 
            .WithDescription("Returns assets distributed to this sub-workspace - Only if User has access or is ADMIN");
            //SubWorkspaceMemberOrAdminPolicy



            app.MapPost("/registers/{registerId:int}/assets", async Task<IResult> (
                int registerId, AppDbContext dbContext, CreateAssetDto createAssetDto,ClaimsPrincipal user, 
                IValidator<CreateAssetDto> validator) =>
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
                string description = "Asset "+asset.Name+" with Inventory number "+asset.InventoryNumber+" was added";

                await HistoryHelper.AddHistoryAsync(registerId, "Adding a new Asset", description, dbContext, user);


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


 
            app.MapGet("/registers/{registerId:int}/assets/{assetId:int}", async Task<IResult> (
           int registerId, int assetId, AppDbContext dbContext, ClaimsPrincipal user) =>
            {
                if (!int.TryParse(user.FindFirstValue(ClaimTypes.NameIdentifier), out int userId) || userId <= 0)
                {
                    return TypedResults.Unauthorized();
                }

            
                var asset = await dbContext.Assets
                    .AsNoTracking()
                    .Where(a => a.Id == assetId && a.WorkspaceId == registerId)
                    .Select(a => new { a.Id, a.SubWorkspaceId, a.WorkspaceId })
                    .FirstOrDefaultAsync();

                if (asset == null)
                {
                    return TypedResults.NotFound("Asset not found.");
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
      
                    if (asset.SubWorkspaceId == null)
                    {
                        return TypedResults.Unauthorized();
                    }

                    bool hasSubAccess = await dbContext.SubWorkspaceRoleUserTables
                        .AnyAsync(sWpTab => sWpTab.UserId == userId && sWpTab.SubWorkSpaceId == asset.SubWorkspaceId.Value);

                    if (!hasSubAccess)
                    {
                        return TypedResults.Unauthorized();
                    }
                }

       
                var assetDto = await dbContext.Assets
                    .AsNoTracking()
                    .Where(a => a.Id == assetId)
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

                return TypedResults.Ok(assetDto);

            }).RequireAuthorization()
         .WithDescription("A person has access to an item if is an admin or part of the subworkspace containing the item");


            app.MapPatch("/registers/{registerId:int}/assets/{assetId:int}", async Task<IResult> (
                int registerId, int assetId, AppDbContext dbContext, UpdateAssetDto updateAssetDto, IValidator<UpdateAssetDto> validator, ClaimsPrincipal user) =>
            {

                var validationResult = await validator.ValidateAsync(updateAssetDto);
                if (!validationResult.IsValid)
                {
                    return TypedResults.ValidationProblem(validationResult.ToDictionary());
                }

                var asset = await dbContext.Assets
                    .FirstOrDefaultAsync(ass => ass.Id == assetId && ass.WorkspaceId == registerId);

                if (asset == null)
                {
                    return TypedResults.NotFound(new { error = "Asset not found" });
                }

                string description = $"Asset updated ({asset.Name}):\n";

                if (updateAssetDto.Name != null && updateAssetDto.Name != asset.Name)
                {
                    description += $"- Name changed to '{updateAssetDto.Name}'\n";
                    asset.Name = updateAssetDto.Name;
                }

                if (updateAssetDto.InventoryNumber != null && updateAssetDto.InventoryNumber != asset.InventoryNumber)
                {
                    description += $"- Inventory number changed to '{updateAssetDto.InventoryNumber}'\n";
                    asset.InventoryNumber = updateAssetDto.InventoryNumber;
                }

                if (updateAssetDto.Location != null && updateAssetDto.Location != asset.Location)
                {
                    description += $"- Location changed to '{updateAssetDto.Location}'\n";
                    asset.Location = updateAssetDto.Location;
                }

                if (updateAssetDto.Quantity.HasValue && updateAssetDto.Quantity.Value != asset.Quantity)
                {
                    description += $"- Quantity changed to {updateAssetDto.Quantity.Value}\n";
                    asset.Quantity = updateAssetDto.Quantity.Value;
                }

                if (updateAssetDto.Custodian != null && updateAssetDto.Custodian != asset.Custodian)
                {
                    description += $"- Custodian changed to '{updateAssetDto.Custodian}'\n";
                    asset.Custodian = updateAssetDto.Custodian;
                }

                if (updateAssetDto.AcquiredOn.HasValue && updateAssetDto.AcquiredOn.Value != asset.AcquiredOn)
                {
                    description += $"- Acquisition date changed to {updateAssetDto.AcquiredOn.Value:yyyy-MM-dd}\n";
                    asset.AcquiredOn = updateAssetDto.AcquiredOn.Value;
                }

                if (updateAssetDto.Unit != null && updateAssetDto.Unit != asset.Unit)
                {
                    description += $"- Unit changed to '{updateAssetDto.Unit}'\n";
                    asset.Unit = updateAssetDto.Unit;
                }

                if (updateAssetDto.Status.HasValue && updateAssetDto.Status.Value != asset.Status)
                {
                    description += $"- Status changed to {updateAssetDto.Status.Value}\n";
                    asset.Status = updateAssetDto.Status.Value;
                }

                if (updateAssetDto.SourceDocument != null && updateAssetDto.SourceDocument != asset.SourceDocument)
                {
                    description += $"- Source document changed to '{updateAssetDto.SourceDocument}'\n";
                    asset.SourceDocument = updateAssetDto.SourceDocument;
                }

                // Проверка дали реално има промяна преди да записваме в историята
                if (description == $"Asset updated ({asset.Name}):\n")
                {
                    return TypedResults.BadRequest("No changes were provided for update.");
                }

                if (updateAssetDto.ExpectedVersion.HasValue && updateAssetDto.ExpectedVersion != asset.Version)
                {
                    return TypedResults.Conflict();
                }

                if (updateAssetDto.ExpectedVersion.HasValue && updateAssetDto.ExpectedVersion != asset.Version)
                {
                    return TypedResults.Conflict();
                }

                asset.UpdatedAt = DateTime.UtcNow;
                asset.Version += 1;

                await HistoryHelper.AddHistoryAsync(registerId, "Edited a new Asset", description, dbContext, user);


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
                int registerId, int assetId, AppDbContext dbContext, ClaimsPrincipal user) =>
            {
                var asset = await dbContext.Assets
                    .FirstOrDefaultAsync(ass => ass.Id == assetId && ass.WorkspaceId == registerId);

                if (asset == null)
                {
                    return TypedResults.NotFound();
                }

                asset.Status = AssetStatus.Archived;
                asset.ArchivedAt = DateTime.UtcNow;

                string description = "Archived asset with id"+asset.Id+" and name "+asset.Name;
                await HistoryHelper.AddHistoryAsync(registerId, "Аrchived an asset", description, dbContext, user);

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