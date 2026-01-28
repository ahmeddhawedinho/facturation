# Export PDF Professionnel - Documentation

## 🎯 Objectif

L'export PDF génère maintenant des documents **professionnels identiques** aux factures/devis originaux, avec :
- ✅ En-tête de l'entreprise avec logo
- ✅ Informations du client/fournisseur
- ✅ Tableau des lignes de produits
- ✅ Calcul des totaux (HT, TVA, FODEC, Timbre Fiscal, TTC)
- ✅ Mise en page professionnelle
- ✅ Footer avec informations de contact

## 📋 Fonctionnalités

### Mode "Documents Séparés"
Chaque document est sur une nouvelle page dans le même PDF, avec sa propre mise en page complète.

### Mode "Document Consolidé"
Tous les documents sont dans un seul PDF, chacun sur sa propre page.

## 🎨 Mise en Page

### En-tête
```
┌─────────────────────────────────────────────────┐
│  [LOGO]                          FACTURE        │
│  Nom Entreprise                  N° FACT-XXX    │
│  MF: XXXXXXX                     Date: XX/XX/XX │
│  Adresse                                        │
└─────────────────────────────────────────────────┘
```

### Bloc Client/Fournisseur
```
┌─────────────────────────────────────────────────┐
│  ADRESSÉ À :                                    │
│  Nom du Client                                  │
│  Adresse                                        │
│  MF: XXXXXXX                                    │
└─────────────────────────────────────────────────┘
```

### Tableau des Produits
```
┌──────────────┬─────┬──────────┬────────────┐
│ DESCRIPTION  │ QTÉ │ PRIX U.  │ TOTAL HT   │
├──────────────┼─────┼──────────┼────────────┤
│ Produit 1    │  2  │ 100.000  │  200.000   │
│ Produit 2    │  1  │  50.000  │   50.000   │
└──────────────┴─────┴──────────┴────────────┘
```

### Totaux
```
                    Total HT:      250.000 TND
                    FODEC (1%):      2.500 TND
                    Total TVA:      47.500 TND
                    ─────────────────────────
                    Total TTC:     300.000 TND
                    Timbre Fiscal:   1.000 TND
                    ═════════════════════════
                    NET À PAYER:   301.000 TND
```

## 🔧 Implémentation Technique

### Service Utilisé
Le service `AdvancedExportService` utilise maintenant la méthode `generateDocumentPage()` qui reproduit exactement le template professionnel de `PdfService`.

### Flux de Génération

1. **Récupération des documents** avec toutes les relations (company, client/supplier, lines, payments)
2. **Pour chaque document** :
   - Ajout du logo de l'entreprise (si disponible)
   - En-tête avec nom et informations de l'entreprise
   - Type de document et numéro
   - Bloc client/fournisseur avec fond gris clair
   - Tableau des lignes de produits
   - Calcul et affichage des totaux
   - Footer avec message de remerciement

3. **Mode Individual** : Chaque document sur une nouvelle page
4. **Mode Consolidated** : Tous les documents dans le même PDF

### Code Principal

```typescript
private generateDocumentPage(doc: any, document: any, section: string) {
  // Logo
  if (company.logo) {
    doc.image(imgBuffer, 50, 40, { width: 80 });
  }

  // En-tête entreprise
  doc.font('Helvetica-Bold').fontSize(16).text(company.name, 50, 50);
  
  // Type de document
  doc.font('Helvetica-Bold').fontSize(22).fillColor('#1e40af');
  doc.text(docTypeLabel, 350, 50, { align: 'right' });
  
  // Bloc client
  doc.rect(50, 190, 500, 85).fillColor('#f8fafc').fill();
  doc.text(clientOrSupplier.name, 70, 220);
  
  // Tableau des lignes
  document.lines.forEach((line) => {
    doc.text(line.description, 50, yPosition);
    doc.text(line.quantity, 320, yPosition);
    doc.text(line.unitPrice.toFixed(3), 380, yPosition);
    doc.text(line.subtotal.toFixed(3), 500, yPosition);
  });
  
  // Totaux
  addTotalLine('Total HT', document.subtotal);
  addTotalLine('Total TVA', document.taxTotal);
  addTotalLine('NET À PAYER', document.total, true);
}
```

## 📊 Comparaison Avant/Après

### ❌ Avant
```
Export Ventes
Mode: individual

Document: FACT-0879926
Type: Facture
Date: 2026-01-18
Total: 100.000

Document: CMD-0957581
Type: Bon de Commande
Date: 2026-01-18
Total: 100.000
```

### ✅ Après
Chaque document est généré avec le template professionnel complet :
- Logo de l'entreprise
- En-tête formaté
- Informations client dans un bloc stylisé
- Tableau des produits avec colonnes alignées
- Totaux calculés et formatés
- Footer professionnel

## 🎯 Cas d'Usage

### Export de Factures pour Comptabilité
```
1. Sélectionner toutes les factures du mois
2. Choisir format PDF
3. Mode "Documents séparés"
4. Résultat : PDF avec chaque facture sur sa page
```

### Archive Mensuelle
```
1. Filtrer par date (01/01 - 31/01)
2. Sélectionner tous les documents
3. Mode "Document consolidé"
4. Résultat : Un seul PDF avec tous les documents
```

### Envoi Client
```
1. Filtrer par client spécifique
2. Sélectionner les factures non payées
3. Mode "Documents séparés"
4. Résultat : PDF professionnel à envoyer au client
```

## 🔍 Détails Techniques

### Dépendances
- `pdfkit` : Génération de PDF
- `PdfService` : Service de génération professionnel existant

### Fichiers Modifiés
- ✅ `advanced-export.service.ts` : Ajout de `generateDocumentPage()`
- ✅ `import-export.module.ts` : Injection de `PdfService`
- ✅ Inclusion de `company` dans les requêtes Prisma

### Optimisations
- Réutilisation du code existant de `PdfService`
- Génération page par page pour économiser la mémoire
- Support des logos en base64
- Gestion des documents sans lignes

## 🚀 Utilisation

1. **Accéder** à la section Ventes ou Achats
2. **Cliquer** sur "Exporter"
3. **Filtrer** et sélectionner les documents
4. **Choisir** format PDF
5. **Sélectionner** le mode (séparé ou consolidé)
6. **Exporter** → Le PDF professionnel est téléchargé ! 🎉

## 📝 Notes

- Les logos sont automatiquement inclus s'ils sont configurés dans l'entreprise
- Les totaux incluent HT, TVA, FODEC, Timbre Fiscal
- Le format est identique aux documents originaux
- Chaque page est autonome et complète

## 🔮 Améliorations Futures

1. **Fusion PDF** : Utiliser `pdf-lib` pour fusionner les PDFs individuels
2. **Templates personnalisés** : Permettre le choix du template (STANDARD, CENTERED, WATERMARK)
3. **Compression** : Optimiser la taille des PDFs
4. **Signatures** : Ajouter des signatures numériques
5. **QR Codes** : Ajouter des QR codes pour vérification
