using Invory.Db;
using Invory.DTO;
using Invory.Models.BDModels;
using Invory.Models.enums;
using Invory.Models.HelperClasses;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Win32;
using System.Security.Claims;

namespace Invory.Endpoints
{
    public static class WorkspaceEndpoints
    {
        public static void MapWorkspaceEndpoints(this IEndpointRouteBuilder app)
        {
            // 1. Взимане на детайли за конкретен регистър (Изисква да си член)
            app.MapGet("/{registerId:int}", async Task<Results<NotFound, Ok<WorkspacePageDto>>> (
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
                 .Where(rut => rut.workspaceRole==WorkspaceRole.Admin).FirstOrDefault();

                User AdminUser = adminUserTB.User;


                WorkspaceRoleUserTable currentUserTB = workspace.WorkspaceRUTable
              .Where(rut => rut.UserId==currentUserId).FirstOrDefault();


                var dto = new WorkspacePageDto(
                    Id: workspace.Id,
                    name: workspace.WorkspaceName,
                    description: workspace.Description,
                    ownerId: AdminUser.Id,
                    owner: new UserDto(AdminUser.Id,AdminUser.UserName, AdminUser.Email),
                    role: currentUserTB.workspaceRole.ToString(),
                    assetCount: workspace.Assets.Count(a => a.ArchivedAt == null),
                    createdAt: workspace.CreatedAt,
                    updatedAt: workspace.UpdatedAt
                );

                return TypedResults.Ok(dto);
            })
            .RequireAuthorization("WorkspaceMemberPolicy"); // Само членове на уъркспейса




            // 2. Списък с регистри на текущия потребител (Остава стандартна аутентикация, тъй като няма registerId в руута)
            app.MapGet("/registers", async Task<Results<NotFound, Ok<PagedResultDto<WorkspaceMainPage>>>> (
                int? page,
                int? pageSize,
                AppDbContext dbContext,
                ClaimsPrincipal user) =>
            {
                var userIdString = user.FindFirstValue(ClaimTypes.NameIdentifier);
                if (!int.TryParse(userIdString, out int currentUserId))
                {
                    return TypedResults.NotFound();
                }

                var pagination = new PaginationCalculator(page, pageSize);

                var baseQuery = dbContext.WorkSpaces
                 .AsNoTracking()
                 .Where(w => w.WorkspaceRUTable.Any(rut => rut.UserId == currentUserId));

                int totalItems = await baseQuery.CountAsync();

                var items = await baseQuery
                    .OrderByDescending(wp => wp.CreatedAt)
                    .Skip(pagination.Skip)
                    .Take(pagination.PageSize)
                    .Select(wp => new WorkspaceMainPage(
                        Id: wp.Id,
                        name: wp.WorkspaceName,
                        description: wp.Description,
                        role: wp.WorkspaceRUTable.Where(rut => rut.UserId == currentUserId).Select(rut => rut.workspaceRole).FirstOrDefault().ToString(),
                        createdAt: wp.CreatedAt,
                        updatedAt: wp.UpdatedAt
                    ))
                    .ToListAsync();

                var meta = pagination.CalculateMeta(totalItems);

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

                var resourceUrl = $"/workspaces/{workSpace.Id}";

                WorkspaceDto wpDtoRead= new WorkspaceDto(workSpace.WorkspaceName, workSpace.Description);
                return TypedResults.Created(resourceUrl, wpDtoRead);


            })
            .RequireAuthorization();

            // 4. Бързо четране на суров workspace по ID (Изисква да си член)
            app.MapGet("/workspaces/{registerId:int}", async (int registerId, AppDbContext context) =>
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

            // 5. Редакция на регистър (Изисква Admin или Owner права чрез новата политика!)
            app.MapPatch("/registers/{registerId}", async Task<Results<NotFound, BadRequest<string>, Ok<WorkspaceMainPage>>> (
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

                var currentUserId = int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var userRole = workspace.WorkspaceRUTable
                    .Where(rut => rut.UserId == currentUserId)
                    .Select(rut => rut.workspaceRole)
                    .FirstOrDefault();

                var updatedRecord = new WorkspaceMainPage(
                    Id: workspace.Id,
                    name: workspace.WorkspaceName,
                    description: workspace.Description,
                    role: userRole.ToString(),
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











            app.MapGet("/registers/{registerId}/assets", async (int registerId,int page,int pageSize,string name,int inventoryNumber,string location,int quantity
                ,string ?custodian,DateTime? acquiredOn,string ?unit, AssetStatus? assetStatus,string sourceDocument
                , ClaimsPrincipal user, AppDbContext context) => {

                int userId;
                
                Int32.TryParse(user.FindFirstValue(ClaimTypes.NameIdentifier), out userId);
                if (userId == null)
                {
                    TypedResults.BadRequest("user id is not int");
                }

                var workspaceQuery= context.WorkSpaces.Where(workspace => workspace.Id == registerId);
                if (workspaceQuery == null)
                {
                    return TypedResults.NotFound();
                }
                workspaceQuery = workspaceQuery.Include(wp => wp.Assets);

                var list = await workspaceQuery.Select(wp => wp.Assets.Select(ass=>new AssetDtoPageDto(ass.Id,wp.Id,ass.Name,ass.InventoryNumber,ass.Location,ass.Custodian,
                    ass.AcquiredOn,ass.Unit,ass.Quantity,ass.Status.ToString(),ass.SourceDocument,ass.ArchivedAt,ass.Version,ass.CreatedAt,ass.UpdatedAt))).ToListAsync();


                var pagination = new PaginationCalculator(page, pageSize);
                    /*
                var meta = pagination.CalculateMeta(
                    );

                var pagedResult = new PagedResultDto<WorkspaceMainPage>(
                    Items: list,
                    Pagination: meta
                );
                    */
                    return null;


            }).RequireAuthorization("WorkspaceAdminPolicy"); 




            //GET / registers /{ registerId}/ assets


        }
    }
}