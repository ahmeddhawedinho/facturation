import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('employees')
@UseGuards(JwtAuthGuard)
export class EmployeesController {
    constructor(private readonly employeesService: EmployeesService) { }

    @Get()
    findAll(@Request() req) {
        return this.employeesService.findAll(req.user.companyId);
    }

    @Get(':id')
    findOne(@Request() req, @Param('id') id: string) {
        return this.employeesService.findOne(req.user.companyId, id);
    }

    @Post()
    create(@Request() req, @Body() data: any) {
        return this.employeesService.create(req.user.companyId, data, req.user);
    }

    @Put(':id')
    update(@Request() req, @Param('id') id: string, @Body() data: any) {
        return this.employeesService.update(req.user.companyId, id, data, req.user);
    }

    @Delete(':id')
    remove(@Request() req, @Param('id') id: string) {
        return this.employeesService.remove(req.user.companyId, id, req.user);
    }
}
