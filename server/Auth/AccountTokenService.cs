using System.Security.Cryptography;
using System.Text;

namespace server.Auth;

public static class AccountTokenService
{
    public static string CreateToken() => Convert.ToBase64String(RandomNumberGenerator.GetBytes(32))
        .TrimEnd('=')
        .Replace('+', '-')
        .Replace('/', '_');

    public static string HashToken(string token) => Convert.ToHexString(
        SHA256.HashData(Encoding.UTF8.GetBytes(token)));

    public static bool Matches(string token, string? expectedHash) =>
        !string.IsNullOrWhiteSpace(expectedHash) &&
        CryptographicOperations.FixedTimeEquals(
            Convert.FromHexString(HashToken(token)),
            Convert.FromHexString(expectedHash));
}
