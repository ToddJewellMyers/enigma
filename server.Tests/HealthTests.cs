using System.Net;
using Xunit;

namespace server.Tests;

public class HealthTests(KanbanApiFactory factory) : IClassFixture<KanbanApiFactory>
{
    [Fact]
    public async Task Health_endpoints_report_live_and_ready()
    {
        using var client = factory.CreateClient();
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/health/live")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/health/ready")).StatusCode);
    }
}
