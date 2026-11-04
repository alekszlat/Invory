namespace Invory.Token
{
    using Microsoft.AspNetCore.Identity;
    using Microsoft.IdentityModel.Tokens;
    using System.IdentityModel.Tokens.Jwt;
    using System.Security.Claims;
    using System.Text;
    using Microsoft.Extensions.Options;
    using Invory.DTO;
    using Invory.Models.BDModels;
    using Invory.Models.HelperClasses;

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



    }
}
