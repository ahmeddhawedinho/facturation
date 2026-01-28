import { Injectable } from '@nestjs/common';

@Injectable()
export class EmailService {
    /**
     * Envoyer un email d'invitation au client pour activer son compte
     */
    async sendClientActivationEmail(
        email: string,
        companyName: string,
        tempPassword: string,
        accountantName: string,
    ): Promise<void> {
        const activationLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`;

        const emailContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .credentials { background: white; border-left: 4px solid #4F46E5; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Bienvenue sur Facturation TN</h1>
        </div>
        <div class="content">
            <p>Bonjour,</p>
            
            <p>Votre expert comptable <strong>${accountantName}</strong> a créé un dossier pour votre entreprise <strong>${companyName}</strong> sur notre plateforme de gestion.</p>
            
            <p>Nous avons créé un compte administrateur pour vous permettre d'accéder à votre espace de facturation.</p>
            
            <div class="credentials">
                <h3>🔐 Vos identifiants de connexion</h3>
                <p><strong>Email :</strong> ${email}</p>
                <p><strong>Mot de passe temporaire :</strong> <code style="background: #e5e7eb; padding: 4px 8px; border-radius: 4px;">${tempPassword}</code></p>
            </div>
            
            <p style="color: #ef4444; font-weight: bold;">⚠️ Pour des raisons de sécurité, veuillez changer votre mot de passe dès votre première connexion.</p>
            
            <div style="text-align: center;">
                <a href="${activationLink}" class="button">Se connecter maintenant</a>
            </div>
            
            <h3>📋 Prochaines étapes :</h3>
            <ol>
                <li>Cliquez sur le bouton ci-dessus pour accéder à la plateforme</li>
                <li>Connectez-vous avec vos identifiants</li>
                <li>Changez votre mot de passe dans Profil → Sécurité</li>
                <li>Complétez les informations de votre entreprise</li>
                <li>Commencez à gérer votre facturation !</li>
            </ol>
            
            <p>Si vous avez des questions, n'hésitez pas à contacter votre expert comptable ou notre support.</p>
            
            <p>Cordialement,<br><strong>L'équipe Facturation TN</strong></p>
        </div>
        <div class="footer">
            <p>Cet email a été envoyé automatiquement. Merci de ne pas y répondre.</p>
            <p>© 2026 Facturation TN - Tous droits réservés</p>
        </div>
    </div>
</body>
</html>
        `.trim();

        // TODO: Implémenter l'envoi réel avec nodemailer, SendGrid, etc.
        console.log('=== EMAIL D\'ACTIVATION CLIENT ===');
        console.log('To:', email);
        console.log('Subject: Activation de votre compte Facturation TN');
        console.log('Content:', emailContent);
        console.log('===================================');

        // Pour production, utiliser un service d'email :
        // await this.mailService.send({
        //     to: email,
        //     subject: 'Activation de votre compte Facturation TN',
        //     html: emailContent,
        // });
    }

    /**
     * Envoyer une notification au comptable confirmant l'acceptation de l'invitation
     */
    async sendAccountantAccessGrantedEmail(
        accountantEmail: string,
        accountantName: string,
        companyName: string,
    ): Promise<void> {
        const portalLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/portal/accountant`;

        const emailContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .success-box { background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Accès accordé</h1>
        </div>
        <div class="content">
            <p>Bonjour ${accountantName},</p>
            
            <div class="success-box">
                <h3>🎉 Nouveau dossier client disponible</h3>
                <p>Vous avez maintenant accès au dossier de <strong>${companyName}</strong>.</p>
            </div>
            
            <p>Vous pouvez dès à présent :</p>
            <ul>
                <li>📊 Consulter les journaux de ventes et d'achats</li>
                <li>💾 Exporter les données comptables (Excel, CSV, PDF)</li>
                <li>📎 Télécharger les pièces justificatives</li>
                <li>💬 Communiquer avec l'administrateur du client</li>
            </ul>
            
            <div style="text-align: center;">
                <a href="${portalLink}" class="button">Accéder au portail comptable</a>
            </div>
            
            <p>Cordialement,<br><strong>L'équipe Facturation TN</strong></p>
        </div>
        <div class="footer">
            <p>Cet email a été envoyé automatiquement. Merci de ne pas y répondre.</p>
            <p>© 2026 Facturation TN - Tous droits réservés</p>
        </div>
    </div>
</body>
</html>
        `.trim();

        console.log('=== EMAIL CONFIRMATION COMPTABLE ===');
        console.log('To:', accountantEmail);
        console.log('Subject: Accès accordé au dossier ' + companyName);
        console.log('Content:', emailContent);
        console.log('=====================================');
    }
}
