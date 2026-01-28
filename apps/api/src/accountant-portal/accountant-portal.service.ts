import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../common/email.service';
import { AccountantExportService } from './accountant-export.service';
import { ChatService } from '../chat/chat.service';
import * as crypto from 'crypto';

@Injectable()
export class AccountantPortalService {
    constructor(
        private prisma: PrismaService,
        private notificationsService: NotificationsService,
        private emailService: EmailService,
        private accountantExportService: AccountantExportService,
        private chatService: ChatService,
    ) { }

    // ==================== GESTION DES RELATIONS ====================

    /**
     * Créer un nouveau dossier client (Méthode B - par le Comptable)
     * Le système crée un compte Admin PENDING et envoie un email d'activation
     */
    async createClientFolder(accountantId: string, clientData: any) {
        // Vérifier que l'user est bien ACCOUNTANT
        const accountant = await this.prisma.user.findUnique({
            where: { id: accountantId },
        });

        if (!accountant || accountant.role !== 'ACCOUNTANT') {
            throw new ForbiddenException('Seuls les experts comptables peuvent créer des dossiers clients');
        }

        // Créer la company
        const company = await this.prisma.company.create({
            data: {
                name: clientData.name,
                legalName: clientData.legalName || clientData.name,
                address: clientData.address,
                postalCode: clientData.postalCode,
                city: clientData.city,
                country: clientData.country || 'Tunisie',
                fiscalNumber: clientData.fiscalNumber,
                phone: clientData.phone,
                email: clientData.email,
                isActive: false, // Compte PENDING jusqu'à activation
            },
        });

        // Créer un compte Admin PENDING
        const tempPassword = crypto.randomBytes(8).toString('hex');
        const hashedPassword = await this.hashPassword(tempPassword);

        const adminUser = await this.prisma.user.create({
            data: {
                email: clientData.email,
                password: hashedPassword,
                firstName: clientData.contactFirstName || 'Admin',
                lastName: clientData.contactLastName || company.name,
                role: 'ADMIN',
                isActive: false, // Compte PENDING
                companyId: company.id,
            },
        });

        // Créer la relation comptable-client
        const relation = await this.prisma.accountantClientRelation.create({
            data: {
                accountantId,
                companyId: company.id,
                status: 'PENDING',
            },
        });

        // Envoyer email d'activation au client avec lien + mot de passe temporaire
        await this.emailService.sendClientActivationEmail(
            clientData.email,
            company.name,
            tempPassword,
            `${accountant.firstName} ${accountant.lastName}`,
        );

        return {
            company,
            adminUser,
            relation,
            tempPassword, // À envoyer par email
        };
    }

    /**
     * Générer un code d'accès unique pour l'entreprise (Méthode par Code)
     */
    async generateAccessCode(companyId: string, userId: string) {
        // Vérifier que l'user est ADMIN de cette company
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { company: true },
        });

        if (!user || user.role !== 'ADMIN' || user.companyId !== companyId) {
            throw new ForbiddenException('Seul l\'administrateur peut générer un code d\'accès');
        }

        // Générer un code unique court et lisible (format: ABC-123-XYZ)
        const code = this.generateUniqueCode();

        // Mettre à jour la company avec le nouveau code
        await this.prisma.company.update({
            where: { id: companyId },
            data: { accountantAccessCode: code },
        });

        return {
            code,
            companyName: user.company.name,
            expiresAt: null, // Le code n'expire jamais tant qu'il n'est pas régénéré
        };
    }

    /**
     * Connecter un comptable à une entreprise via un code d'accès
     */
    async connectWithCode(accountantId: string, accessCode: string) {
        // Vérifier que l'user est ACCOUNTANT
        const accountant = await this.prisma.user.findUnique({
            where: { id: accountantId },
        });

        if (!accountant || accountant.role !== 'ACCOUNTANT') {
            throw new ForbiddenException('Seuls les experts comptables peuvent utiliser un code d\'accès');
        }

        // Trouver la company par le code
        const company = await this.prisma.company.findUnique({
            where: { accountantAccessCode: accessCode.trim().toUpperCase() },
        });

        if (!company) {
            throw new NotFoundException('Code d\'accès invalide');
        }

        // Vérifier si une relation existe déjà
        const existing = await this.prisma.accountantClientRelation.findUnique({
            where: {
                accountantId_companyId: {
                    accountantId,
                    companyId: company.id,
                },
            },
        });

        if (existing) {
            if (existing.status === 'ACTIVE') {
                throw new BadRequestException('Vous avez déjà accès à ce dossier client');
            }
            // Si PENDING ou SUSPENDED, réactiver
            await this.prisma.accountantClientRelation.update({
                where: { id: existing.id },
                data: { status: 'ACTIVE' },
            });
            return { company, message: 'Accès réactivé avec succès' };
        }

        // Créer la relation ACTIVE
        await this.prisma.accountantClientRelation.create({
            data: {
                accountantId,
                companyId: company.id,
                status: 'ACTIVE',
            },
        });

        // Notifier l'admin du client
        await this.notificationsService.notifyAdmins(
            company.id,
            'Nouveau comptable connecté',
            `${accountant.firstName} ${accountant.lastName} a rejoint votre dossier avec le code d'accès.`,
        );

        return { company, message: 'Client ajouté avec succès' };
    }

    /**
     * Révoquer l'accès d'un comptable (par l'admin)
     */
    async revokeAccountantAccess(companyId: string, userId: string) {
        // Vérifier que l'user est ADMIN de cette company
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user || user.role !== 'ADMIN' || user.companyId !== companyId) {
            throw new ForbiddenException('Seul l\'administrateur peut révoquer l\'accès');
        }

        // Trouver les relations actives
        const relations = await this.prisma.accountantClientRelation.findMany({
            where: {
                companyId,
                status: 'ACTIVE',
            },
        });

        if (relations.length === 0) {
            throw new NotFoundException('Aucun comptable connecté');
        }

        // Passer toutes les relations en SUSPENDED
        await this.prisma.accountantClientRelation.updateMany({
            where: {
                companyId,
                status: 'ACTIVE',
            },
            data: { status: 'SUSPENDED' },
        });

        return { message: 'Accès du comptable révoqué avec succès', count: relations.length };
    }

    /**
     * Obtenir les informations du comptable connecté (pour l'admin)
     */
    async getConnectedAccountant(companyId: string, userId: string) {
        // Vérifier que l'user est ADMIN de cette company
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user || user.role !== 'ADMIN' || user.companyId !== companyId) {
            throw new ForbiddenException('Accès refusé');
        }

        // Trouver la relation active
        const relation = await this.prisma.accountantClientRelation.findFirst({
            where: {
                companyId,
                status: 'ACTIVE',
            },
            include: {
                accountant: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
        });

        return relation;
    }

    /**
     * Ancien système d'invitation - DEPRECATED - Garder pour compatibilité
     */
    async generateInvitationLink(companyId: string, userId: string) {
        // Rediriger vers le nouveau système de code
        return this.generateAccessCode(companyId, userId);
    }

    /**
     * Accepter une invitation (Méthode A - le Comptable accepte)
     */
    async acceptInvitation(accountantId: string, token: string) {
        // Vérifier que l'user est ACCOUNTANT
        const accountant = await this.prisma.user.findUnique({
            where: { id: accountantId },
        });

        if (!accountant || accountant.role !== 'ACCOUNTANT') {
            throw new ForbiddenException('Seuls les experts comptables peuvent accepter des invitations');
        }

        // Trouver la relation par token
        const relation = await this.prisma.accountantClientRelation.findUnique({
            where: { invitationToken: token },
            include: { company: true },
        });

        if (!relation) {
            throw new NotFoundException('Invitation invalide ou expirée');
        }

        if (relation.status === 'ACTIVE') {
            throw new BadRequestException('Cette invitation a déjà été acceptée');
        }

        // Vérifier si une relation existe déjà
        const existing = await this.prisma.accountantClientRelation.findUnique({
            where: {
                accountantId_companyId: {
                    accountantId,
                    companyId: relation.companyId,
                },
            },
        });

        if (existing && existing.id !== relation.id) {
            throw new BadRequestException('Vous avez déjà accès à ce dossier client');
        }

        // Activer la relation
        const updated = await this.prisma.accountantClientRelation.update({
            where: { id: relation.id },
            data: {
                accountantId,
                status: 'ACTIVE',
            },
            include: { company: true },
        });

        // Notifier l'admin du client
        await this.notificationsService.notifyAdmins(
            relation.companyId,
            'Comptable connecté',
            `${accountant.firstName} ${accountant.lastName} a accepté votre invitation et a maintenant accès à votre dossier.`,
        );

        return updated;
    }

    /**
     * Obtenir la liste des dossiers clients d'un comptable
     */
    async getClientFolders(accountantId: string) {
        const relations = await this.prisma.accountantClientRelation.findMany({
            where: {
                accountantId,
                status: 'ACTIVE',
            },
            include: {
                company: {
                    select: {
                        id: true,
                        name: true,
                        legalName: true,
                        fiscalNumber: true,
                        address: true,
                        city: true,
                        email: true,
                        phone: true,
                        logo: true,
                        isActive: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return relations.map(r => r.company);
    }

    // ==================== CONSULTATION DOCUMENTS ====================

    /**
     * Obtenir le journal des ventes d'un client
     */
    async getSalesJournal(accountantId: string, companyId: string, filters: any) {
        await this.verifyAccess(accountantId, companyId);

        const where: any = {
            companyId,
            type: { in: ['INVOICE', 'QUOTE', 'CREDIT_NOTE'] },
        };

        if (filters.startDate || filters.endDate) {
            where.issueDate = {};
            if (filters.startDate) where.issueDate.gte = new Date(filters.startDate);
            if (filters.endDate) where.issueDate.lte = new Date(filters.endDate);
        }

        if (filters.status) {
            where.status = filters.status;
        }

        const documents = await this.prisma.document.findMany({
            where,
            include: {
                client: true,
                paymentMethod: true,
                lines: {
                    include: { taxRate: true },
                },
                attachments: true,
                payments: {  // Inclure les paiements et leurs justificatifs
                    select: {
                        id: true,
                        amount: true,
                        paymentDate: true,
                        paymentMode: true,
                        reference: true,
                        attachmentUrl: true,
                        attachmentType: true,
                    },
                },
            },
            orderBy: { issueDate: 'desc' },
        });

        return documents;
    }

    /**
     * Obtenir le journal des achats/charges d'un client
     */
    async getPurchasesJournal(accountantId: string, companyId: string, filters: any) {
        await this.verifyAccess(accountantId, companyId);

        const where: any = {
            companyId,
            type: { in: ['PURCHASE_INVOICE', 'PURCHASE_ORDER'] },
        };

        if (filters.startDate || filters.endDate) {
            where.issueDate = {};
            if (filters.startDate) where.issueDate.gte = new Date(filters.startDate);
            if (filters.endDate) where.issueDate.lte = new Date(filters.endDate);
        }

        // Pour les achats, on peut aussi chercher dans PurchaseOrder
        const purchaseOrders = await this.prisma.purchaseOrder.findMany({
            where: {
                companyId,
                ...(filters.startDate && { issueDate: { gte: new Date(filters.startDate) } }),
                ...(filters.endDate && { issueDate: { lte: new Date(filters.endDate) } }),
            },
            include: {
                supplier: true,
                lines: {
                    include: { taxRate: true },
                },
            },
            orderBy: { issueDate: 'desc' },
        });

        return purchaseOrders;
    }

    /**
     * Obtenir les justificatifs de paiement d'un document
     */
    async getPaymentProofs(accountantId: string, documentId: string) {
        // Récupérer le document pour vérifier l'accès
        const document = await this.prisma.document.findUnique({
            where: { id: documentId },
            select: { companyId: true },
        });

        if (!document) {
            throw new NotFoundException('Document non trouvé');
        }

        // Vérifier l'accès
        await this.verifyAccess(accountantId, document.companyId);

        // Récupérer les paiements avec justificatifs
        const payments = await this.prisma.payment.findMany({
            where: {
                documentId,
                attachmentUrl: { not: null },
            },
            select: {
                id: true,
                amount: true,
                paymentDate: true,
                paymentMode: true,
                reference: true,
                attachmentUrl: true,
                attachmentType: true,
            },
            orderBy: { paymentDate: 'asc' },
        });

        return payments;
    }

    /**
     * Télécharger une pièce jointe
     */
    async getDocumentAttachment(accountantId: string, attachmentId: string) {
        const attachment = await this.prisma.documentAttachment.findUnique({
            where: { id: attachmentId },
            include: {
                document: {
                    select: { companyId: true },
                },
            },
        });

        if (!attachment) {
            throw new NotFoundException('Pièce jointe non trouvée');
        }

        await this.verifyAccess(accountantId, attachment.document.companyId);

        return attachment;
    }

    // ==================== HELPERS ====================

    /**
     * Vérifier que le comptable a bien accès au dossier client
     */
    private async verifyAccess(accountantId: string, companyId: string) {
        const relation = await this.prisma.accountantClientRelation.findUnique({
            where: {
                accountantId_companyId: {
                    accountantId,
                    companyId,
                },
            },
        });

        if (!relation || relation.status !== 'ACTIVE') {
            throw new ForbiddenException('Vous n\'avez pas accès à ce dossier client');
        }

        return relation;
    }

    /**
     * Générer un code unique format ABC-123-XYZ
     */
    private generateUniqueCode(): string {
        const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Sans I, O pour éviter confusion avec 1, 0
        const numbers = '0123456789';

        // Partie 1: 3 lettres
        let part1 = '';
        for (let i = 0; i < 3; i++) {
            part1 += letters.charAt(Math.floor(Math.random() * letters.length));
        }

        // Partie 2: 3 chiffres
        let part2 = '';
        for (let i = 0; i < 3; i++) {
            part2 += numbers.charAt(Math.floor(Math.random() * numbers.length));
        }

        // Partie 3: 2 lettres
        let part3 = '';
        for (let i = 0; i < 2; i++) {
            part3 += letters.charAt(Math.floor(Math.random() * letters.length));
        }

        return `${part1}-${part2}-${part3}`;
    }

    /**
     * Exporter une sélection de documents avec optionnellement leurs justificatifs
     */
    async exportSelectedDocuments(
        accountantId: string,
        companyId: string,
        documentIds: string[],
        includeProofs: boolean,
    ): Promise<Buffer> {
        // Vérifier l'accès
        await this.verifyAccess(accountantId, companyId);

        // Récupérer les documents sélectionnés
        const documents = await this.prisma.document.findMany({
            where: {
                id: { in: documentIds },
                companyId,
            },
            include: {
                client: true,
                paymentMethod: true,
                lines: { include: { taxRate: true } },
                attachments: true,
                payments: includeProofs ? {
                    where: { attachmentUrl: { not: null } },
                } : false,
            },
        });

        // Déléguer la génération du ZIP au service d'export
        return this.accountantExportService.exportSelectedWithProofs(documents, includeProofs);
    }

    // ==================== MESSAGERIE INSTANTANÉE ====================

    /**
     * S'assurer que le canal de chat "Expert Comptable" existe pour ce client
     */
    async ensureAccountantChannel(accountantId: string, companyId: string) {
        // Vérifier l'accès
        await this.verifyAccess(accountantId, companyId);

        const channelName = 'Comptabilité';

        // @ts-ignore: Chat models might not be fully generated in types
        let channel = await this.prisma.chatChannel.findFirst({
            where: { companyId, name: channelName },
            include: { members: true },
        });

        if (!channel) {
            // Créer le canal avec l'Admin de la société
            const admin = await this.prisma.user.findFirst({
                where: { companyId, role: 'ADMIN' },
            });

            const members = [accountantId];
            if (admin) members.push(admin.id);

            channel = await this.chatService.createChannel(
                companyId,
                accountantId,
                channelName,
                'Communication avec l\'expert comptable',
                members
            );
        } else {
            // @ts-ignore
            const isMember = channel.members.some((m: any) => m.userId === accountantId);
            if (!isMember) {
                await this.chatService.addMember(channel.id, accountantId);
            }
        }
        return channel;
    }

    async getChatMessages(accountantId: string, companyId: string, limit = 50) {
        const channel = await this.ensureAccountantChannel(accountantId, companyId);
        return this.chatService.getCustomChannelMessages(channel.id, accountantId, limit);
    }

    async sendMessage(accountantId: string, companyId: string, content: string) {
        const channel = await this.ensureAccountantChannel(accountantId, companyId);
        return this.chatService.saveMessage(companyId, accountantId, {
            content,
            channelId: channel.id,
        });
    }

    /**
     * Initialiser le chat côté Entreprise vers son Expert
     */
    async initCompanyChat(companyId: string) {
        const relation = await this.prisma.accountantClientRelation.findFirst({
            where: { companyId, status: 'ACTIVE' }
        });

        if (!relation) {
            throw new NotFoundException("Aucun expert comptable actif n'est lié à votre dossier.");
        }

        return this.ensureAccountantChannel(relation.accountantId, companyId);
    }

    /**
     * Hash password (simple bcrypt alternative pour POC)
     */
    private async hashPassword(password: string): Promise<string> {
        // TODO: Utiliser bcrypt en production
        const crypto = require('crypto');
        return crypto.createHash('sha256').update(password).digest('hex');
    }
}
