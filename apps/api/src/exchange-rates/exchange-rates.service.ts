import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Currency } from '@prisma/client';

@Injectable()
export class ExchangeRatesService {
    constructor(private prisma: PrismaService) { }

    async createOrUpdate(companyId: string, data: {
        fromCurrency: Currency;
        toCurrency: Currency;
        rate: number;
        isManual: boolean;
    }) {
        return this.prisma.exchangeRate.upsert({
            where: {
                companyId_fromCurrency_toCurrency: {
                    companyId,
                    fromCurrency: data.fromCurrency,
                    toCurrency: data.toCurrency,
                },
            },
            update: {
                rate: data.rate,
                isManual: data.isManual,
            },
            create: {
                ...data,
                companyId,
            },
        });
    }

    async findAll(companyId: string) {
        return this.prisma.exchangeRate.findMany({
            where: { companyId },
            orderBy: { updatedAt: 'desc' },
        });
    }

    async getRate(companyId: string, fromCurrency: Currency, toCurrency: Currency) {
        if (fromCurrency === toCurrency) {
            return 1.0;
        }

        const rate = await this.prisma.exchangeRate.findUnique({
            where: {
                companyId_fromCurrency_toCurrency: {
                    companyId,
                    fromCurrency,
                    toCurrency,
                },
            },
        });

        return rate?.rate || 1.0;
    }
}
