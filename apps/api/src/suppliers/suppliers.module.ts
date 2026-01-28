import { Module } from '@nestjs/common'
import { SuppliersService } from './suppliers.service'
import { SuppliersController } from './suppliers.controller'
import { PrismaModule } from '../prisma/prisma.module'

import { NotificationsModule } from '../notifications/notifications.module'
@Module({
  imports: [PrismaModule, NotificationsModule],
  providers: [SuppliersService],
  controllers: [SuppliersController],
  exports: [SuppliersService],
})
export class SuppliersModule { }
