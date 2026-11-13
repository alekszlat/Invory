using FluentValidation;
using Invory.AuthHandler;
using Invory.Db;
using Invory.Endpoints;
using Invory.HelperClasses;
using Invory.Models.BDModels;
using Invory.Models.Interfaces;
using Invory.Token;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// 1. Database Configuration
string connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
                          ?? builder.Configuration.GetSection("ConnectionStrings")["DefaultConnection"]
                          ?? throw new InvalidOperationException("DefaultConnection string is missing.");

builder.Services.AddDbContext<AppDbContext>(options => options.UseSqlServer(connectionString));

// 2. Identity Configuration
builder.Services.AddIdentity<User, IdentityRole<int>>(options =>
{
    options.Password.RequiredLength = 6;
    options.Password.RequiredUniqueChars = 1;
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = false;
    options.Password.RequireUppercase = false;
    options.Password.RequireNonAlphanumeric = false;
})
.AddEntityFrameworkStores<AppDbContext>()
.AddDefaultTokenProviders();

// 3. JWT & Authentication Configuration (Глобален стандарт по подразбиране)
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("Jwt"));
var jwtSettings = builder.Configuration.GetSection("Jwt").Get<JwtSettings>()
                  ?? throw new InvalidOperationException("Jwt settings are missing in configuration.");
var key = Encoding.UTF8.GetBytes(jwtSettings.Key);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidIssuer = jwtSettings.Issuer,
        ValidateAudience = true,
        ValidAudience = jwtSettings.Audience,
        ValidateLifetime = true,
        IssuerSigningKey = new SymmetricSecurityKey(key),
        ValidateIssuerSigningKey = true,
        ClockSkew = TimeSpan.Zero // Без допълнителен толеранс след изтичане на токена
    };
});

// 4. Authorization Policies & Handlers Configuration
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("WorkspaceMemberPolicy", policy =>
        policy.Requirements.Add(new WorkspaceMemberRequirement()));

    options.AddPolicy("WorkspaceAdminPolicy", policy =>

        policy.Requirements.Add(new WorkspaceAdminRequirement()));
    options.AddPolicy("SubWorkspaceMemberOrAdminPolicy", policy =>
        policy.Requirements.Add(new SubWorkspaceMemberOrAdminRequirement()));

    options.AddPolicy("SubWorkspaceContributorPolicy", policy =>
        policy.Requirements.Add(new SubWorkspaceContributorRequirement()));

    options.AddPolicy("SubWorkspaceContributorOrAdminPolicy", policy =>
        policy.Requirements.Add(new SubWorkspaceContributorOrAdminRequirement()));
});

// Регистрираме хендлърите в DI контейнера
builder.Services.AddScoped<IAuthorizationHandler, WorkspaceMemberHandler>();
builder.Services.AddScoped<IAuthorizationHandler, WorkspaceAdminHandler>();
builder.Services.AddScoped<IAuthorizationHandler, SubWorkspaceMemberOrAdminCheck>();
builder.Services.AddScoped<IAuthorizationHandler, SubWorkspaceContributorOrAdminCheck>();
builder.Services.AddScoped<IAuthorizationHandler, SubWorkspaceContributorCheck>();


// 5. CORS Policy (Конфигуриран за работа с HttpOnly бисквитки за рефреш токени)
builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactAppPolicy", policy =>
    {
        policy.WithOrigins("http://localhost:3000") // Адрес на твоя фронтенд
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials(); // Задължително за изпращане/приемане на cookies от клиентския 앱
    });
});

builder.Services.Configure<Microsoft.AspNetCore.Http.Json.JsonOptions>(options =>
{
    // Превръща енъмите в стрингове (напр. "Viewer" вместо 0)
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
});
// 6. Application Services & Validation
builder.Services.AddValidatorsFromAssembly(typeof(Program).Assembly, includeInternalTypes: true);
builder.Services.AddTransient<IEmailSender, EmailSender>();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();
builder.Services.AddSingleton<PasswordHasher<User>>();
builder.Services.AddSingleton<TokenProvider>();

// 7. OpenAPI / Swagger Setup
builder.Services.AddOpenApi(options =>
{
    options.AddDocumentTransformer<BearerSecuritySchemeTransformer>();
});

var app = builder.Build();

// --- HTTP PIPELINE ---

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/openapi/v1.json", "API v1");
    });
}

app.UseExceptionHandler();
app.UseHttpsRedirection();
app.UseStaticFiles();

// CORS трябва да е преди Authentication/Authorization и след StaticFiles
app.UseCors("ReactAppPolicy");

app.UseAuthentication();
app.UseAuthorization();


var apiV1Group = app.MapGroup("/api/v1");
// Map Endpoints
apiV1Group.MapAuthenticationEndpoints();
//apiV1Group.MapWorkspaceEndpoints();
apiV1Group.MapAssetsEndpoints();
apiV1Group.MapSubRegistersEndpoints();
apiV1Group.MapInvitationsEndpoints();
app.MapGet("/", () => "sup");

app.Run();