using Invory.DTO;
using Invory.Models.BDModels;
using Invory.Models.enums;
using Microsoft.EntityFrameworkCore;

namespace Invory.HelperClasses
{
    public static  class EndpointsHelperStaticFunctions
    {


        public static async Task<PagedResultDto<AssetDtoPageDto>> GetPagedAssetsAsync(
    IQueryable<Asset> assetsQuery,
    int registerId,
    string? name,
    string? inventoryNumber,
    string? location,
    int? quantity,
    string? custodian,
    DateTime? acquiredOn,
    string? unit,
    AssetStatus? assetStatus,
    string? sourceDocument,
    bool includeArchived,
    int page,
    int pageSize)
        {
            // 1. Прилагане на филтрите
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

            // 2. Преброяване и пагинация
            int totalItems = await assetsQuery.CountAsync();

            PaginationMetaDto meta = PaginationCalculator.CalculateMeta(
                totalItems,
                out int totalPages,
                out int skip,
                ref page,
                ref pageSize
            );


            var items = await assetsQuery.OrderByDescending(ass => ass.CreatedAt)
                .Skip(skip)
                .Take(pageSize)
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

            return new PagedResultDto<AssetDtoPageDto>(
                Items: items,
                Pagination: meta
            );
        }
    }
}
