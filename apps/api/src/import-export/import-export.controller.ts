import { Controller, Post, Get, Body, Query, Res, UseInterceptors, UploadedFile, UseGuards, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportExportService } from './import-export.service';
import { AdvancedExportService } from './advanced-export.service';
import { ExportDocumentsDto } from './dto/export-documents.dto';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('import-export')
@UseGuards(JwtAuthGuard)
export class ImportExportController {
    constructor(
        private readonly importExportService: ImportExportService,
        private readonly advancedExportService: AdvancedExportService
    ) { }

    @Get('export')
    async export(
        @Req() req: any,
        @Query() filters: { startDate?: string; endDate?: string; type?: string; clientId?: string; format?: 'csv' | 'excel'; section?: string },
        @Res({ passthrough: true }) res: Response,
    ) {
        const format = filters.format || 'csv';
        return this.importExportService.exportDocuments(req.user.companyId, filters, format, res);
    }

    @Post('import')
    @UseInterceptors(FileInterceptor('file'))
    async import(
        @Req() req: any,
        @UploadedFile() file: Express.Multer.File,
        @Body('section') section: string
    ) {
        return this.importExportService.importDocuments(req.user.companyId, file.buffer, section);
    }

    @Post('advanced-export')
    async advancedExport(
        @Req() req: any,
        @Body() dto: ExportDocumentsDto,
        @Res({ passthrough: true }) res: Response,
    ) {
        return this.advancedExportService.exportDocuments(req.user.companyId, dto, res);
    }

    @Get('template')
    async getTemplate(@Res({ passthrough: true }) res: Response) {
        const columns = [
            'Reference', 'Type', 'Date', 'Echeance', 'Client_Fournisseur',
            'Total_HT', 'Total_TTC', 'Timbre_Fiscal', 'Etat',
            'Description_Ligne', 'Quantite', 'Prix_Unitaire', 'Taux_TVA', 'Total_Ligne'
        ];
        const csvContent = columns.join(',') + '\n' +
            'FACT-0000001,INVOICE,2024-01-17,2024-02-17,Nom Client ou Fournisseur,100.000,120.000,1.000,VALIDE,Article Exemple,1,100.000,19,119.000';

        const buffer = Buffer.from(csvContent, 'utf-8');
        res.set({
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="template_import.csv"',
        });
        return res.send(buffer);
    }
}
