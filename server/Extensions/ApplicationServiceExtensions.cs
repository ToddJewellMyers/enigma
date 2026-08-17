using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.IdentityModel.Tokens;
using server.Data;
using server.Email;
using server.Monitoring;

namespace server.Extensions;

public static class ApplicationServiceExtensions
{
    public static WebApplicationBuilder AddApplicationServices(this WebApplicationBuilder builder)
    {
        ConfigureLogging(builder);
        ValidateCoreConfiguration(builder.Configuration);

        builder.Services.AddControllers();
        builder.Services.AddProblemDetails(options =>
            options.CustomizeProblemDetails = context =>
                context.ProblemDetails.Extensions["traceId"] = context.HttpContext.TraceIdentifier);
        builder.Services.AddAuthorization();
        builder.Services.AddSingleton<IEmailSender, SmtpEmailSender>();
        builder.Services.AddEndpointsApiExplorer();
        builder.Services.AddSwaggerGen();

        AddDatabase(builder);
        AddAuthentication(builder);
        AddRateLimiting(builder);
        AddHealthChecks(builder.Services);
        AddProxyForwarding(builder);
        AddCors(builder);
        return builder;
    }

    private static void ConfigureLogging(WebApplicationBuilder builder)
    {
        if (!builder.Environment.IsProduction()) return;
        builder.Logging.ClearProviders();
        builder.Logging.AddJsonConsole(options => options.TimestampFormat = "yyyy-MM-ddTHH:mm:ss.fffZ");
    }

    private static void AddDatabase(WebApplicationBuilder builder)
    {
        var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("ConnectionStrings:DefaultConnection must contain a PostgreSQL connection string.");
        builder.Services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(PostgresConnectionString.Normalize(connectionString)));
    }

    private static void AddAuthentication(WebApplicationBuilder builder)
    {
        var key = builder.Configuration["Jwt:Key"]!;
        builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = false,
                    ValidateAudience = false,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key))
                };
                options.Events = new JwtBearerEvents
                {
                    OnTokenValidated = async context =>
                    {
                        var userIdValue = context.Principal?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
                        var stampValue = context.Principal?.FindFirst("security_stamp")?.Value;
                        if (!Guid.TryParse(userIdValue, out var userId) || !Guid.TryParse(stampValue, out var stamp))
                        {
                            context.Fail("Invalid account token.");
                            return;
                        }

                        var database = context.HttpContext.RequestServices.GetRequiredService<AppDbContext>();
                        if (!await database.Users.AnyAsync(user => user.Id == userId && user.SecurityStamp == stamp))
                            context.Fail("This account token is no longer valid.");
                    }
                };
            });
    }

    private static void AddRateLimiting(WebApplicationBuilder builder) =>
        builder.Services.AddRateLimiter(options =>
        {
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            options.AddPolicy("auth", context => RateLimitPartition.GetFixedWindowLimiter(
                context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = builder.Environment.IsEnvironment("Testing") ? 10_000 : 10,
                    Window = TimeSpan.FromMinutes(1),
                    QueueLimit = 0,
                    AutoReplenishment = true
                }));
        });

    private static void AddHealthChecks(IServiceCollection services) =>
        services.AddHealthChecks()
            .AddCheck("self", () => HealthCheckResult.Healthy(), tags: ["live"])
            .AddCheck<DatabaseHealthCheck>("database", tags: ["ready"])
            .AddCheck<AccountEmailHealthCheck>("account-email", tags: ["ready"]);

    private static void AddProxyForwarding(WebApplicationBuilder builder)
    {
        if (!builder.Configuration.GetValue<bool>("Proxy:ForwardedHeadersEnabled")) return;
        builder.Services.Configure<ForwardedHeadersOptions>(options =>
        {
            options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
            options.ForwardLimit = 1;
            options.KnownIPNetworks.Clear();
            options.KnownProxies.Clear();
        });
    }

    private static void AddCors(WebApplicationBuilder builder)
    {
        var origins = AllowedOrigins.Resolve(builder.Configuration);
        builder.Services.AddCors(options => options.AddPolicy("ClientApp", policy =>
            policy.WithOrigins(origins).AllowAnyHeader().AllowAnyMethod()));
    }

    private static void ValidateCoreConfiguration(IConfiguration configuration)
    {
        var key = configuration["Jwt:Key"] ?? throw new InvalidOperationException("Jwt:Key is missing.");
        if (Encoding.UTF8.GetByteCount(key) < 32)
            throw new InvalidOperationException("Jwt:Key must be at least 32 bytes long.");
    }
}
