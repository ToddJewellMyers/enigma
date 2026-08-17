namespace server.Email;

public interface IEmailSender
{
    bool IsConfigured { get; }
    Task SendEmailVerificationAsync(string recipient, string verificationUrl);
    Task SendPasswordResetAsync(string recipient, string resetUrl);
}
