using Invory.Models.enums;

namespace Invory.DTO
{
    public record ChangeRequestResponseDto(
     string Id,
     string RegisterId,
     string SubregisterId,
     int AssetId,
     ChangeRequestKind Kind,
     string Note,
     string Location,
     string OriginalLocation,
     AssetStatus OriginalStatus,
     ChangeRequestStatus changeRequestStatus,
     string Reason,
     DateTime CreatedAt,
     DateTime? DecidedAt
 );
}
