import { Controller, Get, Post, Body, Param, Put, UseGuards, Request, Query } from '@nestjs/common';
import { SalaryManagementService } from './salary-management.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('salary-management')
@UseGuards(JwtAuthGuard)
export class SalaryManagementController {
    constructor(private readonly salaryService: SalaryManagementService) { }

    // Obtenir ou créer l'enregistrement mensuel
    @Get('monthly-record/:employeeId/:month/:year')
    getOrCreateMonthlyRecord(
        @Request() req,
        @Param('employeeId') employeeId: string,
        @Param('month') month: string,
        @Param('year') year: string
    ) {
        return this.salaryService.getOrCreateMonthlyRecord(
            employeeId,
            parseInt(month),
            parseInt(year),
            req.user.companyId
        );
    }

    // Ajouter une avance
    @Post('advance/:employeeId/:month/:year')
    addAdvance(
        @Request() req,
        @Param('employeeId') employeeId: string,
        @Param('month') month: string,
        @Param('year') year: string,
        @Body() data: any
    ) {
        return this.salaryService.addAdvance(
            employeeId,
            parseInt(month),
            parseInt(year),
            req.user.companyId,
            data,
            req.user
        );
    }

    // Ajouter un ajustement (prime, augmentation, etc.)
    @Post('adjustment/:employeeId/:month/:year')
    addAdjustment(
        @Request() req,
        @Param('employeeId') employeeId: string,
        @Param('month') month: string,
        @Param('year') year: string,
        @Body() data: any
    ) {
        return this.salaryService.addAdjustment(
            employeeId,
            parseInt(month),
            parseInt(year),
            req.user.companyId,
            data,
            req.user
        );
    }

    // Régler une dette
    @Put('settle-debt/:recordId')
    settleDebt(
        @Request() req,
        @Param('recordId') recordId: string,
        @Body() data: { settlementNote: string }
    ) {
        return this.salaryService.settleDebt(recordId, data.settlementNote, req.user);
    }

    // Obtenir l'historique d'un employé
    @Get('history/:employeeId')
    getEmployeeHistory(
        @Request() req,
        @Param('employeeId') employeeId: string
    ) {
        return this.salaryService.getEmployeeHistory(employeeId, req.user.companyId);
    }

    // Obtenir le résumé du mois en cours
    @Get('current-month/:employeeId')
    getCurrentMonthSummary(
        @Request() req,
        @Param('employeeId') employeeId: string
    ) {
        return this.salaryService.getCurrentMonthSummary(employeeId, req.user.companyId);
    }

    // Obtenir tous les enregistrements mensuels
    @Get('monthly-records')
    getMonthlyRecords(
        @Request() req,
        @Query('month') month?: string,
        @Query('year') year?: string
    ) {
        return this.salaryService.getMonthlyRecords(
            req.user.companyId,
            month ? parseInt(month) : undefined,
            year ? parseInt(year) : undefined
        );
    }

    // Recalculer un enregistrement mensuel
    @Post('recalculate/:recordId')
    recalculateRecord(@Param('recordId') recordId: string) {
        return this.salaryService.recalculateMonthlyRecord(recordId);
    }
}
