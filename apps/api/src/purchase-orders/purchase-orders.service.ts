import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PurchaseType, PurchaseSubtype, PaymentStatus, SupplierCategory } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PurchaseOrdersService {
    constructor(
        private prisma: PrismaService,
        private notificationsService: NotificationsService
    ) { }

    private isUUID(str: string): boolean {
        if (!str || typeof str !== 'string') return false;
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(str);
    }

    async create(companyId: string, data: any, user?: any) {
        try {
            console.log('--- START CREATE PURCHASE ---', data.purchaseType);
            const year = new Date().getFullYear();

            // 1. Supplier Handling
            let finalSupplierId = data.supplierId;
            if (!finalSupplierId || (typeof finalSupplierId === 'string' && finalSupplierId.trim() === '')) {
                throw new BadRequestException('Le fournisseur est obligatoire');
            }

            if (!this.isUUID(finalSupplierId)) {
                const supplierName = finalSupplierId.trim();
                let s = await this.prisma.supplier.findFirst({
                    where: {
                        companyId,
                        name: { equals: supplierName, mode: 'insensitive' }
                    }
                });

                if (!s) {
                    s = await this.prisma.supplier.create({
                        data: {
                            name: supplierName,
                            legalName: supplierName,
                            companyId,
                            category: (data.purchaseType === 'CHARGE') ? SupplierCategory.CHARGE : SupplierCategory.PRODUCT
                        }
                    });
                }
                finalSupplierId = s.id;
            }

            // 2. Document Sequence
            const docType = data.type || 'PURCHASE_ORDER';
            const lastOrder = await this.prisma.purchaseOrder.findFirst({
                where: { companyId, type: docType },
                orderBy: { sequenceNumber: 'desc' },
            });

            const sequenceNumber = (lastOrder?.sequenceNumber || 0) + 1;
            let prefix = 'CMD-F';
            if (docType === 'GOODS_RECEIPT') prefix = 'BR';
            if (docType === 'PURCHASE_INVOICE') prefix = 'FACT-F';

            const number = `${prefix}-${year}-${String(sequenceNumber).padStart(5, '0')}`;

            // 3. Dates validation
            const issueDate = data.issueDate ? new Date(data.issueDate) : new Date();
            if (isNaN(issueDate.getTime())) throw new BadRequestException('Date d\'émission invalide');

            const dueDate = data.dueDate ? new Date(data.dueDate) : null;
            if (dueDate && isNaN(dueDate.getTime())) throw new BadRequestException('Date d\'échéance invalide');

            const result = await this.prisma.$transaction(async (tx) => {
                let subtotalTotal = 0;
                let taxTotalTotal = 0;
                let fodecTotalTotal = 0;
                const timbre = Number(data.timbreFiscale) || 0;

                const linesData = [];

                for (const line of (data.lines || [])) {
                    const qty = Number(line.quantity) || 0;
                    const up = Number(line.unitPrice) || 0;
                    const disc = Number(line.discount) || 0;

                    const lineSubtotal = qty * up * (1 - disc / 100);
                    const lineFodecAmount = line.fodec ? lineSubtotal * 0.01 : 0;
                    const vatBase = lineSubtotal + lineFodecAmount;

                    let lineTaxAmount = 0;
                    let validTaxId = null;

                    if (line.taxId && this.isUUID(line.taxId)) {
                        const tax = await tx.taxRate.findUnique({ where: { id: line.taxId } });
                        if (tax) {
                            lineTaxAmount = vatBase * (tax.rate / 100);
                            validTaxId = line.taxId;
                        }
                    }

                    subtotalTotal += lineSubtotal;
                    fodecTotalTotal += lineFodecAmount;
                    taxTotalTotal += lineTaxAmount;

                    let finalProductId = line.productId;

                    // STOCK UPDATE ON CREATE
                    if (data.purchaseType === 'PRODUCT' && data.subtype === 'STOCK') {
                        const productTitle = line.description?.trim();
                        if (productTitle) {
                            let product = await tx.product.findFirst({
                                where: {
                                    companyId,
                                    OR: [
                                        { id: (line.productId && this.isUUID(line.productId)) ? line.productId : undefined },
                                        { title: { equals: productTitle, mode: 'insensitive' } }
                                    ]
                                }
                            });

                            if (product) {
                                const updatedP = await tx.product.update({
                                    where: { id: product.id },
                                    data: {
                                        quantity: { increment: qty },
                                        purchasePrice: qty > 0 ? (lineSubtotal + lineFodecAmount + lineTaxAmount) / qty : up,
                                        priceTaxFree: up,
                                        supplierId: data.supplierId,
                                        trackStock: true
                                    }
                                });
                                finalProductId = updatedP.id;
                                console.log('Product updated:', updatedP.title, 'new qty:', updatedP.quantity);
                            } else {
                                const newP = await tx.product.create({
                                    data: {
                                        title: productTitle,
                                        purchasePrice: qty > 0 ? (lineSubtotal + lineFodecAmount + lineTaxAmount) / qty : up,
                                        sellingPrice: up * 1.3,
                                        priceTaxFree: up,
                                        quantity: qty,
                                        companyId,
                                        supplierId: data.supplierId,
                                        trackStock: true
                                    }
                                });
                                finalProductId = newP.id;
                                console.log('Product created:', newP.title, 'with qty:', newP.quantity);
                            }
                        }
                    }

                    linesData.push({
                        description: line.description,
                        quantity: qty,
                        unitPrice: up,
                        discount: disc,
                        productId: (finalProductId && this.isUUID(finalProductId)) ? finalProductId : null,
                        taxRateId: validTaxId,
                        subtotal: lineSubtotal,
                        total: vatBase + lineTaxAmount,
                        fodec: !!line.fodec,
                        fodecAmount: lineFodecAmount
                    });
                }

                const totalFinal = subtotalTotal + fodecTotalTotal + taxTotalTotal + timbre;

                return await tx.purchaseOrder.create({
                    data: {
                        number,
                        sequenceNumber,
                        nature: (data.purchaseType || 'PRODUCT') === 'CHARGE' ? PurchaseType.CHARGE : PurchaseType.PRODUCT,
                        subtype: (data.subtype || 'STOCK') === 'GENERAL' ? PurchaseSubtype.GENERAL : PurchaseSubtype.STOCK,
                        type: docType,
                        paymentStatus: (data.paymentStatus as PaymentStatus) || PaymentStatus.UNPAID,
                        issueDate,
                        dueDate,
                        supplierId: finalSupplierId,
                        currency: data.currency || 'TND',
                        subtotal: subtotalTotal,
                        fodecTotal: fodecTotalTotal,
                        taxTotal: taxTotalTotal,
                        timbreFiscal: timbre,
                        total: totalFinal,
                        notes: data.notes || '',
                        scannedImage: data.scannedImage,
                        companyId,
                        lines: {
                            create: linesData
                        }
                    },
                    include: {
                        lines: true,
                        supplier: true
                    }
                });
            });
            if (user) await this.logAndNotify(companyId, user, 'CREATE', `Nouvel Achat ${result.number}`, `/dashboard/purchase/${result.id}`, result.id, { total: result.total });
            return result;

        } catch (error: any) {
            console.error('ERROR IN PURCHASE CREATE:', error);
            if (error instanceof BadRequestException) throw error;
            throw new Error(`Erreur lors de la création: ${error.message}`);
        }
    }

    async findAll(companyId: string, filters: any = {}) {
        const { nature, ...rest } = filters;
        return this.prisma.purchaseOrder.findMany({
            where: {
                companyId,
                nature: nature ? (nature as PurchaseType) : undefined,
                ...rest
            },
            include: {
                supplier: true,
                _count: { select: { lines: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async findOne(id: string, companyId: string) {
        const order = await this.prisma.purchaseOrder.findFirst({
            where: { id, companyId },
            include: {
                supplier: true,
                lines: { include: { taxRate: true } },
                company: true
            }
        });
        if (!order) throw new NotFoundException('Document achat non trouvé');
        return order;
    }

    async update(id: string, companyId: string, data: any, user?: any) {
        const oldDoc = await this.findOne(id, companyId);

        try {
            const result = await this.prisma.$transaction(async (tx: any) => {
                // 1. Revert old stock if it was a STOCK purchase
                if (oldDoc.nature === 'PRODUCT' && oldDoc.subtype === 'STOCK') {
                    for (const oldLine of oldDoc.lines) {
                        if (oldLine.productId) {
                            await tx.product.update({
                                where: { id: oldLine.productId },
                                data: { quantity: { decrement: oldLine.quantity || 0 } }
                            });
                        }
                    }
                }

                let subtotalTotal = 0;
                let taxTotalTotal = 0;
                let fodecTotalTotal = 0;
                const timbre = Number(data.timbreFiscale) || 0;

                await tx.purchaseOrderLine.deleteMany({ where: { purchaseOrderId: id } });

                const linesData = [];
                for (const line of (data.lines || [])) {
                    const qty = Number(line.quantity) || 0;
                    const up = Number(line.unitPrice) || 0;
                    const disc = Number(line.discount) || 0;

                    const lineSubtotal = qty * up * (1 - disc / 100);
                    const lineFodecAmount = line.fodec ? lineSubtotal * 0.01 : 0;
                    const vatBase = lineSubtotal + lineFodecAmount;

                    let lineTaxAmount = 0;
                    let validTaxId = null;

                    if (line.taxId && this.isUUID(line.taxId)) {
                        const tax = await tx.taxRate.findUnique({ where: { id: line.taxId } });
                        if (tax) {
                            lineTaxAmount = vatBase * (tax.rate / 100);
                            validTaxId = line.taxId;
                        }
                    }

                    subtotalTotal += lineSubtotal;
                    fodecTotalTotal += lineFodecAmount;
                    taxTotalTotal += lineTaxAmount;

                    let finalProductId = line.productId;
                    if (data.purchaseType === 'PRODUCT' && data.subtype === 'STOCK') {
                        const productTitle = line.description?.trim();
                        if (productTitle) {
                            let product = await tx.product.findFirst({
                                where: {
                                    companyId,
                                    OR: [
                                        { id: (line.productId && this.isUUID(line.productId)) ? line.productId : undefined },
                                        { title: { equals: productTitle, mode: 'insensitive' } }
                                    ]
                                }
                            });

                            if (product) {
                                const updatedP = await tx.product.update({
                                    where: { id: product.id },
                                    data: {
                                        quantity: { increment: qty },
                                        purchasePrice: qty > 0 ? (lineSubtotal + lineFodecAmount + lineTaxAmount) / qty : up,
                                        priceTaxFree: up,
                                        supplierId: data.supplierId,
                                        trackStock: true
                                    }
                                });
                                finalProductId = updatedP.id;
                            } else {
                                const newP = await tx.product.create({
                                    data: {
                                        title: productTitle,
                                        purchasePrice: qty > 0 ? (lineSubtotal + lineFodecAmount + lineTaxAmount) / qty : up,
                                        sellingPrice: up * 1.3,
                                        priceTaxFree: up,
                                        quantity: qty,
                                        companyId,
                                        supplierId: data.supplierId,
                                        trackStock: true
                                    }
                                });
                                finalProductId = newP.id;
                            }
                        }
                    }

                    linesData.push({
                        description: line.description,
                        quantity: qty,
                        unitPrice: up,
                        discount: disc,
                        productId: (finalProductId && this.isUUID(finalProductId)) ? finalProductId : null,
                        taxRateId: validTaxId,
                        subtotal: lineSubtotal,
                        total: vatBase + lineTaxAmount,
                        fodec: !!line.fodec,
                        fodecAmount: lineFodecAmount
                    });
                }

                const totalFinal = subtotalTotal + fodecTotalTotal + taxTotalTotal + timbre;

                return await tx.purchaseOrder.update({
                    where: { id },
                    data: {
                        issueDate: data.issueDate ? new Date(data.issueDate) : undefined,
                        dueDate: data.dueDate ? new Date(data.dueDate) : null,
                        supplierId: data.supplierId,
                        currency: data.currency,
                        nature: (data.purchaseType || 'PRODUCT') === 'CHARGE' ? PurchaseType.CHARGE : PurchaseType.PRODUCT,
                        subtype: (data.subtype || 'STOCK') === 'GENERAL' ? PurchaseSubtype.GENERAL : PurchaseSubtype.STOCK,
                        type: data.type,
                        paymentStatus: (data.paymentStatus as PaymentStatus),
                        subtotal: subtotalTotal,
                        fodecTotal: fodecTotalTotal,
                        taxTotal: taxTotalTotal,
                        timbreFiscal: timbre,
                        total: totalFinal,
                        notes: data.notes,
                        scannedImage: data.scannedImage,
                        lines: {
                            create: linesData
                        }
                    },
                    include: {
                        lines: {
                            include: { taxRate: true }
                        },
                        supplier: true
                    }
                });
            });
            if (user) await this.logAndNotify(companyId, user, 'UPDATE', `Mise à jour Achat ${result.number}`, `/dashboard/purchase/${result.id}`, result.id, { total: result.total });
            return result;
        } catch (error: any) {
            console.error('ERROR IN PURCHASE UPDATE:', error);
            throw new Error(`Erreur lors de la mise à jour: ${error.message}`);
        }
    }

    async delete(id: string, companyId: string, user?: any) {
        const order = await this.findOne(id, companyId);
        await this.prisma.purchaseOrder.delete({
            where: { id, companyId }
        });
        if (user) await this.logAndNotify(companyId, user, 'DELETE', `Suppression Achat ${order.number}`, `/dashboard/purchase`, id);
        return order;
    }

    // Payment Management
    async addPayment(purchaseOrderId: string, companyId: string, paymentData: any, user?: any) {
        console.log('--- ADD PURCHASE PAYMENT ---', { purchaseOrderId, companyId, paymentData });
        const order: any = await this.findOne(purchaseOrderId, companyId);
        const amount = parseFloat(paymentData.amount || 0);

        if (isNaN(amount) || amount <= 0) {
            throw new BadRequestException('Le montant du paiement doit être supérieur à zéro');
        }

        try {
            const result = await this.prisma.$transaction(async (tx) => {
                const currentPaid = Number(order.paidAmount || 0);
                const newPaidAmount = currentPaid + amount;

                // 1. Create payment record
                const payment = await tx.payment.create({
                    data: {
                        amount,
                        paymentMode: paymentData.paymentMode || 'OTHER',
                        notes: paymentData.notes || '',
                        reference: paymentData.reference || '',
                        attachmentUrl: paymentData.attachmentUrl || null,
                        attachmentType: paymentData.attachmentType || null,
                        purchaseOrderId,
                        companyId
                    }
                });
                console.log('Payment created:', payment.id);

                // 2. Update order paidAmount
                const status = newPaidAmount >= Number(order.total) ? 'PAID' : (newPaidAmount > 0 ? 'PARTIAL' : 'UNPAID');
                console.log('Updating order status to:', status, 'Paid:', newPaidAmount);

                const updated = await tx.purchaseOrder.update({
                    where: { id: purchaseOrderId },
                    data: {
                        paidAmount: newPaidAmount,
                        paymentStatus: status as any
                    }
                });

                return { payment, order: updated };
            });
            if (user) await this.logAndNotify(companyId, user, 'UPDATE', `Paiement sur Achat ${result.order.number}`, `/dashboard/purchase/${purchaseOrderId}`, purchaseOrderId, { amount: paymentData.amount });
            return result;
        } catch (error: any) {
            console.error('--- PURCHASE PAYMENT TRANSACTION FAILED ---');
            console.error(error);
            throw new Error('Erreur lors du traitement du règlement: ' + error.message);
        }
    }

    async getPayments(purchaseOrderId: string, companyId: string) {
        return (this.prisma as any).payment.findMany({
            where: { purchaseOrderId, companyId },
            orderBy: { paymentDate: 'desc' }
        });
    }

    private async logAndNotify(companyId: string, user: any, action: string, message: string, link: string, entityId: string, details?: any) {
        try {
            await this.prisma.auditLog.create({
                data: {
                    userId: user.id,
                    action,
                    entity: 'PurchaseOrder',
                    entityId,
                    changes: details || {}
                }
            });
            if (user.role !== 'ADMIN') {
                await this.notificationsService.notifyAdmins(
                    companyId,
                    `Action Achat: ${action}`,
                    `${user.firstName} ${user.lastName} : ${message}`,
                    link
                );
            }
        } catch (e) { console.error("Log error", e) }
    }
}
