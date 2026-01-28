# Fonctionnalité d'Export Avancé - Documentation

## Vue d'ensemble

Une nouvelle fonctionnalité d'export complète a été ajoutée aux interfaces de **Vente** et d'**Achat**. Cette fonctionnalité permet aux utilisateurs d'exporter leurs documents avec des filtres avancés et plusieurs formats de sortie.

## Fonctionnalités

### 1. Filtrage Avancé

Les utilisateurs peuvent filtrer les documents avant l'export selon :

- **Date de début** : Filtrer les documents créés après une date spécifique
- **Date de fin** : Filtrer les documents créés avant une date spécifique
- **Client/Fournisseur** : Filtrer par partenaire commercial spécifique

### 2. Sélection de Documents

- **Sélection individuelle** : Cocher/décocher chaque document
- **Sélection globale** : Bouton "Tout sélectionner" pour sélectionner tous les documents filtrés
- **Aperçu en temps réel** : Voir le nombre de documents sélectionnés

### 3. Formats d'Export

#### PDF
- **Mode Documents séparés** : Chaque document dans un fichier PDF séparé
- **Mode Document consolidé** : Tous les documents dans un seul fichier PDF

#### CSV
Export en format CSV avec toutes les informations :
- Référence du document
- Type de document
- Date de création
- Date d'échéance
- Nom du client/fournisseur
- Total HT (Hors Taxes)
- Total TVA
- FODEC
- Timbre Fiscal
- Total TTC (Toutes Taxes Comprises)
- Moyen de paiement
- Montant payé
- Reste à payer
- Statut de paiement (avec pourcentage si partiel)
- Date de paiement
- État du document

#### Excel (.xlsx)
Même contenu que le CSV mais avec :
- Formatage professionnel
- En-têtes colorés
- Filtres automatiques
- Colonnes dimensionnées automatiquement

### 4. Informations de Paiement Détaillées

L'export inclut des informations complètes sur les paiements :

- **Montant payé** : Total des paiements effectués
- **Reste à payer** : Montant restant dû
- **Statut de paiement** :
  - "Non payé" si aucun paiement
  - "Payé" si paiement complet
  - "Partiel (XX%)" si paiement partiel avec pourcentage
- **Date de paiement** : Date du dernier paiement
- **Moyen de paiement** : Espèces, Chèque, Virement, etc.

## Utilisation

### Dans l'interface de Vente

1. Accédez à la section **Opérations Commerciales**
2. Cliquez sur le bouton vert **"Exporter"** (à côté du bouton "Actualiser les flux")
3. Dans la fenêtre modale :
   - Sélectionnez les filtres de date si nécessaire
   - Choisissez un client spécifique (optionnel)
   - Sélectionnez les documents à exporter
   - Choisissez le format (PDF, CSV ou Excel)
   - Si PDF, choisissez le mode (séparé ou consolidé)
4. Cliquez sur **"Exporter"**
5. Le fichier sera téléchargé automatiquement

### Dans l'interface d'Achat

1. Accédez à la section **Registre Achats**
2. Cliquez sur le bouton vert **"Exporter"**
3. Suivez les mêmes étapes que pour les ventes, mais avec les fournisseurs au lieu des clients

## Endpoints API

### POST `/import-export/advanced-export`

**Body:**
```json
{
  "section": "sales" | "purchase",
  "format": "pdf" | "csv" | "excel",
  "pdfMode": "individual" | "consolidated",
  "documentIds": ["id1", "id2", ...],
  "startDate": "2024-01-01",
  "endDate": "2024-12-31",
  "clientId": "client-uuid",
  "supplierId": "supplier-uuid"
}
```

**Response:**
- Fichier binaire (PDF, CSV ou Excel) avec les en-têtes appropriés

## Fichiers Modifiés/Créés

### Backend
- `apps/api/src/import-export/dto/export-documents.dto.ts` (nouveau)
- `apps/api/src/import-export/advanced-export.service.ts` (nouveau)
- `apps/api/src/import-export/import-export.controller.ts` (modifié)
- `apps/api/src/import-export/import-export.module.ts` (modifié)
- `apps/api/package.json` (ajout de la dépendance `exceljs`)

### Frontend
- `apps/web/src/components/ExportModal.tsx` (nouveau)
- `apps/web/src/pages/SalesSection.tsx` (modifié)
- `apps/web/src/pages/PurchaseSection.tsx` (modifié)

## Dépendances Ajoutées

- **exceljs** : Pour la génération de fichiers Excel avec formatage

## Notes Techniques

1. **Performance** : Les exports sont optimisés pour gérer de grandes quantités de documents
2. **Sécurité** : Tous les exports sont limités aux documents de l'entreprise de l'utilisateur connecté
3. **Format des nombres** : Les montants sont formatés avec 3 décimales (format tunisien)
4. **Encodage** : Les fichiers CSV sont encodés en UTF-8 pour supporter les caractères spéciaux

## Améliorations Futures Possibles

1. **PDF réel** : Implémenter la génération de vrais PDF avec mise en page professionnelle (actuellement placeholder)
2. **Templates personnalisables** : Permettre aux utilisateurs de personnaliser les colonnes exportées
3. **Export planifié** : Permettre la planification d'exports automatiques
4. **Envoi par email** : Option d'envoyer l'export directement par email
5. **Compression** : Pour les exports volumineux, créer un fichier ZIP

## Support

Pour toute question ou problème, consultez les logs de l'application ou contactez l'équipe de développement.
