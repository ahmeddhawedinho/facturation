import { PrismaClient, Currency, DocumentType, DocumentStatus, AttributeType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Début du seed...');
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Créer une entreprise de démonstration
    const demoCompany = await prisma.company.upsert({
        where: { fiscalNumber: '1234567ABC' },
        update: {},
        create: {
            name: 'Tech Solutions SARL',
            legalName: 'Tech Solutions Société à Responsabilité Limitée',
            address: '123 Avenue Habib Bourguiba',
            postalCode: '1000',
            city: 'Tunis',
            country: 'Tunisie',
            fiscalNumber: '1234567ABC',
            phone: '+216 71 123 456',
            email: 'contact@techsolutions.tn',
            website: 'www.techsolutions.tn',
            defaultCurrency: Currency.TND,
            invoicePrefix: 'FACT',
            quotePrefix: 'DEVIS',
            creditNotePrefix: 'AVOIR',
        },
    });

    console.log('✅ Entreprise créée:', demoCompany.name);

    // Créer un utilisateur ADMIN de l'entreprise (Le Boss)
    const companyAdmin = await prisma.user.upsert({
        where: { email: 'admin@techsolutions.tn' },
        update: {},
        create: {
            email: 'admin@techsolutions.tn',
            password: hashedPassword,
            firstName: 'Mohamed',
            lastName: 'Ben Ali',
            role: 'ADMIN' as any,
            companyId: demoCompany.id,
        },
    });

    console.log('✅ Admin entreprise créé:', companyAdmin.email);

    // Créer un utilisateur SUB_ACCOUNT (Vendeur Shop)
    const companyUser = await prisma.user.upsert({
        where: { email: 'user@techsolutions.tn' },
        update: {},
        create: {
            email: 'user@techsolutions.tn',
            password: hashedPassword,
            firstName: 'Fatma',
            lastName: 'Trabelsi',
            role: 'SUB_ACCOUNT' as any,
            companyId: demoCompany.id,
        },
    });

    console.log('✅ Utilisateur entreprise créé:', companyUser.email);

    // Créer les taux de TVA tunisiens
    const taxRates = await Promise.all([
        prisma.taxRate.create({
            data: {
                name: 'TVA 19%',
                rate: 19.0,
                isDefault: true,
                companyId: demoCompany.id,
            },
        }),
        prisma.taxRate.create({
            data: {
                name: 'TVA 13%',
                rate: 13.0,
                companyId: demoCompany.id,
            },
        }),
        prisma.taxRate.create({
            data: {
                name: 'TVA 7%',
                rate: 7.0,
                companyId: demoCompany.id,
            },
        }),
        prisma.taxRate.create({
            data: {
                name: 'Exonéré',
                rate: 0.0,
                companyId: demoCompany.id,
            },
        }),
    ]);

    console.log('✅ Taux de TVA créés:', taxRates.length);

    // Créer des taux de change
    await Promise.all([
        prisma.exchangeRate.upsert({
            where: {
                companyId_fromCurrency_toCurrency: {
                    companyId: demoCompany.id,
                    fromCurrency: Currency.EUR,
                    toCurrency: Currency.TND,
                }
            },
            update: { rate: 3.35 },
            create: {
                fromCurrency: Currency.EUR,
                toCurrency: Currency.TND,
                rate: 3.35,
                isManual: true,
                companyId: demoCompany.id,
            },
        }),
        prisma.exchangeRate.upsert({
            where: {
                companyId_fromCurrency_toCurrency: {
                    companyId: demoCompany.id,
                    fromCurrency: Currency.USD,
                    toCurrency: Currency.TND,
                }
            },
            update: { rate: 3.10 },
            create: {
                fromCurrency: Currency.USD,
                toCurrency: Currency.TND,
                rate: 3.10,
                isManual: true,
                companyId: demoCompany.id,
            },
        }),
    ]);

    console.log('✅ Taux de change créés');

    // Créer des clients
    const clients = await Promise.all([
        prisma.client.create({
            data: {
                name: 'ACME Corporation',
                legalName: 'ACME Corporation SARL',
                address: '456 Rue de la République',
                postalCode: '2000',
                city: 'Ariana',
                country: 'Tunisie',
                fiscalNumber: '9876543XYZ',
                phone: '+216 71 987 654',
                email: 'contact@acme.tn',
                companyId: demoCompany.id,
            },
        }),
        prisma.client.create({
            data: {
                name: 'Digital Services',
                legalName: 'Digital Services SA',
                address: '789 Avenue Mohamed V',
                postalCode: '3000',
                city: 'Sfax',
                country: 'Tunisie',
                fiscalNumber: '5555666DEF',
                phone: '+216 74 555 666',
                email: 'info@digitalservices.tn',
                companyId: demoCompany.id,
            },
        }),
    ]);

    console.log('✅ Clients créés:', clients.length);

    // Créer des fournisseurs - TODO: vérifier le modèle Prisma
    // const suppliers = await Promise.all([...]);
    const customAttributes = await Promise.all([
        prisma.customAttribute.create({
            data: {
                name: 'Numéro de projet',
                type: AttributeType.TEXT,
                isVisibleOnDoc: true,
                isRequired: false,
                companyId: demoCompany.id,
            },
        }),
        prisma.customAttribute.create({
            data: {
                name: 'Remise globale',
                type: AttributeType.PERCENTAGE,
                isVisibleOnDoc: true,
                isRequired: false,
                defaultValue: '0',
                companyId: demoCompany.id,
            },
        }),
    ]);

    console.log('✅ Attributs personnalisés créés:', customAttributes.length);

    // // Créer une facture de démonstration
    // const invoice = await prisma.document.create({
    //     data: {
    //         type: DocumentType.INVOICE,
    //         status: DocumentStatus.VALIDATED,
    //         number: 'FACT-2024-0001',
    //         sequenceNumber: 1,
    //         issueDate: new Date(),
    //         dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 jours
    //         validatedAt: new Date(),
    //         clientId: clients[0].id,
    //         currency: Currency.TND,
    //         exchangeRate: 1.0,
    //         companyId: demoCompany.id,
    //         notes: 'Merci pour votre confiance',
    //         termsConditions: 'Paiement à 30 jours',
    //     },
    // });

    // // Créer des lignes de facture
    // const line1 = await prisma.documentLine.create({
    //     data: {
    //         description: 'Développement application web',
    //         quantity: 10,
    //         unitPrice: 500,
    //         discount: 0,
    //         taxRateId: taxRates[0].id,
    //         taxAmount: 950, // 5000 * 0.19
    //         subtotal: 5000,
    //         total: 5950,
    //         order: 1,
    //         documentId: invoice.id,
    //     },
    // });

    // const line2 = await prisma.documentLine.create({
    //     data: {
    //         description: 'Hébergement annuel',
    //         quantity: 1,
    //         unitPrice: 1200,
    //         discount: 10,
    //         taxRateId: taxRates[0].id,
    //         taxAmount: 204.12, // 1080 * 0.19
    //         subtotal: 1080,
    //         total: 1284.12,
    //         order: 2,
    //         documentId: invoice.id,
    //     },
    // });

    // // Mettre à jour les totaux de la facture
    // await prisma.document.update({
    //     where: { id: invoice.id },
    //     data: {
    //         subtotal: 6080,
    //         taxTotal: 1154.12,
    //         total: 7234.12,
    //     },
    // });

    // console.log('✅ Facture de démonstration créée:', invoice.number);

    // // Créer un devis
    // const quote = await prisma.document.create({
    //     data: {
    //         type: DocumentType.QUOTE,
    //         status: DocumentStatus.DRAFT,
    //         number: 'DEVIS-2024-0001',
    //         sequenceNumber: 1,
    //         issueDate: new Date(),
    //         dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    //         clientId: clients[1].id,
    //         currency: Currency.EUR,
    //         exchangeRate: 3.35,
    //         companyId: demoCompany.id,
    //         subtotal: 3000,
    //         taxTotal: 570,
    //         total: 3570,
    //         notes: 'Devis valable 15 jours',
    //     },
    // });

    // await prisma.documentLine.create({
    //     data: {
    //         description: 'Consultation et audit',
    //         quantity: 5,
    //         unitPrice: 600,
    //         discount: 0,
    //         taxRateId: taxRates[0].id,
    //         taxAmount: 570,
    //         subtotal: 3000,
    //         total: 3570,
    //         order: 1,
    //         documentId: quote.id,
    //     },
    // });

    // console.log('✅ Devis créé:', quote.number);

    console.log('');
    console.log('🎉 Seed terminé avec succès!');
    console.log('');
    console.log('📋 Comptes créés:');
    console.log('   Super Admin: admin@facturation-tn.com / admin123');
    console.log('   Admin Entreprise: admin@techsolutions.tn / admin123');
    console.log('   Utilisateur: user@techsolutions.tn / admin123');
}

main()
    .catch((e) => {
        console.error('❌ Erreur lors du seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
