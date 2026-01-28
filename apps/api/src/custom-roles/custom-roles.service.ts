import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CustomRolesService {
    constructor(private prisma: PrismaService) { }

    async create(companyId: string, data: { name: string; permissions: string[] }) {
        // Vérifier si un rôle avec ce nom existe déjà pour cette entreprise
        const existing = await (this.prisma as any).customRole.findUnique({
            where: {
                companyId_name: {
                    companyId,
                    name: data.name,
                },
            },
        });

        if (existing) {
            throw new ConflictException('Un rôle avec ce nom existe déjà');
        }

        return (this.prisma as any).customRole.create({
            data: {
                name: data.name,
                permissions: data.permissions,
                companyId,
            },
        });
    }

    async findAll(companyId: string) {
        return (this.prisma as any).customRole.findMany({
            where: { companyId },
            include: {
                _count: {
                    select: { users: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findById(id: string, companyId: string) {
        const role = await (this.prisma as any).customRole.findFirst({
            where: { id, companyId },
            include: {
                users: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });

        if (!role) {
            throw new NotFoundException('Rôle non trouvé');
        }

        return role;
    }

    async update(id: string, companyId: string, data: { name?: string; permissions?: string[] }) {
        const role = await this.findById(id, companyId);

        return (this.prisma as any).customRole.update({
            where: { id: role.id },
            data,
        });
    }

    async delete(id: string, companyId: string) {
        const role = await this.findById(id, companyId);

        // Vérifier si des utilisateurs utilisent ce rôle
        const usersCount = await this.prisma.user.count({
            where: { customRoleId: id } as any,
        });

        if (usersCount > 0) {
            throw new ConflictException(
                `Impossible de supprimer ce rôle car ${usersCount} utilisateur(s) l'utilisent`,
            );
        }

        return (this.prisma as any).customRole.delete({
            where: { id: role.id },
        });
    }

    getAvailablePermissions() {
        return [
            // --- VENTES ---
            { id: 'sales:read', label: 'Voir les ventes', category: 'Vente', description: 'Voir la liste des devis, factures, commandes' },
            { id: 'sales:create', label: 'Créer des ventes', category: 'Vente', description: 'Créer de nouveaux documents de vente' },
            { id: 'sales:update', label: 'Modifier ses ventes', category: 'Vente', description: 'Modifier les documents qu\'on a créés' },
            { id: 'sales:update_all', label: 'Modifier TOUTES les ventes', category: 'Vente', description: 'Modifier les documents de tout le monde' },
            { id: 'sales:delete', label: 'Supprimer ses ventes', category: 'Vente', description: 'Supprimer (mettre à la corbeille) ses documents' },
            { id: 'sales:delete_all', label: 'Supprimer TOUTES les ventes', category: 'Vente', description: 'Supprimer n\'importe quel document' },
            { id: 'sales:validate', label: 'Valider les ventes', category: 'Vente', description: 'Transformer en facture validée' },
            { id: 'sales:export', label: 'Exporter PDF', category: 'Vente', description: 'Générer les PDF' },

            // --- CATALOGUE ---
            { id: 'catalog:read', label: 'Voir le catalogue', category: 'Catalogue' },
            { id: 'catalog:manage', label: 'Gérer catalogue', category: 'Catalogue', description: 'Ajouter/Modifier/Supprimer des produits et prix' },
            { id: 'stock:manage', label: 'Gérer le stock', category: 'Catalogue', description: 'Faire des ajustements de stock' },

            // --- ACHATS ---
            { id: 'purchases:read', label: 'Voir les achats', category: 'Achat' },
            { id: 'purchases:create', label: 'Créer des achats', category: 'Achat' },
            { id: 'purchases:manage', label: 'Gérer les achats', category: 'Achat', description: 'Modifier/Supprimer toutes les commandes d\'achat' },

            // --- RH & SALAIRES ---
            { id: 'hr:read', label: 'Voir les RH', category: 'Ressources Humaines' },
            { id: 'hr:manage', label: 'Gérer les RH', category: 'Ressources Humaines', description: 'Gérer employés et salaires' },

            // --- ADMINISTRATION ---
            { id: 'users:manage', label: 'Gérer les utilisateurs', category: 'Administration', description: 'Créer des comptes et rôles' },
            { id: 'settings:manage', label: 'Gérer l\'entreprise', category: 'Administration', description: 'Modifier les infos société' },
            { id: 'logs:read', label: 'Voir les logs', category: 'Administration', description: 'Voir qui a fait quoi' },
        ];
    }
}
