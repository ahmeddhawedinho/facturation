# 🔍 Diagnostic - Erreur "Sender not found"

## ❌ Problème
Vous recevez l'erreur : **"Erreur de messagerie: Sender not found"**

## 🎯 Cause
L'utilisateur qui essaie d'envoyer le message n'existe pas dans la base de données, ou son compte a un problème.

---

## 🔍 Étapes de Diagnostic

### Étape 1: Vérifier les Logs du Serveur API

1. Regardez la fenêtre PowerShell du **serveur API**
2. Cherchez ces logs lors de la connexion Socket.IO:

```
🔌 New socket connection attempt: <socketId>
🔑 JWT payload: { sub: '<userId>', companyId: '<companyId>' }
👤 User connecting: { userId: '<userId>', companyId: '<companyId>' }
📢 User has access to X channels
✅ Client connected successfully: <userId> (<companyId>)
```

3. Lors de l'envoi d'un message, cherchez:

```
📨 Received sendMessage event from client: <socketId>
📦 Payload: { content: '...', ... }
👤 User data from socket: { id: '<userId>', companyId: '<companyId>' }
💾 Calling saveMessage with: { companyId: '<companyId>', userId: '<userId>' }
💬 saveMessage called with: { companyId: '<companyId>', senderId: '<userId>', payload: {...} }
🔍 Checking if sender exists: <userId>
👤 Sender found: { id: '...', firstName: '...', ... }
```

4. **Si vous voyez** `❌ Sender not found in database: <userId>`, c'est le problème!

---

### Étape 2: Vérifier l'Utilisateur dans la Base de Données

#### Option A: Utiliser Prisma Studio (Recommandé)

```powershell
.\check-users.ps1
```

Ou manuellement:
```powershell
cd apps/api
npx prisma studio
```

Dans Prisma Studio:
1. Cliquez sur **User** dans la sidebar
2. Cherchez votre utilisateur (email: `admin@techsolutions.tn`)
3. Vérifiez:
   - ✅ L'utilisateur existe
   - ✅ `isActive` = `true`
   - ✅ `id` correspond à celui dans les logs
   - ✅ `companyId` est défini

#### Option B: Utiliser la Console du Navigateur

1. Ouvrez la console (F12)
2. Tapez:
```javascript
// Voir les infos de l'utilisateur connecté
console.log(JSON.parse(localStorage.getItem('auth-storage')))
```

3. Notez le `userId` et `companyId`

---

### Étape 3: Vérifier le Token JWT

1. Dans la console du navigateur (F12):
```javascript
// Récupérer le token
const authData = JSON.parse(localStorage.getItem('auth-storage'))
console.log('Token:', authData.state.token)
console.log('User:', authData.state.user)
```

2. Allez sur https://jwt.io
3. Collez le token
4. Vérifiez que le `sub` (userId) correspond à un utilisateur existant

---

## 🛠️ Solutions

### Solution 1: L'Utilisateur N'Existe Pas

**Si l'utilisateur n'existe pas dans la base de données:**

1. Déconnectez-vous de l'application
2. Reconnectez-vous avec un compte valide:
   - Email: `admin@techsolutions.tn`
   - Password: `admin123`

### Solution 2: L'Utilisateur Est Désactivé (`isActive = false`)

**Dans Prisma Studio:**
1. Cliquez sur **User**
2. Trouvez votre utilisateur
3. Cliquez sur l'utilisateur
4. Changez `isActive` à `true`
5. Cliquez sur **Save 1 change**

### Solution 3: Le Token Est Expiré ou Invalide

1. Déconnectez-vous:
   - Cliquez sur votre profil
   - Cliquez sur "Déconnexion"

2. Ou effacez le localStorage:
```javascript
localStorage.clear()
location.reload()
```

3. Reconnectez-vous

### Solution 4: CompanyId Mismatch

**Si les logs montrent**: `❌ Sender companyId mismatch`

Cela signifie que le `companyId` dans le token ne correspond pas au `companyId` de l'utilisateur.

**Solution**:
1. Déconnectez-vous
2. Reconnectez-vous
3. Si le problème persiste, vérifiez dans Prisma Studio que le `companyId` de l'utilisateur est correct

---

## 🧪 Test Après Correction

### 1. Redémarrer les Serveurs
```powershell
.\restart-servers.ps1
```

### 2. Se Reconnecter
1. Allez sur http://localhost:5173
2. Connectez-vous
3. Allez dans Messagerie

### 3. Vérifier les Logs
Dans la fenêtre PowerShell du serveur API, vous devriez voir:
```
✅ Client connected successfully: <userId> (<companyId>)
```

### 4. Envoyer un Message de Test
1. Cliquez sur #GENERAL
2. Tapez: `Test 123`
3. Appuyez sur Entrée

Dans les logs du serveur API, vous devriez voir:
```
📨 Received sendMessage event from client: <socketId>
💬 saveMessage called with: {...}
🔍 Checking if sender exists: <userId>
👤 Sender found: { id: '...', firstName: '...', ... }
✅ Message saved: <messageId>
📢 Broadcasting to company_<companyId> (channel: GENERAL)
✅ Message broadcasted successfully
```

---

## 📊 Logs Détaillés Activés

Avec les dernières modifications, vous avez maintenant des logs très détaillés:

### Logs de Connexion Socket.IO
- 🔌 Tentative de connexion
- 🔑 Payload JWT décodé
- 👤 Informations utilisateur
- 📢 Canaux accessibles
- ✅ Connexion réussie

### Logs d'Envoi de Message
- 📨 Réception de l'événement
- 📦 Payload du message
- 👤 Données utilisateur du socket
- 💾 Appel à saveMessage
- 💬 Détails de saveMessage
- 🔍 Vérification du sender
- 👤 Sender trouvé (avec détails)
- ✅ Message sauvegardé
- 📢 Diffusion du message
- ✅ Diffusion réussie

---

## 🆘 Si le Problème Persiste

### 1. Collecter les Informations

**Logs du Serveur API** (fenêtre PowerShell):
- Copiez tous les logs depuis la connexion jusqu'à l'erreur

**Console du Navigateur** (F12):
```javascript
// Informations utilisateur
const authData = JSON.parse(localStorage.getItem('auth-storage'))
console.log('User ID:', authData.state.user.id)
console.log('Company ID:', authData.state.user.companyId)
console.log('Email:', authData.state.user.email)
console.log('Is Active:', authData.state.user.isActive)
```

**Prisma Studio**:
- Prenez une capture d'écran de la table User
- Notez le nombre d'utilisateurs actifs

### 2. Vérifier la Cohérence

Comparez:
- Le `userId` dans le token JWT
- Le `userId` dans les logs du serveur
- Le `id` dans la table User de Prisma Studio

**Ils doivent tous être identiques!**

### 3. Réinitialiser (Dernier Recours)

Si rien ne fonctionne:

```powershell
# Arrêter les serveurs
Get-Process node | Stop-Process -Force

# Effacer le cache du navigateur
# Ctrl + Shift + Delete

# Redémarrer
.\restart-servers.ps1
```

Puis:
1. Effacez le localStorage: `localStorage.clear()`
2. Rechargez la page: `location.reload()`
3. Reconnectez-vous

---

## 📝 Checklist de Vérification

- [ ] Les logs du serveur API montrent la connexion Socket.IO réussie
- [ ] Le `userId` dans les logs correspond à un utilisateur dans la base
- [ ] L'utilisateur a `isActive = true`
- [ ] Le `companyId` correspond
- [ ] Le token JWT est valide (vérifiable sur jwt.io)
- [ ] Prisma Studio montre l'utilisateur
- [ ] Les logs montrent "👤 Sender found: {...}"

---

**Dernière mise à jour**: 2026-01-28 03:13  
**Version**: 1.0
