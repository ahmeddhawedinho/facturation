import { Injectable, BadRequestException, StreamableFile } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentType, DocumentStatus } from '@prisma/client';
import * as csvStringify from 'csv-stringify/sync';
import * as csvParse from 'csv-parse/sync';
import { Response } from 'express';

@Injectable()
export class ImportExportService {
    constructor(private prisma: PrismaService) { }

    async exportDocuments(
        companyId: string,
        filters: { startDate?: string; endDate?: string; type?: string; clientId?: string; section?: string },
        format: 'csv' | 'excel',
        res: Response
    ) {
        const section = (filters.section || 'sales').toLowerCase();
        const where: any = { companyId };

        if (filters.startDate || filters.endDate) {
            const dateField = 'issueDate';
            where[dateField] = {};
            if (filters.startDate) where[dateField].gte = new Date(filters.startDate);
            if (filters.endDate) where[dateField].lte = new Date(filters.endDate);
        }

        let rows: any[] = [];
        const columns = [
            'Reference', 'Type', 'Date', 'Echeance', 'Client_Fournisseur',
            'Total_HT', 'FODEC', 'Total_TVA', 'Timbre_Fiscal', 'Total_TTC', 'Etat',
            'Description_Ligne', 'Quantite', 'Prix_Unitaire', 'Taux_TVA', 'Total_Ligne'
        ];

        if (section === 'purchase') {
            if (filters.clientId) where.supplierId = filters.clientId;

            const docs = await this.prisma.purchaseOrder.findMany({
                where,
                include: { supplier: true, lines: true },
                orderBy: { issueDate: 'desc' }
            });

            rows = docs.flatMap(doc => {
                let typeStr = 'PURCHASE_ORDER';
                if (doc.notes?.includes('[Type:')) {
                    const match = doc.notes.match(/\[Type:\s*([^\]]+)\]/);
                    if (match) typeStr = match[1].trim();
                }

                const timbreFiscal = ((doc as any).timbreFiscal || 0).toFixed(3);

                if (doc.lines.length === 0) {
                    return [{
                        Reference: doc.number,
                        Type: typeStr,
                        Date: doc.issueDate.toISOString().split('T')[0],
                        Echeance: doc.dueDate ? doc.dueDate.toISOString().split('T')[0] : '',
                        Client_Fournisseur: doc.supplier?.name || '',
                        Total_HT: doc.subtotal,
                        FODEC: (doc as any).fodecTotal || 0,
                        Total_TVA: doc.taxTotal,
                        Timbre_Fiscal: timbreFiscal,
                        Total_TTC: doc.total,
                        Etat: 'VALIDE',
                        Description_Ligne: '',
                        Quantite: 0,
                        Prix_Unitaire: 0,
                        Taux_TVA: 0,
                        Total_Ligne: 0
                    }];
                }
                return doc.lines.map(line => ({
                    Reference: doc.number,
                    Type: typeStr,
                    Date: doc.issueDate.toISOString().split('T')[0],
                    Echeance: doc.dueDate ? doc.dueDate.toISOString().split('T')[0] : '',
                    Client_Fournisseur: doc.supplier?.name || '',
                    Total_HT: doc.subtotal,
                    FODEC: (doc as any).fodecTotal || 0,
                    Total_TVA: doc.taxTotal,
                    Timbre_Fiscal: timbreFiscal,
                    Total_TTC: doc.total,
                    Etat: 'VALIDE',
                    Description_Ligne: line.description,
                    Quantite: line.quantity,
                    Prix_Unitaire: line.unitPrice,
                    Taux_TVA: 0,
                    Total_Ligne: line.total
                }));
            });
        } else {
            // SALES
            if (filters.type) where.type = filters.type as DocumentType;
            if (filters.clientId) where.clientId = filters.clientId;

            const docs = await this.prisma.document.findMany({
                where,
                include: { client: true, lines: { include: { taxRate: true } } },
                orderBy: { issueDate: 'desc' }
            });

            rows = docs.flatMap(doc => {
                const timbreFiscal = ((doc as any).timbreFiscal || 0).toFixed(3);
                const statusStr = doc.status === DocumentStatus.VALIDATED ? 'VALIDE' : 'BROUILLON';

                if (doc.lines.length === 0) {
                    return [{
                        Reference: doc.number,
                        Type: doc.type,
                        Date: doc.issueDate.toISOString().split('T')[0],
                        Echeance: doc.dueDate ? doc.dueDate.toISOString().split('T')[0] : '',
                        Client_Fournisseur: doc.client?.name || '',
                        Total_HT: doc.subtotal,
                        FODEC: (doc as any).fodecTotal || 0,
                        Total_TVA: doc.taxTotal,
                        Timbre_Fiscal: timbreFiscal,
                        Total_TTC: doc.total,
                        Etat: statusStr,
                        Description_Ligne: '',
                        Quantite: 0,
                        Prix_Unitaire: 0,
                        Taux_TVA: 0,
                        Total_Ligne: 0
                    }];
                }
                return doc.lines.map(line => ({
                    Reference: doc.number,
                    Type: doc.type,
                    Date: doc.issueDate.toISOString().split('T')[0],
                    Echeance: doc.dueDate ? doc.dueDate.toISOString().split('T')[0] : '',
                    Client_Fournisseur: doc.client?.name || '',
                    Total_HT: doc.subtotal,
                    FODEC: (doc as any).fodecTotal || 0,
                    Total_TVA: line.taxRate?.rate || 0, // In CSV we usually show the rate for the line
                    Timbre_Fiscal: timbreFiscal,
                    Total_TTC: doc.total,
                    Etat: statusStr,
                    Description_Ligne: line.description,
                    Quantite: line.quantity,
                    Prix_Unitaire: line.unitPrice,
                    Taux_TVA: line.taxRate?.rate || 0,
                    Total_Ligne: line.total
                }));
            });
        }

        const csvData = csvStringify.stringify(rows, {
            header: true,
            columns
        });

        const buffer = Buffer.from(csvData, 'utf-8');
        res.set({
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="export_${section}_${new Date().getTime()}.csv"`,
        });

        return new StreamableFile(buffer);
    }

    async importDocuments(companyId: string, fileBuffer: Buffer, section: string = 'sales') {
        try {
            const records = csvParse.parse(fileBuffer, {
                columns: true,
                skip_empty_lines: true,
                trim: true
            });

            const docsMap = new Map<string, any[]>();
            for (const record of records) {
                const ref = record['Reference'];
                if (!ref) continue;
                if (!docsMap.has(ref)) docsMap.set(ref, []);
                docsMap.get(ref).push(record);
            }

            const taxRates = await this.prisma.taxRate.findMany({ where: { companyId } });
            let createdCount = 0;

            for (const [ref, rows] of docsMap) {
                const firstRow = rows[0];
                const partnerName = firstRow['Client_Fournisseur'];
                const timbre = parseFloat(firstRow['Timbre_Fiscal']) || 0;
                const statusStr = firstRow['Etat']?.toUpperCase();
                const status = (statusStr === 'VALIDE' || statusStr === 'VALIDATED') ? DocumentStatus.VALIDATED : DocumentStatus.DRAFT;

                if (section === 'purchase') {
                    // Purchase Logic
                    let supplier = await this.prisma.supplier.findFirst({
                        where: { companyId, name: partnerName }
                    });

                    if (!supplier && partnerName) {
                        supplier = await this.prisma.supplier.create({
                            data: { companyId, name: partnerName }
                        });
                    }

                    const linesData = rows.map((r, index) => ({
                        description: r['Description_Ligne'] || 'Article',
                        quantity: parseFloat(r['Quantite']) || 0,
                        unitPrice: parseFloat(r['Prix_Unitaire']) || 0,
                        subtotal: (parseFloat(r['Quantite']) || 0) * (parseFloat(r['Prix_Unitaire']) || 0),
                        total: parseFloat(r['Total_Ligne']) || 0,
                    }));

                    const subtotal = linesData.reduce((acc, l) => acc + l.subtotal, 0);
                    const docTotal = parseFloat(firstRow['Total_TTC']) || (linesData.reduce((acc, l) => acc + l.total, 0) + timbre);

                    await this.prisma.purchaseOrder.create({
                        data: {
                            companyId,
                            number: ref,
                            sequenceNumber: Math.floor(Math.random() * 1000000),
                            issueDate: firstRow['Date'] ? new Date(firstRow['Date']) : new Date(),
                            dueDate: firstRow['Echeance'] ? new Date(firstRow['Echeance']) : null,
                            supplierId: supplier?.id as string,
                            subtotal,
                            fodecTotal: 0, // Simplified for import if not provided
                            timbreFiscal: timbre,
                            taxTotal: docTotal - subtotal - timbre,
                            total: docTotal,
                            notes: `[Type: ${firstRow['Type'] || 'PURCHASE_ORDER'}] Importé CSV`,
                            lines: { create: linesData }
                        }
                    });
                } else {
                    // Sales Logic
                    let client = await this.prisma.client.findFirst({
                        where: { companyId, name: partnerName }
                    });

                    if (!client && partnerName) {
                        client = await this.prisma.client.create({
                            data: { companyId, name: partnerName, type: 'PROFESSIONAL' }
                        });
                    }

                    const linesData = await Promise.all(rows.map(async (r, index) => {
                        const rateValue = parseFloat(r['Taux_TVA']) || 0;
                        const taxRate = taxRates.find(tr => tr.rate === rateValue);

                        const qty = parseFloat(r['Quantite']) || 0;
                        const up = parseFloat(r['Prix_Unitaire']) || 0;
                        const lineSubtotal = qty * up;
                        // Default calculation if Total_Ligne is missing or 0
                        let lineTotal = parseFloat(r['Total_Ligne']);
                        if (!lineTotal || isNaN(lineTotal)) {
                            lineTotal = lineSubtotal * (1 + rateValue / 100);
                        }

                        return {
                            description: r['Description_Ligne'] || 'Article',
                            quantity: qty,
                            unitPrice: up,
                            taxRateId: taxRate?.id || null,
                            taxAmount: lineTotal - lineSubtotal,
                            subtotal: lineSubtotal,
                            total: lineTotal,
                            order: index + 1
                        };
                    }));

                    const subtotal = linesData.reduce((acc, l) => acc + l.subtotal, 0);
                    const taxTotal = linesData.reduce((acc, l) => acc + l.taxAmount, 0);
                    const total = parseFloat(firstRow['Total_TTC']) || (subtotal + taxTotal + timbre);

                    await this.prisma.document.create({
                        data: {
                            companyId,
                            number: ref,
                            type: (firstRow['Type'] as DocumentType) || DocumentType.INVOICE,
                            status: status,
                            issueDate: firstRow['Date'] ? new Date(firstRow['Date']) : new Date(),
                            dueDate: firstRow['Echeance'] ? new Date(firstRow['Echeance']) : null,
                            clientId: client?.id,
                            subtotal,
                            taxTotal,
                            fodecTotal: 0,
                            timbreFiscal: timbre,
                            total,
                            sequenceNumber: Math.floor(Math.random() * 1000000),
                            lines: { create: linesData }
                        }
                    });
                }
                createdCount++;
            }

            return { success: true, count: createdCount };
        } catch (error) {
            console.error('Import Error:', error);
            throw new BadRequestException('Erreur lors de l\'importation CSV: ' + error.message);
        }
    }
}
