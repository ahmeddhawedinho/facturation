import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
    constructor(private prisma: PrismaService) { }

    private getPeriod(startDate?: string, endDate?: string) {
        const today = new Date();
        const start = startDate ? new Date(startDate) : new Date(today.getFullYear(), today.getMonth(), 1);
        const end = endDate ? new Date(endDate) : new Date(); // now
        return { start, end };
    }

    // --- 1. VENTES ---
    async getSalesStats(companyId: string, startDate?: string, endDate?: string, clientId?: string) {
        const { start, end } = this.getPeriod(startDate, endDate);
        const docWhere: any = { companyId, issueDate: { gte: start, lte: end } };
        if (clientId) docWhere.clientId = clientId;
        const stockWhere: any = { companyId };
        if (clientId) stockWhere.clientId = clientId;

        const invoicesPeriod = await this.prisma.document.findMany({
            where: { ...docWhere, type: 'INVOICE', status: { notIn: ['CANCELLED', 'TRASHED'] } },
            select: { total: true, paidAmount: true, status: true }
        });

        const quotes = await this.prisma.document.count({ where: { ...docWhere, type: 'QUOTE' } });

        let collectedRevenue = 0;
        let totalVolume = 0;
        for (const doc of invoicesPeriod) {
            totalVolume += doc.total;
            if (doc.status === 'PAID') collectedRevenue += doc.total;
            else collectedRevenue += (doc.paidAmount || 0);
        }

        const allOutstandingInvoices = await this.prisma.document.findMany({
            where: { ...stockWhere, type: 'INVOICE', status: { notIn: ['CANCELLED', 'TRASHED', 'PAID'] } },
            select: { total: true, paidAmount: true }
        });

        const outstandingRevenue = allOutstandingInvoices.reduce((acc, doc) => {
            const due = doc.total - (doc.paidAmount || 0);
            return acc + (due > 0 ? due : 0);
        }, 0);

        const chartData = await this.getSixMonthsChartData(companyId, async (s, e) => {
            const docs = await this.prisma.document.findMany({
                where: {
                    companyId, type: 'INVOICE', status: { notIn: ['CANCELLED', 'TRASHED'] },
                    issueDate: { gte: s, lte: e }, ...(clientId ? { clientId } : {})
                },
                select: { total: true, paidAmount: true, status: true }
            });
            let c = 0, o = 0;
            docs.forEach(d => {
                if (d.status === 'PAID') c += d.total;
                else { c += (d.paidAmount || 0); o += (d.total - (d.paidAmount || 0)); }
            });
            return { collected: c, outstanding: o };
        });

        return { quoteCount: quotes, invoiceCount: invoicesPeriod.length, collectedRevenue, outstandingRevenue, totalVolume, chartData };
    }

    // --- 2. RH ---
    async getHRStats(companyId: string, startDate?: string, endDate?: string) {
        const { start, end } = this.getPeriod(startDate, endDate);

        // Salaire: Intersection Mois/Période
        const salaryRecords = await this.prisma.monthlySalaryRecord.findMany({
            where: { companyId, year: { gte: start.getFullYear(), lte: end.getFullYear() } },
            select: { totalSalary: true, month: true, year: true }
        });

        let netPayroll = 0;
        for (const rec of salaryRecords) {
            const monthStart = new Date(rec.year, rec.month - 1, 1);
            const monthEnd = new Date(rec.year, rec.month, 0);
            if (start <= monthEnd && end >= monthStart) netPayroll += rec.totalSalary;
        }

        // Avances: Mois complet
        const advancesAgg = await this.prisma.salaryAdvance.aggregate({
            _sum: { amount: true },
            where: {
                companyId,
                date: {
                    gte: new Date(start.getFullYear(), start.getMonth(), 1),
                    lte: new Date(end.getFullYear(), end.getMonth() + 1, 0, 23, 59, 59)
                }
            }
        });
        const totalAdvances = advancesAgg._sum.amount || 0;

        const activeEmployees = await this.prisma.employee.count({ where: { companyId, isActive: true } });
        const averageSalary = activeEmployees > 0 ? netPayroll / activeEmployees : 0;

        const chartData = await this.getSixMonthsChartData(companyId, async (s, e) => {
            const recs = await this.prisma.monthlySalaryRecord.findMany({
                where: { companyId, year: { gte: s.getFullYear(), lte: e.getFullYear() } },
                select: { totalSalary: true, month: true, year: true }
            });
            let sumSalaries = 0;
            for (const r of recs) {
                const ms = new Date(r.year, r.month - 1, 1);
                const me = new Date(r.year, r.month, 0);
                if (s <= me && e >= ms) sumSalaries += r.totalSalary;
            }
            const adv = await this.prisma.salaryAdvance.aggregate({
                _sum: { amount: true }, where: { companyId, date: { gte: s, lte: e } }
            });
            return { net: sumSalaries, advances: adv._sum.amount || 0 };
        });

        return { netPayroll, totalAdvances, averageSalary, activeEmployees, chartData };
    }

    // --- 3. CLIENTS ---
    async getClientStats(companyId: string, startDate?: string, endDate?: string) {
        const { start, end } = this.getPeriod(startDate, endDate);

        // Volume pour panier moyen (basé sur période ?) -> Oui, panier moyen de la période
        const invoicesPeriod = await this.prisma.document.findMany({
            where: { companyId, type: 'INVOICE', status: { notIn: ['CANCELLED', 'TRASHED'] }, issueDate: { gte: start, lte: end } },
            select: { total: true }
        });
        const totalVolume = invoicesPeriod.reduce((acc, d) => acc + d.total, 0);

        const totalClientsTotal = await this.prisma.client.count({ where: { companyId } });
        const newClientsCount = await this.prisma.client.count({ where: { companyId, createdAt: { gte: start, lte: end } } });
        // Panier moyen = CA Période / Nb Clients Actifs ? Ou Nb Clients total ? 
        // Standard : Panier moyen par commande ou par client ACTIF. Prenons simple: CA / Total Clients
        const averageBasket = totalClientsTotal > 0 ? totalVolume / totalClientsTotal : 0;

        const topClientGroup = await this.prisma.document.groupBy({
            by: ['clientId'],
            _sum: { total: true },
            where: { companyId, type: 'INVOICE', status: { notIn: ['CANCELLED', 'TRASHED'] }, issueDate: { gte: start, lte: end }, clientId: { not: null } },
            orderBy: { _sum: { total: 'desc' } }, take: 1
        });
        let topClient = { name: 'Aucun', amount: 0 };
        if (topClientGroup.length > 0 && topClientGroup[0].clientId) {
            const c = await this.prisma.client.findUnique({ where: { id: topClientGroup[0].clientId } });
            topClient = { name: c?.name || 'Inconnu', amount: topClientGroup[0]._sum.total || 0 };
        }

        const chartData = await this.getSixMonthsChartData(companyId, async (s, e) => {
            const count = await this.prisma.client.count({ where: { companyId, createdAt: { gte: s, lte: e } } });
            return { newClients: count };
        });

        return { totalClients: totalClientsTotal, newClients: newClientsCount, topClient, averageBasket, chartData };
    }

    // --- 4. ACHATS ---
    async getPurchaseStats(companyId: string, startDate?: string, endDate?: string, supplierId?: string) {
        const { start, end } = this.getPeriod(startDate, endDate);
        const poWhere: any = { companyId, issueDate: { gte: start, lte: end } };
        if (supplierId) poWhere.supplierId = supplierId;

        const stockAgg = await this.prisma.purchaseOrder.aggregate({ _sum: { total: true }, where: { ...poWhere, nature: 'PRODUCT' } });
        const stockExpenses = stockAgg._sum.total || 0;

        const chargeAgg = await this.prisma.purchaseOrder.aggregate({ _sum: { total: true }, where: { ...poWhere, nature: 'CHARGE' } });
        const fixedExpenses = chargeAgg._sum.total || 0;
        const totalPurchases = stockExpenses + fixedExpenses;

        const stockRatio = totalPurchases > 0 ? (stockExpenses / totalPurchases) * 100 : 0;
        const fixedRatio = totalPurchases > 0 ? (fixedExpenses / totalPurchases) * 100 : 0;

        const stockOrdersCount = await this.prisma.purchaseOrder.count({ where: { ...poWhere, nature: 'PRODUCT' } });
        const averageStockOrder = stockOrdersCount > 0 ? stockExpenses / stockOrdersCount : 0;

        const suppliersProduct = await this.prisma.supplier.count({ where: { companyId, category: 'PRODUCT' } });
        const suppliersCharge = await this.prisma.supplier.count({ where: { companyId, category: 'CHARGE' } });

        const chartData = await this.getSixMonthsChartData(companyId, async (s, e) => {
            const sWhere: any = { companyId, nature: 'PRODUCT', issueDate: { gte: s, lte: e } };
            const cWhere: any = { companyId, nature: 'CHARGE', issueDate: { gte: s, lte: e } };
            if (supplierId) { sWhere.supplierId = supplierId; cWhere.supplierId = supplierId; }

            const stock = await this.prisma.purchaseOrder.aggregate({ _sum: { total: true }, where: sWhere });
            const charges = await this.prisma.purchaseOrder.aggregate({ _sum: { total: true }, where: cWhere });
            return { stock: stock._sum.total || 0, charges: charges._sum.total || 0 };
        });

        return { totalExpenses: totalPurchases, stockExpenses, fixedExpenses, stockRatio, fixedRatio, expensesGrowth: 0, suppliersByType: { STOCK: suppliersProduct, CHARGE: suppliersCharge }, averageStockOrder, chartData };
    }

    // BACKWARD COMPAT (Keep getSummary calling the others)
    async getSummary(companyId: string, startDate?: string, endDate?: string, clientId?: string, supplierId?: string) {
        const [sales, hr, clients, purchases] = await Promise.all([
            this.getSalesStats(companyId, startDate, endDate, clientId),
            this.getHRStats(companyId, startDate, endDate),
            this.getClientStats(companyId, startDate, endDate),
            this.getPurchaseStats(companyId, startDate, endDate, supplierId)
        ]);
        return {
            period: this.getPeriod(startDate, endDate),
            sales, hr, clients, purchases
        };
    }

    private async getSixMonthsChartData(companyId: string, callback: (start: Date, end: Date) => Promise<any>) {
        const data = [];
        const today = new Date();
        const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

        for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const m = d.getMonth();
            const y = d.getFullYear();
            const start = new Date(y, m, 1);
            const end = new Date(y, m + 1, 0, 23, 59, 59);
            const result = await callback(start, end);
            data.push({ name: months[m], ...result });
        }
        return data;
    }
}
