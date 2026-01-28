import { Module } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';

import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [NotificationsModule],
    providers: [ClientsService],
    controllers: [ClientsController],
    exports: [ClientsService],
})
export class ClientsModule { }
