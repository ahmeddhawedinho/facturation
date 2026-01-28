import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class EmployeesService {
    constructor(
        private prisma: PrismaService,
        private notificationsService: NotificationsService
    ) { }

    async findAll(companyId: string) {
        return this.prisma.employee.findMany({
            where: { companyId },
            include: {
                monthlyRecords: {
                    orderBy: { createdAt: 'desc' },
                    take: 3
                },
                performanceRatings: {
                    orderBy: [
                        { year: 'desc' },
                        { month: 'desc' }
                    ],
                    take: 3
                }
            },
            orderBy: { lastName: 'asc' }
        });
    }

    async findOne(companyId: string, id: string) {
        return this.prisma.employee.findFirst({
            where: { id, companyId },
            include: {
                monthlyRecords: {
                    orderBy: [
                        { year: 'desc' },
                        { month: 'desc' }
                    ]
                },
                advances: {
                    orderBy: { date: 'desc' }
                },
                salaryAdjustments: {
                    orderBy: { date: 'desc' }
                },
                performanceRatings: {
                    orderBy: [
                        { year: 'desc' },
                        { month: 'desc' }
                    ]
                }
            }
        });
    }

    async create(companyId: string, data: any, user?: any) {
        const paymentDay = data.paymentDay ? Math.min(Math.max(parseInt(data.paymentDay), 1), 31) : 1;

        const employee = await this.prisma.employee.create({
            data: {
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email || null,
                phone: data.phone || null,
                address: data.address || null,
                position: data.position || null,
                department: data.department || null,
                baseSalary: parseFloat(data.baseSalary) || 0,
                paymentDay,
                image: data.image || null,
                hireDate: data.hireDate ? new Date(data.hireDate) : null,
                cnssNumber: data.cnssNumber || null,
                cin: data.cin || null,
                bankAccount: data.bankAccount || null,
                contractDocument: data.contractDocument || null,
                cnssDocument: data.cnssDocument || null,
                otherDocuments: data.otherDocuments || null,
                isActive: true,
                companyId,
            }
        });

        if (user) {
            await this.logAndNotify(companyId, user, 'CREATE', `Ajout de l'employé ${employee.firstName} ${employee.lastName}`, `/dashboard/employees/${employee.id}`, employee.id, { name: `${employee.firstName} ${employee.lastName}` });
        }

        return employee;
    }

    async update(companyId: string, id: string, data: any, user?: any) {
        const updateData: any = {};

        if (data.firstName !== undefined) updateData.firstName = data.firstName;
        if (data.lastName !== undefined) updateData.lastName = data.lastName;
        if (data.email !== undefined) updateData.email = data.email || null;
        if (data.phone !== undefined) updateData.phone = data.phone || null;
        if (data.address !== undefined) updateData.address = data.address || null;
        if (data.position !== undefined) updateData.position = data.position || null;
        if (data.department !== undefined) updateData.department = data.department || null;
        if (data.baseSalary !== undefined) updateData.baseSalary = parseFloat(data.baseSalary) || 0;
        if (data.paymentDay !== undefined) updateData.paymentDay = Math.min(Math.max(parseInt(data.paymentDay), 1), 31);
        if (data.image !== undefined) updateData.image = data.image || null;
        if (data.hireDate !== undefined) updateData.hireDate = data.hireDate ? new Date(data.hireDate) : null;
        if (data.cnssNumber !== undefined) updateData.cnssNumber = data.cnssNumber || null;
        if (data.cin !== undefined) updateData.cin = data.cin || null;
        if (data.bankAccount !== undefined) updateData.bankAccount = data.bankAccount || null;
        if (data.contractDocument !== undefined) updateData.contractDocument = data.contractDocument || null;
        if (data.cnssDocument !== undefined) updateData.cnssDocument = data.cnssDocument || null;
        if (data.otherDocuments !== undefined) updateData.otherDocuments = data.otherDocuments || null;
        if (data.isActive !== undefined) updateData.isActive = data.isActive;

        const employee = await this.prisma.employee.update({
            where: { id },
            data: updateData
        });

        if (user) {
            await this.logAndNotify(companyId, user, 'UPDATE', `Modification de ${employee.firstName} ${employee.lastName}`, `/dashboard/employees/${employee.id}`, employee.id, updateData);
        }

        return employee;
    }

    async remove(companyId: string, id: string, user?: any) {
        const employee = await this.prisma.employee.update({
            where: { id },
            data: { isActive: false }
        });

        if (user) {
            await this.logAndNotify(companyId, user, 'ARCHIVE', `Archivage de ${employee.firstName} ${employee.lastName}`, `/dashboard/employees/${employee.id}`, employee.id);
        }
        return employee;
    }

    async hardDelete(companyId: string, id: string, user?: any) {
        const employee = await this.prisma.employee.delete({
            where: { id }
        });
        return employee;
    }

    private async logAndNotify(companyId: string, user: any, action: string, message: string, link: string, entityId: string, details?: any) {
        try {
            await this.prisma.auditLog.create({
                data: {
                    userId: user.id,
                    action,
                    entity: 'Employee',
                    entityId,
                    changes: details || {}
                }
            });
            if (user.role !== 'ADMIN') {
                await this.notificationsService.notifyAdmins(
                    companyId,
                    `Action RH: ${action}`,
                    `${user.firstName} ${user.lastName} : ${message}`,
                    link
                );
            }
        } catch (e) { console.error("Log error", e) }
    }
}
