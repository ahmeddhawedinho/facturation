#!/usr/bin/env pwsh
# Quick status check for payment system

Write-Host "`n=== PAYMENT SYSTEM STATUS CHECK ===" -ForegroundColor Cyan

# 1. Check Node processes
Write-Host "`n1. Node Processes Running:" -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    $nodeProcesses | Select-Object ProcessName, Id, StartTime | Format-Table -AutoSize
    Write-Host "   ✅ $($nodeProcesses.Count) Node process(es) running" -ForegroundColor Green
}
else {
    Write-Host "   ❌ No Node processes found!" -ForegroundColor Red
    Write-Host "   Run: .\start-servers.ps1" -ForegroundColor Yellow
}

# 2. Check if API is responding
Write-Host "`n2. API Server Status:" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -UseBasicParsing
    Write-Host "   ✅ API Server responding (Status: $($response.StatusCode))" -ForegroundColor Green
}
catch {
    Write-Host "   ❌ API Server not responding" -ForegroundColor Red
    Write-Host "   Check: http://localhost:3000" -ForegroundColor Yellow
}

# 3. Check if Web is responding
Write-Host "`n3. Web Server Status:" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5173" -TimeoutSec 5 -UseBasicParsing
    Write-Host "   ✅ Web Server responding (Status: $($response.StatusCode))" -ForegroundColor Green
}
catch {
    Write-Host "   ❌ Web Server not responding" -ForegroundColor Red
    Write-Host "   Check: http://localhost:5173" -ForegroundColor Yellow
}

# 4. Check Prisma Client
Write-Host "`n4. Prisma Client Status:" -ForegroundColor Yellow
$prismaPath = "c:\Users\ahmed\OneDrive\Bureau\projet\node_modules\.prisma\client"
if (Test-Path $prismaPath) {
    $prismaFiles = Get-ChildItem $prismaPath -File | Measure-Object
    Write-Host "   ✅ Prisma Client exists ($($prismaFiles.Count) files)" -ForegroundColor Green
}
else {
    Write-Host "   ❌ Prisma Client not found!" -ForegroundColor Red
    Write-Host "   Run: cd apps/api; npx prisma generate" -ForegroundColor Yellow
}

# 5. Check schema file
Write-Host "`n5. Schema File Status:" -ForegroundColor Yellow
$schemaPath = "c:\Users\ahmed\OneDrive\Bureau\projet\apps\api\prisma\schema.prisma"
if (Test-Path $schemaPath) {
    $content = Get-Content $schemaPath -Raw
    if ($content -match "paidAmount") {
        Write-Host "   ✅ Schema contains 'paidAmount' field" -ForegroundColor Green
    }
    else {
        Write-Host "   ❌ Schema missing 'paidAmount' field" -ForegroundColor Red
    }
    if ($content -match "model Payment") {
        Write-Host "   ✅ Schema contains 'Payment' model" -ForegroundColor Green
    }
    else {
        Write-Host "   ❌ Schema missing 'Payment' model" -ForegroundColor Red
    }
}
else {
    Write-Host "   ❌ Schema file not found!" -ForegroundColor Red
}

Write-Host "`n=== SUMMARY ===" -ForegroundColor Cyan
Write-Host "If all checks passed (✅), system is ready for testing." -ForegroundColor Green
Write-Host "Follow: PAYMENT_TEST_GUIDE.md for testing procedure." -ForegroundColor Cyan
Write-Host ""
