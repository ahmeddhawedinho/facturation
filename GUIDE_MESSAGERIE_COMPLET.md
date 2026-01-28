# 🎯 Guide Complet - Résolution Problème Messagerie

## ✅ Résumé des Corrections Appliquées

### 1. **Configuration Socket.IO** (`apps/api/src/chat/chat.gateway.ts`)
- ✅ CORS configuré avec origines spécifiques
- ✅ Support WebSocket + Polling
- ✅ Credentials activés

### 2. **Gestion des Erreurs Client** (`apps/web/src/pages/ChatPage.tsx`)
- ✅ Détection bloqueurs de publicités
- ✅ Reconnexion automatique (5 tentatives)
- ✅ Indicateur visuel (point vert/rouge)
- ✅ Validation avant envoi de message
- ✅ Messages d'erreur clairs

### 3. **Validation Serveur** (`apps/api/src/chat/chat.service.ts`)
- ✅ Vérification existence sender
- ✅ Vérification existence receiver
- ✅ Vérification existence channel
- ✅ Construction dynamique de l'objet data
- ✅ Pas de valeurs null pour les FK

---

## 🚀 Comment Tester Maintenant

### Étape 1: Redémarrer les Serveurs
```powershell
.\restart-servers.ps1
```

**Attendez que vous voyiez**:
- ✅ `LOGIN SUCCESS!`
- ✅ `Tout fonctionne! Allez sur http://localhost:5173`

### Étape 2: Ouvrir l'Application
1. Ouvrez votre navigateur
2. Allez sur **http://localhost:5173**
3. **Désactivez votre bloqueur de publicités** pour ce site
4. Connectez-vous:
   - Email: `admin@techsolutions.tn`
   - Password: `admin123`

### Étape 3: Vérifier la Connexion Socket.IO
1. Allez dans **Messagerie** (menu de gauche)
2. Regardez à côté du titre "MESSAGERIE":
   - **🟢 Point vert pulsant** = ✅ Connecté
   - **🔴 Point rouge** = ❌ Déconnecté

3. Ouvrez la **Console du navigateur** (F12):
   - Cherchez: `✅ Chat Connected`
   - Si vous voyez ça, c'est bon!

### Étape 4: Envoyer un Message de Test

#### Test 1: Canal Public (#GENERAL)
1. Cliquez sur **#GENERAL** dans la sidebar
2. Tapez: `Test message 1`
3. Appuyez sur Entrée
4. **Résultat attendu**: Le message apparaît immédiatement

#### Test 2: Message Direct
1. Cliquez sur un utilisateur dans la liste "MESSAGES PRIVÉS"
2. Tapez: `Bonjour!`
3. Appuyez sur Entrée
4. **Résultat attendu**: Le message apparaît immédiatement

#### Test 3: Canal Privé (si vous en avez créé)
1. Cliquez sur un canal privé dans "Canaux Privés"
2. Tapez un message
3. Appuyez sur Entrée
4. **Résultat attendu**: Le message apparaît immédiatement

---

## 🔍 Diagnostic des Problèmes

### Problème 1: Point Rouge (Déconnecté)

**Symptômes**:
- Point rouge à côté de "MESSAGERIE"
- Console affiche: `❌ Socket connection error`
- Erreur: `ERR_BLOCKED_BY_CLIENT`

**Solutions**:
1. **Désactivez votre bloqueur de publicités**
   - AdBlock, uBlock Origin, Privacy Badger, etc.
   - Ajoutez `localhost:5173` et `localhost:3001` à la liste blanche

2. **Essayez un autre navigateur**
   - Chrome en mode navigation privée
   - Firefox
   - Edge

3. **Vérifiez que le serveur API est démarré**
   ```powershell
   Get-Process node
   ```

### Problème 2: Erreur "Foreign key constraint violated"

**Symptômes**:
- Message ne s'envoie pas
- Console affiche: `Foreign key constraint violated`
- Erreur dans les logs du serveur API

**Causes Possibles**:
1. Le canal privé n'existe plus (supprimé)
2. L'utilisateur destinataire n'existe plus
3. Données corrompues dans la base

**Solutions**:

#### Solution A: Vérifier la Base de Données
```powershell
# Ouvrir Prisma Studio
cd apps/api
npx prisma studio
```

Dans Prisma Studio:
1. Allez dans **ChatChannel**
2. Vérifiez que les canaux existent
3. Notez les IDs des canaux

#### Solution B: Nettoyer les Données Orphelines
```powershell
# Exécuter le script SQL de diagnostic
# Ouvrez pgAdmin et exécutez: check-messagerie-db.sql
```

#### Solution C: Rafraîchir la Page
1. Appuyez sur **Ctrl + F5** (rafraîchissement complet)
2. Reconnectez-vous
3. Réessayez d'envoyer un message

### Problème 3: Messages Envoyés mais Non Affichés

**Diagnostic**:
1. Ouvrez la console (F12)
2. Cherchez: `📨 New message received`
3. Si vous voyez ça mais pas le message = Problème d'affichage
4. Si vous ne voyez pas ça = Problème Socket.IO

**Solutions**:
1. Vérifiez que le point est **vert**
2. Rafraîchissez la page (Ctrl + F5)
3. Vérifiez les logs du serveur API

### Problème 4: Erreur "Aucune destination sélectionnée"

**Cause**: Vous essayez d'envoyer un message sans avoir sélectionné de canal ou d'utilisateur

**Solution**:
1. Cliquez sur **#GENERAL** ou **#ANNONCES**
2. OU cliquez sur un utilisateur dans "MESSAGES PRIVÉS"
3. OU cliquez sur un canal dans "Canaux Privés"
4. Puis tapez votre message

---

## 📊 Logs à Surveiller

### Console Navigateur (F12)
```
✅ Chat Connected              → Connexion réussie
📤 Sending message: {...}      → Message en cours d'envoi
📨 New message received        → Message reçu
❌ Socket connection error     → Erreur de connexion
🔌 Closing socket connection   → Déconnexion normale
```

### Console Serveur API
```
Client connected: <userId> (<companyId>)  → Utilisateur connecté
Sender not found: <senderId>              → Erreur: expéditeur introuvable
Receiver not found: <receiverId>          → Erreur: destinataire introuvable
Channel not found: <channelId>            → Erreur: canal introuvable
Handle Message Error                      → Erreur générale d'envoi
```

---

## 🛠️ Scripts Disponibles

### `restart-servers.ps1`
Redémarre les serveurs API et Web avec des messages colorés

```powershell
.\restart-servers.ps1
```

### `test-messagerie.ps1`
Teste que les serveurs sont accessibles et que les endpoints fonctionnent

```powershell
.\test-messagerie.ps1
```

### `check-db.ps1`
Vérifie l'état de la base de données (utilisateurs, canaux, messages)

```powershell
.\check-db.ps1
```

### `check-messagerie-db.sql`
Script SQL complet pour diagnostiquer la base de données

```sql
-- Exécutez dans pgAdmin ou votre client PostgreSQL
```

---

## 📝 Checklist Complète

Avant de signaler un problème, vérifiez:

- [ ] Les deux serveurs sont démarrés (API + Web)
- [ ] Le point à côté de "MESSAGERIE" est **vert**
- [ ] La console affiche `✅ Chat Connected`
- [ ] Aucune erreur `ERR_BLOCKED_BY_CLIENT` dans la console
- [ ] Le bloqueur de publicités est **désactivé**
- [ ] Vous avez sélectionné un canal ou un utilisateur
- [ ] Vous avez tapé un message (pas vide)
- [ ] Le serveur API ne montre pas d'erreurs
- [ ] La base de données contient des utilisateurs actifs
- [ ] Vous avez rafraîchi la page (Ctrl + F5)

---

## 🔧 Commandes de Dépannage

### Vérifier les Processus Node
```powershell
Get-Process node
```

### Arrêter Tous les Processus Node
```powershell
Get-Process node | Stop-Process -Force
```

### Vérifier les Ports Utilisés
```powershell
netstat -ano | findstr :3001
netstat -ano | findstr :5173
```

### Tester l'API Manuellement
```powershell
# Test login
$body = '{"email":"admin@techsolutions.tn","password":"admin123"}' | ConvertTo-Json
Invoke-WebRequest -Uri 'http://localhost:3001/auth/login' -Method Post -ContentType 'application/json' -Body $body

# Test chat users (remplacez TOKEN par votre token)
$headers = @{ "Authorization" = "Bearer TOKEN" }
Invoke-WebRequest -Uri 'http://localhost:3001/chat/users' -Headers $headers
```

### Ouvrir Prisma Studio
```powershell
cd apps/api
npx prisma studio
```

### Vérifier le Statut des Migrations
```powershell
cd apps/api
npx prisma migrate status
```

---

## 🆘 Si Rien Ne Fonctionne

### 1. Redémarrage Complet
```powershell
# Arrêter tous les processus
Get-Process node | Stop-Process -Force

# Attendre 5 secondes
Start-Sleep -Seconds 5

# Redémarrer
.\restart-servers.ps1
```

### 2. Vider le Cache du Navigateur
1. Appuyez sur **Ctrl + Shift + Delete**
2. Cochez "Cached images and files"
3. Cliquez sur "Clear data"
4. Redémarrez le navigateur

### 3. Vérifier la Base de Données
```powershell
# Ouvrir Prisma Studio
cd apps/api
npx prisma studio

# Vérifier:
# - Qu'il y a des utilisateurs dans User
# - Que isActive = true
# - Que companyId est correct
```

### 4. Réinitialiser la Base de Données (ATTENTION: Perte de données!)
```powershell
cd apps/api
npx prisma migrate reset
npx prisma db seed  # Si vous avez un seed
```

---

## 📞 Informations de Débogage à Collecter

Si vous devez demander de l'aide, collectez:

1. **Capture d'écran de la console (F12)**
2. **Logs du serveur API** (fenêtre PowerShell)
3. **Logs du serveur Web** (fenêtre PowerShell)
4. **Résultat de `.\test-messagerie.ps1`**
5. **Résultat de `Get-Process node`**
6. **Version du navigateur**
7. **Extensions de navigateur installées**

---

## 📚 Documentation Complémentaire

- `MESSAGERIE_RESOLUTION.md` - Rapport complet des corrections
- `MESSAGERIE_DIAGNOSTIC.md` - Guide de diagnostic détaillé
- `check-messagerie-db.sql` - Script SQL de diagnostic

---

**Dernière mise à jour**: 2026-01-28 03:06  
**Version**: 3.0  
**Statut**: ✅ TOUTES LES CORRECTIONS APPLIQUÉES
