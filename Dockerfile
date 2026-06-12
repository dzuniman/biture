FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY . .

# Restore and publish the API project directly
RUN dotnet restore Quote2Cash.API/Quote2Cash.API.csproj
RUN dotnet publish Quote2Cash.API/Quote2Cash.API.csproj -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .

# Run migrations from Persistence project, then start the API
ENTRYPOINT ["bash", "-c", "dotnet ef database update --project Quote2Cash.Persistence --startup-project Quote2Cash.API && dotnet Quote2Cash.API.dll"]
