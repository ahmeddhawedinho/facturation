import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { PdfService } from './pdf.service';

import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [NotificationsModule],
    providers: [DocumentsService, PdfService],
    controllers: [DocumentsController],
    exports: [DocumentsService, PdfService],
})
export class DocumentsModule { }
