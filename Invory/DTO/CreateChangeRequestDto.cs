using Invory.Models.enums;

namespace Invory.DTO
{
    public record CreateChangeRequestDto(

     string Note = "",
     string Location = ""
 
 );

    public record RegisterSummaryDto(string Id, string Name);
    public record SubregisterSummaryDto(string Id, string Name);
    public record AssetSummaryDto(string Id, string Name, string InventoryNumber);
}
