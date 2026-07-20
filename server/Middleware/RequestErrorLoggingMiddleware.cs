namespace server.Middleware;

public sealed class RequestErrorLoggingMiddleware(
    RequestDelegate next,
    ILogger<RequestErrorLoggingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception exception)
        {
            logger.LogError(
                exception,
                "Unhandled request error. Method={Method} Path={Path} TraceId={TraceId}",
                context.Request.Method,
                context.Request.Path,
                context.TraceIdentifier);
            throw;
        }
    }
}
