# Base image for running ASP.NET Core apps
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80

# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy everything from the repo
COPY . .

# Restore and publish the API project
RUN dotnet restore Quote2Cash.API/Quote2Cash.API.csproj
RUN dotnet publish Quote2Cash.API/Quote2Cash.API.csproj -c Release -o /app/publish

# Final stage
FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "Quote2Cash.API.dll"]
