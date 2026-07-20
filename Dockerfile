FROM node:24-alpine AS client-build
WORKDIR /src/client
COPY client/package.json client/package-lock.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS server-build
WORKDIR /src
COPY server/server.csproj server/
RUN dotnet restore server/server.csproj
COPY server/ server/
RUN dotnet publish server/server.csproj --configuration Release --output /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=server-build /app/publish ./
COPY --from=client-build /src/client/dist ./wwwroot
ENV ASPNETCORE_URLS=http://0.0.0.0:10000
EXPOSE 10000
USER $APP_UID
ENTRYPOINT ["dotnet", "server.dll"]
