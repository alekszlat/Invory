using Invory.Models.HelperClasses;

namespace Invory.DTO
{
    public record AssetDtoPageDto(
        int Id,
        int RegisterId,
        string Name,
        string InventoryNumber,
        string Location,
        string? Custodian,
        string? AcquiredOn, 
        string Unit,
        decimal Quantity,
        string Status,
        string? SourceDocument,
        DateTime? ArchivedAt,
        int Version,
        DateTime CreatedAt,
        DateTime UpdatedAt
    );
}
