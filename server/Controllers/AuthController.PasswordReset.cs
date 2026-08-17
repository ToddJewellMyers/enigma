using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.Auth;
using server.Contracts;

namespace server.Controllers;

public partial class AuthController
{
    [HttpPost("forgot-password")]
    public async Task<ActionResult<MessageResponse>> ForgotPassword(EmailRequest request)
    {
        var response = new MessageResponse("If an account exists for that email, a reset link has been sent.");
        if (!emailSender.IsConfigured)
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new MessageResponse("Password-reset email is temporarily unavailable."));

        var user = await context.Users.SingleOrDefaultAsync(item => item.Email == NormalizeEmail(request.Email));
        if (user is null || user.EmailVerifiedAt is null) return Accepted(response);

        var token = AccountTokenService.CreateToken();
        user.PasswordResetTokenHash = AccountTokenService.HashToken(token);
        user.PasswordResetTokenExpiresAt = DateTime.UtcNow.AddHours(1);
        await context.SaveChangesAsync();

        try
        {
            await emailSender.SendPasswordResetAsync(user.Email, CreatePublicUrl("resetToken", token));
            return Accepted(response);
        }
        catch
        {
            user.PasswordResetTokenHash = null;
            user.PasswordResetTokenExpiresAt = null;
            await context.SaveChangesAsync();
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new MessageResponse("Password-reset email is temporarily unavailable."));
        }
    }

    [HttpPost("reset-password")]
    public async Task<ActionResult<MessageResponse>> ResetPassword(ResetPasswordRequest request)
    {
        var hash = AccountTokenService.HashToken(request.Token);
        var user = await context.Users.SingleOrDefaultAsync(item => item.PasswordResetTokenHash == hash);
        if (user is null || user.PasswordResetTokenExpiresAt <= DateTime.UtcNow || !AccountTokenService.Matches(request.Token, user.PasswordResetTokenHash))
            return BadRequest("This password-reset link is invalid or has expired.");

        user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);
        user.SecurityStamp = Guid.NewGuid();
        user.PasswordResetTokenHash = null;
        user.PasswordResetTokenExpiresAt = null;
        await context.SaveChangesAsync();
        return Ok(new MessageResponse("Your password has been reset. You can now log in."));
    }
}
