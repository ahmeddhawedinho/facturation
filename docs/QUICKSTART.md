# Guide de Démarrage Rapide

## Installation en 5 minutes

### 1. Prérequis
- Node.js 18+ installé
- PostgreSQL 14+ installé et démarré
- Terminal/PowerShell

### 2. Installation

```bash
# 1. Naviguer dans le projet
cd C:\Users\ahmed\OneDrive\Bureau\projet

# 2. Installer les dépendances
npm install
cd apps/api && npm install
cd ../web && npm install
cd ../..

# 3. Créer la base de données PostgreSQL
# Ouvrir psql ou pgAdmin et exécuter :
CREATE DATABASE facturation_tn;

# 4. Configurer l'environnement
# Créer le fichier apps/api/.env avec :
DATABASE_URL="postgresql://postgres:VOTRE_MOT_DE_PASSE@localhost:5432/facturation_tn?schema=public"
JWT_SECRET="changez-moi-par-une-valeur-securisee"
JWT_EXPIRATION="7d"
PORT=3001
NODE_ENV=development

# 5. Initialiser la base de données
cd apps/api
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
cd ../..

# 6. Lancer l'application
npm run dev
```

### 3. Accès

- **Frontend** : http://localhost:5173
- **Backend API** : http://localhost:3001

### 4. Connexion

Utilisez un des comptes de démonstration :

**Admin Entreprise** (recommandé pour commencer)
- Email : `admin@techsolutions.tn`
- Mot de passe : `admin123`

**Super Admin**
- Email : `admin@facturation-tn.com`
- Mot de passe : `admin123`

## Résolution des problèmes courants

### Erreur de connexion PostgreSQL
```bash
# Vérifier que PostgreSQL est démarré
# Windows : Services > PostgreSQL
# Vérifier le mot de passe dans DATABASE_URL
```

### Port déjà utilisé
```bash
# Changer le port dans apps/api/.env
PORT=3002

# Et dans apps/web/vite.config.ts
target: 'http://localhost:3002'
```

### Erreur Prisma
```bash
cd apps/api
npx prisma generate
npx prisma migrate reset  # Réinitialise tout
```

## Prochaines étapes

1. **Explorer l'interface** : Naviguez dans le dashboard
2. **Créer un client** : Allez dans Clients > Nouveau client
3. **Créer une facture** : Documents > Nouveau document
4. **Télécharger le PDF** : Cliquez sur l'icône de téléchargement

## Support

Consultez le README.md principal pour plus de détails.
