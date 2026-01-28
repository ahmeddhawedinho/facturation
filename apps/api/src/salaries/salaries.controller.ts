import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { SalariesService } from './salaries.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('salaries')
@UseGuards(JwtAuthGuard)
export class SalariesController {
    constructor(private readonly salariesService: SalariesService) { }

    @Get()
    findAll(@Request() req) {
        return this.salariesService.findAll(req.user.companyId);
    }

    @Get('employee/:employeeId')
    findByEmployee(@Request() req, @Param('employeeId') employeeId: string) {
        return this.salariesService.findByEmployee(req.user.companyId, employeeId);
    }
}
