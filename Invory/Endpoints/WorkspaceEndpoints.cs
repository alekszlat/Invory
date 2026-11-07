using Invory.Db;
using Invory.DTO;
using Invory.HelperClasses;
using Invory.Models.BDModels;
using Invory.Models.enums;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query.Internal;
using Microsoft.Win32;
using System.Security.Claims;

namespace Invory.Endpoints
{
    public static class WorkspaceEndpoints
    {
        public static void MapWorkspaceEndpoints(this IEndpointRouteBuilder app)
        {
            // 1. Взимане на детайли за конкретен регистър (Изисква да си член)
            app.MapGet("/registers/{registerId:int}", async Task<Results<NotFound, Ok<WorkspacePageDto>>> (
                int registerId,
                AppDbContext dbContext,
                ClaimsPrincipal user) =>
            {
                var currentUserId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);

                var workspace = await dbContext.WorkSpaces
           .AsSplitQuery()
           .Include(w => w.WorkspaceRUTable)
               .ThenInclude(rut => rut.User)
           .Include(w => w.Assets)
           .Include(w => w.SubWorkSpaces)
               .ThenInclude(sw => sw.Users)
           .FirstOrDefaultAsync(w => w.Id == registerId);

                if (workspace == null)
                {
                    return TypedResults.NotFound();
                }


                WorkspaceRoleUserTable adminUserTB = workspace.WorkspaceRUTable
                 .Where(rut => rut.workspaceRole == WorkspaceRole.Admin).FirstOrDefault();

                User AdminUser = adminUserTB.User;


                WorkspaceRoleUserTable currentUserTB = workspace.WorkspaceRUTable
              .Where(rut => rut.UserId == currentUserId).FirstOrDefault();


                var dto = new WorkspacePageDto(
                    Id: workspace.Id,
                    name: workspace.WorkspaceName,
                    description: workspace.Description,
                    ownerId: AdminUser.Id,
                    owner: new UserDto(AdminUser.Id, AdminUser.UserName, AdminUser.Email),
                    role: currentUserTB.workspaceRole.ToString(),
                    assetCount: workspace.Assets.Count(ass => ass.Status != AssetStatus.Archived),
                    createdAt: workspace.CreatedAt,
                    updatedAt: workspace.UpdatedAt
                );

                return TypedResults.Ok(dto);
            })
            .RequireAuthorization("WorkspaceMemberPolicy"); // Само членове на уъркспейса




            // 2. Списък с регистри на текущия потребител (Остава стандартна аутентикация, тъй като няма registerId в руута)
            app.MapGet("/registers", async Task<Results<NotFound, Ok<PagedResultDto<WorkspaceMainPage>>>> (
                AppDbContext dbContext,
                ClaimsPrincipal user,
                int page = 1,
                int pageSize = 20) =>
            {
                var userIdString = user.FindFirstValue(ClaimTypes.NameIdentifier);
                if (!int.TryParse(userIdString, out int currentUserId))
                {
                    return TypedResults.NotFound();
                }


                var baseQuery = dbContext.WorkSpaces
                 .AsNoTracking()
                 .Where(w => w.WorkspaceRUTable.Any(rut => rut.UserId == currentUserId));

                int totalItems = await baseQuery.CountAsync();
                int totalPages;
                int skip;
                var meta = PaginationCalculator.CalculateMeta(totalItems, out totalPages, out skip, page, pageSize);

                var items = await baseQuery
                    .OrderByDescending(wp => wp.CreatedAt)
                    .Skip(skip)
                    .Take(pageSize)
                    .Select(wp => new WorkspaceMainPage(
                        Id: wp.Id,
                        name: wp.WorkspaceName,
                        description: wp.Description,
                        role: wp.WorkspaceRUTable.Where(rut => rut.UserId == currentUserId).Select(rut => rut.workspaceRole).FirstOrDefault().ToString(),
                        createdAt: wp.CreatedAt,
                        updatedAt: wp.UpdatedAt
                    ))
                    .ToListAsync();


                var pagedResult = new PagedResultDto<WorkspaceMainPage>(
                    Items: items,
                    Pagination: meta
                );

                return TypedResults.Ok(pagedResult);
            })
            .RequireAuthorization();

            // 3. Създаване на нов Workspace (Всеки автентикуван потребител може да създаде)
            app.MapPost("/registers", async Task<Results<UnauthorizedHttpResult, Created<WorkspaceDto>>> (
                ClaimsPrincipal user,
                AppDbContext context,
                CreateWorkspaceDto workspaceDto) =>
            {
                var userIdClaim = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                {
                    return TypedResults.Unauthorized();
                }

                var workSpace = new WorkSpace
                {
                    WorkspaceName = workspaceDto.name,
                    Description = workspaceDto.description
                };

                await context.WorkSpaces.AddAsync(workSpace);
                await context.SaveChangesAsync();

                var newConnection = new WorkspaceRoleUserTable
                {
                    WorkspaceId = workSpace.Id,
                    UserId = userId,
                    workspaceRole = WorkspaceRole.Admin // Създателят автоматично става Admin/Owner
                };

                await context.WorkspaceRoleUserTables.AddAsync(newConnection);
                await context.SaveChangesAsync();

                var resourceUrl = $"/registers/{workSpace.Id}";

                WorkspaceDto wpDtoRead = new WorkspaceDto(workSpace.WorkspaceName, workSpace.Description);
                return TypedResults.Created(resourceUrl, wpDtoRead);


            })
            .RequireAuthorization();

            /*
            app.MapGet("/registers/{registerId}", async (int registerId, AppDbContext context) =>
            {
                var workspace = await context.WorkSpaces
                    .AsNoTracking()
                    .Where(w => w.Id == registerId)
                    .FirstOrDefaultAsync();

                if (workspace == null)
                {
                    return Results.NotFound();
                }

                return Results.Ok(workspace);
            })
            .RequireAuthorization("WorkspaceMemberPolicy")
            .WithDescription("Returns a workspace from a specific id");
            */

            // 5. Редакция на регистър (Изисква Admin)
            app.MapPatch("/registers/{registerId:int}", async Task<Results<NotFound, BadRequest<string>, Ok<WorkspaceMainPage>>> (
                int registerId,
                UpdateRegisterDto dto,
                AppDbContext dbContext,
                ClaimsPrincipal user) =>
            {
                var workspace = await dbContext.WorkSpaces
                    .Include(w => w.WorkspaceRUTable)
                    .FirstOrDefaultAsync(w => w.Id == registerId);

                if (workspace == null)
                {
                    return TypedResults.NotFound();
                }

                // Частична актуализация (PATCH)
                if (!string.IsNullOrWhiteSpace(dto.WorkspaceName))
                {
                    workspace.WorkspaceName = dto.WorkspaceName;
                }

                if (dto.Description != null)
                {
                    workspace.Description = dto.Description;
                }

                workspace.UpdatedAt = DateTime.UtcNow;
                await dbContext.SaveChangesAsync();



                var updatedRecord = new WorkspaceMainPage(
                    Id: workspace.Id,
                    name: workspace.WorkspaceName,
                    description: workspace.Description,
                    role: WorkspaceRole.Admin.ToString(),
                    createdAt: workspace.CreatedAt,
                    updatedAt: workspace.UpdatedAt
                );

                return TypedResults.Ok(updatedRecord);
            })
            .RequireAuthorization("WorkspaceAdminPolicy");



            app.MapGet("/profile", async (ClaimsPrincipal user, UserManager<User> userManager, AppDbContext context) =>
            {
                var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var currentUser = await context.Users
                    .Where(u => u.Id.ToString() == userId)
                    .Include(u => u.Workspaces)
                    .FirstOrDefaultAsync();

                if (currentUser == null) return Results.NotFound();

                return Results.Ok(currentUser);
            })
            .RequireAuthorization();




            app.MapGet("/registers/{registerId:int}/assets", async Task<IResult> (int registerId, string? name, string? inventoryNumber, string? location,
           int? quantity,
           string? custodian,
           DateTime? acquiredOn,
           string? unit,
           AssetStatus? assetStatus,
           string? sourceDocument,
           ClaimsPrincipal user,
           AppDbContext context,
           bool includeArchived = false,
           int page = 1,
           int pageSize = 20
                 ) =>
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
                    .Where(a => a.WorkspaceId == registerId);


                if (!string.IsNullOrEmpty(name))
                    assetsQuery = assetsQuery.Where(a => a.Name.Contains(name));

                if (!string.IsNullOrEmpty(inventoryNumber))
                    assetsQuery = assetsQuery.Where(a => a.InventoryNumber.Contains(inventoryNumber));

                if (!string.IsNullOrEmpty(location))
                    assetsQuery = assetsQuery.Where(a => a.Location.Contains(location));

                if (quantity.HasValue)
                    assetsQuery = assetsQuery.Where(a => a.Quantity == quantity.Value);

                if (!string.IsNullOrEmpty(custodian))
                    assetsQuery = assetsQuery.Where(a => a.Custodian != null && a.Custodian.Contains(custodian));

                if (acquiredOn.HasValue)
                {
                    var targetDate = acquiredOn.Value.Date;
                    assetsQuery = assetsQuery.Where(a => a.AcquiredOn.HasValue && a.AcquiredOn.Value.Date == targetDate);
                }

                if (!string.IsNullOrEmpty(unit))
                    assetsQuery = assetsQuery.Where(a => a.Unit != null && a.Unit.Contains(unit));

                if (assetStatus.HasValue)
                    assetsQuery = assetsQuery.Where(a => a.Status == assetStatus.Value);

                if (!string.IsNullOrEmpty(sourceDocument))
                    assetsQuery = assetsQuery.Where(a => a.SourceDocument != null && a.SourceDocument.Contains(sourceDocument));

                if (!includeArchived)
                {
                    assetsQuery = assetsQuery.Where(a => a.ArchivedAt == null);
                }


                int totalItems = await assetsQuery.CountAsync();


                PaginationMetaDto meta = PaginationCalculator.CalculateMeta(
                    totalItems,
                    out int totalPages,
                    out int skip,
                    page,
                    pageSize
                );


                var items = await assetsQuery
                    .Skip(skip)
                    .Take(meta.PageSize)
                    .Select(ass => new AssetDtoPageDto(
                        ass.Id,
                        registerId,
                        ass.Name,
                        ass.InventoryNumber,
                        ass.Location,
                        ass.Custodian,
                        ass.AcquiredOn,
                        ass.Unit,
                        ass.Quantity,
                        ass.Status.ToString(),
                        ass.SourceDocument,
                        ass.ArchivedAt,
                        ass.Version,
                        ass.CreatedAt,
                        ass.UpdatedAt
                    ))
                    .ToListAsync();

                // 9. Опаковаме ги в крайното DTO и връщаме 200 OK
                var pagedResult = new PagedResultDto<AssetDtoPageDto>(
                    Items: items,
                    Pagination: meta
                );

                return TypedResults.Ok(pagedResult);

            }).RequireAuthorization("WorkspaceAdminPolicy");



            app.MapPost("/registers/{registerId:int}/assets", async Task<IResult> (int registerId, AppDbContext dbContext, CreateAssetDto createAssetDto) =>
            {

                var query = dbContext.Assets.Where(asset => asset.WorkspaceId == registerId);

                if (query == null)
                {
                    return TypedResults.BadRequest("Register doesnt exist");
                }

                Asset asset = new Asset
                {
                    Name = createAssetDto.Name,
                    InventoryNumber = createAssetDto.InventoryNumber,
                    Location = createAssetDto.Location,
                    Quantity = createAssetDto.Quantity,
                    Custodian = createAssetDto.Custodian,
                    AcquiredOn = createAssetDto.AcquiredOn,
                    Unit = string.IsNullOrEmpty(createAssetDto.Unit) ? "бр." : createAssetDto.Unit,
                    Status = createAssetDto.Status ?? AssetStatus.Active,
                    SourceDocument = createAssetDto.SourceDocument,
                    Version = 1, //starts from 1
                    CreatedAt = DateTime.UtcNow,
                    WorkspaceId = registerId,
                    UpdatedAt = DateTime.UtcNow,
                    ArchivedAt = null
                };

                dbContext.Assets.Add(asset);
                await dbContext.SaveChangesAsync();
                return TypedResults.Created($"/registers/{registerId}/assets/{asset.Id}", asset);

            }).RequireAuthorization("WorkspaceAdminPolicy");



            //GET /registers/{registerId}/assets/{assetId}

         app.MapGet("/registers/{registerId:int}/assets/{assetId:int}", async Task<IResult>
         (int registerId, int assetId, AppDbContext dbContext, ClaimsPrincipal user) =>
            {
                int userId;
                if (!Int32.TryParse(user.FindFirstValue(ClaimTypes.NameIdentifier), out userId))
                {
                    return TypedResults.Unauthorized(); // Добавено return
                }

                var connection = await dbContext.WorkspaceRoleUserTables
                    .Where(wu => wu.UserId == userId && wu.WorkspaceId == registerId)
                    .FirstOrDefaultAsync();

                // Защита срещу NullReferenceException, ако потребителят изобщо няма запис тук
                if (connection == null)
                {
                    return TypedResults.Unauthorized();
                }
                   //Има право до ендпойнта ако е админ или участва в subworkspace, който и потребител участва
                if (!(connection.workspaceRole == WorkspaceRole.Admin))
                {
                    //Ако не е админ,взимаме sub Workspace-а ,който съдържа asset-а, който търсим, ако има такъв asset
                    var subWp = await dbContext.SubWorkSpaces
                        .Where(sWp => sWp.WorkspaceId == registerId && sWp.Assets.Any(a => a.Id == assetId))
                        .FirstOrDefaultAsync();

                    if (subWp == null)
                    {
                        return TypedResults.NotFound();
                    }

                    //чрез  таблица проверяваме ако потребителя има достъп до него
                    bool hasSubAccess = await dbContext.SubWorkspaceRoleUserTables
                        .AnyAsync(sWpMjdTablica => sWpMjdTablica.UserId == userId && sWpMjdTablica.SubWorkSpaceId == subWp.Id);

                    if (!hasSubAccess)
                    {
                        return TypedResults.Unauthorized();
                    }
                }

                var asset = await dbContext.Assets
                    .AsNoTracking()
                    .FirstOrDefaultAsync(a => a.Id == assetId && a.WorkspaceId == registerId);

                if (asset == null)
                {
                    return TypedResults.NotFound();
                }

                return TypedResults.Ok(asset);
            }).RequireAuthorization();

            //PATCH /registers/{registerId}/assets/{assetId}
            //UpdateAssetDto

            app.MapPatch("/registers/{registerId:int}/assets/{assetId:int}", async Task<IResult>
     (int registerId, int assetId, AppDbContext dbContext, UpdateAssetDto updateAssetDto) =>
            {
                // 1. Взимаме актива асинхронно (с await!)
                var asset = await dbContext.Assets
                    .FirstOrDefaultAsync(ass => ass.Id == assetId && ass.WorkspaceId == registerId);

                if (asset == null)
                {
                    return TypedResults.NotFound(new { error = "Asset not found" });
                }

                // 2. Присвояваме полетата само ако са подадени (не са null)
                if (updateAssetDto.Name != null)
                {
                    asset.Name = updateAssetDto.Name;
                }

                if (updateAssetDto.InventoryNumber != null)
                {
                    asset.InventoryNumber = updateAssetDto.InventoryNumber;
                }

                if (updateAssetDto.Location != null)
                {
                    asset.Location = updateAssetDto.Location;
                }

                if (updateAssetDto.Quantity.HasValue)
                {
                    asset.Quantity = updateAssetDto.Quantity.Value;
                }

                if (updateAssetDto.Custodian != null)
                {
                    asset.Custodian = updateAssetDto.Custodian;
                }

                if (updateAssetDto.AcquiredOn.HasValue)
                {
                    asset.AcquiredOn = updateAssetDto.AcquiredOn.Value;
                }

                if (updateAssetDto.Unit != null)
                {
                    asset.Unit = updateAssetDto.Unit;
                }

                if (updateAssetDto.Status.HasValue)
                {
                    asset.Status = updateAssetDto.Status.Value;
                }

                if (updateAssetDto.SourceDocument != null)
                {
                    asset.SourceDocument = updateAssetDto.SourceDocument;
                }
                if(updateAssetDto.ExpectedVersion.HasValue&&updateAssetDto.ExpectedVersion!= asset.Version)
                {
                    return TypedResults.Conflict();
                }

                asset.UpdatedAt = DateTime.UtcNow;
                asset.Version += 1;

           
                await dbContext.SaveChangesAsync();

                return TypedResults.Ok(asset);
            })
     .RequireAuthorization("WorkspaceAdminPolicy");
        }
    }
}