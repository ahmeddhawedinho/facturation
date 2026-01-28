# Configuration des Variables d'Environnement

## Backend (apps/api/.env)

Créez un fichier `.env` dans le dossier `apps/api/` avec le contenu suivant :

```env
# Base de données PostgreSQL
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/facturation_tn?schema=public"

# JWT Configuration
JWT_SECRET="votre-secret-jwt-tres-securise-changez-moi"
JWT_EXPIRATION="7d"

# Application
PORT=3001
NODE_ENV=development

# Exchange Rate API (optionnel)
EXCHANGE_RATE_API_KEY=""
```

## Variables détaillées

### DATABASE_URL
URL de connexion PostgreSQL au format :
```
postgresql://[user]:[password]@[host]:[port]/[database]?schema=public
```

**Exemple pour production :**
```
postgresql://prod_user:secure_password@db.example.com:5432/facturation_prod?schema=public
```

### JWT_SECRET
Clé secrète pour signer les tokens JWT. 
**⚠️ IMPORTANT : Changez cette valeur en production !**

Générer une clé sécurisée :
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### JWT_EXPIRATION
Durée de validité des tokens JWT.
- Format : `7d` (7 jours), `24h` (24 heures), `60m` (60 minutes)
- Recommandé : `7d` pour développement, `1h` pour production

### PORT
Port sur lequel l'API écoute (par défaut : 3001)

### NODE_ENV
Environnement d'exécution :
- `development` - Mode développement
- `production` - Mode production
- `test` - Mode test

## Frontend

Le frontend n'a pas besoin de fichier .env car il utilise un proxy Vite configuré dans `vite.config.ts` pour rediriger les appels API vers `http://localhost:3001`.

## Sécurité

**⚠️ Ne jamais committer le fichier .env dans Git !**

Le fichier `.env` est déjà dans `.gitignore` pour éviter de partager des informations sensibles.

Pour la production :
1. Utilisez des variables d'environnement système
2. Ou un service de gestion de secrets (AWS Secrets Manager, Azure Key Vault, etc.)
3. Changez toutes les valeurs par défaut
4. Utilisez des mots de passe forts
