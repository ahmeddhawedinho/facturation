# 🚨 CORRECTION ERREUR "colonne does not exist"

## ⚡ SOLUTION RAPIDE

**ÉTAPE 1️⃣ : ARRÊTER LES SERVEURS**

Appuyez sur **Ctrl+C** dans TOUS les terminaux qui exécutent :
- Backend (npm run start:dev)
- Frontend (npm run dev)

---

**ÉTAPE 2️⃣ : EXÉCUTER LE SCRIPT DE MIGRATION**

```powershell
.\migrate-accountant.ps1
```

**OU manuellement :**

```powershell
cd apps\api
npx prisma migrate dev --name add_accountant_access_code
npx prisma generate
cd ..\..
```

---

**ÉTAPE 3️⃣ : REDÉMARRER LES SERVEURS**

```powershell
.\start-servers.ps1
```

**OU manuellement :**

```powershell
# Terminal 1 - Backend
cd apps\api
npm run start:dev

# Terminal 2 - Frontend  
cd apps\web
npm run dev
```

---

## 🎯 CE QUE FAIT LA MIGRATION

1. ✅ Ajoute la colonne `accountantAccessCode` dans la table `Company`
2. ✅ Crée l'index UNIQUE sur cette colonne
3. ✅ Régénère le Prisma Client avec les nouveaux types
4. ✅ Synchronise le schéma avec la base de données

---

## ✅ VÉRIFICATION

Après la migration, vous devriez voir :

```
✔ Generated Prisma Client
✔ Database synchronized with schema
```

Et l'inscription fonctionnera ! 🎉

---

## 🐛 EN CAS D'ERREUR

### Erreur : "Another migration is already running"
```powershell
# Tuer tous les processus node
taskkill /F /IM node.exe
```

### Erreur : "Can't reach database server"
```powershell
# Vérifier que PostgreSQL tourne
# Vérifier le fichier .env dans apps/api
```

### Erreur : "P3005: The database schema is not empty"
```powershell
# Marquer comme appliquée :
cd apps\api
npx prisma migrate resolve --applied add_accountant_access_code
cd ..\..
```

---

## 📄 FICHIERS MODIFIÉS

- ✅ `apps/api/prisma/schema.prisma` - Schéma mis à jour
- ✅ `apps/api/prisma/migrations/XXX_add_accountant_access_code/` - Migration créée
- ✅ `apps/api/node_modules/.prisma/client/` - Client régénéré

---

**Temps estimé : 30 secondes ⏱️**
