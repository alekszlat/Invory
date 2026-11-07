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

namespace Invory.Endpoints
{
    public static class AuthenticationEndpoints
    {
        public static void MapAuthenticationEndpoints(this IEndpointRouteBuilder app)
        {
            var authGroup = app.MapGroup("/api/v1/auth");

            // 1. LOGIN (Публичен)
            authGroup.MapPost("/login", async Task<Results<BadRequest<string>, Ok<AuthResponseDto>>> (
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

                TokenExpDate tokenAndExpTime = tokenProvider.CreateUserToken(user);

                await TokenProvider.CreateAndStoreRefreshTokenAsync(
                    dbContext,
                    httpContext,
                    user.Id,
                    options.Value.RefreshTokenExpirationDays
                );

                var session = new AuthResponseDto(new UserDto(user.Id, user.UserName, user.Email), tokenAndExpTime);
                return TypedResults.Ok(session);
            })

            .AllowAnonymous();

            // 2. REGISTER (Публичен)
            authGroup.MapPost("/register", async Task<Results<BadRequest<IDictionary<string, string[]>>, BadRequest<string>, BadRequest<IEnumerable<IdentityError>>, Ok<string>>> (
                AppDbContext dbContext,
                RegisterRequestDto registerRequestDto,
                RequestRegisterDtoValidator registerRequestValidator,
                UserManager <User> userManager,
                IEmailSender emailSender) =>
            {
                var validationResult = await registerRequestValidator.ValidateAsync(registerRequestDto);
                if (!validationResult.IsValid)
                {
                    return TypedResults.BadRequest(validationResult.ToDictionary());
                }

                var user = new User
                {
                    Email = registerRequestDto.Email,
                    UserName = registerRequestDto.Username
                };

                var createUserResult = await userManager.CreateAsync(user, registerRequestDto.Password);
                if (!createUserResult.Succeeded)
                {
                    return TypedResults.BadRequest(createUserResult.Errors);
                }

                var emailToken = await userManager.GenerateEmailConfirmationTokenAsync(user);
                var codeBytes = Encoding.UTF8.GetBytes(emailToken);
                var encodedToken = WebEncoders.Base64UrlEncode(codeBytes);

                var confirmationLink = $"http://localhost:5207/api/v1/auth/confirm-email?userId={user.Id}&token={encodedToken}";

                await emailSender.SendEmail(user.Email, "Invory Email confirmation", "Finish invory registration: " + confirmationLink);
           
                return TypedResults.Ok("Account created, email verification needed!");
            })
            .AllowAnonymous()
            .WithDescription("If registration is successful returns message, otherwise Bad Request");


            // 3. CONFIRM EMAIL (Публичен)
            authGroup.MapGet("/confirm-email", async Task<Results<BadRequest<string>, Ok<string>>> (
                int userId,
                string token,
                TokenProvider tokenProvider,AppDbContext dbContext,HttpContext httpContext,
                UserManager<User> userManager, IOptions<JwtSettings> options) =>
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
                if (!result.Succeeded)
                {
                    return TypedResults.BadRequest("Error confirming email.");
                }



                JwtSettings settings = options.Value;


                var refreshToken = await TokenProvider.CreateAndStoreRefreshTokenAsync(
                     dbContext,
                     httpContext,
                     user.Id,
                     settings.RefreshTokenExpirationDays
                 );
                

                return TypedResults.Ok("Email confirmed successfully! You can now log in.");

            })
            .AllowAnonymous()
            .WithDescription("Confirms user's email using token and userId.");

            // 4. REFRESH TOKEN (Публичен - приема HttpOnly бисквитката)
            authGroup.MapPost("/refresh", async Task<Results<BadRequest<string>, Ok<AuthResponseDto>>> (
                HttpContext httpContext,
                AppDbContext dbContext,
                TokenProvider tokenProvider,
                IOptions<JwtSettings> options) =>
            {
                if (!httpContext.Request.Cookies.TryGetValue("invory_refresh", out var oldRefreshTokenValue))
                {
                    return TypedResults.BadRequest("Refresh token is missing.");
                }

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

                TokenExpDate tokenAndExpTime = tokenProvider.CreateUserToken(user);

                await TokenProvider.CreateAndStoreRefreshTokenAsync(
                    dbContext,
                    httpContext,
                    user.Id,
                    options.Value.RefreshTokenExpirationDays
                );

                var session = new AuthResponseDto(new UserDto(user.Id, user.UserName, user.Email), tokenAndExpTime);
                return TypedResults.Ok(session);
            })
            .AllowAnonymous();

            // 5. LOGOUT (Защитеен - изисква валиден Access Token)
            authGroup.MapPost("/logout", async (
                HttpContext httpContext,
                AppDbContext dbContext,
                ClaimsPrincipal user) =>
            {
                var userIdString = user.FindFirstValue(ClaimTypes.NameIdentifier);
                if (int.TryParse(userIdString, out int userId))
                {
                    await dbContext.RefreshTokens
                        .Where(rt => rt.UserId == userId)
                        .ExecuteDeleteAsync();
                }

                httpContext.Response.Cookies.Delete("invory_refresh");

                return TypedResults.NoContent();
            })
            .RequireAuthorization();

            // 6. GET CURRENT USER /me (Защитен - изисква валиден Access Token)
            authGroup.MapGet("/me", async Task<Results<NotFound, Ok<UserDto>>> (
                ClaimsPrincipal user,
                UserManager<User> userManager) =>
            {
                var userId = user.FindFirstValue(ClaimTypes.NameIdentifier);
                var currentUser = await userManager.FindByIdAsync(userId);

                if (currentUser == null)
                {
                    return TypedResults.NotFound();
                }

                return TypedResults.Ok(new UserDto(currentUser.Id, currentUser.UserName, currentUser.Email));
            })
            .RequireAuthorization()
            .WithDescription("Returns current authenticated user details");
        }
    }
}