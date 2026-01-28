# Thèmes PDF Professionnels - Documentation

## 🎨 3 Thèmes Disponibles

### 1. **CLASSIC** - Simple et Professionnel
**Description** : Design épuré et classique, parfait pour tous types de documents

**Caractéristiques** :
- Logo en haut à gauche (taille fixe, pas de recadrage)
- En-tête simple avec informations entreprise
- Bloc client/fournisseur avec fond gris clair
- Tableau des produits avec lignes simples
- Totaux alignés à droite
- Footer minimaliste
- Filigrane VALIDE/NON VALIDE

**Couleurs** :
- Primaire : Gris foncé (#1e293b)
- Secondaire : Bleu (#1e40af)
- Fond : Blanc et gris clair (#f8fafc)

---

### 2. **MODERN** - Stylé et Coloré
**Description** : Design moderne avec touches de couleur et mise en page dynamique

**Caractéristiques** :
- Logo en haut à gauche avec bordure colorée
- En-tête avec bande de couleur (gradient bleu-indigo)
- Bloc client avec fond coloré et icônes
- Tableau avec en-tête coloré (bleu gradient)
- Lignes alternées (zebra striping)
- Totaux dans un encadré coloré
- Footer avec fond coloré
- Filigrane VALIDE/NON VALIDE avec couleur vive

**Couleurs** :
- Primaire : Bleu vif (#3b82f6)
- Secondaire : Indigo (#6366f1)
- Accent : Vert (#10b981) pour VALIDE, Rouge (#ef4444) pour NON VALIDE
- Fond : Blanc avec accents colorés

**Éléments Visuels** :
- Bordures arrondies
- Ombres subtiles
- Icônes pour les sections
- Gradients de couleur

---

### 3. **PREMIUM** - Ultra Moderne et Sophistiqué
**Description** : Design haut de gamme avec mise en page avancée et effets visuels

**Caractéristiques** :
- Logo centré en haut avec effet de halo
- En-tête avec grand titre et fond dégradé
- Carte client/fournisseur avec ombre portée
- Tableau avec design moderne (bordures fines, espacements généreux)
- Badges colorés pour les statuts
- Totaux dans un panneau avec fond dégradé
- Footer avec séparateur stylisé
- Filigrane diagonal avec effet 3D

**Couleurs** :
- Primaire : Bleu nuit (#0f172a)
- Secondaire : Violet (#8b5cf6)
- Accent : Or (#f59e0b) pour les highlights
- Fond : Blanc avec dégradés subtils

**Éléments Visuels** :
- Dégradés multiples
- Ombres portées
- Bordures fines et élégantes
- Espacements généreux
- Typographie variée (tailles et poids)
- Effets de profondeur

---

## 🖼️ Gestion du Logo

### Règles Universelles (tous les thèmes)

1. **Pas de Recadrage** : Le logo n'est jamais coupé ou recadré
2. **Redimensionnement Proportionnel** : Le ratio d'aspect est toujours préservé
3. **Taille Maximale** : 
   - Largeur max : 120px
   - Hauteur max : 80px
4. **Centrage** : Le logo est centré dans son espace réservé
5. **Qualité** : Support des formats PNG, JPG, SVG (base64)

### Implémentation Technique

```typescript
// Fonction de redimensionnement intelligent
const addLogo = (x: number, y: number, maxWidth: number, maxHeight: number) => {
  if (company.logo && company.logo.startsWith('data:image')) {
    const base64Data = company.logo.split(';base64,').pop();
    const imgBuffer = Buffer.from(base64Data, 'base64');
    
    // PDFKit redimensionne automatiquement en gardant le ratio
    doc.image(imgBuffer, x, y, { 
      fit: [maxWidth, maxHeight],  // Taille max
      align: 'center',              // Centré
      valign: 'center'              // Centré verticalement
    });
  }
};
```

---

## 📐 Mise en Page Comparative

### CLASSIC
```
┌─────────────────────────────────────────┐
│ [LOGO]        Entreprise                │
│               MF: XXX                   │
│                                         │
│                      FACTURE            │
│                      N° FACT-001        │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ ADRESSÉ À :                         │ │
│ │ Client Name                         │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ DESC    QTÉ    PRIX    TOTAL           │
│ ────────────────────────────────────   │
│ Item 1   2    100.00   200.00          │
│                                         │
│              Total HT:    200.00 TND   │
│              Total TVA:    38.00 TND   │
│              NET À PAYER: 238.00 TND   │
└─────────────────────────────────────────┘
```

### MODERN
```
┌═════════════════════════════════════════┐
║ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ ║ ← Gradient bleu
║ [LOGO]  Entreprise        FACTURE      ║
║         MF: XXX           N° FACT-001  ║
║ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ ║
│                                         │
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │
│ ┃ 👤 ADRESSÉ À :                    ┃ │ ← Fond coloré
│ ┃ Client Name                       ┃ │
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
│                                         │
│ ╔═══════════════════════════════════╗ │
│ ║ DESC    QTÉ    PRIX    TOTAL      ║ │ ← En-tête coloré
│ ╠═══════════════════════════════════╣ │
│ ║ Item 1   2    100.00   200.00     ║ │
│ ║ ▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒ ║ │ ← Ligne alternée
│ ╚═══════════════════════════════════╝ │
│                                         │
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓   │
│ ┃ NET À PAYER: 238.00 TND        ┃   │ ← Encadré coloré
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛   │
└─────────────────────────────────────────┘
```

### PREMIUM
```
┌─────────────────────────────────────────┐
│           ╭─────────╮                   │
│           │ [LOGO]  │                   │ ← Logo centré
│           ╰─────────╯                   │
│                                         │
│   ╔═══════════════════════════════╗    │
│   ║                               ║    │
│   ║        F A C T U R E          ║    │ ← Grand titre
│   ║        N° FACT-001            ║    │
│   ║                               ║    │
│   ╚═══════════════════════════════╝    │
│                                         │
│   ╭───────────────────────────────╮    │
│   │ 👤 ADRESSÉ À :                │    │ ← Carte avec ombre
│   │ Client Name                   │    │
│   │ Adresse                       │    │
│   ╰───────────────────────────────╯    │
│                                         │
│   ┌───────────────────────────────┐    │
│   │ DESC    QTÉ    PRIX    TOTAL  │    │
│   ├───────────────────────────────┤    │
│   │ Item 1   2    100.00   200.00 │    │
│   │                               │    │
│   └───────────────────────────────┘    │
│                                         │
│   ╔═══════════════════════════════╗    │
│   ║ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ ║    │ ← Fond dégradé
│   ║ NET À PAYER: 238.00 TND      ║    │
│   ╚═══════════════════════════════╝    │
└─────────────────────────────────────────┘
```

---

## 🎯 Choix du Thème

Le client peut choisir son thème dans **Paramètres > Entreprise > Mise en page des Documents PDF**

Une fois choisi, **TOUS** les documents générés (factures, devis, commandes, etc.) utiliseront automatiquement ce thème.

---

## 💾 Stockage

Le thème choisi est stocké dans :
- **Base de données** : `Company.pdfTemplate`
- **Valeurs possibles** : `'CLASSIC'`, `'MODERN'`, `'PREMIUM'`
- **Valeur par défaut** : `'CLASSIC'`

---

## 🔄 Migration

Les anciens thèmes seront automatiquement migrés :
- `'STANDARD'` → `'CLASSIC'`
- `'CENTERED'` → `'MODERN'`
- `'WATERMARK'` → `'PREMIUM'`
