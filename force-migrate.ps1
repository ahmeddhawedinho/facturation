Write-Host "===============================" -ForegroundColor Red
Write-Host "FORCE MIGRATION" -ForegroundColor Red
Write-Host "===============================" -ForegroundColor Red
Write-Host ""

Write-Host "[1/5] Stopping all Node.js processes..." -ForegroundColor Yellow
taskkill /F /IM node.exe 2>$null
Start-Sleep -Seconds 2
Write-Host "Done" -ForegroundColor Green

Write-Host ""
Write-Host "[2/5] Navigating to apps/api..." -ForegroundColor Yellow
Set-Location -Path "apps/api"

Write-Host ""
Write-Host "[3/5] Cleaning old Prisma client..." -ForegroundColor Yellow
Remove-Item -Path "node_modules/.prisma" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "Done" -ForegroundColor Green

Write-Host ""
Write-Host "[4/5] Running migration..." -ForegroundColor Yellow
npx prisma migrate dev --name add_accountant_access_code --skip-generate

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Migration failed!" -ForegroundColor Red
    Set-Location -Path "../.."
    exit 1
}

Write-Host ""
Write-Host "[5/5] Generating NEW Prisma Client..." -ForegroundColor Yellow
npx prisma generate

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Generation failed!" -ForegroundColor Red
    Set-Location -Path "../.."
    exit 1
}

Set-Location -Path "../.."

Write-Host ""
Write-Host "===============================" -ForegroundColor Green
Write-Host "MIGRATION COMPLETE!" -ForegroundColor Green
Write-Host "===============================" -ForegroundColor Green
Write-Host ""
Write-Host "Now run:" -ForegroundColor Yellow
Write-Host "  ./start-servers.ps1" -ForegroundColor Cyan
Write-Host ""
