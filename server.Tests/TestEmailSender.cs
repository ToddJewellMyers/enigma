using server.Email;

namespace server.Tests;

public sealed class TestEmailSender : IEmailSender
{
    public bool IsConfigured => true;
    public Dictionary<string, string> VerificationUrls { get; } = new(StringComparer.OrdinalIgnoreCase);
    public Dictionary<string, string> ResetUrls { get; } = new(StringComparer.OrdinalIgnoreCase);
    public Dictionary<string, string> InvitationUrls { get; } = new(StringComparer.OrdinalIgnoreCase);
    public bool FailInvitations { get; set; }

    public Task SendEmailVerificationAsync(string recipient, string verificationUrl)
    {
        VerificationUrls[recipient] = verificationUrl;
        return Task.CompletedTask;
    }

    public Task SendPasswordResetAsync(string recipient, string resetUrl)
    {
        ResetUrls[recipient] = resetUrl;
        return Task.CompletedTask;
    }

    public Task SendWorkspaceInvitationAsync(string recipient, string workspaceName, string inviterEmail, string invitationUrl, string role)
    {
        if (FailInvitations) throw new InvalidOperationException("Simulated SMTP failure.");
        InvitationUrls[recipient] = invitationUrl;
        return Task.CompletedTask;
    }
}
