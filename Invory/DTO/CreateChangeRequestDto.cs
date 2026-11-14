namespace Invory.DTO
{
    public record CreateChangeRequestDto(
     int RegisterId,
     int SubregisterId,
     int AssetId,
     string Kind="",
     string Note="",
     string Location="",
     string Status="",
     string Reason=""
 );

    public record RegisterSummaryDto(string Id, string Name);
    public record SubregisterSummaryDto(string Id, string Name);
    public record AssetSummaryDto(string Id, string Name, string InventoryNumber);
}
