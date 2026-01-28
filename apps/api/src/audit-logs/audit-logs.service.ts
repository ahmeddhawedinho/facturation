import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditLogsService {
    constructor(private prisma: PrismaService) { }

    async create(data: {
        action: string;
        entity: string;
        entityId: string;
        changes?: any;
        userId?: string;
        documentId?: string;
        ipAddress?: string;
    }) {
        return this.prisma.auditLog.create({
            data,
        });
    }

    async findAll(filters?: {
        userId?: string;
        entity?: string;
        entityId?: string;
    }) {
        return this.prisma.auditLog.findMany({
            where: filters,
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
    }
}
