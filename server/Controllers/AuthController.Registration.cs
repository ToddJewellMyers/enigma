using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using server.Auth;
using server.Contracts;
using server.Data;
using server.Models;

namespace server.Controllers;

public partial class AuthController
{
    [HttpPost("register")]
    public async Task<ActionResult<object>> Register(AuthRequest request)
    {
        var email = NormalizeEmail(request.Email);
        var invitedRegistration = await HasValidInvitation(email, request.InviteToken);
        if (!emailSender.IsConfigured && !invitedRegistration)
            return Problem(statusCode: StatusCodes.Status503ServiceUnavailable, detail: "Account email delivery is temporarily unavailable.");

        var existingUser = await context.Users.SingleOrDefaultAsync(user => user.Email == email);
        if (existingUser?.EmailVerifiedAt is not null)
            return Conflict("An account with this email already exists.");
        if (existingUser is not null)
            return await ResendVerification(existingUser);

        var token = AccountTokenService.CreateToken();
        var user = new AppUser
        {
            Email = email,
            EmailVerificationTokenHash = AccountTokenService.HashToken(token),
            EmailVerificationTokenExpiresAt = DateTime.UtcNow.AddHours(24)
        };
        if (invitedRegistration)
        {
            user.EmailVerifiedAt = DateTime.UtcNow;
            user.EmailVerificationTokenHash = null;
            user.EmailVerificationTokenExpiresAt = null;
        }
        user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);
        context.Users.Add(user);
        context.Workspaces.Add(NewUserSeeder.CreateOnboardingWorkspace(user));
        await context.SaveChangesAsync();

        // Possession of a valid invitation sent by a workspace owner verifies the
        // invited address without depending on SMTP. The invitation itself is
        // still consumed by the authenticated invitation-acceptance endpoint.
        if (invitedRegistration)
            return Ok(CreateResponse(user));

        try
        {
            await emailSender.SendEmailVerificationAsync(email, CreatePublicUrl("verifyToken", token));
            return Accepted(new MessageResponse("Check your email to verify your account."));
        }
        catch
        {
            var workspaces = await context.Workspaces.Where(workspace => workspace.UserId == user.Id).ToListAsync();
            context.Workspaces.RemoveRange(workspaces);
            context.Users.Remove(user);
            await context.SaveChangesAsync();
            return Problem(statusCode: StatusCodes.Status503ServiceUnavailable, detail: "We could not send the verification email. Please try again later.");
        }
    }

    private async Task<bool> HasValidInvitation(string email, string? token)
    {
        if (string.IsNullOrWhiteSpace(token)) return false;
        var hash = AccountTokenService.HashToken(token);
        var invitation = await context.WorkspaceInvitations.SingleOrDefaultAsync(item => item.TokenHash == hash);
        return invitation is not null
            && invitation.ExpiresAt > DateTime.UtcNow
            && string.Equals(invitation.Email, email, StringComparison.OrdinalIgnoreCase)
            && AccountTokenService.Matches(token, invitation.TokenHash);
    }

    [HttpPost("verify-email")]
    public async Task<ActionResult<AuthResponse>> VerifyEmail(TokenRequest request)
    {
        var hash = AccountTokenService.HashToken(request.Token);
        var user = await context.Users.SingleOrDefaultAsync(item => item.EmailVerificationTokenHash == hash);
        if (user is null || user.EmailVerificationTokenExpiresAt <= DateTime.UtcNow || !AccountTokenService.Matches(request.Token, user.EmailVerificationTokenHash))
            return BadRequest("This verification link is invalid or has expired.");

        user.EmailVerifiedAt = DateTime.UtcNow;
        user.EmailVerificationTokenHash = null;
        user.EmailVerificationTokenExpiresAt = null;
        await context.SaveChangesAsync();
        return Ok(CreateResponse(user));
    }

    private async Task<ActionResult<object>> ResendVerification(AppUser user)
    {
        var token = AccountTokenService.CreateToken();
        user.EmailVerificationTokenHash = AccountTokenService.HashToken(token);
        user.EmailVerificationTokenExpiresAt = DateTime.UtcNow.AddHours(24);
        await context.SaveChangesAsync();
        try
        {
            await emailSender.SendEmailVerificationAsync(user.Email, CreatePublicUrl("verifyToken", token));
            return Accepted(new MessageResponse("Check your email to verify your account."));
        }
        catch
        {
            return Problem(statusCode: StatusCodes.Status503ServiceUnavailable, detail: "We could not send the verification email. Please try again later.");
        }
    }
}
