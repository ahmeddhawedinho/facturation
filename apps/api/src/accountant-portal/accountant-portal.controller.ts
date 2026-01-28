import { Controller, Get, Post, Body, Param, UseGuards, Req, Query, Res, Delete } from '@nestjs/common';
import { Response } from 'express';
import { AccountantPortalService } from './accountant-portal.service';
import { AccountantExportService } from './accountant-export.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AccountantGuard } from './guards/accountant.guard';

@Controller('accountant-portal')
@UseGuards(JwtAuthGuard)
export class AccountantPortalController {
    constructor(
        private accountantPortalService: AccountantPortalService,
        private accountantExportService: AccountantExportService,
    ) { }

    // ==================== GESTION DES RELATIONS ====================

    @Post('clients')
    @UseGuards(AccountantGuard)
    async createClientFolder(@Req() req: any, @Body() clientData: any) {
        return this.accountantPortalService.createClientFolder(req.user.id, clientData);
    }

    @Get('clients')
    @UseGuards(AccountantGuard)
    async getClientFolders(@Req() req: any) {
        return this.accountantPortalService.getClientFolders(req.user.id);
    }

    @Post('accept-invitation/:token')
    @UseGuards(AccountantGuard)
    async acceptInvitation(@Req() req: any, @Param('token') token: string) {
        return this.accountantPortalService.acceptInvitation(req.user.id, token);
    }

    // ==================== CONSULTATION DOCUMENTS ====================

    @Get('clients/:companyId/sales')
    @UseGuards(AccountantGuard)
    async getSalesJournal(
        @Req() req: any,
        @Param('companyId') companyId: string,
        @Query() filters: any,
    ) {
        return this.accountantPortalService.getSalesJournal(req.user.id, companyId, filters);
    }

    @Get('clients/:companyId/purchases')
    @UseGuards(AccountantGuard)
    async getPurchasesJournal(
        @Req() req: any,
        @Param('companyId') companyId: string,
        @Query() filters: any,
    ) {
        return this.accountantPortalService.getPurchasesJournal(req.user.id, companyId, filters);
    }

    @Get('attachments/:id')
    @UseGuards(AccountantGuard)
    async getAttachment(
        @Req() req: any,
        @Param('id') attachmentId: string,
        @Res() res: Response,
    ) {
        const attachment = await this.accountantPortalService.getDocumentAttachment(
            req.user.id,
            attachmentId,
        );

        // Si c'est une URL base64
        if (attachment.fileUrl.startsWith('data:')) {
            const base64Data = attachment.fileUrl.split(',')[1];
            const buffer = Buffer.from(base64Data, 'base64');

            res.setHeader('Content-Type', attachment.fileType);
            res.setHeader('Content-Disposition', `attachment; filename="${attachment.fileName}"`);
            res.send(buffer);
        } else {
            // Si c'est un chemin fichier (à implémenter selon votre système de stockage)
            res.download(attachment.fileUrl);
        }
    }

    // ==================== SYSTÈME CODE D'ACCÈS (Côté Admin) ====================

    @Post('company/:companyId/generate-code')
    async generateAccessCode(@Req() req: any, @Param('companyId') companyId: string) {
        return this.accountantPortalService.generateAccessCode(companyId, req.user.id);
    }

    @Get('company/:companyId/connected-accountant')
    async getConnectedAccountant(@Req() req: any, @Param('companyId') companyId: string) {
        return this.accountantPortalService.getConnectedAccountant(companyId, req.user.id);
    }

    @Delete('company/:companyId/revoke-access')
    async revokeAccountantAccess(@Req() req: any, @Param('companyId') companyId: string) {
        return this.accountantPortalService.revokeAccountantAccess(companyId, req.user.id);
    }

    // ==================== CONNEXION PAR CODE (Côté Comptable) ====================

    @Post('connect-with-code')
    @UseGuards(AccountantGuard)
    async connectWithCode(@Req() req: any, @Body() body: { code: string }) {
        return this.accountantPortalService.connectWithCode(req.user.id, body.code);
    }

    // ==================== ANCIEN SYSTÈME (Compatibilité) ====================

    @Post('company/:companyId/generate-invitation')
    async generateInvitationLink(@Req() req: any, @Param('companyId') companyId: string) {
        return this.accountantPortalService.generateInvitationLink(companyId, req.user.id);
    }

    // ==================== JUSTIFICATIFS DE PAIEMENT ====================

    @Get('documents/:documentId/payment-proofs')
    @UseGuards(AccountantGuard)
    async getPaymentProofs(@Req() req: any, @Param('documentId') documentId: string) {
        return this.accountantPortalService.getPaymentProofs(req.user.id, documentId);
    }

    @Post('documents/:documentId/download-with-proofs')
    @UseGuards(AccountantGuard)
    async downloadDocumentWithProofs(
        @Req() req: any,
        @Param('documentId') documentId: string,
        @Res() res: Response,
    ) {
        const zipBuffer = await this.accountantExportService.generateDocumentWithProofsZip(documentId, req.user.id);

        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="document_${documentId}_avec_justificatifs.zip"`);
        res.send(zipBuffer);
    }

    // ==================== EXPORT DOCUMENTS ====================

    @Post('clients/:companyId/export/excel')
    @UseGuards(AccountantGuard)
    async exportToExcel(
        @Req() req: any,
        @Param('companyId') companyId: string,
        @Query() filters: any,
        @Res() res: Response,
    ) {
        // Récupérer les documents selon le type (sales ou purchases)
        const journalType = filters.type || 'sales'; // 'sales' ou 'purchases'
        const documents = journalType === 'sales'
            ? await this.accountantPortalService.getSalesJournal(req.user.id, companyId, filters)
            : await this.accountantPortalService.getPurchasesJournal(req.user.id, companyId, filters);

        const buffer = await this.accountantExportService.exportToExcel(documents);

        const filename = `export_${journalType}_${new Date().toISOString().split('T')[0]}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);
    }

    @Post('clients/:companyId/export/csv')
    @UseGuards(AccountantGuard)
    async exportToCSV(
        @Req() req: any,
        @Param('companyId') companyId: string,
        @Query() filters: any,
        @Res() res: Response,
    ) {
        const journalType = filters.type || 'sales';
        const documents = journalType === 'sales'
            ? await this.accountantPortalService.getSalesJournal(req.user.id, companyId, filters)
            : await this.accountantPortalService.getPurchasesJournal(req.user.id, companyId, filters);

        const csv = await this.accountantExportService.exportToCSV(documents);

        const filename = `export_${journalType}_${new Date().toISOString().split('T')[0]}.csv`;
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send('\uFEFF' + csv); // BOM pour Excel
    }

    @Post('clients/:companyId/export/pdf')
    @UseGuards(AccountantGuard)
    async exportToPDFArchive(
        @Req() req: any,
        @Param('companyId') companyId: string,
        @Query() filters: any,
        @Res() res: Response,
    ) {
        const journalType = filters.type || 'sales';
        const documents = journalType === 'sales'
            ? await this.accountantPortalService.getSalesJournal(req.user.id, companyId, filters)
            : await this.accountantPortalService.getPurchasesJournal(req.user.id, companyId, filters);

        const zipBuffer = await this.accountantExportService.exportToPDFArchive(documents);

        const filename = `factures_${journalType}_${new Date().toISOString().split('T')[0]}.zip`;
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(zipBuffer);
    }

    @Post('clients/:companyId/export-selected')
    @UseGuards(AccountantGuard)
    async exportSelectedDocuments(
        @Req() req: any,
        @Param('companyId') companyId: string,
        @Body() body: { documentIds: string[]; includeProofs: boolean },
        @Res() res: Response,
    ) {
        const { documentIds, includeProofs } = body;

        // Générer l'export via le service
        const zipBuffer = await this.accountantPortalService.exportSelectedDocuments(
            req.user.id,
            companyId,
            documentIds,
            includeProofs,
        );

        const filename = `export_selection_${new Date().toISOString().split('T')[0]}.zip`;
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(zipBuffer);
    }

    // ==================== MESSAGERIE INSTANTANÉE ====================

    @Get('clients/:companyId/chat')
    @UseGuards(AccountantGuard)
    async getChatMessages(@Req() req: any, @Param('companyId') companyId: string) {
        return this.accountantPortalService.getChatMessages(req.user.id, companyId);
    }

    @Post('clients/:companyId/chat')
    @UseGuards(AccountantGuard)
    async sendChatMessage(
        @Req() req: any,
        @Param('companyId') companyId: string,
        @Body() body: { content: string },
    ) {
        return this.accountantPortalService.sendMessage(req.user.id, companyId, body.content);
    }

    @Post('init-company-chat')
    async initCompanyChat(@Req() req: any) {
        return this.accountantPortalService.initCompanyChat(req.user.companyId);
    }
}
