using Microsoft.Extensions.Diagnostics.HealthChecks;
using server.Email;

namespace server.Monitoring;

public sealed class AccountEmailHealthCheck(IEmailSender emailSender, IConfiguration configuration) : IHealthCheck
{
    public Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        if (!emailSender.IsConfigured)
            return Task.FromResult(HealthCheckResult.Unhealthy("SMTP email delivery is not configured."));

        var publicUrl = configuration["PublicAppUrl"];
        if (!Uri.TryCreate(publicUrl, UriKind.Absolute, out var uri) ||
            (uri.Scheme != Uri.UriSchemeHttps && uri.Scheme != Uri.UriSchemeHttp))
            return Task.FromResult(HealthCheckResult.Unhealthy("PublicAppUrl must be an absolute HTTP or HTTPS URL."));

        return Task.FromResult(HealthCheckResult.Healthy());
    }
}
