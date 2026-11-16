using FluentValidation;
using Invory.Db;
using Invory.DTO;
using Invory.HelperClasses;
using Invory.Models.BDModels;
using Invory.Models.enums;
using Invory.Validators;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Org.BouncyCastle.Bcpg;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory;

namespace Invory.Endpoints
{
    public static class SubRegistersEndpoints
    {

        public static void MapSubRegistersEndpoints(this IEndpointRouteBuilder app)
        {
            app.MapPost("/registers/{registerId:int}/subregisters", async Task<Results<Ok<CreatedSubWorkspaceDTO>, BadRequest<string>>> (int registerId, AppDbContext dbContext, string name, ClaimsPrincipal userPr) =>
            {

                Int32.TryParse(userPr.FindFirstValue(ClaimTypes.NameIdentifier), out int userId);
                if (name.IsWhiteSpace())
                {
                    return TypedResults.BadRequest("SubWorkspace name is required");

                }
                if (name.Count() > 100)
                {
                    return TypedResults.BadRequest("SubWorkspace name must not exceed 100 characters.");
                }
                SubWorkSpace subWorkspace = new SubWorkSpace();
                subWorkspace.SubWorkspaceName = name;
                subWorkspace.WorkspaceId = registerId;
                bool nameExists = await dbContext.SubWorkSpaces
                .AnyAsync(sb => sb.SubWorkspaceName == name && sb.WorkspaceId == registerId);

                if (nameExists)
                {
                    return TypedResults.BadRequest("There is already a subWorkspace with the same name.");
                }

                dbContext.SubWorkSpaces.Add(subWorkspace);


                await HistoryHelper.AddHistoryAsync(registerId, "Created a new Sub Workspace", "Created sub-workspace: " + name, dbContext, userPr);


                await dbContext.SaveChangesAsync();

                CreatedSubWorkspaceDTO subRegisterDTo = new CreatedSubWorkspaceDTO(subWorkspace.Id, subWorkspace.SubWorkspaceName, registerId);

                return TypedResults.Ok(subRegisterDTo);

            }).RequireAuthorization("WorkspaceAdminPolicy").WithDescription("Create a subRegister -ADMIN ONLY");
            //EditSubWorkspaceDto


            app.MapGet("/registers/{registerId:int}/subregisters", async Task<Results<Ok<List<CreatedSubWorkspaceDto>>, BadRequest<string>, ForbidHttpResult>> (
            int registerId,
            AppDbContext dbContext,
            ClaimsPrincipal userPr
            ) =>
            {
                if (!int.TryParse(userPr.FindFirstValue(ClaimTypes.NameIdentifier), out int userId) || userId <= 0)
                {
                    return TypedResults.BadRequest("User ID is invalid or missing.");
                }


                var connection = await dbContext.WorkspaceRoleUserTables
                    .AsNoTracking()
                    .FirstOrDefaultAsync(wp => wp.UserId == userId && wp.WorkspaceId == registerId);

                if (connection == null)
                {
                    return TypedResults.Forbid();
                }

                WorkspaceRole role = connection.workspaceRole;

                var query = dbContext.SubWorkSpaces
                    .AsNoTracking()
                    .Where(sb => sb.WorkspaceId == registerId);

                if (role != WorkspaceRole.Admin)
                {
                    query = query.Where(sb => sb.Users.Any(us => us.Id == userId));
                }


                var result = await query
          .Select(sb => new CreatedSubWorkspaceDto(
                  sb.Id,
                  sb.SubWorkspaceName,
                  sb.WorkspaceId,
                  sb.Assets.Select(a => a.Name).ToList(),
                  sb.Users.Select(u => u.UserName).ToList()
              ))
          .ToListAsync();
                return TypedResults.Ok(result);
            })
        .RequireAuthorization("WorkspaceMemberPolicy")
        .WithDescription("Returns all subregisters for Workspace Admins, or only the ones the user participates in for Members.");




            app.MapPatch("/registers/{registerId:int}/subregisters/{subregisterId:int}", async Task<Results<Ok<string>, BadRequest<string>, NotFound<string>,ValidationProblem>> (
                 int registerId,
                 int subregisterId,
                 AppDbContext dbContext,
                 [FromBody] UpdateSubWorkspaceDto dto, IValidator<UpdateSubWorkspaceDto> validator, ClaimsPrincipal userPr
             ) =>
            {

                string description = "";

                var validationResult = await validator.ValidateAsync(dto);
                if (!validationResult.IsValid)
                {
                    return TypedResults.ValidationProblem(validationResult.ToDictionary());
                }
                if (!string.IsNullOrWhiteSpace(dto.Name))
                {
                    bool nameExists = await dbContext.SubWorkSpaces
                        .AnyAsync(sb => sb.SubWorkspaceName == dto.Name && sb.WorkspaceId == registerId && sb.Id != subregisterId);

                    if (nameExists)
                    {
                        return TypedResults.BadRequest("There is already a subWorkspace with the same name.");
                    }
                }

                var subRegister = await dbContext.SubWorkSpaces
                    .FirstOrDefaultAsync(subW => subW.Id == subregisterId && subW.WorkspaceId == registerId);

                if (subRegister == null)
                {
                    return TypedResults.NotFound("SubWorkspace not found or SubWorkspace does not belong to this register.");
                }


                if (!string.IsNullOrWhiteSpace(dto.Name))
                {
                    description += "Changed subWorkspace name from " + subRegister.SubWorkspaceName + " to " + dto.Name + "\n";

                    subRegister.SubWorkspaceName = dto.Name;
                }

                if (dto.AssetIds != null && dto.AssetIds.Any())
                {
                    var assetsToAssign = await dbContext.Assets
                        .Where(ass => dto.AssetIds.Contains(ass.Id) && ass.WorkspaceId == registerId)
                        .ToListAsync();

                    if (assetsToAssign.Count != dto.AssetIds.Count)
                    {
                        return TypedResults.BadRequest("Not all assets belong to this workspace.");
                    }
                    description += "Adding assets with ID's ";

                    foreach (var asset in assetsToAssign)
                    {
                        description += asset.Id + " ";
                        asset.SubWorkspaceId = subregisterId;
                    }


                }

                if (string.IsNullOrWhiteSpace(description))
                {
                    return TypedResults.BadRequest("No valid data provided for update or assignment.");
                }


                await HistoryHelper.AddHistoryAsync(registerId, "Edited a subWorkspace", description, dbContext, userPr);


                await dbContext.SaveChangesAsync();

                return TypedResults.Ok("Sub-workspace updated and assets assigned successfully!");
            }).RequireAuthorization("WorkspaceAdminPolicy")
             .WithDescription("Update subWorkspace name and/or assign assets - ADMIN ONLY");



            app.MapGet("/requests", async Task<Results<Ok<PagedResultDto<ChangeRequestResponseDto>>, BadRequest<string>, NotFound>> (
           int? registerId,
           int? subregisterId,
           ChangeRequestStatus? status,
           ClaimsPrincipal currentUser,
           AppDbContext dbContext,
           int page = 1,
           int pageSize = 20) =>
            {

                if (!int.TryParse(currentUser.FindFirstValue(ClaimTypes.NameIdentifier), out int userId) || userId <= 0)
                {
                    return TypedResults.BadRequest("Invalid user session.");
                }

                var adminWorkspaceIds = await dbContext.WorkspaceRoleUserTables
                    .Where(w => w.UserId == userId && w.workspaceRole == WorkspaceRole.Admin)
                    .Select(w => w.WorkspaceId).Distinct()
                    .ToListAsync();

                //Change request by us or ones we are admin of
                var query = dbContext.ChangeRequests
                    .Where(cr => cr.RequestedById == userId || adminWorkspaceIds.Contains(cr.WorkspaceId));
                

                //if register id is not null we get ones from this Workspace only
                if (registerId.HasValue)
                {
                    query = query.Where(cr => cr.WorkspaceId == registerId.Value);
                }

                //if subregister id is not null we get ones from this Subrkspace only

                if (subregisterId.HasValue)
                {
                    query = query.Where(cr => cr.SubWorkspaceId == subregisterId.Value);
                }
            
                //if searching by status
                if (status.HasValue)
                {
                    query = query.Where(cr => cr.Status == status);
                }

                if (query == null)
                {
                    return TypedResults.NotFound();
                }
                int count = await query.CountAsync();
                int totalPages;
                int skip;


                PaginationMetaDto pgDto = PaginationCalculator.CalculateMeta(count, out totalPages, out skip, ref page, ref pageSize);


                var result = await query
                      .OrderByDescending(cr => cr.CreatedAt)
                      .Skip(skip)
                      .Take(pageSize)
                      .Select(cr => new ChangeRequestResponseDto(
                          cr.Id.ToString(),
                          cr.WorkspaceId.ToString(),
                          cr.SubWorkspaceId.ToString(),
                          cr.AssetId,
                          cr.ChangeReuestType,
                          cr.Note,
                          cr.Location,
                          cr.OriginalLocation,
                          cr.OriginalAssetStatus,
                          cr.Status,
                          cr.Reason,
                          cr.CreatedAt,
                          cr.DecidedAt
                      ))
                      .ToListAsync();

                PagedResultDto<ChangeRequestResponseDto> pagedResult = new PagedResultDto<ChangeRequestResponseDto>(result, pgDto);

                return TypedResults.Ok(pagedResult);
            })
       .RequireAuthorization()
       .WithDescription("Get list of Requests, his and other, with workspaceId , subWorkspace ,id and status, being optional");


            app.MapPost("/registers/{registerId:int}/subregisters/{subregisterId:int}/changerequests/{AssetId:int}", async Task<Results<Ok<string>, BadRequest<string>, NotFound<string>>> (
                int AssetId,
                int registerId,
                ChangeRequestKind ChangeReuestType,
                int subregisterId,
                CreateChangeRequestDto dto,
                ClaimsPrincipal currentUser,
                AppDbContext dbContext) =>
            {
                if (!int.TryParse(currentUser.FindFirstValue(ClaimTypes.NameIdentifier), out int userId) || userId <= 0)
                {
                    return TypedResults.BadRequest("Invalid user session.");
                }

                // Read claims directly instead of hitting the Users table
                string username = currentUser.FindFirstValue(ClaimTypes.Name) ?? currentUser.Identity?.Name ?? string.Empty;
                string email = currentUser.FindFirstValue(ClaimTypes.Email) ?? string.Empty;

                // Verify asset belongs to the specified subworkspace AND workspace
                Asset? asset = await dbContext.Assets
                    .Where(a => a.Id == AssetId
                             && a.SubWorkspaceId == subregisterId
                             && a.SubWorkspace.WorkspaceId == registerId)
                    .FirstOrDefaultAsync();

                if (asset == null)
                {
                    return TypedResults.NotFound("Asset not found in this subregister.");
                }

                if (asset.Status == AssetStatus.Archived || asset.Status == AssetStatus.Scrapped)
                {
                    return TypedResults.BadRequest("A request cannot be sent about an asset that is archived or scrapped.");
                }

                // Check for existing pending request of the same type for this asset

                bool hasPendingRequest = await dbContext.ChangeRequests.AnyAsync(cr =>
                    cr.WorkspaceId == registerId &&
                    cr.SubWorkspaceId == subregisterId &&
                    cr.AssetId == AssetId &&
                    cr.ChangeReuestType == ChangeReuestType && //трябва даа го махна ако няма значение типа, а просто искам за един асет една зявка
                    cr.Status == ChangeRequestStatus.pending
                );

                if (hasPendingRequest)
                {
                    return TypedResults.BadRequest("A pending request of this type already exists for this asset.");
                }

                if (ChangeReuestType != ChangeRequestKind.Present && string.IsNullOrWhiteSpace(dto.Note))
                {
                    return TypedResults.BadRequest("If the change request kind is not Present, a note is required.");
                }

                if (ChangeReuestType == ChangeRequestKind.Location)
                {
                    if (string.IsNullOrWhiteSpace(dto.Location))
                    {
                        return TypedResults.BadRequest("Location is required for a location change request.");
                    }
                    if (dto.Location == asset.Location)
                    {
                        return TypedResults.BadRequest("The new location must differ from the current location.");
                    }
                }

                DateTime now = DateTime.UtcNow;
                bool isPresent = ChangeReuestType == ChangeRequestKind.Present;

                var changeRequest = new ChangeRequest
                {
                    WorkspaceId = registerId,
                    SubWorkspaceId = subregisterId,
                    AssetId = AssetId,
                    RequestedById = userId,
                    RequestedByUsername = username,
                    RequestedByEmail = email,
                    ChangeReuestType = ChangeReuestType,
                    Note = dto.Note,
                    Location = dto.Location,
                    Status = isPresent ? ChangeRequestStatus.approved : ChangeRequestStatus.pending,
                    CreatedAt = now,
                    DecidedAt = isPresent ? now : null,
                    OriginalAssetVersion = asset.Version,
                    OriginalAssetStatus = asset.Status,
                    OriginalLocation = asset.Location
                };

                dbContext.ChangeRequests.Add(changeRequest);

                if (isPresent)
                {
                    string title = "Checked asset - Status Present";
                    string description = $"Asset - {asset.Name} is present";
                    await HistoryHelper.AddHistoryAsync(registerId, title, description, dbContext, currentUser);
                }

                await dbContext.SaveChangesAsync();

                return TypedResults.Ok("Change request created successfully! ID:"+ changeRequest.Id );
            })
            .RequireAuthorization("SubWorkspaceContributorOrAdminPolicy")
            .WithDescription("Create a new change request for an asset.");


            app.MapPatch("/registers/{registerId:int}/requests/{requestId:int}", async Task<IResult> (
        int registerId,
        int requestId,
          ChangeRequestAnswer Answer,
        ClaimsPrincipal currentUser,
        AppDbContext dbContext, string Reason = ""

    ) =>
            {
                if (!int.TryParse(currentUser.FindFirstValue(ClaimTypes.NameIdentifier), out int userId) || userId <= 0)
                {
                    return TypedResults.BadRequest("Invalid user session.");
                }

                // if the request is from this workspace
                var request = await dbContext.ChangeRequests
                    .Where(cr => cr.Id == requestId && cr.WorkspaceId == registerId)
                    .Include(cr => cr.Asset)
                    .FirstOrDefaultAsync();

                if (request == null)
                {
                    return TypedResults.NotFound("Change request not found.");
                }

                if (request.Status != ChangeRequestStatus.pending || request.DecidedAt != null)
                {
                    return TypedResults.BadRequest("A decision has already been made for this request.");
                }

                Asset? asset = request.Asset;

                if (asset == null)
                {
                    return TypedResults.NotFound("Asset not found");
                }

                if (asset.Status == AssetStatus.Archived || asset.Status == AssetStatus.Scrapped)
                {
                    return TypedResults.BadRequest("Can't approve or reject requests for an archived or scrapped asset.");
                }


                if (Answer == ChangeRequestAnswer.Approved &&
                    request.ChangeReuestType == ChangeRequestKind.Location &&
                    asset.Location == request.Location)
                {
                    return TypedResults.BadRequest("New location must differ from current location.");
                }


                request.DecidedAt = DateTime.UtcNow;
                request.Reason = Reason;

                string title = "";
                string description = "";

                if (Answer == ChangeRequestAnswer.Approved)
                {
                    request.Status = ChangeRequestStatus.approved;
                    
                    if (request.ChangeReuestType == ChangeRequestKind.Missing)
                    {
                        title = "Checked asset - Status Missing";
                        description = "Asset - " + asset.Name + " is missing,\nREQUEST NOTE: " + request.Note;
                    }
                    else if (request.ChangeReuestType == ChangeRequestKind.Location)
                    {
                        title = "Checked asset - Location changed";
                        description = "Asset - " + asset.Name + "'s location changed from: " + request.OriginalLocation + " to : " + request.Location + ",\nREQUEST NOTE: " + request.Note;
                        asset.Location = request.Location;
                    }
                    else if (request.ChangeReuestType == ChangeRequestKind.Disposal)
                    {
                        asset.Status = AssetStatus.Scrapped;
                        title = "Checked asset - Asset Scrapped";
                        description = "Asset - " + asset.Name + " has been Scrapped,\nREQUEST NOTE: " + request.Note;
                    }

                    await HistoryHelper.AddHistoryAsync(registerId, title, description, dbContext, currentUser);
                    await dbContext.SaveChangesAsync();

                    return TypedResults.Ok("Change request has been accepted");
                }
                else if (Answer == ChangeRequestAnswer.Rejected)
                {
                    if (string.IsNullOrWhiteSpace(request.Reason))
                    {
                        return TypedResults.BadRequest("reason is required when rejecting");

                    }
                    request.Status = ChangeRequestStatus.rejected;

                    await dbContext.SaveChangesAsync();

                    return TypedResults.Ok("Change request has been rejected");
                }

                return TypedResults.BadRequest("Request Error");
            
    
            }).RequireAuthorization("WorkspaceAdminPolicy");

        }
    }
}
