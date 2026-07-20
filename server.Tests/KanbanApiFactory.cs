using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using server.Data;

namespace server.Tests;

public class KanbanApiFactory : WebApplicationFactory<Program>
{
    private readonly string _databaseName = $"kanban-tests-{Guid.NewGuid()}";

    static KanbanApiFactory()
    {
        Environment.SetEnvironmentVariable("ConnectionStrings__DefaultConnection", "Host=unused;Database=unused;Username=unused;Password=unused");
        Environment.SetEnvironmentVariable("Jwt__Key", "integration-test-key-with-at-least-32-characters");
        Environment.SetEnvironmentVariable("Cors__AllowedOrigins__0", "http://localhost:5173");
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureServices(services =>
        {
            var descriptor = services.Single(service =>
                service.ServiceType == typeof(DbContextOptions<AppDbContext>));
            services.Remove(descriptor);
            var inMemoryProvider = new ServiceCollection()
                .AddEntityFrameworkInMemoryDatabase()
                .BuildServiceProvider();
            services.AddDbContext<AppDbContext>(options =>
                options.UseInMemoryDatabase(_databaseName)
                    .UseInternalServiceProvider(inMemoryProvider));
        });
    }
}
