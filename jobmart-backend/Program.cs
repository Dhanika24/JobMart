using System.Text;
using jobmart.Data;
using jobmart.Interfaces;
using jobmart.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder =
    WebApplication.CreateBuilder(args);

// ------------------------------------------------------
// Database connection
// ------------------------------------------------------
builder.Services.AddDbContext<
    ApplicationDbContext>(options =>
    {
        options.UseSqlServer(
            builder.Configuration
                .GetConnectionString(
                    "DefaultConnection"));
    });

// ------------------------------------------------------
// Controllers
// ------------------------------------------------------
builder.Services.AddControllers();

// ------------------------------------------------------
// HTTP context accessor
// Used by AuditLogService to read IP addresses.
// ------------------------------------------------------
builder.Services.AddHttpContextAccessor();

// ------------------------------------------------------
// Application services
// ------------------------------------------------------

// JWT service
builder.Services.AddScoped<
    IJwtService,
    JwtService>();

// AI candidate matching service
builder.Services.AddScoped<
    ICandidateMatchingService,
    CandidateMatchingService>();

// Audit logging service
builder.Services.AddScoped<
    IAuditLogService,
    AuditLogService>();

// Resume parsing and skill extraction service
builder.Services.AddScoped<
    IResumeParsingService,
    ResumeParsingService>();

// ------------------------------------------------------
// JWT settings from appsettings.json
// ------------------------------------------------------
string jwtKey =
    builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException(
        "JWT Key is missing from appsettings.json.");

string jwtIssuer =
    builder.Configuration["Jwt:Issuer"]
    ?? throw new InvalidOperationException(
        "JWT Issuer is missing from appsettings.json.");

string jwtAudience =
    builder.Configuration["Jwt:Audience"]
    ?? throw new InvalidOperationException(
        "JWT Audience is missing from appsettings.json.");

// ------------------------------------------------------
// JWT authentication
// ------------------------------------------------------
builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme =
            JwtBearerDefaults
                .AuthenticationScheme;

        options.DefaultChallengeScheme =
            JwtBearerDefaults
                .AuthenticationScheme;

        options.DefaultScheme =
            JwtBearerDefaults
                .AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.SaveToken =
            true;

        options.TokenValidationParameters =
            new TokenValidationParameters
            {
                ValidateIssuer =
                    true,

                ValidateAudience =
                    true,

                ValidateLifetime =
                    true,

                ValidateIssuerSigningKey =
                    true,

                ValidIssuer =
                    jwtIssuer,

                ValidAudience =
                    jwtAudience,

                IssuerSigningKey =
                    new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(
                            jwtKey)),

                ClockSkew =
                    TimeSpan.Zero
            };
    });

// ------------------------------------------------------
// Authorization
// ------------------------------------------------------
builder.Services.AddAuthorization();

// ------------------------------------------------------
// Swagger
// ------------------------------------------------------
builder.Services
    .AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc(
        "v1",
        new OpenApiInfo
        {
            Title =
                "JobMart API",

            Version =
                "v1",

            Description =
                "JobMart Recruitment Management System API"
        });

    options.AddSecurityDefinition(
        "Bearer",
        new OpenApiSecurityScheme
        {
            Name =
                "Authorization",

            Type =
                SecuritySchemeType.Http,

            Scheme =
                "bearer",

            BearerFormat =
                "JWT",

            In =
                ParameterLocation.Header,

            Description =
                "Enter your JWT token only. Example: eyJhbGciOi..."
        });

    options.AddSecurityRequirement(
        new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecurityScheme
                {
                    Reference =
                        new OpenApiReference
                        {
                            Type =
                                ReferenceType
                                    .SecurityScheme,

                            Id =
                                "Bearer"
                        }
                },

                Array.Empty<string>()
            }
        });
});

// ------------------------------------------------------
// CORS for React frontend
// ------------------------------------------------------
builder.Services.AddCors(options =>
{
    options.AddPolicy(
        "AllowFrontend",
        policy =>
        {
            policy
                .AllowAnyOrigin()
                .AllowAnyHeader()
                .AllowAnyMethod();
        });
});

// ------------------------------------------------------
// Build application
// ------------------------------------------------------
var app =
    builder.Build();

// ------------------------------------------------------
// HTTP pipeline
// ------------------------------------------------------
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// Allow access to files inside wwwroot
app.UseStaticFiles();

// Apply CORS
app.UseCors(
    "AllowFrontend");

// Authentication must come before authorization
app.UseAuthentication();

app.UseAuthorization();

// Map API controllers
app.MapControllers();

// ------------------------------------------------------
// Apply migrations and create default Admin
// ------------------------------------------------------
await DbSeeder.SeedAdminAsync(
    app);

// ------------------------------------------------------
// Run application
// ------------------------------------------------------
app.Run();