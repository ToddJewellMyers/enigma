using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using server.Contracts;
using server.Data;
using server.Email;
using server.Models;

namespace server.Controllers;

[ApiController]
[Route("api/[controller]")]
[EnableRateLimiting("auth")]
public partial class AuthController(
    AppDbContext context,
    IConfiguration configuration,
    IEmailSender emailSender) : ControllerBase
{
    private readonly PasswordHasher<AppUser> _passwordHasher = new();

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(AuthRequest request)
    {
        var email = NormalizeEmail(request.Email);
        var user = await context.Users.SingleOrDefaultAsync(existingUser => existingUser.Email == email);
        if (user is null || _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password) == PasswordVerificationResult.Failed)
            return Unauthorized("Invalid email or password.");
        if (user.EmailVerifiedAt is null)
            return Unauthorized("Verify your email before logging in.");
        return Ok(CreateResponse(user));
    }

    private string CreatePublicUrl(string parameter, string token)
    {
        var baseUrl = configuration["PublicAppUrl"]?.TrimEnd('/')
            ?? throw new InvalidOperationException("PublicAppUrl is missing.");
        return $"{baseUrl}/?{parameter}={Uri.EscapeDataString(token)}";
    }

    private static string NormalizeEmail(string email) => email.Trim().ToLowerInvariant();

    private AuthResponse CreateResponse(AppUser user)
    {
        var key = configuration["Jwt:Key"] ?? throw new InvalidOperationException("Jwt:Key is missing.");
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
