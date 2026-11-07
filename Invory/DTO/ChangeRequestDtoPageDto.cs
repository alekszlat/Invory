namespace Invory.DTO
{
    public record ChangeRequestDtoPageDto(
     string Id,
     string RegisterId,
     string SubregisterId,
     string AssetId,
     string Kind,
     string Note,
     string Location,
     string OriginalLocation,
     string OriginalStatus,
     int OriginalAssetVersion,
     string Status,
     string Reason,
     DateTime CreatedAt,
     DateTime? DecidedAt,
     RegisterSummaryDto Register,
     SubregisterSummaryDto Subregister,
     AssetSummaryDto Asset,
     UserDto Requester,
     UserDto? DecidedBy
 );

    public record RegisterSummaryDto(string Id, string Name);
    public record SubregisterSummaryDto(string Id, string Name);
    public record AssetSummaryDto(string Id, string Name, string InventoryNumber);
}
