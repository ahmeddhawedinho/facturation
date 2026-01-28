import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@Controller('clients')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ClientsController {
    constructor(private clientsService: ClientsService) { }

    @Post()
    @Permissions('clients:create')
    async create(@Request() req, @Body() createData: any) {
        return this.clientsService.create(req.user.companyId, createData, req.user);
    }

    @Get()
    @Permissions('clients:read')
    async findAll(@Request() req) {
        return this.clientsService.findAll(req.user.companyId);
    }

    @Get(':id')
    @Permissions('clients:read')
    async findOne(@Request() req, @Param('id') id: string) {
        return this.clientsService.findById(id, req.user.companyId);
    }

    @Put(':id')
    @Permissions('clients:update')
    async update(@Request() req, @Param('id') id: string, @Body() updateData: any) {
        return this.clientsService.update(id, req.user.companyId, updateData, req.user);
    }

    @Delete(':id')
    @Permissions('clients:delete')
    async delete(@Request() req, @Param('id') id: string) {
        return this.clientsService.delete(id, req.user.companyId, req.user);
    }
}
