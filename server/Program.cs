using server.Extensions;

var builder = WebApplication.CreateBuilder(args);
builder.AddApplicationServices();

var app = builder.Build();
await app.ConfigureApplicationAsync();
app.Run();

public partial class Program { }
