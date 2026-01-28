# 🎯 Module Expert Comptable - Documentation Complète

## ✅ IMPLÉMENTATION TERMINÉE (90%)

### 📊 Vue d'ensemble
Le module Expert Comptable permet aux cabinets comptables de gérer les dossiers de leurs clients directement dans l'application, avec consultation des journaux comptables, export professionnel et communication sécurisée.

---

## 🗄️ BASE DE DONNÉES

### Nouveaux Modèles Prisma

#### 1. **AccountantClientRelation**
Gère les relations entre comptables et entreprises clientes.

```prisma
model AccountantClientRelation {
  id              String         @id @default(uuid())
  accountantId    String         // User avec role ACCOUNTANT
  companyId       String         // Company du client
  status          RelationStatus @default(PENDING)
  invitationToken String?        @unique
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  
  accountant      User           @relation("AccountantRelations")
  company         Company        @relation
}

enum RelationStatus {
  PENDING   // En attente d'activation
  ACTIVE    // Relation active
  SUSPENDED // Temporairement suspendue
}
```

#### 2. **DocumentAttachment**
Stocke les pièces jointes (scans de chèques, factures fournisseurs, etc.)

```prisma
model DocumentAttachment {
  id         String   @id @default(uuid())
  documentId String
  fileName   String
  fileUrl    String   @db.Text  // Base64 ou chemin fichier
  fileType   String              // MIME type
  size       Int                 // Taille en bytes
  uploadedAt DateTime @default(now())
  
  document   Document @relation
}
```

#### 3. **Enum Role étendu**
```prisma
enum Role {
  ADMIN      // Administrateur d'entreprise
  SUB_ACCOUNT // Sous-compte / Agent
  ACCOUNTANT  // Expert Comptable (NOUVEAU)
}
```

---

## 🔧 BACKEND (NestJS)

### Structure du Module
```
apps/api/src/accountant-portal/
├── accountant-portal.module.ts           # Module principal
├── accountant-portal.controller.ts       # Contrôleur REST
├── accountant-portal.service.ts          # Logique métier
├── accountant-export.service.ts          # Service d'export avancé
├── guards/
│   └── accountant.guard.ts               # Guard de sécurité
└── dto/
    ├── create-client-folder.dto.ts       # DTO création client
    └── filter-documents.dto.ts           # DTO filtres
```

### Endpoints API Disponibles

#### **Gestion des Relations**
| Méthode | Endpoint | Description | Guard |
|---------|----------|-------------|-------|
| POST | `/accountant-portal/clients` | Créer un nouveau dossier client | ✅ Accountant |
| GET | `/accountant-portal/clients` | Liste des dossiers clients | ✅ Accountant |
| POST | `/accountant-portal/accept-invitation/:token` | Accepter une invitation | ✅ Accountant |
| POST | `/company/:id/generate-invitation` | Générer lien invitation (Admin) | 🔓 |

#### **Consultation Documents**
| Méthode | Endpoint | Description | Guard |
|---------|----------|-------------|-------|
| GET | `/accountant-portal/clients/:id/sales` | Journal des ventes | ✅ Accountant |
| GET | `/accountant-portal/clients/:id/purchases` | Journal des achats | ✅ Accountant |
| GET | `/accountant-portal/attachments/:id` | Télécharger pièce jointe | ✅ Accountant |

#### **Export Avancé**
| Méthode | Endpoint | Description | Guard |
|---------|----------|-------------|-------|
| POST | `/accountant-portal/clients/:id/export/excel` | Export Excel complet | ✅ Accountant |
| POST | `/accountant-portal/clients/:id/export/csv` | Export CSV simple | ✅ Accountant |
| POST | `/accountant-portal/clients/:id/export/pdf` | Archive ZIP des PDFs | ✅ Accountant |

### Fonctionnalités Backend

#### **Service d'Export (exceljs)**

##### Export Excel
- **Format** : Plat (1 ligne par document)
- **Colonnes** : N° Document, Type, Dates, Tiers (nom, MF, adresse complète), Montants (HT, TVA, FODEC, Timbre, TTC), Paiement, Notes, Créateur
- **Style** : En-têtes colorés (Indigo), ligne de totaux, formules automatiques, bordures, format monétaire tunisien (3 décimales)
- **Usage** : Import direct dans logiciel comptable

##### Export CSV
- **Format** : Séparateur point-virgule (;)
- **Encodage** : UTF-8 avec BOM (compatible Excel)
- **Colonnes** : Essentielles uniquement

##### Export PDF
- **Format** : Archive ZIP
- **Contenu** : PDFs originaux avec le design du client (conserve logo, template)
- **Nommage** : `{numero_facture}.pdf`

---

## 🎨 FRONTEND (React)

### Pages Créées

#### 1. **RegisterPage** (Modifiée)
- **Chemin** : `/register`
- **Nouveauté** : Sélecteur de type de compte
  - 🏢 **Je suis une Entreprise** (Admin)
  - 💼 **Je suis un Expert Comptable** (Accountant)
- **Design** : Cards avec icônes, validation conditionnelle

#### 2. **LoginPage** (Modifiée)
- **Chemin** : `/login`
- **Nouveauté** : Redirection conditionnelle
  - ADMIN/SUB_ACCOUNT → `/dashboard`
  - ACCOUNTANT → `/portal/accountant`

#### 3. **AccountantPortalPage** (Dashboard Comptable)
- **Chemin** : `/portal/accountant`
- **Features** :
  - 📊 KPIs (Dossiers clients, Clients actifs, Documents, CA total)
  - 🔍 Recherche de clients (nom, MF)
  - ➕ Bouton "Nouveau Client"
  - 🃏 Cards clients cliquables
- **Design** : Gradient Indigo/Purple

#### 4. **ClientDetailPage** (Journaux Comptables)
- **Chemin** : `/portal/accountant/clients/:clientId`
- **Features** :
  - 📑 Tabs : Journal des Ventes / Journal des Achats
  - 📅 **Filtres obligatoires** : Date début, Date fin
  - 📊 Tableau dense avec colonnes : Réf, Date, Tiers, MF, HT, TVA, Timbre, FODEC, TTC, État paiement
  - 📎 Icône trombone pour télécharger pièces jointes
  - 💾 Boutons Export : Excel, CSV, PDF
  - 🧮 Ligne de totaux automatique

#### 5. **NewClientPage** (Création Dossier)
- **Chemin** : `/portal/accountant/new-client`
- **Features** :
  - Formulaire complet (entreprise + contact)
  - Création de compte Admin PENDING
  - Email d'activation automatique (TODO: service email)

---

## 🔐 SÉCURITÉ

### Guards
```typescript
@UseGuards(JwtAuthGuard, AccountantGuard)
```

### Vérifications
1. **AccountantGuard** : Vérifie `user.role === 'ACCOUNTANT'`
2. **verifyAccess()** : Vérifie relation active (`status === 'ACTIVE'`)
3. **Isolation des données** : Chaque comptable ne voit QUE ses dossiers clients

### Confidentialité
- ✅ Comptable accède uniquement aux dossiers liés
- ✅ Pas d'accès aux autres données de l'entreprise (salaires, etc.)
- 🚧 **TODO** : Filtrage chat (montrer seulement ADMIN principal)

---

## 📈 WORKFLOW UTILISATEUR

### Scénario A : Le Client invite le Comptable

1. **Admin du Client** :
   - Va dans Paramètres → "Inviter mon comptable" (TODO: UI)
   - Génère un token d'invitation
   - Envoie le lien au comptable

2. **Expert Comptable** :
   - Clique sur le lien d'invitation
   - Accepte l'invitation
   - Le dossier apparaît dans son portail

### Scénario B : Le Comptable crée le Dossier

1. **Expert Comptable** :
   - Clique sur "Nouveau Client"
   - Remplit le formulaire
   - Soumet

2. **Système** :
   - Crée la company (isActive = false)
   - Crée un compte Admin PENDING
   - Génère mot de passe temporaire
   - Envoie email d'activation

3. **Client** :
   - Reçoit email avec lien + mot de passe
   - Active son compte
   - Le dossier devient ACTIVE

---

## 🎨 DESIGN SYSTEM

### Couleurs Portail Comptable
```css
Primary: Indigo (#6366F1, #4F46E5)
Accent: Purple (#8B5CF6)
Background: Gradient Indigo/Purple/White
Success: Green (#22c55e)
Warning: Yellow (#eab308)
```

### Icons
- 💼 `Briefcase` : Portail comptable
- 🏢 `Building2` : Entreprise / Dossier
- 📊 `TrendingUp` : Journal ventes
- 🛒 `ShoppingCart` : Journal achats
- 📎 `Paperclip` : Pièce jointe
- 📥 `Download` : Export

---

## ✅ FAIT | 🚧 À FAIRE

### ✅ FAIT (90%)
- [x] Schema Prisma (AccountantClientRelation, DocumentAttachment, Role ACCOUNTANT)
- [x] Backend Module complet
- [x] Service d'export Excel/CSV/PDF
- [x] Endpoints REST sécurisés
- [x] Page RegisterPage avec sélecteur
- [x] Page LoginPage avec redirect
- [x] AccountantPortalPage (Dashboard)
- [x] ClientDetailPage (Journaux)
- [x] NewClientPage (Création dossier)
- [x] Routes configurées
- [x] Guards de sécurité

### 🚧 À FAIRE (10%)
- [ ] **Email Service** : Templates d'invitation + activation
- [ ] **UI Invitation Admin** : Bouton "Inviter comptable" dans Settings
- [ ] **Page Accept Invitation** : `/accountant/accept-invitation/:token`
- [ ] **Chat Filtré** : Backend + Frontend filtering
- [ ] **Tests E2E** : Créer compte comptable, créer dossier, consulter journaux, export
- [ ] **Pagination** : Si > 100 documents dans journaux
- [ ] **Upload Attachments** : Feature pour joindre scans aux documents

---

## 🚀 COMMANDES DE DÉPLOIEMENT

```bash
# 1. Arrêter les serveurs
Ctrl+C dans les terminaux

# 2. Backend - Générer Prisma Client
cd apps/api
npx prisma generate
npm run build

# 3. Redémarrer backend
npm run start:dev

# 4. Frontend (nouveau terminal)
cd apps/web
npm run dev
```

---

## 📝 NOTES IMPORTANTES

### Dépendances à installer
```bash
# Backend
npm install exceljs archiver
npm install --save-dev @types/archiver

# Frontend (déjà installées)
# react-router-dom, lucide-react, axios
```

### Variables d'environnement
```env
# apps/api/.env
FRONTEND_URL=http://localhost:3000
```

### Prisma Migration
```bash
cd apps/api
npx prisma migrate dev --name add_accountant_module
```

---

## 🎯 PROCHAINES ÉTAPES

1. **Tester la création d'un compte comptable**
   - S'inscrire avec type "Expert Comptable"
   - Se connecter → doit rediriger vers `/portal/accountant`

2. **Créer un dossier client**
   - Cliquer "Nouveau Client"
   - Remplir le formulaire
   - Vérifier que le compte Admin est créé

3. **Consulter les journaux**
   - Sélectionner un client
   - Appliquer filtres de date
   - Vérifier le tableau de données

4. **Tester les exports**
   - Excel : vérifier toutes les colonnes et totaux
   - CSV : ouvrir dans Excel
   - PDF : extraire le ZIP

5. **Implémenter les TODOs**
   - Service Email
   - UI Invitation
   - Chat filtré

---

## 📞 SUPPORT

Pour toute question technique, référez-vous à :
- Plan d'implémentation : `.agent/workflows/accountant-portal-implementation.md`
- Documentation Prisma : https://www.prisma.io/docs
- Documentation ExcelJS : https://github.com/exceljs/exceljs

---

**Version** : 1.0.0  
**Dernière mise à jour** : 2026-01-23  
**Statut** : ✅ Prêt pour tests
