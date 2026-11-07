using Invory.Models.enums;

namespace Invory.DTO
{
    public record SubWorkspacePageDto(
        string Id,
        string WorkspaceId,
        string Name,
        List<string> AssetIds,
        int Version,
        DateTime CreatedAt,
        DateTime UpdatedAt,
        string WorkspaceName,
        int MemberCount,
        WorkspaceRole role
    );


}
