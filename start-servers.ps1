# Stop all Node processes
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Start API server in new window
Start-Process powershell -ArgumentList "-NoExit -Command `"cd 'c:\Users\ahmed\OneDrive\Bureau\FACTURE.TN\projet\projet\apps\api'; npm run start:dev`""

# Wait for API to start
Start-Sleep -Seconds 15

# Start Web server in new window
Start-Process powershell -ArgumentList "-NoExit -Command `"cd 'c:\Users\ahmed\OneDrive\Bureau\FACTURE.TN\projet\projet\apps\web'; npm run dev`""

# Wait for Web to start
Start-Sleep -Seconds 10

Write-Host "SERVERS STARTED!"
Write-Host "API: http://localhost:3001"
Write-Host "WEB: http://localhost:5173"
Write-Host ""
Write-Host "Login with:"
Write-Host "Email: admin@techsolutions.tn"
Write-Host "Password: admin123"
Write-Host ""
Write-Host "Testing login..."
$loginData = @{email = 'admin@techsolutions.tn'; password = 'admin123' } | ConvertTo-Json
try {
    $response = Invoke-WebRequest -Uri 'http://localhost:3001/auth/login' -Method Post -ContentType 'application/json' -Body $loginData -ErrorAction Stop
    $json = $response.Content | ConvertFrom-Json
    Write-Host "LOGIN SUCCESS!"
    Write-Host "Token: $($json.access_token.Substring(0, 20))..."
    Write-Host ""
    Write-Host "Everything works! Go to http://localhost:5173"
}
catch {
    Write-Host "Login error: $_"
    Write-Host "Make sure both servers are running."
}
