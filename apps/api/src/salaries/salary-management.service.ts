import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SalaryManagementService {
    constructor(
        private prisma: PrismaService,
        private notificationsService: NotificationsService
    ) { }

    /**
     * Obtenir ou créer l'enregistrement mensuel pour un employé
     */
    async getOrCreateMonthlyRecord(employeeId: string, month: number, year: number, companyId: string) {
        // Vérifier si l'enregistrement existe
        let record = await this.prisma.monthlySalaryRecord.findUnique({
            where: {
                employeeId_month_year: { employeeId, month, year }
            },
            include: {
                employee: true,
                advances: { orderBy: { date: 'asc' } },
                adjustments: { orderBy: { date: 'asc' } }
            }
        });

        if (!record) {
            // Récupérer l'employé
            const employee = await this.prisma.employee.findUnique({
                where: { id: employeeId }
            });

            if (!employee) {
                throw new NotFoundException('Employé non trouvé');
            }

            // Vérifier la dette du mois précédent
            const prevMonth = month === 1 ? 12 : month - 1;
            const prevYear = month === 1 ? year - 1 : year;

            const previousRecord = await this.prisma.monthlySalaryRecord.findUnique({
                where: {
                    employeeId_month_year: { employeeId, month: prevMonth, year: prevYear }
                }
            });

            const debtFromPrevious = previousRecord?.debtToNext || 0;

            // Créer un nouvel enregistrement
            record = await this.prisma.monthlySalaryRecord.create({
                data: {
                    employeeId,
                    month,
                    year,
                    baseSalary: employee.baseSalary,
                    bonuses: 0,
                    deductions: 0,
                    totalSalary: employee.baseSalary,
                    totalPaid: 0,
                    remainingBalance: employee.baseSalary,
                    debtFromPrevious,
                    debtToNext: 0,
                    status: 'PENDING',
                    companyId
                },
                include: {
                    employee: true,
                    advances: true,
                    adjustments: true
                }
            });
        }

        // RECALCULER SYSTÉMATIQUEMENT pour garantir des indicateurs exacts
        return this.recalculateMonthlyRecord(record.id);
    }

    /**
     * Ajouter une avance sur salaire
     */
    async addAdvance(employeeId: string, month: number, year: number, companyId: string, data: {
        amount: number;
        paymentMethod: string;
        reason?: string;
        notes?: string;
    }, user?: any) {
        const record = await this.getOrCreateMonthlyRecord(employeeId, month, year, companyId);

        const advance = await this.prisma.salaryAdvance.create({
            data: {
                employeeId,
                monthlyRecordId: record.id,
                amount: data.amount,
                paymentMethod: data.paymentMethod,
                reason: data.reason,
                notes: data.notes,
                companyId
            }
        });

        await this.recalculateMonthlyRecord(record.id);

        if (user) {
            const empName = record.employee ? `${record.employee.firstName} ${record.employee.lastName}` : 'Employé';
            await this.logAndNotify(companyId, user, 'CREATE', `Avance ${data.amount} TND pour ${empName}`, `/dashboard/salaries`, record.id, {
                amount: data.amount,
                employeeName: empName,
                entity: 'SalaryAdvance' // Helper for frontend
            });
        }

        return advance;
    }

    /**
     * Ajouter un ajustement (prime, augmentation, déduction)
     */
    async addAdjustment(employeeId: string, month: number, year: number, companyId: string, data: {
        type: 'BONUS' | 'INCREASE' | 'DECREASE' | 'DEDUCTION';
        amount: number;
        reason: string;
        isPermanent?: boolean;
    }, user?: any) {
        const record = await this.getOrCreateMonthlyRecord(employeeId, month, year, companyId);

        const adjustment = await this.prisma.salaryAdjustment.create({
            data: {
                employeeId,
                monthlyRecordId: record.id,
                type: data.type,
                amount: data.amount,
                reason: data.reason,
                isPermanent: data.isPermanent || false,
                companyId
            }
        });

        // Si permanent, mettre à jour le salaire de base de l'employé ET de la fiche actuelle
        if (data.isPermanent && (data.type === 'INCREASE' || data.type === 'DECREASE')) {
            const employee = await this.prisma.employee.findUnique({ where: { id: employeeId } });
            if (employee) {
                const newBaseSalary = data.type === 'INCREASE'
                    ? employee.baseSalary + data.amount
                    : employee.baseSalary - data.amount;

                const finalSalary = Math.max(0, newBaseSalary);

                // Mettre à jour l'employé (pour les mois futurs)
                await this.prisma.employee.update({
                    where: { id: employeeId },
                    data: { baseSalary: finalSalary }
                });

                // Mettre à jour la fiche actuelle (pour le mois en cours)
                await this.prisma.monthlySalaryRecord.update({
                    where: { id: record.id },
                    data: { baseSalary: finalSalary }
                });
            }
        }

        await this.recalculateMonthlyRecord(record.id);

        if (user) {
            const empName = record.employee ? `${record.employee.firstName} ${record.employee.lastName}` : 'Employé';
            let actionText = 'Ajustement Salaire';
            if (data.type === 'INCREASE') actionText = 'Augmentation Salaire';
            else if (data.type === 'BONUS') actionText = 'Prime';
            else if (data.type === 'DEDUCTION') actionText = 'Déduction';

            const message = `${actionText} (${data.amount} TND) pour ${empName}`;

            await this.logAndNotify(companyId, user, 'CREATE', message, `/dashboard/salaries`, record.id, {
                amount: data.amount,
                type: data.type,
                employeeName: empName,
                entity: 'SalaryAdjustment'
            });
        }

        return adjustment;
    }

    /**
     * Recalculer le solde d'un enregistrement mensuel
     */
    async recalculateMonthlyRecord(recordId: string) {
        const record = await this.prisma.monthlySalaryRecord.findUnique({
            where: { id: recordId },
            include: {
                employee: true,
                advances: true,
                adjustments: true
            }
        });

        if (!record) {
            throw new NotFoundException('Enregistrement mensuel non trouvé');
        }

        let bonuses = 0;
        let deductions = 0;

        for (const adj of record.adjustments) {
            if (adj.type === 'BONUS' || adj.type === 'INCREASE') {
                bonuses += adj.amount;
            } else if (adj.type === 'DEDUCTION' || adj.type === 'DECREASE') {
                deductions += adj.amount;
            }
        }

        const totalSalary = record.baseSalary + bonuses - deductions;
        const totalPaid = record.advances.reduce((sum, adv) => sum + adv.amount, 0);
        const remainingBalance = totalSalary - totalPaid;

        let status = 'PENDING';
        let isPaid = false;
        let debtToNext = 0;

        if (totalPaid === 0) {
            status = 'PENDING';
        } else if (totalPaid < totalSalary) {
            status = 'PARTIAL';
        } else if (totalPaid === totalSalary) {
            status = 'PAID';
            isPaid = true;
        } else {
            status = 'OVERPAID';
            isPaid = true;
            debtToNext = totalPaid - totalSalary;
        }

        return this.prisma.monthlySalaryRecord.update({
            where: { id: recordId },
            include: {
                employee: true,
                advances: { orderBy: { date: 'asc' } },
                adjustments: { orderBy: { date: 'asc' } }
            },
            data: {
                bonuses,
                deductions,
                totalSalary,
                totalPaid,
                remainingBalance,
                status,
                isPaid,
                debtToNext,
                paidAt: isPaid ? new Date() : null
            }
        });
    }

    async settleDebt(recordId: string, settlementNote: string, user?: any) {
        const record = await this.prisma.monthlySalaryRecord.update({
            where: { id: recordId },
            data: {
                debtSettled: true,
                debtSettlementNote: settlementNote,
                debtToNext: 0
            },
            include: {
                employee: true
            }
        });

        if (user) {
            const empName = record.employee ? `${record.employee.firstName} ${record.employee.lastName}` : 'Employé';
            await this.logAndNotify(record.companyId, user, 'UPDATE', `Dette réglée pour ${empName}`, `/dashboard/salaries`, record.id, {
                note: settlementNote,
                employeeName: empName,
                type: 'DEBT_SETTLEMENT'
            });
        }

        return record;
    }

    async getEmployeeHistory(employeeId: string, companyId: string) {
        return this.prisma.monthlySalaryRecord.findMany({
            where: { employeeId, companyId },
            include: {
                advances: { orderBy: { date: 'asc' } },
                adjustments: { orderBy: { date: 'asc' } }
            },
            orderBy: [
                { year: 'desc' },
                { month: 'desc' }
            ]
        });
    }

    async getCurrentMonthSummary(employeeId: string, companyId: string) {
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        return this.getOrCreateMonthlyRecord(employeeId, month, year, companyId);
    }

    async getMonthlyRecords(companyId: string, month?: number, year?: number) {
        const where: any = { companyId };

        if (month) where.month = month;
        if (year) where.year = year;

        return this.prisma.monthlySalaryRecord.findMany({
            where,
            include: {
                employee: true,
                advances: true,
                adjustments: true
            },
            orderBy: [
                { year: 'desc' },
                { month: 'desc' },
                { employee: { lastName: 'asc' } }
            ]
        });
    }

    private async logAndNotify(companyId: string, user: any, action: string, message: string, link: string, entityId: string, details?: any) {
        try {
            await this.prisma.auditLog.create({
                data: {
                    userId: user.id,
                    action,
                    entity: details?.entity || 'MonthlySalaryRecord', // Use specific entity if provided
                    entityId,
                    changes: details || {}
                }
            });
            if (user.role !== 'ADMIN') {
                await this.notificationsService.notifyAdmins(
                    companyId,
                    `Action Paie: ${action}`,
                    `${user.firstName} ${user.lastName} : ${message}`,
                    link
                );
            }
        } catch (e) { console.error("Log error", e) }
    }
}
