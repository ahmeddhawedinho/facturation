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
        const existingUser = await this.prisma.user.findUnique({
            where: { email: data.email },
        });

        if (existingUser) {
            throw new ConflictException('Cet email est déjà utilisé');
        }

        return this.prisma.user.create({
            data: {
                email: data.email,
                password: data.password,
                firstName: data.firstName,
                lastName: data.lastName,
                role: data.role || 'SUB_ACCOUNT' as any,
                companyId: data.companyId,
                customRoleId: data.customRoleId,
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
