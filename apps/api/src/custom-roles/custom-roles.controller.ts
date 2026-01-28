import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { CustomRolesService } from './custom-roles.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('custom-roles')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN' as any) // Seul l'ADMIN peut gérer les rôles
export class CustomRolesController {
    constructor(private customRolesService: CustomRolesService) { }

    @Get('permissions')
    getPermissions() {
        return this.customRolesService.getAvailablePermissions();
    }

    @Post()
    async create(@Request() req, @Body() createData: { name: string; permissions: string[] }) {
        return this.customRolesService.create(req.user.companyId, createData);
    }

    @Get()
    async findAll(@Request() req) {
        return this.customRolesService.findAll(req.user.companyId);
    }

    @Get(':id')
    async findOne(@Request() req, @Param('id') id: string) {
        return this.customRolesService.findById(id, req.user.companyId);
    }

    @Put(':id')
    async update(@Request() req, @Param('id') id: string, @Body() updateData: { name?: string; permissions?: string[] }) {
        return this.customRolesService.update(id, req.user.companyId, updateData);
    }

    @Delete(':id')
    async delete(@Request() req, @Param('id') id: string) {
        return this.customRolesService.delete(id, req.user.companyId);
    }
}
