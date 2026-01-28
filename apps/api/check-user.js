const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const userId = 'f1954998-0ca6-475c-b96e-91965d9bc180';

async function checkUser() {
    try {
        console.log('='.repeat(60));
        console.log('Recherche de l\'utilisateur:', userId);
        console.log('='.repeat(60));
        console.log('');

        const user = await prisma.user.findUnique({
            where: { id: userId },
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
            console.log('');
            console.log('ID:        ', user.id);
            console.log('Nom:       ', user.firstName, user.lastName);
            console.log('Email:     ', user.email);
            console.log('Role:      ', user.role);
            console.log('CompanyId: ', user.companyId);
            console.log('Actif:     ', user.isActive);
            console.log('Créé le:   ', user.createdAt);
            console.log('');

            if (!user.isActive) {
                console.log('⚠️  ATTENTION: L\'utilisateur est DÉSACTIVÉ (isActive = false)');
                console.log('');
                console.log('Solution: Ouvrez Prisma Studio et changez isActive à true');
                console.log('  cd apps/api');
                console.log('  npx prisma studio');
            }
        } else {
            console.log('❌ UTILISATEUR NON TROUVÉ dans la base de données');
            console.log('');
            console.log('Cet ID n\'existe pas. Recherche d\'utilisateurs actifs...');
            console.log('');

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
                take: 10,
                orderBy: { createdAt: 'desc' }
            });

            console.log(`Trouvé ${allUsers.length} utilisateur(s) actif(s):`);
            console.log('');

            allUsers.forEach((u, index) => {
                console.log(`${index + 1}. ${u.firstName} ${u.lastName}`);
                console.log(`   Email:     ${u.email}`);
                console.log(`   ID:        ${u.id}`);
                console.log(`   Role:      ${u.role}`);
                console.log(`   CompanyId: ${u.companyId}`);
                console.log('');
            });

            console.log('='.repeat(60));
            console.log('SOLUTION:');
            console.log('='.repeat(60));
            console.log('');
            console.log('1. Déconnectez-vous de l\'application');
            console.log('2. Effacez le localStorage:');
            console.log('   - Ouvrez la console (F12)');
            console.log('   - Tapez: localStorage.clear()');
            console.log('   - Appuyez sur Entrée');
            console.log('3. Rechargez la page (Ctrl + F5)');
            console.log('4. Reconnectez-vous avec un compte valide ci-dessus');
            console.log('');
        }
    } catch (error) {
        console.error('❌ Erreur:', error.message);
        console.error(error.stack);
    } finally {
        await prisma.$disconnect();
    }
}

checkUser();
