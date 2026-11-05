using Invory.Db;
using Invory.DTO;
using Invory.Models.BDModels;
using Invory.Models.HelperClasses;
using Invory.Models.Interfaces;
using Invory.Token;
using Invory.Validators;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace Invory.Endpoints
{
    public static class AuthenticationEndpoints
    {

        public static void MapAuthenticationEndpoints(this IEndpointRouteBuilder app)
        {

            var authGroup = app.MapGroup("/api/v1/auth");


            authGroup.MapPost("/login", async Task<Results<BadRequest<string>, Ok<TokenExpDate>>> (
     HttpContext httpContext,
     LoginRequestDto loginRequestDto,
     AppDbContext dbContext,
     TokenProvider tokenProvider,
     UserManager<User> userManager,
     IOptions<JwtSettings> options) =>
            {
                var user = await userManager.FindByEmailAsync(loginRequestDto.gmail);
                if (user == null || !user.EmailConfirmed)
                {
                    return TypedResults.BadRequest("Username or password is not correct, or email not confirmed");
                }

                bool isPasswordValid = await userManager.CheckPasswordAsync(user, loginRequestDto.password);
                if (!isPasswordValid)
                {
                    return TypedResults.BadRequest("Username or password is not correct");
                }

                // 1. Създаваме краткотраен Access Token
                TokenExpDate tokenAndExpTime = tokenProvider.CreateUserToken(user);

                // 2. Извикваме общата функция за генериране и запис на рефреш токена + бисквитката
                await TokenProvider.CreateAndStoreRefreshTokenAsync(
                    dbContext,
                    httpContext,
                    user.Id,
                    options.Value.RefreshTokenExpirationDays
                );

                return TypedResults.Ok(tokenAndExpTime);
            });






            authGroup.MapPost("/register", async Task<Results<BadRequest<IDictionary<string, string[]>>, BadRequest<string>, BadRequest<IEnumerable<IdentityError>>, BadRequest, Ok<string>>>
                (AppDbContext dbContext, RegisterRequestDto registerRequestDto
                , RequestRegisterDtoValidator registerRequestValidator, UserManager<User> userManager, IEmailSender emailSender) =>
            {

                var validationResult = await registerRequestValidator.ValidateAsync(registerRequestDto);
                if (!validationResult.IsValid)
                {
                    return TypedResults.BadRequest(validationResult.ToDictionary());
                }


                User user = new User();

                user.Email = registerRequestDto.Email;
                user.UserName = registerRequestDto.Username;

                //creates a user in the database and adds a password while hashing it
                var createUserResult = await userManager.CreateAsync(user, registerRequestDto.Password);

                if (!createUserResult.Succeeded)
                {
                    return TypedResults.BadRequest(createUserResult.Errors);
                }


                //само генерира токена
                var emailToken = await userManager.GenerateEmailConfirmationTokenAsync(user);
                //само маркира в бд, че чака потвърцждение не неча тук да го приеме;

                var codeBytes = Encoding.UTF8.GetBytes(emailToken);
                var encodedToken = WebEncoders.Base64UrlEncode(codeBytes);

                var confirmationLink = $"http://localhost:5207/confirm-email?userId={user.Id}&token={encodedToken}";

                await emailSender.SendEmail(user.Email, "Invory Email confirmation", "Finish invory regestration: " + confirmationLink);


                return TypedResults.Ok("Account created, email verification needed!");

            }

          ).WithDescription("If registration is susscesfull returns message:- Registration successful email verification needed, otherwise :- Bad Request");

           


    
            app.MapGet("/confirm-email", async Task<Results<BadRequest<string>, Ok<string>>> (int userId, string token, UserManager<User> userManager) =>
            {
                if (userId <= 0 || string.IsNullOrEmpty(token))
                {
                    return TypedResults.BadRequest("Invalid email confirmation parameters.");
                }

                var user = await userManager.FindByIdAsync(userId.ToString());
                if (user == null)
                {
                    return TypedResults.BadRequest("User not found.");
                }

                // Декодираме токена от Base64Url формат
                string decodedToken;
                try
                {
                    var decodedBytes = WebEncoders.Base64UrlDecode(token);
                    decodedToken = Encoding.UTF8.GetString(decodedBytes);
                }
                catch (Exception)
                {
                    return TypedResults.BadRequest("Invalid token format.");
                }

                var result = await userManager.ConfirmEmailAsync(user, decodedToken);

                if (result.Succeeded)
                {
                    return TypedResults.Ok("Email confirmed successfully! You can now log in.");
                }

                return TypedResults.BadRequest("Error confirming email.");
            })
            .WithDescription("Confirms user's email using token and userId.");


            authGroup.MapPost("/logout", async (HttpContext httpContext, AppDbContext dbContext, ClaimsPrincipal user) =>
            {

                var userIdString = user.FindFirstValue(ClaimTypes.NameIdentifier);

                if (int.TryParse(userIdString, out int userId))
                {
                    // Изтриваме всички рефреш токени на този потребител от базата
                    await dbContext.RefreshTokens
                        .Where(rt => rt.UserId == userId)
                        .ExecuteDeleteAsync();
                   
                }

                // Изчистваме бисквитката от браузъра
                httpContext.Response.Cookies.Delete("invory_refresh");

                // Връщаме 204 No Content според спецификацията
                return TypedResults.NoContent();
            }).RequireAuthorization(policy => policy
    .AddAuthenticationSchemes(JwtBearerDefaults.AuthenticationScheme)
    .RequireAuthenticatedUser()).WithDescription("Who is the user");




            authGroup.MapPost("/refresh", async Task<Results<BadRequest<string>, Ok<TokenExpDate>>> (
       HttpContext httpContext,
       AppDbContext dbContext,
       TokenProvider tokenProvider,
       IOptions<JwtSettings> options) =>
            {
        /*Целта на функцията е да провери дали рефреш токена е още валиден
         *като го взима от бисквитката
         *Първо проверява дали е изтекъл, изтича, когато потребител не се логне дълго време
         *Ако не е изтекал го изтриваме, за да го заменим с новия 
         *Възможно е да има проблем с потребителя
         *Създаваме нов рефреш токен чрез функцията
       */



                //пробва да извади рефреш токена от бисквитката 
                if (!httpContext.Request.Cookies.TryGetValue("invory_refresh", out var oldRefreshTokenValue))
                {
                    return TypedResults.BadRequest("Refresh token is missing.");
                }

                // 2. Намираме го в базата и зареждаме потребителя му
                var existingToken = await dbContext.RefreshTokens
                    .Include(rt => rt.User)
                    .FirstOrDefaultAsync(rt => rt.Token == oldRefreshTokenValue);

                if (existingToken == null || existingToken.ExpireTime < DateTime.UtcNow)
                {
                    return TypedResults.BadRequest("Invalid or expired refresh token.");
                }

                
                dbContext.RefreshTokens.Remove(existingToken);

                var user = existingToken.User;
                if (user == null || !user.EmailConfirmed)
                {
                    return TypedResults.BadRequest("User not found or unconfirmed.");
                }
              
                TokenExpDate newAccessTokenDto = tokenProvider.CreateUserToken(user);

                await TokenProvider.CreateAndStoreRefreshTokenAsync(
                    dbContext,
                    httpContext,
                    user.Id,
                    options.Value.RefreshTokenExpirationDays
                );

                // 6. Връщаме новия Access Token към фронтенда
                return TypedResults.Ok(newAccessTokenDto);
            });


            authGroup.MapGet("/me", async Task<Results<NotFound,Ok<UserDto>>>(ClaimsPrincipal user, UserManager<User> userManager) =>
            {
                var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
                var currentUser = await userManager.FindByIdAsync(userId);

                if (currentUser == null) return TypedResults.NotFound();

                return TypedResults.Ok(new UserDto(currentUser.Id,currentUser.UserName,currentUser.Email));
            })
            .RequireAuthorization(policy => policy
    .AddAuthenticationSchemes(JwtBearerDefaults.AuthenticationScheme)
    .RequireAuthenticatedUser()).WithDescription("Who is the user");
        }

    } 
}