namespace Invory.DTO
{
    public record WorkspaceInvitationResponseDto(
     int Id,
     int WorkspaceId,
     string InviteLink,
     string Token,
     DateTime ExpiresAt
 );
}
