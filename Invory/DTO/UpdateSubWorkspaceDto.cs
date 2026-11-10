namespace Invory.DTO
{
    public record UpdateSubWorkspaceDto(
       string? Name,
       List<int>? AssetIds
   );
}
