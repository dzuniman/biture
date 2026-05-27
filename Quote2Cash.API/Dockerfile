FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy everything (solution + projects)
COPY . .

# Restore and publish from the solution file
RUN dotnet restore Quote2Cash.sln
RUN dotnet publish Quote2Cash.API/Quote2Cash.API.csproj -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "Quote2Cash.API.dll"]
