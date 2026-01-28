import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
    constructor(private prisma: PrismaService) { }

    async create(data: {
        title: string;
        message: string;
        type?: string;
        companyId: string;
        userId?: string;
        link?: string;
    }) {
        return this.prisma.notification.create({
            data: {
                title: data.title,
                message: data.message,
                type: data.type || 'INFO',
                companyId: data.companyId,
                userId: data.userId, // Si null, visible par tous les admins (selon notre logique de fetch)
                link: data.link,
            },
        });
    }

    // Alerte tous les admins d'une entreprise
    async notifyAdmins(companyId: string, title: string, message: string, link?: string) {
        // Trouver tous les admins
        const admins = await this.prisma.user.findMany({
            where: { companyId, role: 'ADMIN' },
            select: { id: true }
        });

        // Créer une notif pour chacun (pour gérer le statut "lu" individuellement)
        const notifications = admins.map(admin => ({
            title,
            message,
            type: 'WARNING',
            companyId,
            userId: admin.id,
            link
        }));

        if (notifications.length > 0) {
            await this.prisma.notification.createMany({
                data: notifications
            });
        }
    }

    async findAllUnread(userId: string, companyId: string) {
        return this.prisma.notification.findMany({
            where: {
                companyId,
                userId,
                isRead: false,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async markAsRead(id: string, userId: string) {
        // Vérifier que la notif appartient bien à l'user (sécurité)
        const notif = await this.prisma.notification.findFirst({
            where: { id, userId }
        });

        if (!notif) return null;

        return this.prisma.notification.update({
            where: { id },
            data: { isRead: true },
        });
    }

    async markAllAsRead(userId: string) {
        return this.prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
    }
}
