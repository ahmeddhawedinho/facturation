import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

import { NotificationsService } from '../notifications/notifications.service';
import { ClientType } from '@prisma/client';

@Injectable()
export class ClientsService {
    constructor(
        private prisma: PrismaService,
        private notificationsService: NotificationsService
    ) { }

    async create(companyId: string, data: {
        name: string;
        type?: ClientType;
        legalName?: string;
        address?: string;
        postalCode?: string;
        city?: string;
        country?: string;
        fiscalNumber?: string;
        phone?: string;
        email?: string;
        image?: string;
    }, user?: any) {
        // Validation: au minimum le nom doit être fourni
        if (!data.name || data.name.trim() === '') {
            throw new Error('Le nom du client est obligatoire');
        }

        const client = await this.prisma.client.create({
            data: {
                name: data.name.trim(),
                type: data.type,
                legalName: data.legalName?.trim(),
                address: data.address?.trim(),
                postalCode: data.postalCode?.trim(),
                city: data.city?.trim(),
                country: data.country?.trim(),
                fiscalNumber: data.fiscalNumber?.trim(),
                phone: data.phone?.trim(),
                email: data.email?.trim(),
                image: data.image,
                companyId,
            },
        });

        await this.logAndNotify(companyId, user, 'CREATE', `Ajout client ${client.name}`, `/dashboard/clients/${client.id}`, client.id, { name: client.name });

        return client;
    }

    async findAll(companyId: string) {
        return this.prisma.client.findMany({
            where: { companyId },
            include: {
                _count: {
                    select: { documents: true },
                },
            },
            orderBy: { name: 'asc' },
        });
    }

    async findById(id: string, companyId: string) {
        const client = await this.prisma.client.findFirst({
            where: { id, companyId },
            include: {
                documents: {
                    orderBy: { issueDate: 'desc' },
                    include: { lines: true }
                },
                _count: { select: { documents: true } }
            },
        });

        if (!client) {
            throw new NotFoundException('Client non trouvé');
        }

        // Calculate statistics
        const docs = (client as any).documents || [];
        const totalSales = docs.filter(d => d.status !== 'CANCELLED' && d.status !== 'TRASHED' && d.type === 'INVOICE')
            .reduce((sum, d) => sum + d.total, 0);
        const outstandingBalance = docs.filter(d => d.type === 'INVOICE' && d.status === 'VALIDATED')
            .reduce((sum, d) => sum + d.total, 0);
        const documentsCount = docs.length;

        return {
            ...client,
            stats: {
                totalSales,
                outstandingBalance,
                documentsCount
            }
        };
    }

    async update(id: string, companyId: string, data: Partial<{
        name: string;
        type: ClientType;
        legalName: string;
        address: string;
        postalCode: string;
        city: string;
        country: string;
        fiscalNumber: string;
        phone: string;
        email: string;
        image: string;
    }>, user?: any) {
        const client = await this.prisma.client.update({
            where: { id, companyId },
            data,
        });
        await this.logAndNotify(companyId, user, 'UPDATE', `Mise à jour client ${client.name}`, `/dashboard/clients/${client.id}`, client.id, data);
        return client;
    }

    async delete(id: string, companyId: string, user?: any) {
        const client = await this.prisma.client.delete({
            where: { id, companyId },
        });
        await this.logAndNotify(companyId, user, 'DELETE', `Suppression du client ${client.name}`, `/dashboard/clients`, client.id);
        return client;
    }

    private async logAndNotify(companyId: string, user: any, action: string, message: string, link: string, entityId: string, details?: any) {
        if (!user) return;
        try {
            await this.prisma.auditLog.create({
                data: {
                    userId: user.id,
                    action,
                    entity: 'Client',
                    entityId,
                    changes: details || {}
                }
            });
            if (user.role !== 'ADMIN') {
                await this.notificationsService.notifyAdmins(
                    companyId,
                    `Action Client: ${action}`,
                    `${user.firstName} ${user.lastName} : ${message}`,
                    link
                );
            }
        } catch (e) { console.error("Log error", e) }
    }
}
