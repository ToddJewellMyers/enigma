using System.ComponentModel.DataAnnotations;

namespace server.Contracts;

public record AuthRequest(
    [Required, EmailAddress, MaxLength(254)] string Email,
    [Required, MinLength(8), MaxLength(128)] string Password,
    [MinLength(20), MaxLength(200)] string? InviteToken = null);
public record EmailRequest([Required, EmailAddress, MaxLength(254)] string Email);
public record TokenRequest([Required, MinLength(20), MaxLength(200)] string Token);
public record ResetPasswordRequest(
    [Required, MinLength(20), MaxLength(200)] string Token,
    [Required, MinLength(8), MaxLength(128)] string Password);
public record AuthResponse(string Token, string Email);
public record MessageResponse(string Message);
