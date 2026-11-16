using Invory.Models.enums;

namespace Invory.DTO
{
    public record CreateAssetDto(
       string Name,
       string InventoryNumber,
       int WorkspaceId,
       string Location,
       decimal Quantity,
       string? Custodian,
       DateTime? AcquiredOn,
       string? SourceDocument,
       string Unit= "Count",
       AssetStatus Status = AssetStatus.Active



   );
}
