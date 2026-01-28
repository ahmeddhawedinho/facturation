# Script pour vérifier les utilisateurs dans la base de données
Write-Host "👥 Vérification des Utilisateurs - Base de Données" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

Write-Host "📊 Ouverture de Prisma Studio..." -ForegroundColor Yellow
Write-Host "   Cela va ouvrir une interface web pour explorer la base de données" -ForegroundColor White
Write-Host ""
Write-Host "🔍 Dans Prisma Studio:" -ForegroundColor Yellow
Write-Host "   1. Cliquez sur 'User' dans la sidebar" -ForegroundColor White
Write-Host "   2. Vérifiez que votre utilisateur existe" -ForegroundColor White
Write-Host "   3. Vérifiez que 'isActive' = true" -ForegroundColor White
Write-Host "   4. Notez le 'id' et 'companyId'" -ForegroundColor White
Write-Host ""
Write-Host "⏳ Lancement de Prisma Studio..." -ForegroundColor Yellow

cd apps/api
npx prisma studio
