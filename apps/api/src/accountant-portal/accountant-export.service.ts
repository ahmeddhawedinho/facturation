import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as ExcelJS from 'exceljs';
import { PdfService } from '../documents/pdf.service';
import * as archiver from 'archiver';
import { Readable } from 'stream';

@Injectable()
export class AccountantExportService {
    constructor(
        private prisma: PrismaService,
        private pdfService: PdfService,
    ) { }

    /**
     * Exporter les documents en Excel (format plat pour import comptable)
     */
    async exportToExcel(documents: any[]): Promise<Buffer> {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Journal');

        // En-têtes de colonnes - TOUTES LES MÉTADONNÉES
        worksheet.columns = [
            { header: 'N° Document', key: 'number', width: 20 },
            { header: 'Type', key: 'type', width: 15 },
            { header: 'Date Émission', key: 'issueDate', width: 15 },
            { header: 'Date Échéance', key: 'dueDate', width: 15 },
            { header: 'Statut', key: 'status', width: 12 },

            // Informations Tiers
            { header: 'Nom Tiers', key: 'tiersName', width: 30 },
            { header: 'Raison Sociale', key: 'tiersLegalName', width: 30 },
            { header: 'MF Tiers', key: 'tiersFiscalNumber', width: 20 },
            { header: 'Adresse Tiers', key: 'tiersAddress', width: 40 },
            { header: 'Ville Tiers', key: 'tiersCity', width: 20 },
            { header: 'Email Tiers', key: 'tiersEmail', width: 30 },
            { header: 'Téléphone Tiers', key: 'tiersPhone', width: 20 },

            // Montants
            { header: 'Montant HT', key: 'subtotal', width: 15 },
            { header: 'TVA', key: 'taxTotal', width: 15 },
            { header: 'FODEC', key: 'fodecTotal', width: 15 },
            { header: 'Timbre Fiscal', key: 'timbreFiscal', width: 15 },
            { header: 'Total TTC', key: 'total', width: 15 },

            // Paiement
            { header: 'Montant Payé', key: 'paidAmount', width: 15 },
            { header: 'Reste à Payer', key: 'remaining', width: 15 },
            { header: 'Méthode Paiement', key: 'paymentMethod', width: 20 },

            // Autres
            { header: 'Notes', key: 'notes', width: 40 },
            { header: 'Créé Par', key: 'createdBy', width: 25 },
            { header: 'Date Création', key: 'createdAt', width: 20 },
        ];

        // Style de l'en-tête
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4F46E5' }, // Indigo
        };
        worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
        worksheet.getRow(1).height = 25;

        // Remplir les données
        documents.forEach((doc) => {
            const tiers = doc.client || doc.supplier || {};
            const remaining = (doc.total || 0) - (doc.paidAmount || 0);

            worksheet.addRow({
                number: doc.number,
                type: this.getDocumentTypeLabel(doc.type),
                issueDate: doc.issueDate ? new Date(doc.issueDate).toLocaleDateString('fr-FR') : '',
                dueDate: doc.dueDate ? new Date(doc.dueDate).toLocaleDateString('fr-FR') : '',
                status: this.getStatusLabel(doc.status),

                tiersName: tiers.name || '',
                tiersLegalName: tiers.legalName || '',
                tiersFiscalNumber: tiers.fiscalNumber || '',
                tiersAddress: tiers.address || '',
                tiersCity: tiers.city || '',
                tiersEmail: tiers.email || '',
                tiersPhone: tiers.phone || '',

                subtotal: doc.subtotal || 0,
                taxTotal: doc.taxTotal || 0,
                fodecTotal: doc.fodecTotal || 0,
                timbreFiscal: doc.timbreFiscal || 0,
                total: doc.total || 0,

                paidAmount: doc.paidAmount || 0,
                remaining: remaining,
                paymentMethod: doc.paymentMethod?.name || '',

                notes: doc.notes || '',
                createdBy: doc.createdBy ? `${doc.createdBy.firstName} ${doc.createdBy.lastName}` : '',
                createdAt: doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('fr-FR') : '',
            });
        });

        // Ligne de totaux
        const totalRow = worksheet.addRow({
            number: 'TOTAUX',
            subtotal: { formula: `SUM(M2:M${worksheet.rowCount})` },
            taxTotal: { formula: `SUM(N2:N${worksheet.rowCount})` },
            fodecTotal: { formula: `SUM(O2:O${worksheet.rowCount})` },
            timbreFiscal: { formula: `SUM(P2:P${worksheet.rowCount})` },
            total: { formula: `SUM(Q2:Q${worksheet.rowCount})` },
            paidAmount: { formula: `SUM(R2:R${worksheet.rowCount})` },
            remaining: { formula: `SUM(S2:S${worksheet.rowCount})` },
        });

        totalRow.font = { bold: true };
        totalRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E7FF' },
        };

        // Format des nombres
        worksheet.getColumn('subtotal').numFmt = '#,##0.000';
        worksheet.getColumn('taxTotal').numFmt = '#,##0.000';
        worksheet.getColumn('fodecTotal').numFmt = '#,##0.000';
        worksheet.getColumn('timbreFiscal').numFmt = '#,##0.000';
        worksheet.getColumn('total').numFmt = '#,##0.000';
        worksheet.getColumn('paidAmount').numFmt = '#,##0.000';
        worksheet.getColumn('remaining').numFmt = '#,##0.000';

        // Bordures
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 0) {
                row.eachCell((cell) => {
                    cell.border = {
                        top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                        left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                        bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                        right: { style: 'thin', color: { argb: 'FFD1D5DB' } },
                    };
                });
            }
        });

        // Générer le buffer
        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }

    /**
     * Exporter en CSV (format simple)
     */
    async exportToCSV(documents: any[]): Promise<string> {
        const headers = [
            'N° Document',
            'Type',
            'Date',
            'Tiers',
            'MF Tiers',
            'HT',
            'TVA',
            'FODEC',
            'Timbre',
            'TTC',
            'Payé',
            'Reste',
            'Statut',
        ].join(';');

        const rows = documents.map((doc) => {
            const tiers = doc.client || doc.supplier || {};
            const remaining = (doc.total || 0) - (doc.paidAmount || 0);

            return [
                doc.number,
                this.getDocumentTypeLabel(doc.type),
                doc.issueDate ? new Date(doc.issueDate).toLocaleDateString('fr-FR') : '',
                tiers.name || '',
                tiers.fiscalNumber || '',
                (doc.subtotal || 0).toFixed(3),
                (doc.taxTotal || 0).toFixed(3),
                (doc.fodecTotal || 0).toFixed(3),
                (doc.timbreFiscal || 0).toFixed(3),
                (doc.total || 0).toFixed(3),
                (doc.paidAmount || 0).toFixed(3),
                remaining.toFixed(3),
                this.getStatusLabel(doc.status),
            ].join(';');
        });

        return [headers, ...rows].join('\n');
    }

    /**
     * Exporter les PDFs originaux dans une archive ZIP
     */
    async exportToPDFArchive(documents: any[]): Promise<Buffer> {
        return new Promise(async (resolve, reject) => {
            const archive = archiver('zip', { zlib: { level: 9 } });
            const chunks: Buffer[] = [];

            archive.on('data', (chunk) => chunks.push(chunk));
            archive.on('end', () => resolve(Buffer.concat(chunks)));
            archive.on('error', reject);

            // Générer un PDF pour chaque document
            for (const doc of documents) {
                try {
                    const pdfBuffer = await this.pdfService.generateInvoicePdf(doc);
                    const fileName = `${doc.number.replace(/[/\\?%*:|"<>]/g, '_')}.pdf`;
                    archive.append(pdfBuffer, { name: fileName });
                } catch (error) {
                    console.error(`Erreur génération PDF pour ${doc.number}:`, error);
                }
            }

            archive.finalize();
        });
    }

    // Helpers
    private getDocumentTypeLabel(type: string): string {
        const types: Record<string, string> = {
            INVOICE: 'Facture',
            QUOTE: 'Devis',
            CREDIT_NOTE: 'Avoir',
            SALES_ORDER: 'Commande',
            DELIVERY_NOTE: 'Bon de Livraison',
            STOCK_OUTPUT: 'Bon de Sortie',
            PURCHASE_ORDER: 'Commande Fournisseur',
            GOODS_RECEIPT: 'Bon de Réception',
            PURCHASE_INVOICE: 'Facture Fournisseur',
        };
        return types[type] || type;
    }

    private getStatusLabel(status: string): string {
        const statuses: Record<string, string> = {
            DRAFT: 'Brouillon',
            VALIDATED: 'Validé',
            SENT: 'Envoyé',
            PAID: 'Payé',
            CANCELLED: 'Annulé',
            TRASHED: 'Corbeille',
        };
        return statuses[status] || status;
    }

    /**
     * Générer un ZIP contenant la facture + tous ses justificatifs de paiement
     */
    async generateDocumentWithProofsZip(documentId: string, accountantId: string): Promise<Buffer> {
        // Récupérer le document avec ses paiements
        const document = await this.prisma.document.findUnique({
            where: { id: documentId },
            include: {
                payments: {
                    where: { attachmentUrl: { not: null } },
                },
            },
        });

        if (!document) {
            throw new Error('Document non trouvé');
        }

        return new Promise(async (resolve, reject) => {
            const archive = archiver('zip', { zlib: { level: 9 } });
            const chunks: Buffer[] = [];

            archive.on('data', (chunk) => chunks.push(chunk));
            archive.on('end', () => resolve(Buffer.concat(chunks)));
            archive.on('error', reject);

            // 1. Ajouter la facture PDF
            try {
                const pdfBuffer = await this.pdfService.generateInvoicePdf(document);
                const invoiceFileName = `${document.number.replace(/[/\\?%*:|"<>]/g, '_')}.pdf`;
                archive.append(pdfBuffer, { name: invoiceFileName });
            } catch (error) {
                console.error(`Erreur génération facture PDF:`, error);
            }

            // 2. Ajouter les justificatifs de paiement
            for (const payment of document.payments) {
                if (payment.attachmentUrl) {
                    try {
                        let buffer: Buffer;
                        const url = payment.attachmentUrl;

                        if (url.startsWith('http') || url.startsWith('https')) {
                            const response = await fetch(url);
                            buffer = Buffer.from(await response.arrayBuffer());
                        } else if (url.startsWith('data:')) {
                            buffer = Buffer.from(url.split(',')[1], 'base64');
                        } else {
                            // Fichier local - utiliser require('fs') dynamiquement
                            const fs = require('fs');
                            buffer = await fs.promises.readFile(url);
                        }

                        // Déterminer l'extension
                        const ext = payment.attachmentType?.includes('pdf') ? 'pdf' :
                            payment.attachmentType?.includes('image') ? 'jpg' : 'bin';

                        const proofFileName = `justificatif_${payment.paymentMode}_${payment.paymentDate.toISOString().split('T')[0]}.${ext}`;
                        archive.append(buffer, { name: proofFileName });
                    } catch (error) {
                        console.error(`Erreur téléchargement justificatif:`, error);
                    }
                }
            }

            archive.finalize();
        });
    }

    /**
     * Exporter une sélection de documents avec optionnellement leurs justificatifs
     */
    async exportSelectedWithProofs(documents: any[], includeProofs: boolean): Promise<Buffer> {
        return new Promise(async (resolve, reject) => {
            const archive = archiver('zip', { zlib: { level: 9 } });
            const chunks: Buffer[] = [];

            archive.on('data', (chunk) => chunks.push(chunk));
            archive.on('end', () => resolve(Buffer.concat(chunks)));
            archive.on('error', reject);

            // Pour chaque document
            for (const document of documents) {
                try {
                    // 1. Générer et ajouter le PDF de la facture
                    const pdfBuffer = await this.pdfService.generateInvoicePdf(document);
                    const invoiceFileName = `${document.number.replace(/[/\\?%*:|"<>]/g, '_')}.pdf`;
                    archive.append(pdfBuffer, { name: `factures/${invoiceFileName}` });

                    // 2. Ajouter les justificatifs si demandé
                    if (includeProofs && document.payments && document.payments.length > 0) {
                        for (const payment of document.payments) {
                            if (payment.attachmentUrl) {
                                try {
                                    let buffer: Buffer;
                                    const url = payment.attachmentUrl;

                                    if (url.startsWith('http') || url.startsWith('https')) {
                                        const response = await fetch(url);
                                        buffer = Buffer.from(await response.arrayBuffer());
                                    } else if (url.startsWith('data:')) {
                                        buffer = Buffer.from(url.split(',')[1], 'base64');
                                    } else {
                                        const fs = require('fs');
                                        buffer = await fs.promises.readFile(url);
                                    }

                                    const ext = payment.attachmentType?.includes('pdf') ? 'pdf' :
                                        payment.attachmentType?.includes('image') ? 'jpg' : 'bin';

                                    const proofFileName = `justificatif_${document.number.replace(/[/\\?%*:|"<>]/g, '_')}_${payment.paymentMode}.${ext}`;
                                    archive.append(buffer, { name: `justificatifs/${proofFileName}` });
                                } catch (error) {
                                    console.error(`Erreur téléchargement justificatif:`, error);
                                }
                            }
                        }
                    }
                } catch (error) {
                    console.error(`Erreur traitement document ${document.number}:`, error);
                }
            }

            archive.finalize();
        });
    }
}
