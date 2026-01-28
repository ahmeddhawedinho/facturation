import { Module } from '@nestjs/common';
import { SalariesService } from './salaries.service';
import { SalariesController } from './salaries.controller';
import { SalaryManagementService } from './salary-management.service';
import { SalaryManagementController } from './salary-management.controller';
import { PrismaModule } from '../prisma/prisma.module';

import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [PrismaModule, NotificationsModule],
    controllers: [SalariesController, SalaryManagementController],
    providers: [SalariesService, SalaryManagementService],
    exports: [SalaryManagementService]
})
export class SalariesModule { }
