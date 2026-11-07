namespace Invory.DTO
{
    public record TokenExpDate(string token, DateTime expirationTimeInMinutes);
    public record AuthResponseDto(
    UserDto User,TokenExpDate tokenAndDate);
    public record RefreshTokenDto(string RefreshToken, int ExpiresInDays);
 
}
