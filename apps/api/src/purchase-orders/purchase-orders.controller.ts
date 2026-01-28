import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, Res } from '@nestjs/common';
import { Response } from 'express';
import { PurchaseOrdersService } from './purchase-orders.service';
import { PdfService } from '../documents/pdf.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('purchase-orders')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PurchaseOrdersController {
    constructor(
        private readonly purchaseOrdersService: PurchaseOrdersService,
        private readonly pdfService: PdfService
    ) { }

    @Get('health-check')
    healthCheck() {
        return { status: 'OK', message: 'Purchase Orders Controller is responding' };
    }

    // PDF Export route - must stay ABOVE :id
    @Get('export/:id/pdf')
    @Permissions('purchase:read')
    async exportPdf(@Request() req, @Param('id') id: string, @Res() res: Response) {
        console.log('[API] PDF Export requested for:', id);
        try {
            const order = await this.purchaseOrdersService.findOne(id, req.user.companyId);
            const buffer = await this.pdfService.generateInvoicePdf(order);

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=Commande-${order.number}.pdf`);
            res.setHeader('Content-Length', buffer.length.toString());

            return res.send(buffer);
        } catch (error) {
            console.error('[API] PDF Error:', error);
            return res.status(500).json({ message: 'Erreur PDF', error: error.message });
        }
    }

    @Post()
    @Permissions('purchase:create')
    create(@Request() req, @Body() createData: any) {
        return this.purchaseOrdersService.create(req.user.companyId, createData, req.user);
    }

    @Get()
    @Permissions('purchase:read')
    findAll(@Request() req) {
        return this.purchaseOrdersService.findAll(req.user.companyId);
    }

    @Get(':id')
    @Permissions('purchase:read')
    async findOne(@Request() req, @Param('id') id: string) {
        return this.purchaseOrdersService.findOne(id, req.user.companyId);
    }

    @Put(':id')
    @Permissions('purchase:update')
    update(@Request() req, @Param('id') id: string, @Body() updateData: any) {
        return this.purchaseOrdersService.update(id, req.user.companyId, updateData, req.user);
    }

    @Delete(':id')
    @Permissions('purchase:delete')
    delete(@Request() req, @Param('id') id: string) {
        return this.purchaseOrdersService.delete(id, req.user.companyId, req.user);
    }

    @Post(':id/payments')
    @Permissions('purchase:update')
    async addPayment(@Request() req, @Param('id') id: string, @Body() paymentData: any) {
        return this.purchaseOrdersService.addPayment(id, req.user.companyId, paymentData, req.user);
    }

    @Get(':id/payments')
    @Permissions('purchase:read')
    async getPayments(@Request() req, @Param('id') id: string) {
        return this.purchaseOrdersService.getPayments(id, req.user.companyId);
    }
}
