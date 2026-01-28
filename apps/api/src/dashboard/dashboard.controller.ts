import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) { }

    @Get('summary')
    getSummary(
        @Request() req,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('clientId') clientId?: string,
        @Query('supplierId') supplierId?: string
    ) {
        return this.dashboardService.getSummary(req.user.companyId, startDate, endDate, clientId, supplierId);
    }

    @Get('sales')
    getSales(
        @Request() req,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('clientId') clientId?: string
    ) {
        return this.dashboardService.getSalesStats(req.user.companyId, startDate, endDate, clientId);
    }

    @Get('hr')
    getHR(
        @Request() req,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string
    ) {
        return this.dashboardService.getHRStats(req.user.companyId, startDate, endDate);
    }

    @Get('clients')
    getClients(
        @Request() req,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string
    ) {
        return this.dashboardService.getClientStats(req.user.companyId, startDate, endDate);
    }

    @Get('purchases')
    getPurchases(
        @Request() req,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('supplierId') supplierId?: string
    ) {
        return this.dashboardService.getPurchaseStats(req.user.companyId, startDate, endDate, supplierId);
    }
}
