import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';


@Controller('companies')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CompaniesController {
    constructor(private companiesService: CompaniesService) { }

    @Post()
    @Roles('ADMIN' as any)
    async create(@Body() createData: any) {
        return this.companiesService.create(createData);
    }

    @Get()
    @Roles('ADMIN' as any)
    async findAll() {
        return this.companiesService.findAll();
    }

    @Get('settings')
    async getSettings(@Req() req: any) {
        return this.companiesService.getSettings(req.user.companyId);
    }

    @Get('taxes')
    async getTaxes(@Req() req: any) {
        return this.companiesService.getTaxes(req.user.companyId);
    }

    @Get('payment-methods')
    async getPaymentMethods(@Req() req: any) {
        return this.companiesService.getPaymentMethods(req.user.companyId);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.companiesService.findById(id);
    }

    @Put(':id/settings')
    @Roles('ADMIN' as any)
    async updateSettings(@Param('id') id: string, @Body() updateData: any) {
        return this.companiesService.update(id, updateData);
    }

    @Put(':id')
    @Roles('ADMIN' as any)
    async update(@Param('id') id: string, @Body() updateData: any) {
        return this.companiesService.update(id, updateData);
    }

    @Delete(':id')
    @Roles('ADMIN' as any)
    async delete(@Param('id') id: string) {
        return this.companiesService.delete(id);
    }

    // Taxes endpoints
    @Post('taxes')
    @Roles('ADMIN' as any)
    async createTax(@Req() req: any, @Body() data: any) {
        return this.companiesService.createTax(req.user.companyId, data);
    }

    @Delete(':companyId/taxes/:taxId')
    @Roles('ADMIN' as any)
    async deleteTax(@Param('companyId') companyId: string, @Param('taxId') taxId: string) {
        // Security check: ensure user owns this company or is strictly admin
        return this.companiesService.deleteTax(companyId, taxId);
    }

    // Payment Methods endpoints
    @Post('payment-methods')
    @Roles('ADMIN' as any)
    async createPaymentMethod(@Req() req: any, @Body() data: any) {
        return this.companiesService.createPaymentMethod(req.user.companyId, data);
    }

    @Delete(':companyId/payment-methods/:methodId')
    @Roles('ADMIN' as any)
    async deletePaymentMethod(@Param('companyId') companyId: string, @Param('methodId') methodId: string) {
        return this.companiesService.deletePaymentMethod(companyId, methodId);
    }
}
