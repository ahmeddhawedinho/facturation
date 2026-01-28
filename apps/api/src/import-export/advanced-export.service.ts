import { Injectable, StreamableFile } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as csvStringify from 'csv-stringify/sync';
import { Response } from 'express';
import * as ExcelJS from 'exceljs';
import { ExportDocumentsDto } from './dto/export-documents.dto';
import { PdfService } from '../documents/pdf.service';

@Injectable()
export class AdvancedExportService {
    constructor(
        private prisma: PrismaService,
        private pdfService: PdfService
    ) { }

    async exportDocuments(
        companyId: string,
        dto: ExportDocumentsDto,
        res: Response
    ) {
        const { section, format, pdfMode, documentIds, startDate, endDate, clientId, supplierId } = dto;

        console.log('Export request:', { companyId, dto });

        // Fetch documents based on filters with company info for PDF
        const documents = await this.fetchDocuments(companyId, {
            section,
            documentIds,
            startDate,
            endDate,
            clientId,
            supplierId,
        });

        console.log(`Found ${documents.length} documents to export`);

        if (format === 'pdf') {
            return this.exportToPDF(documents, section, pdfMode || 'individual', res);
        } else if (format === 'csv') {
            return this.exportToCSV(documents, section, res);
        } else if (format === 'excel') {
            return this.exportToExcel(documents, section, res);
        }
    }

    private async fetchDocuments(companyId: string, filters: any) {
        const { section, documentIds, startDate, endDate, clientId, supplierId } = filters;

        if (section === 'sales') {
            const where: any = { companyId };

            if (documentIds && documentIds.length > 0) {
                where.id = { in: documentIds };
            }

            if (startDate || endDate) {
                where.issueDate = {};
                if (startDate) where.issueDate.gte = new Date(startDate);
                if (endDate) where.issueDate.lte = new Date(endDate);
            }

            if (clientId) {
                where.clientId = clientId;
            }

            return this.prisma.document.findMany({
                where,
                include: {
                    client: true,
                    company: true,
                    lines: { include: { taxRate: true } },
                    payments: true,
                    paymentMethod: true,
                },
                orderBy: { issueDate: 'desc' },
            });
        } else {
            // Purchase
            const where: any = { companyId };

            if (documentIds && documentIds.length > 0) {
                where.id = { in: documentIds };
            }

            if (startDate || endDate) {
                where.issueDate = {};
                if (startDate) where.issueDate.gte = new Date(startDate);
                if (endDate) where.issueDate.lte = new Date(endDate);
            }

            if (supplierId) {
                where.supplierId = supplierId;
            }

            return this.prisma.purchaseOrder.findMany({
                where,
                include: {
                    supplier: true,
                    company: true,
                    lines: { include: { taxRate: true } },
                    payments: true,
                },
                orderBy: { issueDate: 'desc' },
            });
        }
    }

    private async exportToCSV(documents: any[], section: string, res: Response) {
        const rows = this.prepareDataForExport(documents, section);

        console.log(`Preparing CSV with ${rows.length} rows`);

        const csvData = csvStringify.stringify(rows, {
            header: true,
            columns: [
                'Référence',
                'Type',
                'Date_Création',
                'Date_Échéance',
                section === 'sales' ? 'Client' : 'Fournisseur',
                'Total_HT',
                'Total_TVA',
                'FODEC',
                'Timbre_Fiscal',
                'Total_TTC',
                'Moyen_Paiement',
                'Montant_Payé',
                'Reste_à_Payer',
                'Statut_Paiement',
                'Date_Paiement',
                'État',
            ],
        });

        const buffer = Buffer.from(csvData, 'utf-8');
        res.set({
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="export_${section}_${new Date().getTime()}.csv"`,
        });

        return new StreamableFile(buffer);
    }

    private async exportToExcel(documents: any[], section: string, res: Response) {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Export');

        // Define columns
        worksheet.columns = [
            { header: 'Référence', key: 'Référence', width: 15 },
            { header: 'Type', key: 'Type', width: 20 },
            { header: 'Date Création', key: 'Date_Création', width: 15 },
            { header: 'Date Échéance', key: 'Date_Échéance', width: 15 },
            { header: section === 'sales' ? 'Client' : 'Fournisseur', key: section === 'sales' ? 'Client' : 'Fournisseur', width: 25 },
            { header: 'Total HT', key: 'Total_HT', width: 12 },
            { header: 'Total TVA', key: 'Total_TVA', width: 12 },
            { header: 'FODEC', key: 'FODEC', width: 12 },
            { header: 'Timbre Fiscal', key: 'Timbre_Fiscal', width: 12 },
            { header: 'Total TTC', key: 'Total_TTC', width: 12 },
            { header: 'Moyen Paiement', key: 'Moyen_Paiement', width: 15 },
            { header: 'Montant Payé', key: 'Montant_Payé', width: 12 },
            { header: 'Reste à Payer', key: 'Reste_à_Payer', width: 12 },
            { header: 'Statut Paiement', key: 'Statut_Paiement', width: 15 },
            { header: 'Date Paiement', key: 'Date_Paiement', width: 15 },
            { header: 'État', key: 'État', width: 12 },
        ];

        // Style header row
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4F81BD' },
        };

        // Add data
        const rows = this.prepareDataForExport(documents, section);
        console.log(`Preparing Excel with ${rows.length} rows`);

        rows.forEach((row) => {
            worksheet.addRow(row);
        });

        // Auto-filter
        worksheet.autoFilter = {
            from: 'A1',
            to: `P1`,
        };

        // Generate buffer
        const buffer = await workbook.xlsx.writeBuffer();

        res.set({
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="export_${section}_${new Date().getTime()}.xlsx"`,
        });

        return new StreamableFile(Buffer.from(buffer));
    }

    private async exportToPDF(
        documents: any[],
        section: string,
        mode: 'individual' | 'consolidated',
        res: Response
    ) {
        console.log(`Generating PDF for ${documents.length} documents in ${mode} mode`);

        // Use PDFKit to merge multiple PDFs
        const PDFDocument = require('pdfkit');
        const mergedDoc = new PDFDocument({ size: 'A4', margin: 50, autoFirstPage: false });
        const chunks: Buffer[] = [];

        mergedDoc.on('data', (chunk: Buffer) => chunks.push(chunk));

        return new Promise<StreamableFile>(async (resolve, reject) => {
            mergedDoc.on('end', () => {
                const buffer = Buffer.concat(chunks);
                res.set({
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': `attachment; filename="export_${section}_${mode}_${new Date().getTime()}.pdf"`,
                });
                resolve(new StreamableFile(buffer));
            });
            mergedDoc.on('error', reject);

            try {
                // Generate each document using the EXACT same method as individual export
                for (let i = 0; i < documents.length; i++) {
                    const document = documents[i];

                    console.log(`Generating PDF for document ${document.number} (${i + 1}/${documents.length})`);

                    // Use the EXACT same PDF generation as the individual document export
                    const pdfBuffer = await this.pdfService.generateInvoicePdf(document);

                    // For the first document, we need to handle it differently
                    if (i === 0) {
                        // Add the first PDF content
                        mergedDoc.addPage();
                        // Note: PDFKit doesn't support direct PDF import
                        // We'll regenerate each page instead
                    }

                    if (mode === 'individual' && i > 0) {
                        // Add page break between documents in individual mode
                        mergedDoc.addPage();
                    }
                }

                // Since PDFKit can't import PDFs, we'll use a different approach:
                // Generate all PDFs and return them as separate files OR
                // Use the pdf-lib library to merge them

                // For now, let's regenerate using the same template for each document
                for (let i = 0; i < documents.length; i++) {
                    if (i > 0 || mode === 'consolidated') {
                        mergedDoc.addPage();
                    }

                    // This will add the content directly to mergedDoc
                    await this.addDocumentToMergedPDF(mergedDoc, documents[i], section);
                }

                mergedDoc.end();
            } catch (error) {
                console.error('Error generating merged PDF:', error);
                reject(error);
            }
        });
    }

    private async addDocumentToMergedPDF(doc: any, document: any, section: string) {
        // Use the EXACT same generation logic as PdfService.generateInvoicePdf
        // but write to the provided doc instead of creating a new one

        const company = document.company || {};
        const clientOrSupplier = document.client || document.supplier || {};
        const isPurchase = !!document.supplier;
        const template = company.pdfTemplate || 'STANDARD';

        // Logo function
        const addLogo = (x: number, y: number, width: number, opacity = 1) => {
            if (company.logo && company.logo.startsWith('data:image')) {
                try {
                    const base64Data = company.logo.split(';base64,').pop();
                    if (base64Data) {
                        const imgBuffer = Buffer.from(base64Data, 'base64');
                        doc.save();
                        doc.opacity(opacity);
                        doc.image(imgBuffer, x, y, { width });
                        doc.restore();
                        return true;
                    }
                } catch (e) {
                    console.error('Erreur logo PDF:', e);
                }
            }
            return false;
        };

        // WATERMARK
        if (template === 'WATERMARK') {
            addLogo(150, 300, 300, 0.1);
        }

        // HEADER
        if (template === 'CENTERED') {
            const logoAdded = addLogo(247, 40, 100);
            const startY = logoAdded ? 120 : 50;
            doc.font('Helvetica-Bold').fontSize(16).text(company.name || '', 50, startY, { align: 'center', width: 495 });
            doc.font('Helvetica').fontSize(9).fillColor('#4b5563');
            let infoText = '';
            if (company.legalName) infoText += company.legalName + ' • ';
            if (company.fiscalNumber) infoText += 'MF: ' + company.fiscalNumber + ' • ';
            if (company.phone) infoText += 'Tél: ' + company.phone;
            doc.text(infoText.replace(/ • $/, ''), 50, startY + 18, { align: 'center', width: 495 });
        } else {
            const logoAdded = addLogo(50, 40, 80);
            const startX = 50;
            const startY = logoAdded ? 110 : 50;
            doc.font('Helvetica-Bold').fontSize(16).text(company.name || '', startX, startY);
            doc.font('Helvetica').fontSize(9).fillColor('#4b5563');
            let currentY = startY + 18;
            if (company.legalName) { doc.text(company.legalName, startX, currentY); currentY += 12; }
            if (company.fiscalNumber) { doc.text(`MF: ${company.fiscalNumber}`, startX, currentY); currentY += 12; }
            if (company.address) { doc.text(company.address, startX, currentY); currentY += 12; }
        }

        // DOCUMENT TYPE
        let docTypeLabel = 'DOCUMENT';
        const typeMap: Record<string, string> = {
            INVOICE: 'FACTURE',
            QUOTE: 'DEVIS',
            CREDIT_NOTE: 'AVOIR',
            SALES_ORDER: 'COMMANDE',
            DELIVERY_NOTE: 'BON DE LIVRAISON',
            STOCK_OUTPUT: 'BON DE SORTIE',
            PURCHASE_ORDER: 'COMMANDE FOURNISSEUR',
            GOODS_RECEIPT: 'BON DE RÉCEPTION',
            PURCHASE_INVOICE: 'FACTURE FOURNISSEUR',
        };
        docTypeLabel = typeMap[document.type] || document.type || 'DOCUMENT';

        doc.font('Helvetica-Bold').fontSize(22).fillColor('#1e40af');
        doc.text(docTypeLabel, 350, 50, { align: 'right', width: 200 });

        doc.font('Helvetica').fontSize(10).fillColor('#000');
        doc.text(`N° ${document.number}`, 350, 80, { align: 'right', width: 200 });
        doc.text(`Date: ${new Date(document.issueDate).toLocaleDateString('fr-FR')}`, 350, 95, { align: 'right', width: 200 });
        if (document.dueDate) {
            doc.text(`Échéance: ${new Date(document.dueDate).toLocaleDateString('fr-FR')}`, 350, 110, { align: 'right', width: 200 });
        }

        // CLIENT BLOCK
        const clientYStart = 190;
        doc.rect(50, clientYStart, 500, 85).fillColor('#f8fafc').fill();
        doc.fillColor('#64748b');
        doc.font('Helvetica').fontSize(8).text(isPurchase ? 'FOURNISSEUR :' : 'ADRESSÉ À :', 70, clientYStart + 15);

        doc.fillColor('#0f172a');
        doc.font('Helvetica-Bold').fontSize(12).text(clientOrSupplier.name || (isPurchase ? 'Fournisseur Inconnu' : 'Client Inconnu'), 70, clientYStart + 30);
        doc.font('Helvetica').fontSize(9);

        let clientY = clientYStart + 48;
        if (clientOrSupplier.address) {
            doc.text(clientOrSupplier.address, 70, clientY, { width: 200 });
            clientY += 12;
        }
        if (clientOrSupplier.fiscalNumber) {
            doc.text(`Matricule Fiscal: ${clientOrSupplier.fiscalNumber}`, 70, clientY);
        }

        // VALIDATION STAMP (FILIGRANE)
        const isValide = document.status === 'VALIDATED' || document.status === 'PAID';
        doc.save();
        doc.rotate(-45, { origin: [300, 400] });
        doc.fontSize(80).opacity(0.15);
        if (isValide) {
            doc.fillColor('#22c55e');
            doc.text('VALIDE', 150, 400, { align: 'center' });
        } else {
            doc.fillColor('#ef4444');
            doc.text('NON VALIDE', 100, 400, { align: 'center' });
        }
        doc.restore();

        // PAYMENT INFO
        if (document.paymentMethodId) {
            const mapPayment: Record<string, string> = { 'CASH': 'Espèces', 'CHECK': 'Chèque', 'TRANSFER': 'Virement', 'OTHER': 'Autre' };
            const paymentLabel = mapPayment[document.paymentMethodId] || document.paymentMethodId;
            doc.font('Helvetica').fontSize(9).fillColor('#000');
            doc.text(`Mode de Paiement: ${paymentLabel}`, 350, 130, { align: 'right', width: 200 });
        }
        if (document.notes) {
            doc.font('Helvetica-Oblique').fontSize(8).fillColor('#64748b');
            doc.text(`Note: ${document.notes}`, 350, 145, { align: 'right', width: 200 });
        }

        // TABLE
        let yPosition = 300;
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#64748b');
        doc.text('DESCRIPTION', 50, yPosition);
        doc.text('QTÉ', 320, yPosition, { align: 'center', width: 40 });
        doc.text('PRIX U.', 380, yPosition, { align: 'right', width: 60 });
        doc.text('REMISE', 450, yPosition, { align: 'right', width: 40 });
        doc.text('TOTAL HT', 500, yPosition, { align: 'right', width: 60 });

        yPosition += 15;
        doc.moveTo(50, yPosition).lineTo(560, yPosition).lineWidth(0.5).strokeColor('#e2e8f0').stroke();
        yPosition += 15;

        doc.font('Helvetica').fillColor('#1e293b');
        if (document.lines && Array.isArray(document.lines)) {
            document.lines.forEach((line: any) => {
                if (yPosition > 700) { doc.addPage(); yPosition = 50; }

                const lineY = yPosition;
                doc.text(line.description || '', 50, lineY, { width: 260 });
                doc.text((line.quantity || 0).toString(), 320, lineY, { align: 'center', width: 40 });
                doc.text(`${(line.unitPrice || 0).toFixed(3)}`, 380, lineY, { align: 'right', width: 60 });
                doc.text(line.discount > 0 ? `${line.discount}%` : '-', 450, lineY, { align: 'right', width: 40 });
                doc.text(`${(line.subtotal || 0).toFixed(3)}`, 500, lineY, { align: 'right', width: 60 });

                yPosition += 25;
            });
        }

        // TOTALS
        yPosition += 10;
        if (yPosition > 700) { doc.addPage(); yPosition = 50; }

        const totalsX = 350;
        const valuesX = 480;

        doc.font('Helvetica').fontSize(10).fillColor('#475569');

        const addTotalLine = (label: string, value: number, isBold = false) => {
            if (isBold) doc.font('Helvetica-Bold').fillColor('#0f172a');
            doc.text(label, totalsX, yPosition, { align: 'right', width: 120 });
            doc.text(`${value.toFixed(3)} ${document.currency || 'TND'}`, valuesX, yPosition, { align: 'right', width: 80 });
            yPosition += 18;
            doc.font('Helvetica').fillColor('#475569');
        };

        const totalFodec = (document as any).fodecTotal || 0;
        const taxTotal = document.taxTotal || 0;
        const timbre = (document as any).timbreFiscal || 0;
        const subtotalHT = document.subtotal || 0;
        const totalTTC_BeforeStamp = subtotalHT + totalFodec + taxTotal;

        addTotalLine('Total HT', subtotalHT);
        if (totalFodec > 0.001) addTotalLine('Total FODEC (1%)', totalFodec);
        addTotalLine('Total TVA', taxTotal);

        yPosition += 5;
        doc.moveTo(totalsX, yPosition).lineTo(560, yPosition).lineWidth(0.5).strokeColor('#e2e8f0').stroke();
        yPosition += 10;

        addTotalLine('Total TTC', totalTTC_BeforeStamp);
        addTotalLine('Timbre Fiscal', timbre);

        yPosition += 5;
        doc.rect(totalsX - 10, yPosition - 5, 220, 30).fillColor('#f8fafc').fill();
        doc.fillColor('#0f172a');
        addTotalLine('NET À PAYER', document.total || 0, true);

        // FOOTER
        const footerY = 770;
        doc.moveTo(50, footerY - 10).lineTo(560, footerY - 10).lineWidth(0.5).strokeColor('#e2e8f0').stroke();

        doc.fontSize(8).fillColor('#94a3b8');
        let companyFooter = `${company.name || ''}`;
        if (company.fiscalNumber) companyFooter += ` • MF: ${company.fiscalNumber}`;
        if (company.address) companyFooter += ` • ${company.address}, ${company.city || ''}`;
        if (company.phone) companyFooter += ` • Tél: ${company.phone}`;
        if (company.email) companyFooter += ` • Email: ${company.email}`;

        doc.text(companyFooter, 50, footerY, { align: 'center', width: 495 });
        doc.text('Merci pour votre confiance !', 50, footerY + 12, { align: 'center', width: 495 });
    }

    private prepareDataForExport(documents: any[], section: string) {
        return documents.map((doc) => {
            const paidAmount = doc.paidAmount || 0;
            const remaining = doc.total - paidAmount;
            const paymentPercentage = doc.total > 0 ? ((paidAmount / doc.total) * 100).toFixed(2) : '0';

            let paymentStatus = 'Non payé';
            if (paidAmount === 0) {
                paymentStatus = 'Non payé';
            } else if (remaining <= 0.001) {
                paymentStatus = 'Payé';
            } else {
                paymentStatus = `Partiel (${paymentPercentage}%)`;
            }

            const lastPayment = doc.payments && doc.payments.length > 0
                ? doc.payments[doc.payments.length - 1]
                : null;

            return {
                'Référence': doc.number,
                'Type': this.getDocumentTypeLabel(doc.type || doc.notes),
                'Date_Création': doc.issueDate.toISOString().split('T')[0],
                'Date_Échéance': doc.dueDate ? doc.dueDate.toISOString().split('T')[0] : '',
                [section === 'sales' ? 'Client' : 'Fournisseur']:
                    section === 'sales' ? doc.client?.name || '' : doc.supplier?.name || '',
                'Total_HT': doc.subtotal.toFixed(3),
                'Total_TVA': doc.taxTotal.toFixed(3),
                'FODEC': (doc.fodecTotal || 0).toFixed(3),
                'Timbre_Fiscal': (doc.timbreFiscal || 0).toFixed(3),
                'Total_TTC': doc.total.toFixed(3),
                'Moyen_Paiement': doc.paymentMethod?.name || lastPayment?.paymentMode || '',
                'Montant_Payé': paidAmount.toFixed(3),
                'Reste_à_Payer': remaining.toFixed(3),
                'Statut_Paiement': paymentStatus,
                'Date_Paiement': lastPayment ? lastPayment.paymentDate.toISOString().split('T')[0] : '',
                'État': doc.status || 'VALIDE',
            };
        });
    }

    private getDocumentTypeLabel(type: string): string {
        const typeMap: Record<string, string> = {
            INVOICE: 'Facture',
            QUOTE: 'Devis',
            CREDIT_NOTE: 'Avoir',
            SALES_ORDER: 'Bon de Commande',
            DELIVERY_NOTE: 'Bon de Livraison',
            STOCK_OUTPUT: 'Sortie de Stock',
            PURCHASE_ORDER: 'Bon de Commande Achat',
            GOODS_RECEIPT: 'Bon de Réception',
            PURCHASE_INVOICE: 'Facture Achat',
        };

        return typeMap[type] || type;
    }
}
