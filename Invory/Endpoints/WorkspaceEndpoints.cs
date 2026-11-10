using FluentValidation;
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
                    owner: new UserDto(AdminUser.Id, AdminUser.UserName, AdminUser.Email),
                    role: currentUserTB.workspaceRole.ToString(),
                    assetCount: workspace.Assets.Count(ass => ass.Status != AssetStatus.Archived),
                    createdAt: workspace.CreatedAt,
                    updatedAt: workspace.UpdatedAt
                );

                return TypedResults.Ok(dto);
            })
            .RequireAuthorization("WorkspaceMemberPolicy"); // Само членове на уъркспейса


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
                var meta = PaginationCalculator.CalculateMeta(totalItems, out totalPages, out skip, ref page, ref pageSize);

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
            app.MapPost("/registers", async Task<Results<ValidationProblem,UnauthorizedHttpResult, Created<WorkspaceDto>>> (
                ClaimsPrincipal user, IValidator<CreateWorkspaceDto> validator,
                AppDbContext context,
                CreateWorkspaceDto workspaceDto) =>
            {

                var validationResult = await validator.ValidateAsync(workspaceDto);
                if (!validationResult.IsValid)
                {

                    return TypedResults.ValidationProblem(validationResult.ToDictionary());
                }
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





          
        }
    }
}