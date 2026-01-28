import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { DocumentsService } from './documents.service';
import { PdfService } from './pdf.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('documents')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DocumentsController {
    constructor(
        private documentsService: DocumentsService,
        private pdfService: PdfService,
    ) { }

    @Post()
    @Permissions('sales:create')
    async create(@Req() req: any, @Body() createData: any) {
        return this.documentsService.create(req.user.companyId, createData, req.user);
    }

    @Get()
    @Permissions('sales:read')
    async findAll(@Req() req: any, @Query() filters: any) {
        const { limit, offset, ...restFilters } = filters;
        return this.documentsService.findAll(req.user.companyId, restFilters, limit ? Number(limit) : undefined, offset ? Number(offset) : undefined);
    }

    @Get('stats')
    @Permissions('sales:read')
    async getStats(@Req() req: any) {
        return this.documentsService.getStats(req.user.companyId);
    }

    @Get(':id/pdf')
    @Permissions('sales:export')
    async generatePdf(@Req() req: any, @Param('id') id: string, @Res() res: Response) {
        const document = await this.documentsService.findById(id, req.user.companyId);
        const pdfBuffer = await this.pdfService.generateInvoicePdf(document);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${document.number}.pdf"`);
        res.send(pdfBuffer);
    }

    @Get(':id')
    @Permissions('sales:read')
    async findOne(@Req() req: any, @Param('id') id: string) {
        return this.documentsService.findById(id, req.user.companyId);
    }

    @Put(':id')
    @Permissions('sales:update')
    async update(@Req() req: any, @Param('id') id: string, @Body() updateData: any) {
        return this.documentsService.update(id, req.user, updateData);
    }

    @Post(':id/validate')
    @Permissions('sales:update')
    async validate(@Req() req: any, @Param('id') id: string) {
        return this.documentsService.validate(id, req.user.companyId);
    }

    @Post(':id/convert')
    @Permissions('sales:update')
    async convert(@Req() req: any, @Param('id') id: string) {
        return this.documentsService.convertToInvoice(req.user.companyId, id);
    }

    @Post(':id/copy')
    @Permissions('sales:update')
    async copy(@Req() req: any, @Param('id') id: string, @Body('type') targetType: any) {
        return this.documentsService.duplicateAs(req.user.companyId, id, targetType);
    }

    @Delete(':id')
    @Permissions('sales:delete')
    async delete(@Req() req: any, @Param('id') id: string) {
        return this.documentsService.delete(id, req.user);
    }

    // Payment endpoints
    @Post(':id/payments')
    @Permissions('sales:update')
    async addPayment(@Req() req: any, @Param('id') id: string, @Body() paymentData: any) {
        return this.documentsService.addPayment(id, req.user.companyId, paymentData);
    }

    @Get(':id/payments')
    @Permissions('sales:read')
    async getPayments(@Req() req: any, @Param('id') id: string) {
        return this.documentsService.getPayments(id, req.user.companyId);
    }

    @Delete(':id/payments/:paymentId')
    @Permissions('sales:delete')
    async deletePayment(@Req() req: any, @Param('id') id: string, @Param('paymentId') paymentId: string) {
        return this.documentsService.deletePayment(paymentId, req.user.companyId);
    }
}
