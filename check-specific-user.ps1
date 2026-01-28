# Script pour vérifier un utilisateur spécifique
$userId = "8f8fa08e-9662-44ad-a26c-c39d6cf3639a"

Write-Host "🔍 Recherche de l'utilisateur: $userId" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

cd apps/api

Write-Host "📊 Exécution de la requête Prisma..." -ForegroundColor Yellow
Write-Host ""

# Créer un script Node.js temporaire pour vérifier l'utilisateur
$script = @"
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUser() {
    try {
        const user = await prisma.user.findUnique({
            where: { id: '$userId' },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                companyId: true,
                isActive: true,
                createdAt: true
            }
        });

        if (user) {
            console.log('✅ UTILISATEUR TROUVÉ:');
            console.log(JSON.stringify(user, null, 2));
        } else {
            console.log('❌ UTILISATEUR NON TROUVÉ');
            console.log('');
            console.log('Recherche d\'utilisateurs similaires...');
            
            const allUsers = await prisma.user.findMany({
                where: { isActive: true },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    role: true,
                    companyId: true
                },
                take: 10
            });
            
            console.log('');
            console.log('Utilisateurs actifs trouvés:');
            console.log(JSON.stringify(allUsers, null, 2));
        }
    } catch (error) {
        console.error('❌ Erreur:', error.message);
    } finally {
        await prisma.\$disconnect();
    }
}

checkUser();
"@

# Sauvegarder le script
$script | Out-File -FilePath "check-user-temp.js" -Encoding UTF8

# Exécuter le script
node check-user-temp.js

# Nettoyer
Remove-Item "check-user-temp.js" -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Solutions possibles:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1️⃣ Si l'utilisateur n'existe pas:" -ForegroundColor White
Write-Host "   - Déconnectez-vous de l'application" -ForegroundColor Gray
Write-Host "   - Effacez le localStorage (F12 > Console > localStorage.clear())" -ForegroundColor Gray
Write-Host "   - Reconnectez-vous avec: admin@techsolutions.tn / admin123" -ForegroundColor Gray
Write-Host ""
Write-Host "2️⃣ Si l'utilisateur existe mais isActive = false:" -ForegroundColor White
Write-Host "   - Ouvrez Prisma Studio: npx prisma studio" -ForegroundColor Gray
Write-Host "   - Trouvez l'utilisateur et changez isActive à true" -ForegroundColor Gray
Write-Host ""
Write-Host "3️⃣ Si un autre utilisateur existe:" -ForegroundColor White
Write-Host "   - Utilisez l'ID de cet utilisateur pour vous connecter" -ForegroundColor Gray
Write-Host ""

cd ../..
