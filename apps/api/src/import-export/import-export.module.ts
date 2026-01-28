import { Module } from '@nestjs/common';
import { ImportExportService } from './import-export.service';
import { AdvancedExportService } from './advanced-export.service';
import { ImportExportController } from './import-export.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { PdfService } from '../documents/pdf.service';

@Module({
    imports: [PrismaModule],
    controllers: [ImportExportController],
    providers: [ImportExportService, AdvancedExportService, PdfService],
})
export class ImportExportModule { }
