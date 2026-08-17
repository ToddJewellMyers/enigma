using System.Net;
using System.Net.Http.Json;
using Xunit;

namespace server.Tests;

public class AccountLifecycleTests(KanbanApiFactory factory) : WorkflowTestBase(factory), IClassFixture<KanbanApiFactory>
{
    [Fact]
    public async Task Account_requires_email_verification_and_supports_password_reset()
    {
        using var client = Factory.CreateClient();
        var email = $"account-{Guid.NewGuid()}@example.com";
        const string originalPassword = "OriginalPassword123!";
        Assert.Equal(HttpStatusCode.Accepted, (await client.PostAsJsonAsync("/api/auth/register", new { email, password = originalPassword })).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.PostAsJsonAsync("/api/auth/login", new { email, password = originalPassword })).StatusCode);

        var firstUrl = Factory.EmailSender.VerificationUrls[email];
        Assert.Equal(HttpStatusCode.Accepted, (await client.PostAsJsonAsync("/api/auth/register", new { email, password = originalPassword })).StatusCode);
        Assert.NotEqual(firstUrl, Factory.EmailSender.VerificationUrls[email]);
        var verificationToken = GetQueryValue(Factory.EmailSender.VerificationUrls[email], "verifyToken");
        (await client.PostAsJsonAsync("/api/auth/verify-email", new { token = verificationToken })).EnsureSuccessStatusCode();

        Assert.Equal(HttpStatusCode.Accepted, (await client.PostAsJsonAsync("/api/auth/forgot-password", new { email })).StatusCode);
        var resetToken = GetQueryValue(Factory.EmailSender.ResetUrls[email], "resetToken");
        (await client.PostAsJsonAsync("/api/auth/reset-password", new { token = resetToken, password = "UpdatedPassword123!" })).EnsureSuccessStatusCode();
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.PostAsJsonAsync("/api/auth/login", new { email, password = originalPassword })).StatusCode);
        (await client.PostAsJsonAsync("/api/auth/login", new { email, password = "UpdatedPassword123!" })).EnsureSuccessStatusCode();
    }

    [Fact]
    public async Task Account_can_export_all_data_and_delete_itself()
    {
        using var client = await CreateAuthenticatedClient();
        var export = await client.GetAsync("/api/account/export");
        export.EnsureSuccessStatusCode();
        var payload = await export.Content.ReadFromJsonAsync<AccountExportDto>(JsonOptions);
        Assert.Equal("Sweet Mahogany Boards account export", payload!.Product);
        Assert.NotEmpty(payload.Workspaces);

        var wrongPassword = new HttpRequestMessage(HttpMethod.Delete, "/api/account") { Content = JsonContent.Create(new { password = "wrong-password", confirmation = "DELETE" }) };
        Assert.Equal(HttpStatusCode.BadRequest, (await client.SendAsync(wrongPassword)).StatusCode);
        var deletion = new HttpRequestMessage(HttpMethod.Delete, "/api/account") { Content = JsonContent.Create(new { password = "TestPassword123!", confirmation = "DELETE" }) };
        Assert.Equal(HttpStatusCode.NoContent, (await client.SendAsync(deletion)).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, (await client.GetAsync("/api/workspaces")).StatusCode);
    }
}
