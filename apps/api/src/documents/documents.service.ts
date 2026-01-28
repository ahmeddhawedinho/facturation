import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentType, DocumentStatus, Currency } from '@prisma/client';

import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class DocumentsService {
    constructor(
        private prisma: PrismaService,
        private notificationsService: NotificationsService,
    ) { }

    private isUUID(str: string): boolean {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(str);
    }

    private async calculateLines(lines: any[]) {
        let subtotal = 0;
        let taxTotal = 0;
        let fodecTotal = 0;

        const linesData = await Promise.all(
            lines.map(async (line) => {
                const lineSubtotal = line.quantity * line.unitPrice * (1 - (line.discount || 0) / 100);

                let lineFodecAmount = 0;
                if (line.fodec) {
                    lineFodecAmount = lineSubtotal * 0.01;
                }

                const vatBase = lineSubtotal + lineFodecAmount;

                let lineTaxAmount = 0;
                let validTaxRateId = null;

                if (line.taxRateId && line.taxRateId.trim() !== '') {
                    if (this.isUUID(line.taxRateId)) {
                        try {
                            const taxRate = await this.prisma.taxRate.findUnique({
                                where: { id: line.taxRateId },
                            });
                            if (taxRate) {
                                lineTaxAmount = vatBase * (taxRate.rate / 100);
                                validTaxRateId = line.taxRateId;
                            }
                        } catch (e) { }
                    }
                }

                subtotal += lineSubtotal;
                taxTotal += lineTaxAmount;
                fodecTotal += lineFodecAmount;

                return {
                    description: line.description || '',
                    quantity: Number(line.quantity) || 0,
                    unitPrice: Number(line.unitPrice) || 0,
                    discount: Number(line.discount) || 0,
                    taxRateId: validTaxRateId,
                    taxAmount: lineTaxAmount,
                    fodec: !!line.fodec,
                    fodecAmount: lineFodecAmount,
                    subtotal: lineSubtotal,
                    total: lineSubtotal + lineFodecAmount + lineTaxAmount,
                    order: lines.indexOf(line) + 1,
                    productId: (line.productId && this.isUUID(line.productId)) ? line.productId : null,
                    productVariantId: (line.productVariantId && this.isUUID(line.productVariantId)) ? line.productVariantId : null
                };
            }),
        );

        return { linesData, subtotal, taxTotal, fodecTotal };
    }

    async create(companyId: string, data: any, user?: any) {
        // ... (rest of logic)
        try {
            console.log('--- CRÉATION DOCUMENT ---');
            console.log('Type:', data.type);

            const issueDate = data.issueDate ? new Date(data.issueDate) : new Date();
            if (isNaN(issueDate.getTime())) throw new BadRequestException('Date d\'émission invalide');

            const dueDate = (data.dueDate && data.dueDate.trim() !== '') ? new Date(data.dueDate) : null;
            if (dueDate && isNaN(dueDate.getTime())) throw new BadRequestException('Date d\'échéance invalide');

            const lastDoc = await this.prisma.document.findFirst({
                where: { companyId, type: data.type },
                orderBy: { sequenceNumber: 'desc' },
            });

            const sequenceNumber = (lastDoc?.sequenceNumber || 0) + 1;

            let prefix = 'DOC';
            if (data.type === DocumentType.INVOICE) prefix = 'FACT';
            else if (data.type === DocumentType.QUOTE) prefix = 'DEVIS';
            else if (data.type === DocumentType.CREDIT_NOTE) prefix = 'AVOIR';
            else if (data.type === DocumentType.SALES_ORDER) prefix = 'CMD';
            else if (data.type === DocumentType.DELIVERY_NOTE) prefix = 'BL';
            else if (data.type === DocumentType.STOCK_OUTPUT) prefix = 'BS';

            const number = `${prefix}-${String(sequenceNumber).padStart(7, '0')}`;

            const { linesData, subtotal, taxTotal, fodecTotal } = await this.calculateLines(data.lines || []);

            const linesTotalSum = linesData.reduce((acc, l) => acc + l.total, 0);
            const timbre = Number(data.timbreFiscale) || 0;
            const total = linesTotalSum + timbre;

            // Sanitize IDs
            const clientId = (data.clientId && this.isUUID(data.clientId)) ? data.clientId : null;
            const paymentMethodId = (data.paymentMethodId && this.isUUID(data.paymentMethodId)) ? data.paymentMethodId : null;

            const document = await this.prisma.document.create({
                data: {
                    type: data.type,
                    status: DocumentStatus.DRAFT,
                    number,
                    sequenceNumber,
                    issueDate,
                    dueDate,
                    clientId,
                    currency: data.currency || Currency.TND,
                    exchangeRate: 1.0,
                    subtotal,
                    taxTotal,
                    fodecTotal,
                    timbreFiscal: timbre,
                    total,
                    notes: data.notes || '',
                    termsConditions: data.termsConditions || null,
                    paymentMethodId,
                    companyId,
                    createdById: user?.id, // Enregistrer l'auteur
                    lines: {
                        create: linesData,
                    },
                },
                include: {
                    lines: {
                        include: { taxRate: true },
                        orderBy: { order: 'asc' },
                    },
                    client: true,
                },
            });

            // Notification & Audit
            if (user) {
                const action = `Création ${data.type}`;
                const details = `Document ${number} créé pour ${total} TND`;

                // Audit Log
                await this.prisma.auditLog.create({
                    data: {
                        userId: user.id,
                        action: 'CREATE',
                        entity: 'Document',
                        entityId: document.id,
                        changes: { details }
                    }
                });

                // Notifier Admins si c'est un agent
                if (user.role !== 'ADMIN') {
                    await this.notificationsService.notifyAdmins(
                        companyId,
                        `Action Agent: Création`,
                        `${user.firstName} ${user.lastName} (${user.customRole?.name || 'Agent'}) a créé le document ${number}.`,
                        `/dashboard/documents/${document.id}`
                    );
                }
            }

            // Update stock if applicable (Skip for Quotes)
            if (data.type !== DocumentType.QUOTE) {
                await this.handleStockUpdate(companyId, document.lines, 'decrement');
            }

            return document;
        } catch (error) {
            console.error('ERREUR CRÉATION:', error);
            if (error instanceof BadRequestException) throw error;
            throw new InternalServerErrorException('Erreur lors de la création du document: ' + error.message);
        }
    }

    async findAll(companyId: string, filters?: any, limit?: number, offset?: number) {
        return this.prisma.document.findMany({
            where: {
                companyId,
                ...filters,
            },
            take: limit,
            skip: offset,
            include: {
                client: { select: { id: true, name: true } },
                _count: { select: { lines: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findById(id: string, companyId: string) {
        const document = await this.prisma.document.findFirst({
            where: { id, companyId },
            include: {
                client: true,
                company: true,
                paymentMethod: true,
                sourceDocument: true,
                lines: {
                    include: {
                        taxRate: true,
                    },
                    orderBy: { order: 'asc' },
                },
            } as any,
        });

        if (!document) {
            throw new NotFoundException('Document non trouvé');
        }

        return document;
    }

    async duplicateAs(companyId: string, id: string, targetType: DocumentType) {
        const sourceDoc = await this.findById(id, companyId) as any;

        const lastDoc = await this.prisma.document.findFirst({
            where: { companyId, type: targetType },
            orderBy: { sequenceNumber: 'desc' },
        });

        const sequenceNumber = (lastDoc?.sequenceNumber || 0) + 1;

        let prefix = 'DOC';
        if (targetType === DocumentType.INVOICE) prefix = 'FACT';
        else if (targetType === DocumentType.QUOTE) prefix = 'DEVIS';
        else if (targetType === DocumentType.CREDIT_NOTE) prefix = 'AVOIR';
        else if (targetType === DocumentType.SALES_ORDER) prefix = 'CMD';
        else if (targetType === DocumentType.DELIVERY_NOTE) prefix = 'BL';
        else if (targetType === DocumentType.STOCK_OUTPUT) prefix = 'BS';

        const number = `${prefix}-${String(sequenceNumber).padStart(7, '0')}`;

        return this.prisma.$transaction(async (tx) => {
            const newDoc = await tx.document.create({
                data: {
                    type: targetType,
                    status: DocumentStatus.DRAFT,
                    number,
                    sequenceNumber,
                    issueDate: new Date(),
                    dueDate: sourceDoc.dueDate,
                    clientId: sourceDoc.clientId,
                    paymentMethodId: sourceDoc.paymentMethodId,
                    currency: sourceDoc.currency,
                    exchangeRate: sourceDoc.exchangeRate,
                    subtotal: sourceDoc.subtotal,
                    taxTotal: sourceDoc.taxTotal,
                    fodecTotal: sourceDoc.fodecTotal, // Ensure fodecTotal is copied
                    timbreFiscal: sourceDoc.timbreFiscal, // Ensure timbreFiscal is copied
                    total: sourceDoc.total,
                    notes: sourceDoc.notes,
                    companyId,
                    sourceDocumentId: sourceDoc.id,
                    lines: {
                        create: sourceDoc.lines.map((line: any) => ({
                            description: line.description,
                            quantity: line.quantity,
                            unitPrice: line.unitPrice,
                            discount: line.discount,
                            taxRateId: line.taxRateId,
                            taxAmount: line.taxAmount,
                            fodec: line.fodec, // Ensure fodec is copied
                            fodecAmount: line.fodecAmount, // Ensure fodecAmount is copied
                            subtotal: line.subtotal,
                            total: line.total,
                            order: line.order,
                            productId: line.productId
                        }))
                    }
                },
                include: { lines: true, client: true }
            });

            // Handle Stock (if target is not a Quote)
            if (targetType !== DocumentType.QUOTE) {
                await this.handleStockUpdate(companyId, newDoc.lines, 'decrement', tx);
            }

            return newDoc;
        });
    }

    async convertToInvoice(companyId: string, id: string) {
        return this.duplicateAs(companyId, id, DocumentType.INVOICE);
    }

    async update(id: string, user: any, data: any) {
        try {
            const document = await this.findById(id, user.companyId);

            // Access Control Logic
            if (user.role !== 'ADMIN') {
                const perms = user.permissions || [];
                // Check if user has ALL access or is owner with OWN access
                const hasAllAccess = perms.includes('sales:update_all');
                const isOwner = document.createdById === user.id;

                if (!hasAllAccess) {
                    if (isOwner && perms.includes('sales:update')) {
                        // OK, owner and has own update permission
                    } else {
                        throw new ForbiddenException("Vous n'avez pas la permission de modifier ce document (appartient à autrui)");
                    }
                }
            }

            if (document.status === DocumentStatus.VALIDATED) {
                throw new BadRequestException('Impossible de modifier un document validé');
            }

            // Vérifier si le document est totalement payé (pour tous les types : Facture, BL, BS, etc.)
            const paidAmount = Number((document as any).paidAmount || 0);
            const isFullyPaid = paidAmount > 0 && paidAmount >= (document.total - 0.005);
            if (isFullyPaid) {
                throw new BadRequestException('Impossible de modifier un document totalement payé');
            }

            const issueDate = data.issueDate ? new Date(data.issueDate) : document.issueDate;
            const dueDate = (data.dueDate && typeof data.dueDate === 'string' && data.dueDate.trim() !== '')
                ? new Date(data.dueDate)
                : (data.dueDate === null || data.dueDate === "" ? null : document.dueDate);

            const updatePayload: any = {
                type: data.type || document.type,
                issueDate,
                dueDate,
                clientId: (data.clientId && this.isUUID(data.clientId)) ? data.clientId : document.clientId,
                currency: data.currency || document.currency,
                notes: data.notes !== undefined ? data.notes : document.notes,
                termsConditions: data.termsConditions !== undefined ? data.termsConditions : document.termsConditions,
                paymentMethodId: (data.paymentMethodId && this.isUUID(data.paymentMethodId)) ? data.paymentMethodId : (data.paymentMethodId === null || data.paymentMethodId === "" ? null : document.paymentMethodId),
                fodecTotal: (document as any).fodecTotal || 0, // Ensure fodecTotal is included
                timbreFiscal: (document as any).timbreFiscal || 0, // Ensure timbreFiscal is included
            };

            let subtotal = document.subtotal;
            let taxTotal = document.taxTotal;
            let fodecTotal = (document as any).fodecTotal || 0;
            let timbreFiscal = (document as any).timbreFiscal || 0;
            let total = document.total;
            let linesDataToUpdate = null;

            if (data.lines) {
                const { linesData, subtotal: s, taxTotal: t, fodecTotal: f } = await this.calculateLines(data.lines);
                subtotal = s;
                taxTotal = t;
                fodecTotal = f;

                const linesTotalSum = linesData.reduce((acc, l) => acc + l.total, 0);
                timbreFiscal = data.timbreFiscale !== undefined ? Number(data.timbreFiscale) : timbreFiscal;
                total = linesTotalSum + timbreFiscal;
                linesDataToUpdate = linesData;
            } else if (data.timbreFiscale !== undefined) {
                timbreFiscal = Number(data.timbreFiscale);
                total = subtotal + taxTotal + fodecTotal + timbreFiscal;
            }

            updatePayload.subtotal = subtotal;
            updatePayload.taxTotal = taxTotal;
            updatePayload.fodecTotal = fodecTotal;
            updatePayload.timbreFiscal = timbreFiscal;
            updatePayload.total = total;

            const result = await this.prisma.$transaction(async (tx) => {
                if (linesDataToUpdate) {
                    // Restore stock from old lines before deleting them
                    await this.handleStockUpdate(user.companyId, (document as any).lines, 'increment', tx);

                    await tx.documentLine.deleteMany({ where: { documentId: id } });

                    const updated = await tx.document.update({
                        where: { id },
                        data: {
                            ...updatePayload,
                            lines: { create: linesDataToUpdate }
                        } as any,
                        include: { lines: { include: { taxRate: true } }, client: true }
                    }) as any;

                    // Decrement stock for new lines
                    await this.handleStockUpdate(user.companyId, updated.lines, 'decrement', tx);

                    return updated;
                } else {
                    return tx.document.update({
                        where: { id },
                        data: updatePayload,
                        include: { lines: { include: { taxRate: true } }, client: true }
                    });
                }
            });

            // Notification
            if (user) {
                // Audit Log
                await this.prisma.auditLog.create({
                    data: {
                        userId: user.id,
                        action: 'UPDATE',
                        entity: 'Document',
                        entityId: id,
                        changes: { changes: updatePayload, linesChanged: !!linesDataToUpdate }
                    }
                });

                if (user.role !== 'ADMIN') {
                    await this.notificationsService.notifyAdmins(
                        user.companyId,
                        `Action Agent: Modification`,
                        `${user.firstName} ${user.lastName} a modifié le document ${(result as any).number}.`,
                        `/dashboard/documents/${id}`
                    );
                }
            }

            return result;
        } catch (error) {
            console.error('ERREUR UPDATE:', error);
            if (error instanceof BadRequestException) throw error;
            throw new InternalServerErrorException('Erreur lors de la mise à jour: ' + error.message);
        }
    }

    async validate(id: string, companyId: string) {
        const document = await this.findById(id, companyId);
        if (document.status === DocumentStatus.VALIDATED) throw new BadRequestException('Document déjà validé');

        return this.prisma.document.update({
            where: { id },
            data: { status: DocumentStatus.VALIDATED, validatedAt: new Date() },
            include: { lines: { include: { taxRate: true } }, client: true },
        });
    }

    async delete(id: string, user: any) {
        const document = await this.findById(id, user.companyId);

        // Access Control Logic
        if (user.role !== 'ADMIN') {
            const perms = user.permissions || [];
            const hasAllAccess = perms.includes('sales:delete_all');
            const isOwner = document.createdById === user.id;

            if (!hasAllAccess) {
                if (isOwner && perms.includes('sales:delete')) {
                    // OK
                } else {
                    throw new ForbiddenException("Vous n'avez pas la permission de supprimer ce document (appartient à autrui)");
                }
            }
        }

        // Vérifier si le document est totalement payé
        const paidAmount = Number((document as any).paidAmount || 0);
        const isFullyPaid = paidAmount > 0 && paidAmount >= (document.total - 0.005);
        if (isFullyPaid) {
            throw new BadRequestException('Impossible de supprimer un document totalement payé');
        }

        // If it's already in TRASHED or if user wants to bypass (but here we follow the "red then delete" rule)
        if (document.status === ('TRASHED' as any)) {
            await this.prisma.document.delete({ where: { id } });
            if (user) {
                await this.prisma.auditLog.create({
                    data: { userId: user.id, action: 'DELETE', entity: 'Document', entityId: id, changes: { documentNumber: document.number } }
                });
                if (user.role !== 'ADMIN') {
                    await this.notificationsService.notifyAdmins(user.companyId, `Action Agent: Suppression Définitive`, `${user.firstName} a supprimé définitivement ${document.number}.`);
                }
            }
            return { message: 'Document supprimé définitivement' };
        }

        // Move to TRASHED
        const result = await this.prisma.document.update({
            where: { id },
            data: { status: 'TRASHED' as any }
        });

        if (user) {
            await this.prisma.auditLog.create({
                data: { userId: user.id, action: 'TRASH', entity: 'Document', entityId: id, changes: { documentNumber: document.number } }
            });
            if (user.role !== 'ADMIN') {
                await this.notificationsService.notifyAdmins(user.companyId, `Action Agent: Corbeille`, `${user.firstName} a mis à la corbeille ${document.number}.`, `/dashboard/documents/${id}`);
            }
        }
        return result;
    }

    async getStats(companyId: string) {
        const [totalInvoices, totalRevenue, pendingInvoices] = await Promise.all([
            this.prisma.document.count({
                where: { companyId, type: DocumentType.INVOICE, status: DocumentStatus.VALIDATED },
            }),
            this.prisma.document.aggregate({
                where: { companyId, type: DocumentType.INVOICE, status: DocumentStatus.VALIDATED },
                _sum: { total: true },
            }),
            this.prisma.document.count({
                where: { companyId, type: DocumentType.INVOICE, status: { in: [DocumentStatus.SENT, DocumentStatus.VALIDATED] } },
            }),
        ]);

        return {
            totalInvoices,
            totalRevenue: totalRevenue._sum.total || 0,
            pendingInvoices,
        };
    }

    private async handleStockUpdate(companyId: string, lines: any[], action: 'increment' | 'decrement', tx?: any) {
        const prisma = tx || this.prisma;

        for (const line of lines) {
            // 1. Handle variant stock if selected
            if (line.productVariantId) {
                const variant = await prisma.productVariant.findUnique({
                    where: { id: line.productVariantId }
                });
                if (variant) {
                    const adj = action === 'decrement' ? -line.quantity : line.quantity;
                    await prisma.productVariant.update({
                        where: { id: line.productVariantId },
                        data: { quantity: { increment: adj } }
                    });
                }
            }

            // 2. Handle main product stock
            if (line.productId) {
                const product = await prisma.product.findUnique({
                    where: { id: line.productId, companyId }
                });

                if (product && product.trackStock) {
                    const adjustment = action === 'decrement' ? -line.quantity : line.quantity;
                    await prisma.product.update({
                        where: { id: line.productId },
                        data: {
                            quantity: { increment: adjustment }
                        }
                    });
                }
            }
        }
    }

    // Payment Management
    async addPayment(documentId: string, companyId: string, paymentData: any) {
        console.log('--- ADD PAYMENT ---', { documentId, companyId, paymentData });
        const document: any = await this.findById(documentId, companyId);
        const amount = parseFloat(paymentData.amount || 0);

        if (isNaN(amount) || amount <= 0) {
            console.error('Invalid payment amount:', paymentData.amount);
            throw new BadRequestException('Le montant du paiement doit être supérieur à zéro');
        }

        try {
            return await this.prisma.$transaction(async (tx) => {
                const currentPaid = Number(document.paidAmount || 0);
                const newPaidAmount = currentPaid + amount;

                console.log('Calculating new paid amount:', { currentPaid, amount, newPaidAmount, total: document.total });

                // 1. Create payment record
                const payment = await tx.payment.create({
                    data: {
                        amount,
                        paymentMode: paymentData.paymentMode || 'OTHER',
                        notes: paymentData.notes || '',
                        reference: paymentData.reference || '',
                        attachmentUrl: paymentData.attachmentUrl || null,
                        attachmentType: paymentData.attachmentType || null,
                        documentId,
                        companyId
                    }
                });

                // 2. Update document paidAmount
                const updated = await tx.document.update({
                    where: { id: documentId },
                    data: {
                        paidAmount: newPaidAmount
                    }
                });

                // 3. Auto-validate if fully paid and is a draft
                if (newPaidAmount >= document.total && document.status === DocumentStatus.DRAFT) {
                    console.log('Document fully paid, auto-validating...');
                    await tx.document.update({
                        where: { id: documentId },
                        data: { status: DocumentStatus.VALIDATED, validatedAt: new Date() }
                    });
                }

                return { payment, document: updated };
            });
        } catch (error: any) {
            console.error('PAYMENT TRANSACTION ERROR:', error);
            throw new InternalServerErrorException('Erreur lors du traitement du paiement : ' + error.message);
        }
    }

    async getPayments(documentId: string, companyId: string) {
        return this.prisma.payment.findMany({
            where: { documentId, companyId },
            orderBy: { paymentDate: 'desc' }
        });
    }

    async deletePayment(paymentId: string, companyId: string) {
        // For now, just reset paidAmount to 0
        // This is a placeholder until the Payment table is created
        throw new BadRequestException('Payment deletion not yet supported. Please update payment amount.');
    }
}
