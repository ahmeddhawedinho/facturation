import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ExchangeRatesService } from './exchange-rates.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('exchange-rates')
@UseGuards(JwtAuthGuard)
export class ExchangeRatesController {
    constructor(private exchangeRatesService: ExchangeRatesService) { }

    @Post()
    async createOrUpdate(@Request() req, @Body() data: any) {
        return this.exchangeRatesService.createOrUpdate(req.user.companyId, data);
    }

    @Get()
    async findAll(@Request() req) {
        return this.exchangeRatesService.findAll(req.user.companyId);
    }
}
