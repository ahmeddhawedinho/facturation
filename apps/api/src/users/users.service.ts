import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';


@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async create(data: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        role?: any;
        companyId?: string;
        customRoleId?: string;
    }) {
        console.log('═══════════════════════════════════════════════════');
        console.log('📝 CRÉATION D\'UTILISATEUR - DÉBUT');
        console.log('═══════════════════════════════════════════════════');
        console.log('📋 Données reçues:', {
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            role: data.role,
            companyId: data.companyId,
            customRoleId: data.customRoleId,
            passwordLength: data.password?.length
        });

        console.log('🔍 Vérification de l\'email existant...');
        const existingUser = await this.prisma.user.findUnique({
            where: { email: data.email },
        });

        if (existingUser) {
            console.error('❌ Email déjà utilisé:', data.email);
            throw new ConflictException('Cet email est déjà utilisé');
        }
        console.log('✅ Email disponible');

        // Nettoyer customRoleId - si c'est une chaîne vide, le mettre à undefined
        const cleanCustomRoleId = data.customRoleId && data.customRoleId.trim() !== ''
            ? data.customRoleId
            : undefined;

        console.log('🧹 CustomRoleId nettoyé:', cleanCustomRoleId);

        try {
            console.log('💾 Appel à Prisma.user.create...');
            const newUser = await this.prisma.user.create({
                data: {
                    email: data.email,
                    password: data.password,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    role: data.role || 'SUB_ACCOUNT' as any,
                    companyId: data.companyId,
                    customRoleId: cleanCustomRoleId,
                },
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    role: true,
                    companyId: true,
                    customRoleId: true,
                    customRole: {
                        select: {
                            id: true,
                            name: true,
                            permissions: true,
                        }
                    },
                    permissions: true,
                    isActive: true,
                    createdAt: true,
                } as any,
            });

            console.log('═══════════════════════════════════════════════════');
            console.log('✅ UTILISATEUR CRÉÉ AVEC SUCCÈS');
            console.log('═══════════════════════════════════════════════════');
            console.log('👤 ID:', newUser.id);
            console.log('📧 Email:', newUser.email);
            console.log('👨 Nom:', newUser.firstName, newUser.lastName);
            console.log('🏢 CompanyId:', newUser.companyId);
            console.log('🔑 Role:', newUser.role);
            console.log('✅ isActive:', newUser.isActive);
            console.log('═══════════════════════════════════════════════════');

            return newUser;
        } catch (error) {
            console.error('═══════════════════════════════════════════════════');
            console.error('❌ ERREUR PRISMA LORS DE LA CRÉATION');
            console.error('═══════════════════════════════════════════════════');
            console.error('❌ Message:', error.message);
            console.error('❌ Code:', error.code);
            console.error('❌ Stack:', error.stack);
            console.error('═══════════════════════════════════════════════════');
            throw error;
        }
    }

    async findByEmail(email: string) {
        return this.prisma.user.findUnique({
            where: { email },
            include: {
                company: true,
                customRole: true,
            } as any,
        });
    }

    async findById(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            include: {
                company: true,
            },
        });

        if (!user) {
            throw new NotFoundException('Utilisateur non trouvé');
        }

        return user;
    }

    async findAll(companyId?: string) {
        return this.prisma.user.findMany({
            where: companyId ? { companyId } : {},
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                customRoleId: true,
                customRole: {
                    select: {
                        id: true,
                        name: true,
                        permissions: true,
                    }
                },
                permissions: true,
                isActive: true,
                createdAt: true,
                company: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            } as any,
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    async update(id: string, data: Partial<{
        firstName: string;
        lastName: string;
        isActive: boolean;
        role: any;
        password: string;
        customRoleId: string;
    }>) {
        return this.prisma.user.update({
            where: { id },
            data,
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                isActive: true,
                companyId: true,
            },
        });
    }

    async delete(id: string) {
        return this.prisma.user.delete({
            where: { id },
        });
    }
}
