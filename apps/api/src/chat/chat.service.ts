import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
    constructor(private prisma: PrismaService) { }

    // Sauvegarder un message
    async saveMessage(companyId: string, senderId: string, payload: { content: string, receiverId?: string, channel?: string, channelId?: string }) {
        // Validation basique
        if (!payload.receiverId && !payload.channel && !payload.channelId) throw new Error("Target missing");

        // Verify Membership for Private Channels
        if (payload.channelId) {
            // Check Admin
            const user = await this.prisma.user.findUnique({ where: { id: senderId } });
            const isAdmin = user?.role === 'ADMIN' || (user?.role as string) === 'owner';

            if (!isAdmin) {
                const member = await (this.prisma as any).channelMember.findUnique({
                    where: { channelId_userId: { channelId: payload.channelId, userId: senderId } }
                });
                if (!member) throw new ForbiddenException("Vous n'êtes pas membre de ce canal privé.");
            }
        }

        return this.prisma.chatMessage.create({
            data: {
                content: payload.content,
                senderId,
                companyId,
                receiverId: payload.receiverId || null,
                channel: payload.channel || null,
                channelId: payload.channelId || null,
                isRead: false
            },
            include: { sender: { select: { id: true, firstName: true, lastName: true, role: true } } }
        });
    }

    // Récupérer historique Canal (Public / Legacy)
    async getChannelMessages(companyId: string, channel: string, limit = 50) {
        return this.prisma.chatMessage.findMany({
            where: { companyId, channel },
            orderBy: { createdAt: 'asc' },
            take: limit,
            include: { sender: { select: { id: true, firstName: true, lastName: true, role: true } } }
        });
    }

    // --- NOUVEAUX CANAUX PRIVÉS ---

    // Créer un canal (Admin)
    async createChannel(companyId: string, creatorId: string, name: string, description: string, memberIds: string[]) {
        // Add creator to members if not present
        const allMembers = Array.from(new Set([...memberIds, creatorId]));

        return (this.prisma as any).chatChannel.create({
            data: {
                name,
                description,
                companyId,
                members: {
                    create: allMembers.map(userId => ({ userId }))
                }
            }
        });
    }

    async updateChannel(channelId: string, name: string) {
        return (this.prisma as any).chatChannel.update({ where: { id: channelId }, data: { name } });
    }

    async deleteChannel(channelId: string) {
        return (this.prisma as any).chatChannel.delete({ where: { id: channelId } });
    }

    async addMember(channelId: string, userId: string) {
        try {
            return await (this.prisma as any).channelMember.create({
                data: { channelId, userId }
            });
        } catch (e) {
            // Probably already exists
            return null;
        }
    }

    async removeMember(channelId: string, userId: string) {
        try {
            return await (this.prisma as any).channelMember.delete({
                where: { channelId_userId: { channelId, userId } }
            });
        } catch (e) {
            return null;
        }
    }

    // Lister les canaux (Avec flag d'accès)
    async getUserChannels(companyId: string, userId: string) {
        // Check if user is Admin/Owner
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        const isAdmin = user?.role === 'ADMIN' || (user?.role as string) === 'owner';

        // Fetch all channels for company
        const channels = await (this.prisma as any).chatChannel.findMany({
            where: { companyId },
            include: {
                members: { where: { userId }, select: { userId: true, lastReadAt: true } },
                messages: { orderBy: { createdAt: 'desc' }, take: 1, select: { createdAt: true } }
            }
        });

        // Map to include 'hasAccess'
        return channels.map((c: any) => {
            const hasAccess = isAdmin || c.members.length > 0;
            const lastRead = c.members[0]?.lastReadAt || new Date(0);
            const lastMsg = c.messages[0]?.createdAt || new Date(0);
            const isUnread = hasAccess && (lastMsg > lastRead);

            // Fetch generic count if needed, or just boolean "isUnread"
            // For badge, boolean is enough to show "Red Dot".
            return {
                id: c.id,
                name: c.name,
                description: c.description,
                hasAccess,
                hasUnread: isUnread
            };
        });
    }

    // Messages d'un canal privé
    async getCustomChannelMessages(channelId: string, userId: string, limit = 50) {
        // Vérifier l'accès (Admin ou Membre)
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        const isAdmin = user?.role === 'ADMIN' || (user?.role as string) === 'owner';

        const membership = await (this.prisma as any).channelMember.findUnique({
            where: { channelId_userId: { channelId, userId } }
        });

        if (!membership && !isAdmin) {
            throw new ForbiddenException("Vous n'avez pas accès à ce canal.");
        }

        return this.prisma.chatMessage.findMany({
            where: { channelId },
            orderBy: { createdAt: 'asc' },
            take: limit,
            include: { sender: { select: { id: true, firstName: true, lastName: true, role: true } } }
        });
    }

    // Récupérer historique DM (Privé) entre MOI et AUTRE
    async getDirectMessages(companyId: string, userId1: string, userId2: string, limit = 50) {
        return this.prisma.chatMessage.findMany({
            where: {
                companyId,
                OR: [
                    { senderId: userId1, receiverId: userId2 },
                    { senderId: userId2, receiverId: userId1 }
                ]
            },
            orderBy: { createdAt: 'asc' },
            take: limit,
            include: { sender: { select: { id: true, firstName: true, lastName: true, role: true } } }
        });
    }

    // SUPERVISION (Admin seulement)
    async getAuditLog(companyId: string, adminId: string, targetUser1: string, targetUser2: string) {
        // Vérifier si admin
        const admin = await this.prisma.user.findUnique({ where: { id: adminId } });
        if (admin?.companyId !== companyId || ((admin?.role as string) !== 'ADMIN' && (admin?.role as string) !== 'owner')) {
            throw new ForbiddenException("Non autorisé");
        }

        // Retourne les messages SANS marquer comme lu (Ghost Mode)
        return this.getDirectMessages(companyId, targetUser1, targetUser2, 100);
    }

    // Marquer comme lu (Sauf si supervision)
    async markAsRead(companyId: string, readerId: string, senderId: string) {
        // Update tout ce qui m'est envoyé par senderId
        return this.prisma.chatMessage.updateMany({
            where: {
                companyId,
                senderId: senderId,
                receiverId: readerId,
                isRead: false
            },
            data: { isRead: true }
        });
    }

    // Liste des utilisateurs actifs pour Sidebar (Simulé ou DB)
    async getCompanyUsers(companyId: string) {
        return this.prisma.user.findMany({
            where: { companyId, isActive: true },
            select: { id: true, firstName: true, lastName: true, role: true, email: true }
        });
    }
    // --- ACTIVITY LOGS & UNREAD ---

    async logActivity(userId: string, companyId: string, action: 'CONNECT' | 'DISCONNECT') {
        try {
            return await (this.prisma as any).userActivityLog.create({
                data: { userId, companyId, action }
            });
        } catch (e) { console.error("Log Activity Error", e); }
    }

    async getCompanyActivityLogs(companyId: string, adminId: string) {
        // Admin check logic is often in controller, but double check here
        return (this.prisma as any).userActivityLog.findMany({
            where: { companyId },
            orderBy: { timestamp: 'desc' },
            include: { user: { select: { firstName: true, lastName: true } } },
            take: 200
        });
    }

    async markChannelRead(channelId: string, userId: string) {
        try {
            return await (this.prisma as any).channelMember.update({
                where: { channelId_userId: { channelId, userId } },
                data: { lastReadAt: new Date() }
            });
        } catch (e) { return null; }
    }
}
