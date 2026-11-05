namespace Invory.Token
{
    using Invory.Db;
    using Invory.DTO;
    using Invory.Models.BDModels;
    using Invory.Models.HelperClasses;
    using Microsoft.AspNetCore.Identity;
    using Microsoft.EntityFrameworkCore;
    using Microsoft.Extensions.Options;
    using Microsoft.IdentityModel.Tokens;
    using System.IdentityModel.Tokens.Jwt;
    using System.Security.Claims;
    using System.Security.Cryptography;
    using System.Text;

    public class TokenProvider
    {
        private readonly JwtSettings jwtSettings;
        
        public TokenProvider(IOptions<JwtSettings>options)
        {
            jwtSettings = options.Value;
        }

        public TokenExpDate CreateUserToken(User user)
        {
            //Данните за нашия токен
            List<Claim> claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()), // sets user id to claim Sub
                new Claim(ClaimTypes.Name, user.UserName),       // Sets to
                new Claim(ClaimTypes.Email, user.Email),         // Имейл
            };


            var jwtKey = jwtSettings.Key;//тайната, ключ 
            var keyBytes = Encoding.UTF8.GetBytes(jwtKey);//превръшаме в байтове
            var symmetricKey = new SymmetricSecurityKey(keyBytes);
            var credentials = new SigningCredentials(symmetricKey, SecurityAlgorithms.HmacSha256);// по алгоритъм кодираме

            int keyInspirationTimeInMinutes = jwtSettings.ExpirationInMinutes;


            //данните за нашия токен
            var tokenDescriptor = new JwtSecurityToken(
                issuer: jwtSettings.Issuer,
                audience: jwtSettings.Audience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(keyInspirationTimeInMinutes),
                signingCredentials: credentials
            );

         
            var tokenString = new JwtSecurityTokenHandler().WriteToken(tokenDescriptor);//самия токен


            return new TokenExpDate(
               tokenString,
               DateTime.UtcNow.AddMinutes(keyInspirationTimeInMinutes)
           );

        }



        public static string GenerateRefreshToken()
        {
            return Convert.ToBase64String(RandomNumberGenerator.GetBytes(32));
        }


        public static async Task<string> CreateAndStoreRefreshTokenAsync(
    AppDbContext dbContext,
    HttpContext httpContext,
    int userId,
    int expirationDays)
        {
            //Почистваме изтеклите токени за този потребител 
            await dbContext.RefreshTokens.Where(rt => rt.UserId == userId && rt.ExpireTime <= DateTime.UtcNow).ExecuteDeleteAsync();

            // Генерираме нов суров рефреш токен
            var rawRefreshToken = GenerateRefreshToken();
            var expireTime = DateTime.UtcNow.AddDays(expirationDays);

            var refToken = new RefreshToken
            {
                UserId = userId,
                Token = rawRefreshToken,
                ExpireTime = expireTime
            };

            dbContext.RefreshTokens.Add(refToken);
            await dbContext.SaveChangesAsync();

            // 3. Записваме го в HttpOnly бисквитка
            httpContext.Response.Cookies.Append("invory_refresh", rawRefreshToken, new CookieOptions
            {
                HttpOnly = true,
                Secure = false, // В production задължително true (заради HTTPS)
                SameSite = SameSiteMode.Strict,
                Expires = expireTime
            });

            return rawRefreshToken;
        }

    }
}
