using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.EntityFrameworkCore;
using server.Data;
using server.Middleware;
using server.Realtime;

namespace server.Extensions;

public static class ApplicationPipelineExtensions
{
    public static async Task ConfigureApplicationAsync(this WebApplication app)
    {
        await ApplyMigrationsAsync(app);

        if (app.Configuration.GetValue<bool>("Proxy:ForwardedHeadersEnabled")) app.UseForwardedHeaders();
        if (!app.Environment.IsDevelopment() && !app.Environment.IsEnvironment("Testing"))
        {
            app.UseHsts();
            app.UseHttpsRedirection();
        }

        app.UseExceptionHandler();
        app.UseMiddleware<RequestErrorLoggingMiddleware>();
        app.UseMiddleware<SecurityHeadersMiddleware>();
        app.UseDefaultFiles();
        app.UseStaticFiles();

        if (app.Environment.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI();
        }

        app.UseCors("ClientApp");
        app.UseRateLimiter();
        app.UseAuthentication();
        app.UseAuthorization();
        MapEndpoints(app);
    }

    private static async Task ApplyMigrationsAsync(WebApplication app)
    {
        if (!app.Configuration.GetValue<bool>("Database:ApplyMigrationsOnStartup")) return;
        await using var scope = app.Services.CreateAsyncScope();
        await scope.ServiceProvider.GetRequiredService<AppDbContext>().Database.MigrateAsync();
    }

    private static void MapEndpoints(WebApplication app)
    {
        app.MapControllers();
        app.MapHub<WorkspaceHub>("/hubs/workspaces");
        app.MapHealthChecks("/health/live", new HealthCheckOptions { Predicate = check => check.Tags.Contains("live") });
        app.MapHealthChecks("/health/ready", new HealthCheckOptions { Predicate = check => check.Tags.Contains("ready") });
        app.MapFallbackToFile("index.html");
    }
}
