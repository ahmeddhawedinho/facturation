import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SalariesService {
    constructor(private prisma: PrismaService) { }

    // Service de compatibilité - redirige vers le nouveau système
    async findAll(companyId: string) {
        // Retourner les enregistrements mensuels au lieu des anciens paiements
        return this.prisma.monthlySalaryRecord.findMany({
            where: { companyId },
            include: {
                employee: true,
                advances: true,
                adjustments: true
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async findByEmployee(companyId: string, employeeId: string) {
        return this.prisma.monthlySalaryRecord.findMany({
            where: { companyId, employeeId },
            include: {
                advances: true,
                adjustments: true
            },
            orderBy: [
                { year: 'desc' },
                { month: 'desc' }
            ]
        });
    }
}
