import { Module } from '@nestjs/common';
import { PerformanceController } from './performance.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [PerformanceController]
})
export class PerformanceModule { }
