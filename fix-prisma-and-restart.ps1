#!/usr/bin/env pwsh
# Script to fix Prisma Client and restart servers

Write-Host "=== FIXING PRISMA CLIENT ===" -ForegroundColor Cyan

# Step 1: Stop all Node processes
Write-Host "`n1. Stopping all Node processes..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 3

# Step 2: Clean Prisma cache
Write-Host "`n2. Cleaning Prisma cache..." -ForegroundColor Yellow
Remove-Item "c:\Users\ahmed\OneDrive\Bureau\projet\node_modules\.prisma" -Recurse -Force -ErrorAction SilentlyContinue

# Step 3: Generate Prisma Client
Write-Host "`n3. Generating Prisma Client..." -ForegroundColor Yellow
Set-Location "c:\Users\ahmed\OneDrive\Bureau\projet\apps\api"
npx prisma generate

# Step 4: Restart API Server
Write-Host "`n4. Starting API server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:\Users\ahmed\OneDrive\Bureau\projet\apps\api'; npm run start:dev"
Start-Sleep -Seconds 5

# Step 5: Restart Web Server
Write-Host "`n5. Starting Web server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:\Users\ahmed\OneDrive\Bureau\projet\apps\web'; npm run dev"

Write-Host "`n=== DONE! Servers are restarting... ===" -ForegroundColor Green
Write-Host "Wait 10-15 seconds for the servers to be fully ready." -ForegroundColor Cyan
