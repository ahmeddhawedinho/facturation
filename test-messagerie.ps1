# Script de test rapide pour la messagerie
Write-Host "🧪 Test de la Messagerie Socket.IO" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Vérifier que les serveurs tournent
Write-Host "1️⃣ Vérification des processus Node..." -ForegroundColor Yellow
$nodeProcesses = Get-Process node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "   ✅ $($nodeProcesses.Count) processus Node en cours d'exécution" -ForegroundColor Green
}
else {
    Write-Host "   ❌ Aucun processus Node trouvé!" -ForegroundColor Red
    Write-Host "   Exécutez: .\restart-servers.ps1" -ForegroundColor Yellow
    exit
}

Write-Host ""
Write-Host "2️⃣ Test de l'API..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri 'http://localhost:3001/auth/login' -Method Post -ContentType 'application/json' -Body '{"email":"admin@techsolutions.tn","password":"admin123"}' -ErrorAction Stop
    $json = $response.Content | ConvertFrom-Json
    $token = $json.access_token
    Write-Host "   ✅ API accessible - Token reçu" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "3️⃣ Test de l'endpoint Chat Users..." -ForegroundColor Yellow
    try {
        $headers = @{
            "Authorization" = "Bearer $token"
        }
        $usersResponse = Invoke-WebRequest -Uri 'http://localhost:3001/chat/users' -Headers $headers -ErrorAction Stop
        $users = $usersResponse.Content | ConvertFrom-Json
        Write-Host "   ✅ Endpoint Chat Users accessible - $($users.Count) utilisateurs trouvés" -ForegroundColor Green
    }
    catch {
        Write-Host "   ❌ Erreur endpoint Chat Users: $_" -ForegroundColor Red
    }
    
}
catch {
    Write-Host "   ❌ API non accessible: $_" -ForegroundColor Red
    Write-Host "   Vérifiez que le serveur API est démarré" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "4️⃣ Test du serveur Web..." -ForegroundColor Yellow
try {
    $webResponse = Invoke-WebRequest -Uri 'http://localhost:5173' -ErrorAction Stop
    Write-Host "   ✅ Serveur Web accessible" -ForegroundColor Green
}
catch {
    Write-Host "   ❌ Serveur Web non accessible: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📋 RÉSUMÉ DES TESTS" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Corrections appliquées:" -ForegroundColor Green
Write-Host "   • Configuration CORS Socket.IO améliorée" -ForegroundColor White
Write-Host "   • Gestion des erreurs de connexion" -ForegroundColor White
Write-Host "   • Correction des contraintes de clé étrangère" -ForegroundColor White
Write-Host "   • Indicateur visuel de connexion (point vert/rouge)" -ForegroundColor White
Write-Host ""
Write-Host "🔍 Prochaines étapes:" -ForegroundColor Yellow
Write-Host "   1. Ouvrez http://localhost:5173" -ForegroundColor White
Write-Host "   2. Connectez-vous (admin@techsolutions.tn / admin123)" -ForegroundColor White
Write-Host "   3. Allez dans Messagerie" -ForegroundColor White
Write-Host "   4. Vérifiez le point vert à côté de 'MESSAGERIE'" -ForegroundColor White
Write-Host "   5. Ouvrez la console (F12) pour voir les logs" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Si les messages ne s'envoient toujours pas:" -ForegroundColor Magenta
Write-Host "   • Désactivez votre bloqueur de publicités" -ForegroundColor White
Write-Host "   • Vérifiez la console pour 'ERR_BLOCKED_BY_CLIENT'" -ForegroundColor White
Write-Host "   • Consultez MESSAGERIE_DIAGNOSTIC.md" -ForegroundColor White
Write-Host ""
