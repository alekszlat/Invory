using Invory.Db;
using Invory.DTO;
using Invory.Models.BDModels;
using Invory.Models.Interfaces;
using Invory.Token;
using Invory.Validators;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using System.Text;

namespace Invory.Endpoints
{
    public static class AuthenticationEndpoints
    {

        public static void MapAuthenticationEndpoints(this IEndpointRouteBuilder app)
        {
            app.MapPost("/login", async Task<Results<BadRequest<string>, Ok<TokenExpDate>>> (LoginRequestDto loginRequestDto, AppDbContext dbContext, TokenProvider tokenProvider, UserManager<User> userManager) =>
            {
                var user = await userManager.FindByEmailAsync(loginRequestDto.gmail);
                if (user == null)
                {
                    return TypedResults.BadRequest("Username or password is not correct");
                }

                if (!user.EmailConfirmed)
                {
                    return TypedResults.BadRequest("User has not confirmed email");
                }

                bool isPasswordValid = await userManager.CheckPasswordAsync(user, loginRequestDto.password);
                if (!isPasswordValid)
                {
                    return TypedResults.BadRequest("Username or password is not correct");
                }

                TokenExpDate tokenAndExpTime = tokenProvider.CreateUserToken(user);

                return TypedResults.Ok(tokenAndExpTime);

            });



            app.MapPost("/register", async Task<Results<BadRequest<IDictionary<string, string[]>>, BadRequest<string>, BadRequest<IEnumerable<IdentityError>>, BadRequest, Ok<string>>>
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

          ).WithDescription("If registration is susscesfull returns message:- Registration successful! otherwise :- Bad Request");

           


            

       
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




        }
    } 
}