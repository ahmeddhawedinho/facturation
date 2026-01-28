# 🚀 BusinessOS TN - Premium SaaS Edition

BusinessOS TN est une plateforme logicielle de pointe conçue spécifiquement pour le marché tunisien. Alliant une esthétique premium à une fonctionnalité robuste, elle simplifie la gestion commerciale de A à Z.

## ✨ Caractéristiques Premium
- **Design de pointe** : Interface moderne avec mode sombre, glassmorphisme et animations fluides.
- **Gestion Fiscale Tunisienne** : Automatisation de la TVA, Fodec, Timbre Fiscal et Retenue à la source.
- **Optimisation Tactile** : Expérience utilisateur fluide sur tous les appareils.
- **Performance Accrue** : Système de recherche instantanée débouclée (debounced) pour une rapidité extrême.

---

## 🛠️ Démarrage Rapide

### 1. Prérequis
- **Node.js 18+**
- **PostgreSQL** ou **SQLite** (configuré via Prisma)
- **PowerShell** (pour les scripts automatisés sous Windows)

### 2. Installation & Lancement
```powershell
# Installation des dépendances
npm install

# Configuration de la base de données (Prisma)
cd apps/api
npx prisma db push
npx prisma db seed

# Lancement automatisé (Frontend + Backend)
cd ../..
./start-servers.ps1
```

### 3. Accès Authentifié
- **URL** : `http://localhost:5173`
- **Admin** : `admin@techsolutions.tn` / `admin123`

---

## 🏗️ Architecture du Projet

### `apps/web` (Frontend - React + Tailwind)
- **Premium Pages** : `CreateDocumentPage`, `ProductsPage`, `SalariesPage`, `ClientsPage`.
- **UI System** : Composants réutilisables, thèmes dynamiques (Light, Dark, Blue).

### `apps/api` (Backend - NestJS + Prisma)
- **Modules** : Sales, Purchase, Inventory, Salaries, Auth.
- **Database** : Modèle de données hautement relationnel et optimisé.

---

## 🧰 Maintenance & Administration

### Réinitialisation Totale (Nettoyage)
Si vous souhaitez repartir d'une base de données propre :
```powershell
cd apps/api
npx prisma migrate reset --force
```

### Optimisation des Assets
Le projet utilise des icônes **Lucide-React** et des polices **Google Fonts (Inter & Outfit)** pour un rendu premium.

---

**Version**: 2.0.0-Premium | **Auteur**: TechSolutions TN | **2026**
