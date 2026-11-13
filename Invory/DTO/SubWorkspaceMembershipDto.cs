using Invory.Models.enums;

namespace Invory.DTO
{
   
public record SubWorkspaceMembershipDto(
    UserDto user,
    SubWorkspaceRoles Role
);

    public record WorkspaceMembershipDto(
    UserDto user,
    WorkspaceRole Role
);
}
