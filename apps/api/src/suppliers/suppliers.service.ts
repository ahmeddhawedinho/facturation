import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { NotificationsService } from '../notifications/notifications.service'

@Injectable()
export class SuppliersService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService
  ) { }

  async create(companyId: string, data: any, user?: any) {
    const trimmedData = {
      ...data,
      name: data.name?.trim() || '',
      email: data.email?.trim() || '',
      phone: data.phone?.trim() || '',
      address: data.address?.trim() || '',
      image: data.image,
    }

    const supplier = await this.prisma.supplier.create({
      data: {
        ...trimmedData,
        companyId,
      },
    })

    if (user) await this.logAndNotify(companyId, user, 'CREATE', `Ajout fournisseur ${supplier.name}`, `/dashboard/suppliers/${supplier.id}`, supplier.id, trimmedData);

    return supplier;
  }

  async findAll(companyId: string) {
    return this.prisma.supplier.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findById(companyId: string, id: string) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id, companyId },
      include: {
        purchaseOrders: {
          orderBy: { issueDate: 'desc' },
          include: { lines: true }
        },
        goodsReceipts: {
          orderBy: { receiptDate: 'desc' }
        },
        _count: { select: { purchaseOrders: true } }
      }
    });

    if (!supplier) throw new Error('Fournisseur non trouvé');

    const pos = (supplier as any).purchaseOrders || [];
    const totalPurchases = pos.reduce((sum, po) => sum + (po.total || 0), 0);
    const documentsCount = pos.length + (supplier as any).goodsReceipts.length;

    return {
      ...supplier,
      stats: {
        totalPurchases,
        documentsCount
      }
    };
  }

  async update(companyId: string, id: string, data: any, user?: any) {
    const supplier = await this.prisma.supplier.update({
      where: { id, companyId },
      data,
    })

    if (user) await this.logAndNotify(companyId, user, 'UPDATE', `Mise à jour fournisseur ${supplier.name}`, `/dashboard/suppliers/${supplier.id}`, supplier.id, data);

    return supplier;
  }

  async delete(companyId: string, id: string, user?: any) {
    const supplier = await this.prisma.supplier.delete({
      where: { id, companyId },
    })

    if (user) await this.logAndNotify(companyId, user, 'DELETE', `Suppression fournisseur ${supplier.name}`, `/dashboard/suppliers`, supplier.id);

    return supplier;
  }

  private async logAndNotify(companyId: string, user: any, action: string, message: string, link: string, entityId: string, details?: any) {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: user.id,
          action,
          entity: 'Supplier',
          entityId,
          changes: details || {}
        }
      });
      if (user.role !== 'ADMIN') {
        await this.notificationsService.notifyAdmins(companyId, `Action Fournisseur: ${action}`, `${user.firstName} ${user.lastName} : ${message}`, link);
      }
    } catch (e) { console.error("Log error", e) }
  }
}
