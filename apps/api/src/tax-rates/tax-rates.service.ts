import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TaxRatesService {
    constructor(private prisma: PrismaService) { }

    async create(companyId: string, data: {
        name: string;
        rate: number;
        isDefault?: boolean;
    }) {
        // Si isDefault est true, désactiver les autres defaults
        if (data.isDefault) {
            await this.prisma.taxRate.updateMany({
                where: { companyId, isDefault: true },
                data: { isDefault: false },
            });
        }

        return this.prisma.taxRate.create({
            data: {
                ...data,
                companyId,
            },
        });
    }

    async findAll(companyId: string) {
        let taxes = await this.prisma.taxRate.findMany({
            where: { companyId, isActive: true },
            orderBy: { rate: 'desc' },
        });

        // Si aucune taxe n'existe, en créer par défaut
        if (taxes.length === 0) {
            await Promise.all([
                this.create(companyId, { name: 'TVA 19%', rate: 19.0, isDefault: true }),
                this.create(companyId, { name: 'TVA 13%', rate: 13.0 }),
                this.create(companyId, { name: 'TVA 7%', rate: 7.0 }),
                this.create(companyId, { name: 'Exonéré', rate: 0.0 }),
            ]);

            taxes = await this.prisma.taxRate.findMany({
                where: { companyId, isActive: true },
                orderBy: { rate: 'desc' },
            });
        }

        return taxes;
    }

    async update(id: string, companyId: string, data: Partial<{
        name: string;
        rate: number;
        isDefault: boolean;
        isActive: boolean;
    }>) {
        if (data.isDefault) {
            await this.prisma.taxRate.updateMany({
                where: { companyId, isDefault: true, NOT: { id } },
                data: { isDefault: false },
            });
        }

        return this.prisma.taxRate.update({
            where: { id, companyId },
            data,
        });
    }

    async delete(id: string, companyId: string) {
        return this.prisma.taxRate.delete({
            where: { id, companyId },
        });
    }
}
