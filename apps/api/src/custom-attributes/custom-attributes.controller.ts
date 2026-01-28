import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { CustomAttributesService } from './custom-attributes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('custom-attributes')
@UseGuards(JwtAuthGuard)
export class CustomAttributesController {
    constructor(private customAttributesService: CustomAttributesService) { }

    @Post()
    async create(@Request() req, @Body() createData: any) {
        return this.customAttributesService.create(req.user.companyId, createData);
    }

    @Get()
    async findAll(@Request() req) {
        return this.customAttributesService.findAll(req.user.companyId);
    }

    @Put(':id')
    async update(@Request() req, @Param('id') id: string, @Body() updateData: any) {
        return this.customAttributesService.update(id, req.user.companyId, updateData);
    }

    @Delete(':id')
    async delete(@Request() req, @Param('id') id: string) {
        return this.customAttributesService.delete(id, req.user.companyId);
    }
}
