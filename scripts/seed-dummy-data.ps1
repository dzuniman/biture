# Seed dummy data into the Quote2Cash PostgreSQL database.
# Run this once, then remove or ignore the script.

Set-Location -Path "$(Split-Path -Parent $MyInvocation.MyCommand.Path)\..\Quote2Cash.API"

Write-Host "Seeding dummy data into Quote2Cash database..."

dotnet run --project "..\Quote2Cash.API\Quote2Cash.API.csproj" -- --seed-data

Write-Host "Seed script completed."
