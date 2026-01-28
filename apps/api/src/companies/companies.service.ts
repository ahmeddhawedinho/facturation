import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Currency } from '@prisma/client';

@Injectable()
export class CompaniesService {
    constructor(private prisma: PrismaService) { }

    async create(data: {
        name: string;
        legalName: string;
        address: string;
        postalCode?: string;
        city: string;
        country?: string;
        fiscalNumber: string;
        phone?: string;
        email: string;
        website?: string;
        defaultCurrency?: Currency;
    }) {
        const existing = await this.prisma.company.findUnique({
            where: { fiscalNumber: data.fiscalNumber },
        });

        if (existing) {
            throw new ConflictException('Ce matricule fiscal est déjà utilisé');
        }

        return this.prisma.company.create({ data });
    }

    async findAll() {
        return this.prisma.company.findMany({
            include: {
                _count: {
                    select: {
                        users: true,
                        clients: true,
                        documents: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async findById(id: string) {
        const company = await this.prisma.company.findUnique({
            where: { id },
            include: {
                users: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        role: true,
                        isActive: true,
                    },
                },
                _count: {
                    select: {
                        clients: true,
                        documents: true,
                    },
                },
            },
        });

        if (!company) {
            throw new NotFoundException('Entreprise non trouvée');
        }

        return company;
    }

    async update(id: string, data: any) {
        // Filter out fields that shouldn't be updated directly or are not in the model
        const { id: _, createdAt: __, updatedAt: ___, ...updateData } = data;

        return this.prisma.company.update({
            where: { id },
            data: {
                ...updateData,
                employeesCount: data.employeesCount ? Number(data.employeesCount) : undefined,
            },
        });
    }

    async delete(id: string) {
        return this.prisma.company.delete({
            where: { id },
        });
    }

    // Tax Configuration Methods
    async createTax(companyId: string, data: any) {
        return this.prisma.taxConfig.create({
            data: {
                ...data,
                companyId,
            },
        });
    }

    async getTaxes(companyId: string) {
        return this.prisma.taxConfig.findMany({
            where: { companyId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async deleteTax(companyId: string, taxId: string) {
        return this.prisma.taxConfig.delete({
            where: { id: taxId },
        });
    }

    // Payment Methods
    async createPaymentMethod(companyId: string, data: any) {
        return this.prisma.paymentMethod.create({
            data: {
                ...data,
                companyId,
            },
        });
    }

    async getPaymentMethods(companyId: string) {
        return this.prisma.paymentMethod.findMany({
            where: { companyId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async deletePaymentMethod(companyId: string, methodId: string) {
        return this.prisma.paymentMethod.delete({
            where: { id: methodId },
        });
    }

    // Get Company Settings
    async getSettings(companyId: string) {
        if (!companyId) throw new NotFoundException('ID d\'entreprise manquant');

        const company = await this.prisma.company.findUnique({
            where: { id: companyId },
        });

        if (!company) throw new NotFoundException('Entreprise non trouvée');
        return company;
    }
}
