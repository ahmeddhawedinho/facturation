import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AttributeType } from '@prisma/client';

@Injectable()
export class CustomAttributesService {
    constructor(private prisma: PrismaService) { }

    async create(companyId: string, data: {
        name: string;
        type: AttributeType;
        isVisibleOnDoc?: boolean;
        isRequired?: boolean;
        defaultValue?: string;
    }) {
        return this.prisma.customAttribute.create({
            data: {
                ...data,
                companyId,
            },
        });
    }

    async findAll(companyId: string) {
        return this.prisma.customAttribute.findMany({
            where: { companyId },
            orderBy: { createdAt: 'asc' },
        });
    }

    async update(id: string, companyId: string, data: Partial<{
        name: string;
        isVisibleOnDoc: boolean;
        isRequired: boolean;
        defaultValue: string;
    }>) {
        return this.prisma.customAttribute.update({
            where: { id, companyId },
            data,
        });
    }

    async delete(id: string, companyId: string) {
        return this.prisma.customAttribute.delete({
            where: { id, companyId },
        });
    }
}
