# Script pour redémarrer les serveurs avec les nouvelles configurations Socket.IO
Write-Host "🔄 Redémarrage des serveurs..." -ForegroundColor Cyan

# Stop all Node processes
Write-Host "🛑 Arrêt des processus Node existants..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

# Start API server in new window
Write-Host "🚀 Démarrage du serveur API..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit -Command `"cd 'c:\Users\ahmed\OneDrive\Bureau\projet\apps\api'; npm run start:dev`""

# Wait for API to start
Write-Host "⏳ Attente du démarrage de l'API (15s)..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Start Web server in new window
Write-Host "🚀 Démarrage du serveur Web..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit -Command `"cd 'c:\Users\ahmed\OneDrive\Bureau\projet\apps\web'; npm run dev`""

# Wait for Web to start
Write-Host "⏳ Attente du démarrage du Web (10s)..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

Write-Host ""
Write-Host "✅ SERVEURS DÉMARRÉS!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📡 API: http://localhost:3001" -ForegroundColor White
Write-Host "🌐 WEB: http://localhost:5173" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔐 Identifiants de test:" -ForegroundColor Yellow
Write-Host "   Email: admin@techsolutions.tn" -ForegroundColor White
Write-Host "   Password: admin123" -ForegroundColor White
Write-Host ""
Write-Host "💡 IMPORTANT - Messagerie:" -ForegroundColor Magenta
Write-Host "   Si les messages ne s'envoient pas:" -ForegroundColor White
Write-Host "   1. Vérifiez le point vert à côté de 'MESSAGERIE'" -ForegroundColor White
Write-Host "   2. Désactivez votre bloqueur de publicités" -ForegroundColor White
Write-Host "   3. Regardez la console du navigateur (F12)" -ForegroundColor White
Write-Host ""

# Test login
Write-Host "🧪 Test de connexion..." -ForegroundColor Cyan
$loginData = @{email = 'admin@techsolutions.tn'; password = 'admin123' } | ConvertTo-Json
try {
    $response = Invoke-WebRequest -Uri 'http://localhost:3001/auth/login' -Method Post -ContentType 'application/json' -Body $loginData -ErrorAction Stop
    $json = $response.Content | ConvertFrom-Json
    Write-Host "✅ LOGIN SUCCESS!" -ForegroundColor Green
    Write-Host "   Token: $($json.access_token.Substring(0, 20))..." -ForegroundColor Gray
    Write-Host ""
    Write-Host "🎉 Tout fonctionne! Allez sur http://localhost:5173" -ForegroundColor Green
}
catch {
    Write-Host "❌ Erreur de login: $_" -ForegroundColor Red
    Write-Host "   Assurez-vous que les deux serveurs sont en cours d'exécution." -ForegroundColor Yellow
}
