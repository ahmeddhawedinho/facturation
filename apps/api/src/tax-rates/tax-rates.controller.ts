import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { TaxRatesService } from './tax-rates.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('tax-rates')
@UseGuards(JwtAuthGuard)
export class TaxRatesController {
    constructor(private taxRatesService: TaxRatesService) { }

    @Post()
    async create(@Request() req, @Body() createData: any) {
        return this.taxRatesService.create(req.user.companyId, createData);
    }

    @Get()
    async findAll(@Request() req) {
        return this.taxRatesService.findAll(req.user.companyId);
    }

    @Put(':id')
    async update(@Request() req, @Param('id') id: string, @Body() updateData: any) {
        return this.taxRatesService.update(id, req.user.companyId, updateData);
    }

    @Delete(':id')
    async delete(@Request() req, @Param('id') id: string) {
        return this.taxRatesService.delete(id, req.user.companyId);
    }
}
