import { Module } from '@nestjs/common';
import { ExchangeRatesService } from './exchange-rates.service';
import { ExchangeRatesController } from './exchange-rates.controller';

@Module({
    providers: [ExchangeRatesService],
    controllers: [ExchangeRatesController],
    exports: [ExchangeRatesService],
})
export class ExchangeRatesModule { }
