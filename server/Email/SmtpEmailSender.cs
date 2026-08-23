using System.Net;
using System.Net.Mail;

namespace server.Email;

public sealed class SmtpEmailSender(IConfiguration configuration, ILogger<SmtpEmailSender> logger) : IEmailSender
{
    private readonly string? _host = configuration["Email:Smtp:Host"]?.Trim();
    private readonly string? _username = configuration["Email:Smtp:Username"]?.Trim();
    private readonly string? _password = configuration["Email:Smtp:Password"]?.Replace(" ", string.Empty).Trim();
    private readonly string? _fromAddress = configuration["Email:FromAddress"]?.Trim();
    private readonly string _fromName = configuration["Email:FromName"] ?? "Sweet Mahogany Boards";
    private readonly int _port = configuration.GetValue("Email:Smtp:Port", 587);
    private readonly bool _enableSsl = configuration.GetValue("Email:Smtp:EnableSsl", true);

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(_host) &&
        !string.IsNullOrWhiteSpace(_fromAddress) &&
        !string.IsNullOrWhiteSpace(_username) &&
        !string.IsNullOrWhiteSpace(_password);

    public Task SendEmailVerificationAsync(string recipient, string verificationUrl) => SendAsync(
        recipient,
        "Verify your Sweet Mahogany Boards email",
        $"Welcome to Sweet Mahogany Boards. Verify your email by opening this link:\n\n{verificationUrl}\n\nThis link expires in 24 hours.");

    public Task SendPasswordResetAsync(string recipient, string resetUrl) => SendAsync(
        recipient,
        "Reset your Sweet Mahogany Boards password",
        $"Reset your Sweet Mahogany Boards password by opening this link:\n\n{resetUrl}\n\nThis link expires in one hour. If you did not request this, you can ignore this email.");

    public Task SendWorkspaceInvitationAsync(string recipient, string workspaceName, string inviterEmail, string invitationUrl, string role) => SendAsync(
        recipient,
        $"Join {workspaceName} in Sweet Mahogany Boards",
        $"{inviterEmail} invited you to collaborate as a {role} in the {workspaceName} workspace.\n\nAccept the invitation:\n{invitationUrl}\n\nSign in or create an account using this email address. This invitation expires in seven days.");

    private async Task SendAsync(string recipient, string subject, string body)
    {
        if (!IsConfigured)
            throw new InvalidOperationException("Email delivery is not configured.");

        using var message = new MailMessage
        {
            From = new MailAddress(_fromAddress!, _fromName),
            Subject = subject,
            Body = body,
            IsBodyHtml = false
        };
        message.To.Add(recipient);

        using var client = new SmtpClient(_host!, _port)
        {
            EnableSsl = _enableSsl,
            DeliveryMethod = SmtpDeliveryMethod.Network,
            UseDefaultCredentials = false,
            Credentials = new NetworkCredential(_username!, _password!)
        };

        try
        {
            await client.SendMailAsync(message);
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Unable to send account email to {Recipient}", recipient);
            throw;
        }
    }
}
