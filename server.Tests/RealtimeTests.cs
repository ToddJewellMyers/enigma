using System.Net;
using Xunit;

namespace server.Tests;

public class RealtimeTests(KanbanApiFactory factory) : WorkflowTestBase(factory), IClassFixture<KanbanApiFactory>
{
    [Fact]
    public async Task Realtime_negotiation_requires_a_valid_account_token()
    {
        using var anonymous = Factory.CreateClient();
        var unauthorized = await anonymous.PostAsync("/hubs/workspaces/negotiate?negotiateVersion=1", null);
        Assert.Equal(HttpStatusCode.Unauthorized, unauthorized.StatusCode);

        using var authenticated = await CreateAuthenticatedClient();
        var negotiated = await authenticated.PostAsync("/hubs/workspaces/negotiate?negotiateVersion=1", null);
        Assert.Equal(HttpStatusCode.OK, negotiated.StatusCode);
    }
}
