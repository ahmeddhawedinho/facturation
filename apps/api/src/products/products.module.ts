import { Module } from '@nestjs/common'
import { ProductsService } from './products.service'
import { ProductsController } from './products.controller'
import { PrismaModule } from '../prisma/prisma.module'

import { NotificationsModule } from '../notifications/notifications.module'
@Module({
  imports: [PrismaModule, NotificationsModule],
  providers: [ProductsService],
  controllers: [ProductsController],
  exports: [ProductsService],
})
export class ProductsModule { }
