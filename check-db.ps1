# Script pour diagnostiquer la base de données de messagerie
Write-Host "🔍 Diagnostic de la Base de Données - Messagerie" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Vérifier que Prisma est disponible
Write-Host "1️⃣ Vérification de Prisma..." -ForegroundColor Yellow
cd apps/api

# Compter les utilisateurs
Write-Host ""
Write-Host "2️⃣ Comptage des utilisateurs actifs..." -ForegroundColor Yellow
$userCount = npx prisma db execute --stdin --schema=prisma/schema.prisma <<< "SELECT COUNT(*) FROM \"User\" WHERE \"isActive\" = true;"
Write-Host "   Résultat: $userCount" -ForegroundColor White

# Compter les canaux
Write-Host ""
Write-Host "3️⃣ Comptage des canaux privés..." -ForegroundColor Yellow
$channelCount = npx prisma db execute --stdin --schema=prisma/schema.prisma <<< "SELECT COUNT(*) FROM \"ChatChannel\";"
Write-Host "   Résultat: $channelCount" -ForegroundColor White

# Compter les messages
Write-Host ""
Write-Host "4️⃣ Comptage des messages..." -ForegroundColor Yellow
$messageCount = npx prisma db execute --stdin --schema=prisma/schema.prisma <<< "SELECT COUNT(*) FROM \"ChatMessage\";"
Write-Host "   Résultat: $messageCount" -ForegroundColor White

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "💡 Pour plus de détails:" -ForegroundColor Yellow
Write-Host "   1. Ouvrez pgAdmin ou votre client PostgreSQL" -ForegroundColor White
Write-Host "   2. Connectez-vous à la base 'facturation_tn'" -ForegroundColor White
Write-Host "   3. Exécutez le script: check-messagerie-db.sql" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Ouvrir Prisma Studio pour explorer les données:" -ForegroundColor Yellow
Write-Host "   cd apps/api" -ForegroundColor White
Write-Host "   npx prisma studio" -ForegroundColor White
Write-Host ""

cd ../..
