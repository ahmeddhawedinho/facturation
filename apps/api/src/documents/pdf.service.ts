import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';

@Injectable()
export class PdfService {
    async generateInvoicePdf(document: any): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ size: 'A4', margin: 50 });
            const buffers: Buffer[] = [];

            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfBuffer = Buffer.concat(buffers);
                resolve(pdfBuffer);
            });
            doc.on('error', reject);

            const company = document.company || {};
            const template = company.pdfTemplate || 'CLASSIC';

            // Migrate old templates to new ones
            const templateMap: Record<string, string> = {
                'STANDARD': 'CLASSIC',
                'CENTERED': 'MODERN',
                'WATERMARK': 'PREMIUM'
            };
            const actualTemplate = templateMap[template] || template;

            // Route to appropriate theme generator
            if (actualTemplate === 'MODERN') {
                this.generateModernTheme(doc, document);
            } else if (actualTemplate === 'PREMIUM') {
                this.generatePremiumTheme(doc, document);
            } else {
                // CLASSIC (default)
                this.generateClassicTheme(doc, document);
            }

            // Ajouter le tampon de statut (PAYÉ / IMPAYÉ)
            this.addPaymentStatusStamp(doc, document);

            // Ajouter la méthode de paiement en bas à gauche (si définie)
            this.addPaymentMethod(doc, document);

            doc.end();
        });
    }

    // ==================== FEATURES ====================

    // Helper pour formater les coordonnées complètes
    private getFormattedCoordinates(entity: any, includeName: boolean = false): string[] {
        const lines = [];
        if (includeName && entity.name) lines.push(entity.name);
        if (entity.address) lines.push(entity.address);

        let cityLine = '';
        if (entity.postalCode) cityLine += entity.postalCode + ' ';
        if (entity.city) cityLine += entity.city;
        if (cityLine.trim()) lines.push(cityLine.trim());

        if (entity.country && entity.country !== 'Tunisie') lines.push(entity.country); // Tunisie est souvent implicite, mais on peut l'afficher

        if (entity.phone) lines.push(`Tél: ${entity.phone}`);
        if (entity.email) lines.push(`Email: ${entity.email}`);
        if (entity.fiscalNumber) lines.push(`MF: ${entity.fiscalNumber}`);

        return lines;
    }

    // Affiche la méthode de paiement en bas à gauche
    private addPaymentMethod(doc: any, document: any) {
        if (!document.paymentMethod || !document.paymentMethod.name) return;

        const footerY = 720; // Juste au-dessus du footer
        const x = 50;

        doc.font('Helvetica-Bold').fontSize(9).fillColor('#000000');
        doc.text('Mode de paiement :', x, footerY);

        doc.font('Helvetica').fontSize(9).fillColor('#333333');
        doc.text(document.paymentMethod.name, x + 95, footerY); // Décalage pour le label
    }

    // Ajoute un tampon PAYÉ (Vert) ou IMPAYÉ (Rouge)
    private addPaymentStatusStamp(doc: any, document: any) {
        // Appliquer SEULEMENT aux factures de vente et d'achat
        // Ignorer complètement pour tous les autres types (Devis, Commandes, BL, etc.)
        if (!['INVOICE', 'PURCHASE_INVOICE'].includes(document.type)) return;

        // Logique plus robuste pour déterminer si payé
        // 1. Statut explicite 'PAID'
        // 2. Montant payé >= Total (avec une petite marge d'erreur pour les flottants)
        const amountPaid = document.paidAmount || document.amountPaid || 0;
        const total = document.total || 0;

        // On considère payé si statut PAID ou si le reste à payer est négligeable (< 0.005)
        const isPaid = document.status === 'PAID' || (total > 0 && Math.abs(total - amountPaid) < 0.005);

        // Configuration du tampon
        doc.save();

        // Position au centre de la page (approximatif pour A4)
        const centerX = 300;
        const centerY = 400;

        doc.translate(centerX, centerY);
        doc.rotate(-45);
        doc.opacity(isPaid ? 0.2 : 0.15); // Transparence

        if (isPaid) {
            // Tampon PAYÉ - VERT
            const color = '#22c55e'; // Vert succès

            // Cadre
            doc.rect(-150, -60, 300, 120)
                .lineWidth(8)
                .strokeColor(color)
                .stroke();

            // Texte
            doc.fontSize(80)
                .font('Helvetica-Bold')
                .fillColor(color)
                .text('PAYÉ', -150, -40, {
                    align: 'center',
                    width: 300
                });

            // Date de paiement si disponible (optionnel)
            doc.fontSize(20)
                .text(new Date().toLocaleDateString('fr-FR'), -150, 35, {
                    align: 'center',
                    width: 300
                });

        } else {
            // Tampon IMPAYÉ - ROUGE
            const color = '#ef4444'; // Rouge danger

            // Cadre pointillé pour impayé
            doc.rect(-170, -60, 340, 120)
                .lineWidth(8)
                .dash(15, { space: 10 })
                .strokeColor(color)
                .stroke();
            doc.undash();

            // Texte
            doc.fontSize(70)
                .font('Helvetica-Bold')
                .fillColor(color)
                .text('IMPAYÉ', -170, -35, {
                    align: 'center',
                    width: 340
                });
        }

        doc.restore();
    }

    // ==================== CLASSIC THEME - Simple et Professionnel ====================
    private generateClassicTheme(doc: any, document: any) {
        const company = document.company || {};
        const clientOrSupplier = document.client || document.supplier || {};
        const isPurchase = !!document.supplier;

        // Logo - Smart resize without cropping
        const addLogo = (x: number, y: number, maxWidth: number, maxHeight: number) => {
            if (company.logo && company.logo.startsWith('data:image')) {
                try {
                    const base64Data = company.logo.split(';base64,').pop();
                    if (base64Data) {
                        const imgBuffer = Buffer.from(base64Data, 'base64');
                        doc.image(imgBuffer, x, y, {
                            fit: [maxWidth, maxHeight],
                            align: 'center',
                            valign: 'center'
                        });
                        return true;
                    }
                } catch (e) {
                    console.error('Erreur logo PDF:', e);
                }
            }
            return false;
        };

        // Header - Logo + Company Info (Left) | Document Type (Right)
        addLogo(50, 40, 80, 50);

        // Company Info
        doc.font('Helvetica-Bold').fontSize(12).fillColor('#000000').text(company.name || '', 50, 100);
        doc.font('Helvetica').fontSize(8).fillColor('#666666');

        let y = 115;
        const companyLines = this.getFormattedCoordinates(company);
        companyLines.forEach(line => {
            doc.text(line, 50, y);
            y += 10;
        });

        // Document Type - Right Side
        const docTypeLabel = this.getDocumentTypeLabel(document.type);
        doc.font('Helvetica-Bold').fontSize(20).fillColor('#000000');
        doc.text(docTypeLabel, 350, 50, { align: 'right', width: 200 });

        doc.font('Helvetica').fontSize(9).fillColor('#666666');
        doc.text(`N° ${document.number}`, 350, 75, { align: 'right', width: 200 });
        doc.text(`Date: ${new Date(document.issueDate).toLocaleDateString('fr-FR')}`, 350, 88, { align: 'right', width: 200 });
        if (document.dueDate) {
            doc.text(`Échéance: ${new Date(document.dueDate).toLocaleDateString('fr-FR')}`, 350, 101, { align: 'right', width: 200 });
        }

        // Separator Line
        doc.moveTo(50, 150).lineTo(545, 150).strokeColor('#CCCCCC').lineWidth(1).stroke();

        // Client Block - Simple Box
        const clientY = 170;
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#000000');
        doc.text(isPurchase ? 'FOURNISSEUR' : 'FACTURÉ À', 50, clientY);

        doc.font('Helvetica').fontSize(9).fillColor('#333333');
        let clientTextY = clientY + 15;
        doc.text(clientOrSupplier.name || 'Inconnu', 50, clientTextY);
        clientTextY += 12;

        const clientLines = this.getFormattedCoordinates(clientOrSupplier);
        // Retirer le nom s'il est déjà affiché et formater le reste (ici on a déjà affiché le nom)
        // getFormattedCoordinates sans includeName

        clientLines.forEach(line => {
            doc.text(line, 50, clientTextY, { width: 250 });
            clientTextY += 12;
        });

        // Table Header
        let tableY = 250;
        doc.rect(50, tableY, 495, 20).fillColor('#333333').fill();

        doc.font('Helvetica-Bold').fontSize(9).fillColor('#FFFFFF');
        doc.text('DESCRIPTION', 60, tableY + 6);
        doc.text('QTÉ', 340, tableY + 6, { width: 40, align: 'center' });
        doc.text('PRIX U.', 390, tableY + 6, { width: 60, align: 'right' });
        doc.text('TOTAL HT', 480, tableY + 6, { width: 60, align: 'right' });

        tableY += 25;

        // Table Lines
        doc.font('Helvetica').fontSize(9).fillColor('#000000');
        if (document.lines && Array.isArray(document.lines)) {
            document.lines.forEach((line: any, index: number) => {
                if (tableY > 680) {
                    doc.addPage();
                    tableY = 50;
                    // Repeat header on new page
                    doc.rect(50, tableY, 495, 20).fillColor('#333333').fill();
                    doc.font('Helvetica-Bold').fontSize(9).fillColor('#FFFFFF');
                    doc.text('DESCRIPTION', 60, tableY + 6);
                    doc.text('QTÉ', 340, tableY + 6, { width: 40, align: 'center' });
                    doc.text('PRIX U.', 390, tableY + 6, { width: 60, align: 'right' });
                    doc.text('TOTAL HT', 480, tableY + 6, { width: 60, align: 'right' });
                    tableY += 25;
                    doc.font('Helvetica').fontSize(9).fillColor('#000000');
                }

                // Alternate row background
                if (index % 2 === 0) {
                    doc.rect(50, tableY - 2, 495, 18).fillColor('#F9F9F9').fill();
                }

                doc.fillColor('#000000');
                doc.text(line.description || '', 60, tableY, { width: 270 });
                doc.text((line.quantity || 0).toString(), 340, tableY, { width: 40, align: 'center' });
                doc.text(`${(line.unitPrice || 0).toFixed(3)}`, 390, tableY, { width: 60, align: 'right' });
                doc.text(`${(line.subtotal || 0).toFixed(3)}`, 480, tableY, { width: 60, align: 'right' });

                tableY += 18;
            });
        }

        // Bottom Line
        doc.moveTo(50, tableY).lineTo(545, tableY).strokeColor('#CCCCCC').lineWidth(1).stroke();

        // Totals Section - Compact
        tableY += 15;
        this.addSimpleTotals(doc, document, tableY);

        // Footer with better styling
        const footerY = 750;
        doc.moveTo(50, footerY).lineTo(545, footerY).strokeColor('#CCCCCC').lineWidth(1).stroke();

        doc.fontSize(8).fillColor('#666666');
        let footerText = company.name || '';
        if (company.fiscalNumber) footerText += ` • MF: ${company.fiscalNumber}`;
        if (company.address) footerText += ` • ${company.address}`;
        if (company.city) footerText += `, ${company.city}`;
        doc.text(footerText, 50, footerY + 8, { align: 'center', width: 495 });

        if (company.phone || company.email) {
            let contactText = '';
            if (company.phone) contactText += `Tél: ${company.phone}`;
            if (company.email) contactText += (contactText ? ' • ' : '') + `Email: ${company.email}`;
            doc.text(contactText, 50, footerY + 18, { align: 'center', width: 495 });
        }
    }

    // ==================== MODERN THEME - Avec Touches de Couleur ====================
    private generateModernTheme(doc: any, document: any) {
        const company = document.company || {};
        const clientOrSupplier = document.client || document.supplier || {};
        const isPurchase = !!document.supplier;

        const primaryColor = '#2563EB'; // Bleu moderne

        // Logo
        const addLogo = (x: number, y: number, maxWidth: number, maxHeight: number) => {
            if (company.logo && company.logo.startsWith('data:image')) {
                try {
                    const base64Data = company.logo.split(';base64,').pop();
                    if (base64Data) {
                        const imgBuffer = Buffer.from(base64Data, 'base64');
                        doc.image(imgBuffer, x, y, {
                            fit: [maxWidth, maxHeight],
                            align: 'center',
                            valign: 'center'
                        });
                        return true;
                    }
                } catch (e) {
                    console.error('Erreur logo PDF:', e);
                }
            }
            return false;
        };

        // Header with colored accent
        doc.rect(0, 0, 595, 5).fillColor(primaryColor).fill();

        addLogo(50, 20, 80, 50);

        // Company Info
        doc.font('Helvetica-Bold').fontSize(12).fillColor('#000000').text(company.name || '', 50, 80);
        doc.font('Helvetica').fontSize(8).fillColor('#666666');
        let y = 95;

        const companyLines = this.getFormattedCoordinates(company);
        companyLines.forEach(line => {
            doc.text(line, 50, y);
            y += 10;
        });

        // Document Type - Colored Box
        const docTypeLabel = this.getDocumentTypeLabel(document.type);
        doc.rect(350, 40, 195, 30).fillColor(primaryColor).fill();
        doc.font('Helvetica-Bold').fontSize(16).fillColor('#FFFFFF');
        doc.text(docTypeLabel, 350, 50, { align: 'center', width: 195 });

        doc.font('Helvetica').fontSize(9).fillColor('#666666');
        doc.text(`N° ${document.number}`, 350, 80, { align: 'right', width: 195 });
        doc.text(`Date: ${new Date(document.issueDate).toLocaleDateString('fr-FR')}`, 350, 93, { align: 'right', width: 195 });

        // Client Block with colored border
        const clientY = 140;
        doc.rect(50, clientY, 240, 60).strokeColor(primaryColor).lineWidth(2).stroke();

        doc.font('Helvetica-Bold').fontSize(8).fillColor(primaryColor);
        doc.text(isPurchase ? 'FOURNISSEUR' : 'CLIENT', 60, clientY + 10);

        doc.font('Helvetica-Bold').fontSize(10).fillColor('#000000');
        doc.text(clientOrSupplier.name || 'Inconnu', 60, clientY + 25);

        doc.font('Helvetica').fontSize(8).fillColor('#666666');
        let clientTextY = clientY + 38;

        const clientLines = this.getFormattedCoordinates(clientOrSupplier);
        clientLines.forEach(line => {
            doc.text(line, 60, clientTextY, { width: 220 }); // Slightly wider
            clientTextY += 10;
        });

        // Table with colored header
        let tableY = 220;
        doc.rect(50, tableY, 495, 22).fillColor(primaryColor).fill();

        doc.font('Helvetica-Bold').fontSize(9).fillColor('#FFFFFF');
        doc.text('DESCRIPTION', 60, tableY + 7);
        doc.text('QTÉ', 340, tableY + 7, { width: 40, align: 'center' });
        doc.text('PRIX U.', 390, tableY + 7, { width: 60, align: 'right' });
        doc.text('TOTAL', 480, tableY + 7, { width: 60, align: 'right' });

        tableY += 27;

        // Table Lines
        doc.font('Helvetica').fontSize(9).fillColor('#000000');
        if (document.lines && Array.isArray(document.lines)) {
            document.lines.forEach((line: any, index: number) => {
                if (tableY > 680) {
                    doc.addPage();
                    tableY = 50;
                    doc.rect(50, tableY, 495, 22).fillColor(primaryColor).fill();
                    doc.font('Helvetica-Bold').fontSize(9).fillColor('#FFFFFF');
                    doc.text('DESCRIPTION', 60, tableY + 7);
                    doc.text('QTÉ', 340, tableY + 7, { width: 40, align: 'center' });
                    doc.text('PRIX U.', 390, tableY + 7, { width: 60, align: 'right' });
                    doc.text('TOTAL', 480, tableY + 7, { width: 60, align: 'right' });
                    tableY += 27;
                    doc.font('Helvetica').fontSize(9).fillColor('#000000');
                }

                if (index % 2 === 0) {
                    doc.rect(50, tableY - 2, 495, 18).fillColor('#F8FAFC').fill();
                }

                doc.fillColor('#000000');
                doc.text(line.description || '', 60, tableY, { width: 270 });
                doc.text((line.quantity || 0).toString(), 340, tableY, { width: 40, align: 'center' });
                doc.text(`${(line.unitPrice || 0).toFixed(3)}`, 390, tableY, { width: 60, align: 'right' });
                doc.text(`${(line.subtotal || 0).toFixed(3)}`, 480, tableY, { width: 60, align: 'right' });

                tableY += 18;
            });
        }

        doc.moveTo(50, tableY).lineTo(545, tableY).strokeColor('#CCCCCC').lineWidth(1).stroke();

        // Totals with colored accent
        tableY += 15;
        this.addColoredTotals(doc, document, tableY, primaryColor);

        // Footer with colored accent
        const footerY = 745;
        doc.rect(0, footerY, 595, 3).fillColor(primaryColor).fill();

        doc.fontSize(8).fillColor('#666666');
        let footerText = company.name || '';
        if (company.fiscalNumber) footerText += ` • MF: ${company.fiscalNumber}`;
        if (company.address) footerText += ` • ${company.address}`;
        if (company.city) footerText += `, ${company.city}`;
        doc.text(footerText, 50, footerY + 10, { align: 'center', width: 495 });

        if (company.phone || company.email) {
            let contactText = '';
            if (company.phone) contactText += `Tél: ${company.phone}`;
            if (company.email) contactText += (contactText ? ' • ' : '') + `Email: ${company.email}`;
            doc.text(contactText, 50, footerY + 20, { align: 'center', width: 495 });
        }
    }

    // ==================== PREMIUM THEME - Vraiment Premium ====================
    private generatePremiumTheme(doc: any, document: any) {
        const company = document.company || {};
        const clientOrSupplier = document.client || document.supplier || {};
        const isPurchase = !!document.supplier;

        const primaryColor = '#6366F1'; // Indigo vibrant
        const accentColor = '#8B5CF6'; // Violet

        // Logo Centered with border
        const addCenteredLogo = (y: number, maxWidth: number, maxHeight: number) => {
            if (company.logo && company.logo.startsWith('data:image')) {
                try {
                    const base64Data = company.logo.split(';base64,').pop();
                    if (base64Data) {
                        const imgBuffer = Buffer.from(base64Data, 'base64');
                        const x = 297.5 - (maxWidth / 2);

                        // Border around logo
                        doc.roundedRect(x - 10, y - 10, maxWidth + 20, maxHeight + 20, 8)
                            .strokeColor('#E5E7EB').lineWidth(2).stroke();

                        doc.image(imgBuffer, x, y, {
                            fit: [maxWidth, maxHeight],
                            align: 'center',
                            valign: 'center'
                        });
                        return true;
                    }
                } catch (e) {
                    console.error('Erreur logo PDF:', e);
                }
            }
            return false;
        };

        const logoAdded = addCenteredLogo(40, 100, 70);
        const startY = logoAdded ? 130 : 50;

        // Company Name Centered - Big and Bold
        doc.font('Helvetica-Bold').fontSize(16).fillColor('#1F2937');
        doc.text(company.name || '', 50, startY, { align: 'center', width: 495 });

        doc.font('Helvetica').fontSize(9).fillColor('#6B7280');
        let infoY = startY + 20;

        const companyLines = this.getFormattedCoordinates(company);
        // Pour le thème Premium, on essaie de garder ça compact et centré
        // On va concaténer certaines infos si possible ou juste lister
        if (companyLines.length > 0) {
            const addressLines = companyLines.slice(0, 2).join(' - '); // Adresse + Ville
            doc.text(addressLines, 50, infoY, { align: 'center', width: 495 });
            infoY += 12;

            // Phone / Email / MF sur une autre ligne
            const contactLines = companyLines.slice(2).join(' • ');
            doc.text(contactLines, 50, infoY, { align: 'center', width: 495 });
            infoY += 12;
        } else {
            doc.text('', 50, infoY, { align: 'center', width: 495 }); // Placeholder line height
        }

        // Document Type - Centered and Big
        const docTypeLabel = this.getDocumentTypeLabel(document.type);
        doc.font('Helvetica-Bold').fontSize(22).fillColor('#1F2937');
        doc.text(docTypeLabel, 50, infoY + 25, { align: 'center', width: 495 });

        // Document Number and Date
        doc.font('Helvetica').fontSize(10).fillColor('#6B7280');
        doc.text(`N° ${document.number}`, 50, infoY + 52, { align: 'center', width: 495 });
        doc.text(`Date: ${new Date(document.issueDate).toLocaleDateString('fr-FR')}`, 50, infoY + 67, { align: 'center', width: 495 });

        // Separator line
        const sepY = infoY + 90;
        doc.moveTo(50, sepY).lineTo(545, sepY).strokeColor('#E5E7EB').lineWidth(1).stroke();

        // Client Card - Centered with border
        const clientY = sepY + 20;
        doc.roundedRect(170, clientY, 255, 70, 12).strokeColor('#E5E7EB').lineWidth(2).stroke();
        doc.roundedRect(170, clientY, 255, 70, 12).fillColor('#FAFAFA').opacity(0.5).fill();
        doc.opacity(1);

        doc.font('Helvetica-Bold').fontSize(9).fillColor('#6B7280');
        doc.text(isPurchase ? 'FOURNISSEUR' : 'CLIENT', 170, clientY + 12, { align: 'center', width: 255 });

        doc.font('Helvetica-Bold').fontSize(13).fillColor('#1F2937');
        doc.text(clientOrSupplier.name || 'Inconnu', 170, clientY + 30, { align: 'center', width: 255 });

        doc.font('Helvetica').fontSize(9).fillColor('#6B7280');
        const clientLines = this.getFormattedCoordinates(clientOrSupplier);
        let cY = clientY + 45; // ajusté un peu plus bas

        clientLines.forEach(line => {
            doc.text(line, 170, cY, { align: 'center', width: 255 });
            cY += 10; // Espacement serré
        });

        // Table Header
        let tableY = clientY + 95;
        doc.rect(50, tableY, 495, 25).fillColor('#F3F4F6').fill();
        doc.rect(50, tableY, 495, 25).strokeColor('#E5E7EB').lineWidth(1).stroke();

        doc.font('Helvetica-Bold').fontSize(10).fillColor('#374151');
        doc.text('DESCRIPTION', 65, tableY + 8);
        doc.text('QTÉ', 340, tableY + 8, { width: 40, align: 'center' });
        doc.text('PRIX U.', 390, tableY + 8, { width: 60, align: 'right' });
        doc.text('TOTAL', 480, tableY + 8, { width: 60, align: 'right' });

        tableY += 30;

        // Table Lines
        doc.font('Helvetica').fontSize(10).fillColor('#1F2937');
        if (document.lines && Array.isArray(document.lines)) {
            document.lines.forEach((line: any, index: number) => {
                if (tableY > 650) {
                    doc.addPage();
                    tableY = 50;
                }

                // Separator line between rows
                if (index > 0) {
                    doc.moveTo(50, tableY - 5).lineTo(545, tableY - 5).strokeColor('#F3F4F6').lineWidth(1).stroke();
                }

                doc.fillColor('#1F2937');
                doc.text(line.description || '', 65, tableY, { width: 265 });
                doc.text((line.quantity || 0).toString(), 340, tableY, { width: 40, align: 'center' });
                doc.text(`${(line.unitPrice || 0).toFixed(3)}`, 390, tableY, { width: 60, align: 'right' });
                doc.text(`${(line.subtotal || 0).toFixed(3)}`, 480, tableY, { width: 60, align: 'right' });

                tableY += 22;
            });
        }

        // Bottom line
        doc.moveTo(50, tableY).lineTo(545, tableY).strokeColor('#E5E7EB').lineWidth(1).stroke();

        // Totals Card - Like in your example
        tableY += 20;
        const totalsCardX = 320;
        const totalsCardY = tableY;
        const totalsCardWidth = 225;

        // Card with rounded border
        doc.roundedRect(totalsCardX, totalsCardY, totalsCardWidth, 95, 12)
            .strokeColor(primaryColor).lineWidth(2).stroke();

        // Totals content
        let totY = totalsCardY + 15;
        doc.font('Helvetica').fontSize(10).fillColor('#6B7280');

        const subtotal = document.subtotal || 0;
        const taxTotal = document.taxTotal || 0;
        const fodec = (document as any).fodecTotal || 0;
        const timbre = (document as any).timbreFiscal || 0;

        // Sous-total
        doc.text('Sous-total HT', totalsCardX + 15, totY, { width: 120, align: 'left' });
        doc.text(`${subtotal.toFixed(3)} TND`, totalsCardX + 140, totY, { width: 70, align: 'right' });
        totY += 15;

        // TVA
        doc.text('TVA', totalsCardX + 15, totY, { width: 120, align: 'left' });
        doc.text(`${taxTotal.toFixed(3)} TND`, totalsCardX + 140, totY, { width: 70, align: 'right' });
        totY += 15;

        // FODEC if exists
        if (fodec > 0) {
            doc.text('FODEC', totalsCardX + 15, totY, { width: 120, align: 'left' });
            doc.text(`${fodec.toFixed(3)} TND`, totalsCardX + 140, totY, { width: 70, align: 'right' });
            totY += 15;
        }

        // NET À PAYER - Highlighted
        totY += 5;
        doc.roundedRect(totalsCardX + 10, totY - 5, totalsCardWidth - 20, 30, 8)
            .fillColor(primaryColor).fill();

        doc.font('Helvetica-Bold').fontSize(12).fillColor('#FFFFFF');
        doc.text('NET À PAYER', totalsCardX + 15, totY + 3, { width: 100, align: 'left' });
        doc.text(`${(document.total || 0).toFixed(3)} TND`, totalsCardX + 120, totY + 3, { width: 90, align: 'right' });

        // Footer - Premium
        const footerY = 750;
        doc.moveTo(50, footerY).lineTo(545, footerY).strokeColor('#E5E7EB').lineWidth(1).stroke();

        doc.fontSize(8).fillColor('#9CA3AF');
        let footerText = company.name || '';
        if (company.fiscalNumber) footerText += ` • MF: ${company.fiscalNumber}`;
        if (company.address) footerText += ` • ${company.address}`;
        if (company.city) footerText += `, ${company.city}`;
        doc.text(footerText, 50, footerY + 8, { align: 'center', width: 495 });

        if (company.phone || company.email) {
            let contactText = '';
            if (company.phone) contactText += `Tél: ${company.phone}`;
            if (company.email) contactText += (contactText ? ' • ' : '') + `Email: ${company.email}`;
            doc.text(contactText, 50, footerY + 18, { align: 'center', width: 495 });
        }
    }

    // ==================== HELPER METHODS ====================

    private addSimpleTotals(doc: any, document: any, yPosition: number) {
        const totalsX = 380;
        const valuesX = 480;

        doc.font('Helvetica').fontSize(9).fillColor('#666666');

        const addLine = (label: string, value: number, isBold = false) => {
            if (isBold) doc.font('Helvetica-Bold').fontSize(10).fillColor('#000000');
            doc.text(label, totalsX, yPosition, { align: 'right', width: 90 });
            doc.text(`${value.toFixed(3)} TND`, valuesX, yPosition, { align: 'right', width: 60 });
            yPosition += 15;
            doc.font('Helvetica').fontSize(9).fillColor('#666666');
        };

        const subtotal = document.subtotal || 0;
        const taxTotal = document.taxTotal || 0;
        const fodec = (document as any).fodecTotal || 0;
        const timbre = (document as any).timbreFiscal || 0;

        addLine('Sous-total HT', subtotal);
        if (fodec > 0) addLine('FODEC', fodec);
        addLine('TVA', taxTotal);
        if (timbre > 0) addLine('Timbre Fiscal', timbre);

        yPosition += 5;
        doc.moveTo(380, yPosition).lineTo(545, yPosition).strokeColor('#CCCCCC').lineWidth(1).stroke();
        yPosition += 10;

        addLine('TOTAL TTC', document.total || 0, true);
    }

    private addColoredTotals(doc: any, document: any, yPosition: number, color: string) {
        const totalsX = 380;
        const valuesX = 480;

        doc.font('Helvetica').fontSize(9).fillColor('#666666');

        const addLine = (label: string, value: number, isBold = false) => {
            if (isBold) {
                doc.rect(375, yPosition - 3, 170, 20).fillColor(color).fill();
                doc.font('Helvetica-Bold').fontSize(10).fillColor('#FFFFFF');
            }
            doc.text(label, totalsX, yPosition, { align: 'right', width: 90 });
            doc.text(`${value.toFixed(3)} TND`, valuesX, yPosition, { align: 'right', width: 60 });
            yPosition += isBold ? 25 : 15;
            doc.font('Helvetica').fontSize(9).fillColor('#666666');
        };

        const subtotal = document.subtotal || 0;
        const taxTotal = document.taxTotal || 0;
        const fodec = (document as any).fodecTotal || 0;
        const timbre = (document as any).timbreFiscal || 0;

        addLine('Sous-total HT', subtotal);
        if (fodec > 0) addLine('FODEC', fodec);
        addLine('TVA', taxTotal);
        if (timbre > 0) addLine('Timbre', timbre);

        yPosition += 5;
        addLine('TOTAL TTC', document.total || 0, true);
    }

    private addPremiumTotals(doc: any, document: any, yPosition: number, primaryColor: string, secondaryColor: string, accentColor: string) {
        const totalsX = 350;
        const valuesX = 480;

        // Premium totals card with shadow
        doc.roundedRect(totalsX - 8, yPosition - 5, 203, 110, 12).fillColor('#000000').opacity(0.05).fill();
        doc.opacity(1);

        // Gradient background
        doc.roundedRect(totalsX - 10, yPosition - 7, 203, 110, 12).fillColor('#F9FAFB').fill();
        doc.roundedRect(totalsX - 10, yPosition - 7, 203, 110, 12).strokeColor(primaryColor).lineWidth(2).stroke();

        yPosition += 5;

        doc.font('Helvetica').fontSize(9).fillColor('#6B7280');

        const addLine = (label: string, value: number, isBold = false, isTotal = false) => {
            if (isTotal) {
                // Total final with premium styling
                doc.roundedRect(totalsX - 5, yPosition - 3, 193, 25, 8).fillColor(primaryColor).fill();
                doc.font('Helvetica-Bold').fontSize(12).fillColor('#FFFFFF');
                doc.text(label, totalsX, yPosition + 2, { align: 'right', width: 90 });
                doc.text(`${value.toFixed(3)} TND`, valuesX, yPosition + 2, { align: 'right', width: 60 });
                yPosition += 30;
            } else if (isBold) {
                doc.font('Helvetica-Bold').fontSize(10).fillColor('#1F2937');
                doc.text(label, totalsX, yPosition, { align: 'right', width: 90 });
                doc.text(`${value.toFixed(3)} TND`, valuesX, yPosition, { align: 'right', width: 60 });
                yPosition += 18;
            } else {
                doc.text(label, totalsX, yPosition, { align: 'right', width: 90 });
                doc.text(`${value.toFixed(3)} TND`, valuesX, yPosition, { align: 'right', width: 60 });
                yPosition += 15;
            }
            doc.font('Helvetica').fontSize(9).fillColor('#6B7280');
        };

        const subtotal = document.subtotal || 0;
        const taxTotal = document.taxTotal || 0;
        const fodec = (document as any).fodecTotal || 0;
        const timbre = (document as any).timbreFiscal || 0;

        addLine('Sous-total HT', subtotal);
        if (fodec > 0) addLine('FODEC', fodec);
        addLine('TVA', taxTotal);
        if (timbre > 0) addLine('Timbre Fiscal', timbre);

        yPosition += 5;
        doc.moveTo(totalsX, yPosition).lineTo(totalsX + 180, yPosition).strokeColor(secondaryColor).opacity(0.5).lineWidth(1).stroke();
        doc.opacity(1);
        yPosition += 8;

        addLine('NET À PAYER', document.total || 0, false, true);
    }

    private getDocumentTypeLabel(type: string): string {
        const typeMap: Record<string, string> = {
            INVOICE: 'FACTURE',
            QUOTE: 'DEVIS',
            CREDIT_NOTE: 'AVOIR',
            SALES_ORDER: 'COMMANDE',
            DELIVERY_NOTE: 'BON DE LIVRAISON',
            STOCK_OUTPUT: 'BON DE SORTIE',
            PURCHASE_ORDER: 'COMMANDE FOURNISSEUR',
            GOODS_RECEIPT: 'BON DE RÉCEPTION',
            PURCHASE_INVOICE: 'FACTURE FOURNISSEUR',
        };
        return typeMap[type] || type || 'DOCUMENT';
    }
}
