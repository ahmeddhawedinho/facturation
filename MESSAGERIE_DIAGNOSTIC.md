# 🔧 Guide de Diagnostic - Problème de Messagerie Socket.IO

## 🎯 Problème Identifié

Les messages ne s'envoient pas et ne s'affichent pas dans la discussion. Les erreurs dans la console indiquent :
- `net::ERR_BLOCKED_BY_CLIENT` - Requêtes Socket.IO bloquées
- Erreurs de connexion Socket.IO répétées

## ✅ Solutions Appliquées

### 1. Configuration CORS Améliorée (Backend)
**Fichier**: `apps/api/src/chat/chat.gateway.ts`

- ✅ Configuration CORS spécifique pour Socket.IO
- ✅ Ajout des origines autorisées explicites
- ✅ Support des transports WebSocket et Polling
- ✅ Activation des credentials

### 2. Gestion des Erreurs Améliorée (Frontend)
**Fichier**: `apps/web/src/pages/ChatPage.tsx`

- ✅ Détection automatique des bloqueurs de publicités
- ✅ Reconnexion automatique (5 tentatives)
- ✅ Messages d'erreur clairs pour l'utilisateur
- ✅ Logs détaillés dans la console
- ✅ Indicateur visuel de connexion (point vert/rouge)

### 3. Indicateur de Statut Visuel
- **Point vert pulsant** = Connecté à Socket.IO ✅
- **Point rouge** = Déconnecté ❌

## 🚀 Comment Tester

### Étape 1: Redémarrer les Serveurs
```powershell
.\restart-servers.ps1
```

### Étape 2: Ouvrir l'Application
1. Allez sur http://localhost:5173
2. Connectez-vous avec:
   - Email: `admin@techsolutions.tn`
   - Password: `admin123`

### Étape 3: Vérifier la Connexion Socket.IO
1. Allez dans la page **Messagerie**
2. Regardez à côté du titre "MESSAGERIE" :
   - **Point vert pulsant** = ✅ Tout va bien
   - **Point rouge** = ❌ Problème de connexion

### Étape 4: Ouvrir la Console du Navigateur
1. Appuyez sur **F12**
2. Allez dans l'onglet **Console**
3. Recherchez :
   - ✅ `✅ Chat Connected` = Connexion réussie
   - ❌ `❌ Socket connection error` = Erreur de connexion
   - 📨 `📨 New message received` = Message reçu

## 🛠️ Diagnostic des Problèmes

### Problème 1: Point Rouge (Déconnecté)

**Cause Probable**: Bloqueur de publicités ou extension de navigateur

**Solutions**:
1. **Désactiver le bloqueur de publicités**
   - AdBlock, uBlock Origin, Privacy Badger, etc.
   - Ajoutez `localhost:5173` et `localhost:3001` à la liste blanche

2. **Essayer un autre navigateur**
   - Chrome en mode navigation privée
   - Firefox
   - Edge

3. **Désactiver les extensions**
   - Désactivez toutes les extensions temporairement
   - Réactivez-les une par une pour identifier le coupable

### Problème 2: Erreur "ERR_BLOCKED_BY_CLIENT"

**Cause**: Extension de navigateur bloquant les WebSockets

**Solutions**:
1. Ouvrez les paramètres de votre bloqueur de publicités
2. Ajoutez ces règles d'exception :
   ```
   @@||localhost:3001/socket.io/*
   @@||localhost:5173/*
   ```

### Problème 3: Messages Envoyés mais Non Affichés

**Diagnostic**:
1. Ouvrez la console (F12)
2. Vérifiez si vous voyez `📨 New message received`
3. Si OUI mais pas affiché = Problème de rendu
4. Si NON = Problème de connexion Socket.IO

**Solutions**:
- Vérifiez que le point est **vert**
- Rafraîchissez la page (Ctrl + F5)
- Vérifiez les logs du serveur API

### Problème 4: Serveur API Non Accessible

**Diagnostic**:
```powershell
# Tester si l'API répond
curl http://localhost:3001/auth/login
```

**Solutions**:
1. Vérifiez que le serveur API est démarré
2. Regardez la fenêtre PowerShell du serveur API
3. Vérifiez les erreurs dans les logs

## 📊 Logs à Surveiller

### Console Navigateur (F12)
```
✅ Chat Connected              → Connexion réussie
📨 New message received        → Message reçu
❌ Socket connection error     → Erreur de connexion
🔌 Closing socket connection   → Déconnexion normale
```

### Console Serveur API
```
Client connected: <userId> (<companyId>)  → Utilisateur connecté
Handle Message Error                      → Erreur d'envoi de message
Socket auth error                         → Erreur d'authentification
```

## 🔍 Commandes de Diagnostic

### Vérifier les Processus Node
```powershell
Get-Process node
```

### Vérifier les Ports Utilisés
```powershell
netstat -ano | findstr :3001
netstat -ano | findstr :5173
```

### Tester la Connexion Socket.IO (depuis la console navigateur)
```javascript
// Vérifier l'état du socket
console.log('Socket connected:', socket?.connected)

// Forcer une reconnexion
socket?.connect()

// Voir les événements
socket?.onAny((event, ...args) => {
  console.log('Socket event:', event, args)
})
```

## 📝 Checklist de Vérification

- [ ] Les deux serveurs sont démarrés (API + Web)
- [ ] Le point à côté de "MESSAGERIE" est vert
- [ ] La console affiche "✅ Chat Connected"
- [ ] Aucune erreur "ERR_BLOCKED_BY_CLIENT" dans la console
- [ ] Le bloqueur de publicités est désactivé
- [ ] Les extensions de navigateur sont désactivées
- [ ] Le navigateur est à jour

## 🆘 Si Rien Ne Fonctionne

1. **Redémarrer complètement**:
   ```powershell
   # Arrêter tous les processus Node
   Get-Process node | Stop-Process -Force
   
   # Redémarrer
   .\restart-servers.ps1
   ```

2. **Vider le cache du navigateur**:
   - Ctrl + Shift + Delete
   - Cochez "Cached images and files"
   - Cliquez sur "Clear data"

3. **Vérifier les logs détaillés**:
   - Console navigateur (F12)
   - Fenêtre PowerShell du serveur API
   - Fenêtre PowerShell du serveur Web

4. **Tester avec curl**:
   ```powershell
   # Tester l'API
   curl http://localhost:3001/chat/users
   ```

## 📞 Support

Si le problème persiste après avoir suivi tous ces steps:
1. Prenez une capture d'écran de la console (F12)
2. Copiez les logs du serveur API
3. Notez les étapes exactes pour reproduire le problème
4. Vérifiez la version de votre navigateur

---

**Dernière mise à jour**: 2026-01-28
**Version**: 1.0
