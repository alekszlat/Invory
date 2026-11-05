namespace Invory.DTO
{
    public record TokenExpDate(string token, DateTime expirationTimeInMinutes);

    public record RefreshTokenDto(string RefreshToken, int ExpiresInDays);
    public record AuthResponseDto(TokenExpDate AccessToken, RefreshTokenDto RefreshToken);
}
