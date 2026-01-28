#!/usr/bin/env pwsh
# Script to stop servers, run migration, and restart

Write-Host "Stopping servers..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

Write-Host "Running Prisma migration..." -ForegroundColor Cyan
Set-Location "c:\Users\ahmed\OneDrive\Bureau\projet\apps\api"
npx prisma migrate dev --name add_payment_tracking --skip-generate
npx prisma generate

Write-Host "Restarting servers..." -ForegroundColor Green
Set-Location "c:\Users\ahmed\OneDrive\Bureau\projet"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:\Users\ahmed\OneDrive\Bureau\projet\apps\api'; npm run start:dev"
Start-Sleep -Seconds 3
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:\Users\ahmed\OneDrive\Bureau\projet\apps\web'; npm run dev"

Write-Host "Migration complete and servers restarted!" -ForegroundColor Green
