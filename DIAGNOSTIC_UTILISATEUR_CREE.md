# 🔍 Diagnostic - Utilisateur Créé mais "Sender not found"

## ❌ Problème

Vous avez créé un utilisateur via l'interface de gestion d'équipe (email: `bb@mail.com`), mais quand cet utilisateur se connecte et essaie d'envoyer un message, l'erreur apparaît :

**`Sender not found: f1954998-0ca6-475c-b96e-91965d9bc180`**

---

## 🔍 Causes Possibles

### 1. L'Utilisateur N'a Pas Été Créé Correctement
- La création a échoué silencieusement
- Une erreur Prisma non capturée
- Un problème de transaction de base de données

### 2. L'Utilisateur a Été Créé puis Supprimé
- Suppression accidentelle
- Problème de synchronisation

### 3. Problème de Token JWT
- Le token contient un ID différent de celui en base
- Le token est corrompu

---

## 🧪 Diagnostic Étape par Étape

### Étape 1: Vérifier les Logs du Serveur API

**Lors de la création de l'utilisateur**, vous devriez voir dans les logs du serveur API :

```
═══════════════════════════════════════════════════
📝 CRÉATION D'UTILISATEUR - DÉBUT
═══════════════════════════════════════════════════
📋 Données reçues: { email: 'bb@mail.com', ... }
🔍 Vérification de l'email existant...
✅ Email disponible
🧹 CustomRoleId nettoyé: undefined
💾 Appel à Prisma.user.create...
═══════════════════════════════════════════════════
✅ UTILISATEUR CRÉÉ AVEC SUCCÈS
═══════════════════════════════════════════════════
👤 ID: f1954998-0ca6-475c-b96e-91965d9bc180
📧 Email: bb@mail.com
👨 Nom: ...
🏢 CompanyId: ...
🔑 Role: SUB_ACCOUNT
✅ isActive: true
═══════════════════════════════════════════════════
```

**Si vous ne voyez PAS ces logs**, l'utilisateur n'a pas été créé !

### Étape 2: Vérifier dans la Base de Données

```powershell
cd apps/api
npx prisma studio
```

Dans Prisma Studio:
1. Cliquez sur **User**
2. Cherchez l'email `bb@mail.com`
3. Vérifiez:
   - ✅ L'utilisateur existe
   - ✅ `id` = `f1954998-0ca6-475c-b96e-91965d9bc180`
   - ✅ `isActive` = `true`
   - ✅ `companyId` est défini

**Si l'utilisateur n'existe PAS**, il n'a jamais été créé !

### Étape 3: Vérifier le Token JWT

Après connexion avec `bb@mail.com`:

1. Ouvrez la console du navigateur (F12)
2. Tapez:
```javascript
const authData = JSON.parse(localStorage.getItem('auth-storage'))
console.log('User ID:', authData.state.user.id)
console.log('Token:', authData.state.token)
```

3. Allez sur https://jwt.io
4. Collez le token
5. Vérifiez que `sub` = `f1954998-0ca6-475c-b96e-91965d9bc180`

**Si le `sub` est différent**, il y a un problème avec le token !

---

## ✅ Solutions

### Solution 1: Recréer l'Utilisateur

1. **Supprimez l'utilisateur existant** (si présent):
   - Dans Prisma Studio, trouvez `bb@mail.com`
   - Cliquez sur l'utilisateur
   - Cliquez sur "Delete 1 record"

2. **Recréez l'utilisateur** via l'interface de gestion d'équipe:
   - Allez dans "Gestion d'équipe"
   - Cliquez sur "Ajouter un utilisateur"
   - Remplissez les informations
   - Cliquez sur "Enregistrer"

3. **Vérifiez les logs** du serveur API pour confirmer la création

4. **Connectez-vous** avec le nouveau compte

### Solution 2: Vérifier que l'Utilisateur Existe

Si l'utilisateur existe dans la base de données mais l'erreur persiste:

1. **Déconnectez-vous**
2. **Effacez le localStorage**:
```javascript
localStorage.clear()
```
3. **Rechargez la page** (Ctrl + F5)
4. **Reconnectez-vous** avec `bb@mail.com`

### Solution 3: Créer Manuellement dans Prisma Studio

Si la création via l'interface échoue:

1. Ouvrez Prisma Studio:
```powershell
cd apps/api
npx prisma studio
```

2. Cliquez sur **User**
3. Cliquez sur "Add record"
4. Remplissez:
   - `email`: `bb@mail.com`
   - `password`: (hashé avec bcrypt - utilisez un outil en ligne)
   - `firstName`: `BB`
   - `lastName`: `Test`
   - `role`: `SUB_ACCOUNT`
   - `companyId`: (copiez depuis votre compte admin)
   - `isActive`: `true`
5. Cliquez sur "Save 1 change"

---

## 🧪 Test Complet

### 1. Redémarrer les Serveurs

```powershell
.\restart-servers.ps1
```

### 2. Créer un Nouvel Utilisateur

1. Connectez-vous avec `aa@mail.com` (admin)
2. Allez dans "Gestion d'équipe"
3. Cliquez sur "Ajouter un utilisateur"
4. Remplissez:
   - Email: `test@mail.com`
   - Prénom: `Test`
   - Nom: `User`
   - Mot de passe: `test123`
5. Cliquez sur "Enregistrer"

### 3. Vérifier les Logs

Dans la fenêtre PowerShell du serveur API, vous devriez voir:

```
═══════════════════════════════════════════════════
✅ UTILISATEUR CRÉÉ AVEC SUCCÈS
═══════════════════════════════════════════════════
👤 ID: <NOUVEL_ID>
📧 Email: test@mail.com
...
```

**Notez le `ID`** affiché !

### 4. Se Connecter avec le Nouveau Compte

1. Déconnectez-vous
2. Connectez-vous avec:
   - Email: `test@mail.com`
   - Password: `test123`

### 5. Vérifier le Token

Dans la console (F12):
```javascript
const authData = JSON.parse(localStorage.getItem('auth-storage'))
console.log('User ID:', authData.state.user.id)
```

**L'ID doit correspondre** à celui affiché dans les logs !

### 6. Envoyer un Message

1. Allez dans "Messagerie"
2. Cliquez sur "#GENERAL"
3. Tapez: `Test 123`
4. Appuyez sur Entrée

**Le message devrait s'envoyer sans erreur !**

---

## 📊 Logs à Surveiller

### Lors de la Création

```
═══════════════════════════════════════════════════
📝 CRÉATION D'UTILISATEUR - DÉBUT
═══════════════════════════════════════════════════
...
✅ UTILISATEUR CRÉÉ AVEC SUCCÈS
═══════════════════════════════════════════════════
```

### Lors de la Connexion Socket.IO

```
🔌 New socket connection attempt
🔑 JWT payload: { sub: '<ID>', companyId: '<companyId>' }
👤 User connecting: { userId: '<ID>', companyId: '<companyId>' }
✅ Client connected successfully
```

### Lors de l'Envoi de Message

```
📨 Received sendMessage event
💬 saveMessage called with: { senderId: '<ID>', ... }
🔍 Checking if sender exists: <ID>
👤 Sender found: { id: '<ID>', ... }
✅ Message saved
✅ Message broadcasted successfully
```

---

## 🆘 Si le Problème Persiste

1. **Collectez les logs complets** du serveur API
2. **Vérifiez dans Prisma Studio** que l'utilisateur existe
3. **Comparez les IDs**:
   - ID dans les logs de création
   - ID dans Prisma Studio
   - ID dans le token JWT
   - ID dans l'erreur "Sender not found"

**Ils doivent TOUS être identiques !**

---

**Dernière mise à jour**: 2026-01-28 03:23  
**Version**: 1.0
