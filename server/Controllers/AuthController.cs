using System.ComponentModel.DataAnnotations;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using server.Auth;
using server.Data;
using server.Email;
using server.Models;

namespace server.Controllers;

[ApiController]
[Route("api/[controller]")]
[EnableRateLimiting("auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly IEmailSender _emailSender;
    private readonly PasswordHasher<AppUser> _passwordHasher = new();

    public AuthController(AppDbContext context, IConfiguration configuration, IEmailSender emailSender)
    {
        _context = context;
        _configuration = configuration;
        _emailSender = emailSender;
    }

    [HttpPost("register")]
    public async Task<ActionResult<MessageResponse>> Register(AuthRequest request)
    {
        if (!_emailSender.IsConfigured)
            return Problem(statusCode: StatusCodes.Status503ServiceUnavailable, detail: "Account email delivery is temporarily unavailable.");

        var email = NormalizeEmail(request.Email);
        var existingUser = await _context.Users.SingleOrDefaultAsync(user => user.Email == email);
        if (existingUser?.EmailVerifiedAt is not null)
            return Conflict("An account with this email already exists.");

        if (existingUser is not null)
        {
            var replacementToken = AccountTokenService.CreateToken();
            existingUser.EmailVerificationTokenHash = AccountTokenService.HashToken(replacementToken);
            existingUser.EmailVerificationTokenExpiresAt = DateTime.UtcNow.AddHours(24);
            await _context.SaveChangesAsync();
            try
            {
                await _emailSender.SendEmailVerificationAsync(email, CreatePublicUrl("verifyToken", replacementToken));
                return Accepted(new MessageResponse("Check your email to verify your account."));
            }
            catch
            {
                return Problem(statusCode: StatusCodes.Status503ServiceUnavailable, detail: "We could not send the verification email. Please try again later.");
            }
        }

        var token = AccountTokenService.CreateToken();
        var user = new AppUser
        {
            Email = email,
            EmailVerificationTokenHash = AccountTokenService.HashToken(token),
            EmailVerificationTokenExpiresAt = DateTime.UtcNow.AddHours(24)
        };
        user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);
        user.SecurityStamp = Guid.NewGuid();
        _context.Users.Add(user);
        _context.Workspaces.Add(NewUserSeeder.CreateOnboardingWorkspace(user));
        await _context.SaveChangesAsync();

        try
        {
            await _emailSender.SendEmailVerificationAsync(email, CreatePublicUrl("verifyToken", token));
        }
        catch
        {
            var workspaces = await _context.Workspaces.Where(workspace => workspace.UserId == user.Id).ToListAsync();
            _context.Workspaces.RemoveRange(workspaces);
            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            return Problem(statusCode: StatusCodes.Status503ServiceUnavailable, detail: "We could not send the verification email. Please try again later.");
        }

        return Accepted(new MessageResponse("Check your email to verify your account."));
    }

    [HttpPost("verify-email")]
    public async Task<ActionResult<AuthResponse>> VerifyEmail(TokenRequest request)
    {
        var hash = AccountTokenService.HashToken(request.Token);
        var user = await _context.Users.SingleOrDefaultAsync(item => item.EmailVerificationTokenHash == hash);
        if (user is null || user.EmailVerificationTokenExpiresAt <= DateTime.UtcNow || !AccountTokenService.Matches(request.Token, user.EmailVerificationTokenHash))
            return BadRequest("This verification link is invalid or has expired.");

        user.EmailVerifiedAt = DateTime.UtcNow;
        user.EmailVerificationTokenHash = null;
        user.EmailVerificationTokenExpiresAt = null;
        await _context.SaveChangesAsync();
        return Ok(CreateResponse(user));
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(AuthRequest request)
    {
        var email = NormalizeEmail(request.Email);
        var user = await _context.Users.SingleOrDefaultAsync(existingUser => existingUser.Email == email);
        if (user is null || _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password) == PasswordVerificationResult.Failed)
            return Unauthorized("Invalid email or password.");
        if (user.EmailVerifiedAt is null)
            return Unauthorized("Verify your email before logging in.");
        return Ok(CreateResponse(user));
    }

    [HttpPost("forgot-password")]
    public async Task<ActionResult<MessageResponse>> ForgotPassword(EmailRequest request)
    {
        var response = new MessageResponse("If an account exists for that email, a reset link has been sent.");
        if (!_emailSender.IsConfigured)
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new MessageResponse("Password-reset email is temporarily unavailable."));

        var email = NormalizeEmail(request.Email);
        var user = await _context.Users.SingleOrDefaultAsync(item => item.Email == email);
        if (user is null || user.EmailVerifiedAt is null)
            return Accepted(response);

        var token = AccountTokenService.CreateToken();
        user.PasswordResetTokenHash = AccountTokenService.HashToken(token);
        user.PasswordResetTokenExpiresAt = DateTime.UtcNow.AddHours(1);
        await _context.SaveChangesAsync();

        try
        {
            await _emailSender.SendPasswordResetAsync(email, CreatePublicUrl("resetToken", token));
        }
        catch
        {
            user.PasswordResetTokenHash = null;
            user.PasswordResetTokenExpiresAt = null;
            await _context.SaveChangesAsync();
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new MessageResponse("Password-reset email is temporarily unavailable."));
        }

        return Accepted(response);
    }

    [HttpPost("reset-password")]
    public async Task<ActionResult<MessageResponse>> ResetPassword(ResetPasswordRequest request)
    {
        var hash = AccountTokenService.HashToken(request.Token);
        var user = await _context.Users.SingleOrDefaultAsync(item => item.PasswordResetTokenHash == hash);
        if (user is null || user.PasswordResetTokenExpiresAt <= DateTime.UtcNow || !AccountTokenService.Matches(request.Token, user.PasswordResetTokenHash))
            return BadRequest("This password-reset link is invalid or has expired.");

        user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);
        user.PasswordResetTokenHash = null;
        user.PasswordResetTokenExpiresAt = null;
        await _context.SaveChangesAsync();
        return Ok(new MessageResponse("Your password has been reset. You can now log in."));
    }

    private string CreatePublicUrl(string parameter, string token)
    {
        var baseUrl = _configuration["PublicAppUrl"]?.TrimEnd('/')
            ?? throw new InvalidOperationException("PublicAppUrl is missing.");
        return $"{baseUrl}/?{parameter}={Uri.EscapeDataString(token)}";
    }

    private static string NormalizeEmail(string email) => email.Trim().ToLowerInvariant();

    private AuthResponse CreateResponse(AppUser user)
    {
        var key = _configuration["Jwt:Key"] ?? throw new InvalidOperationException("Jwt:Key is missing.");
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim("security_stamp", user.SecurityStamp.ToString())
        };
        var token = new JwtSecurityToken(
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: new SigningCredentials(new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)), SecurityAlgorithms.HmacSha256));
        return new AuthResponse(new JwtSecurityTokenHandler().WriteToken(token), user.Email);
    }
}

public record AuthRequest(
    [Required, EmailAddress, MaxLength(254)] string Email,
    [Required, MinLength(8), MaxLength(128)] string Password);
public record EmailRequest([Required, EmailAddress, MaxLength(254)] string Email);
public record TokenRequest([Required, MinLength(20), MaxLength(200)] string Token);
public record ResetPasswordRequest(
    [Required, MinLength(20), MaxLength(200)] string Token,
    [Required, MinLength(8), MaxLength(128)] string Password);
public record AuthResponse(string Token, string Email);
public record MessageResponse(string Message);
