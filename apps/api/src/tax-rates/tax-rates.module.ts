import { Module } from '@nestjs/common';
import { TaxRatesService } from './tax-rates.service';
import { TaxRatesController } from './tax-rates.controller';

@Module({
    providers: [TaxRatesService],
    controllers: [TaxRatesController],
    exports: [TaxRatesService],
})
export class TaxRatesModule { }
