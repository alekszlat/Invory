using Invory.Models.enums;

namespace Invory.DTO
{
    public record UpdateAssetDto(string? Name,
     string?InventoryNumber,
     string? Location,
     decimal? Quantity,
     string? Custodian,
     DateTime? AcquiredOn,
     string? Unit,
     AssetStatus? Status,
     string? SourceDocument, 
     int? ExpectedVersion);
}
