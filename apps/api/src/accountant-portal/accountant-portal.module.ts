import { Module } from '@nestjs/common';
import { AccountantPortalController } from './accountant-portal.controller';
import { AccountantPortalService } from './accountant-portal.service';
import { AccountantExportService } from './accountant-export.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PdfService } from '../documents/pdf.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { EmailService } from '../common/email.service';
import { ChatModule } from '../chat/chat.module';

@Module({
    imports: [PrismaModule, NotificationsModule, ChatModule],
    controllers: [AccountantPortalController],
    providers: [AccountantPortalService, AccountantExportService, PdfService, EmailService],
    exports: [AccountantPortalService],
})
export class AccountantPortalModule { }
