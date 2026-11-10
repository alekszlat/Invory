using Invory.Models.enums;

namespace Invory.DTO
{
    public record SearchAssetDto(
    string? SearchTerm,       
    int? RegisterId,
    int? SubregisterId,
    string? Location,
    string? Custodian,
    AssetStatus? AssetStatus,
    DateTime? AcquiredFrom,      
    DateTime? AcquiredTo,      
    int PageNumber = 1,
    int PageSize = 20,
    bool SortDescending = false

        );

    
}
