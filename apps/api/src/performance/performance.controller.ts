import { Controller, Get, Post, Put, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('performance')
@UseGuards(JwtAuthGuard)
export class PerformanceController {
    constructor(private prisma: PrismaService) { }

    // Ajouter ou mettre à jour une notation
    @Post(':employeeId/:month/:year')
    async addOrUpdateRating(
        @Request() req,
        @Param('employeeId') employeeId: string,
        @Param('month') month: string,
        @Param('year') year: string,
        @Body() data: { rating: number; notes: string }
    ) {
        const monthNum = parseInt(month);
        const yearNum = parseInt(year);

        // Vérifier si une notation existe déjà
        const existing = await this.prisma.performanceRating.findUnique({
            where: {
                employeeId_month_year: { employeeId, month: monthNum, year: yearNum }
            }
        });

        if (existing) {
            return this.prisma.performanceRating.update({
                where: { id: existing.id },
                data: {
                    rating: parseFloat(data.rating.toString()),
                    notes: data.notes,
                    evaluatedBy: req.user.userId
                }
            });
        }

        return this.prisma.performanceRating.create({
            data: {
                employeeId,
                month: monthNum,
                year: yearNum,
                rating: parseFloat(data.rating.toString()),
                notes: data.notes,
                evaluatedBy: req.user.userId,
                companyId: req.user.companyId
            }
        });
    }

    // Obtenir les notations d'un employé
    @Get('employee/:employeeId')
    async getEmployeeRatings(
        @Request() req,
        @Param('employeeId') employeeId: string
    ) {
        return this.prisma.performanceRating.findMany({
            where: { employeeId, companyId: req.user.companyId },
            orderBy: [
                { year: 'desc' },
                { month: 'desc' }
            ]
        });
    }

    // Obtenir la notation d'un mois spécifique
    @Get(':employeeId/:month/:year')
    async getRating(
        @Param('employeeId') employeeId: string,
        @Param('month') month: string,
        @Param('year') year: string
    ) {
        return this.prisma.performanceRating.findUnique({
            where: {
                employeeId_month_year: {
                    employeeId,
                    month: parseInt(month),
                    year: parseInt(year)
                }
            }
        });
    }

    // Changer le statut d'emploi
    @Put('employee/:employeeId/status')
    async updateEmploymentStatus(
        @Param('employeeId') employeeId: string,
        @Body() data: {
            employmentStatus: string;
            terminationDate?: string;
            terminationReason?: string
        }
    ) {
        return this.prisma.employee.update({
            where: { id: employeeId },
            data: {
                employmentStatus: data.employmentStatus,
                isActive: data.employmentStatus === 'ACTIVE',
                terminationDate: data.terminationDate ? new Date(data.terminationDate) : null,
                terminationReason: data.terminationReason || null
            }
        });
    }
}
