namespace server.Extensions;

internal static class AllowedOrigins
{
    public static string[] Resolve(IConfiguration configuration)
    {
        var configured = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()?
            .Select(origin => origin.Trim().TrimEnd('/'))
            .Where(origin => !string.IsNullOrWhiteSpace(origin)) ?? [];
        var renderHostname = configuration["RENDER_EXTERNAL_HOSTNAME"];
        var origins = configured
            .Concat(string.IsNullOrWhiteSpace(renderHostname) ? [] : [$"https://{renderHostname}"])
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        if (origins.Length == 0)
            throw new InvalidOperationException("At least one Cors:AllowedOrigins entry must be configured.");
        foreach (var origin in origins)
        {
            if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri) ||
                (uri.Scheme != Uri.UriSchemeHttps && uri.Scheme != Uri.UriSchemeHttp) || origin.Contains('*'))
                throw new InvalidOperationException($"Invalid CORS origin '{origin}'. Use an exact http or https origin without wildcards.");
        }
        return origins;
    }
}
