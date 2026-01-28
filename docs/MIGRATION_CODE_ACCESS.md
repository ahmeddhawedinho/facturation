# 🔄 MIGRATION VER SYSTÈME DE CODE D'ACCÈS UNIQUE

## 📋 RÉSUMÉ DU NOUVEAU SYSTÈME

**Avant** : Système d'invitation par lien/email
**Après** : Système de code d'accès unique (format: ABC-123-XY)

### Flux d'utilisation

1. **Admin (Entreprise)** génère un CODE dans Paramètres → `ABC-123-XY`
2. **Admin** donne le code au comptable (téléphone, email perso, SMS...)
3. **Comptable** (déjà inscrit) entre le code dans "Ajouter client par code"
4. ✅ **Client ajouté automatiquement** dans le portail du comptable
5. **Admin** peut voir le nom du comptable et **révoquer** l'accès

---

## 🗄️ MODIFICATIONS PRISMA

### Schema modifié

```prisma
model Company {
  // ... champs existants ...
  pdfTemplate        String                @default("STANDARD")
  accountantAccessCode String?             @unique  // ✅ NOUVEAU CHAMP
  clients            Client[]
  // ...
}
```

### Migration à exécuter

```bash
cd apps/api
npx prisma generate
npx prisma migrate dev --name add_accountant_access_code
```

---

## 🔧 BACKEND - MODIFICATIONS NÉCESSAIRES

### 1. Service (accountant-portal.service.ts) - **PARTIELLEMENT FAIT**

✅ Ajouté :
- `generateAccessCode(companyId, userId)` - Génère code unique
- `connectWithCode(accountantId, accessCode)` - Connecte comptable via code
- `revokeAccountantAccess(companyId, userId)` - Révoque accès
- `getConnectedAccountant(companyId, userId)` - Récupère infos comptable
- `generateUniqueCode()` - Helper pour générer code format ABC-123-XY

### 2. Contrôleur (accountant-portal.controller.ts) - **À FINALISER**

Remplacer/Ajouter ces endpoints :

```typescript
// ==================== GÉNÉRATION CODE D'ACCÈS (Côté Admin) ====================

@Post('company/:companyId/generate-code')
async generateAccessCode(@Req() req: any, @Param('companyId') companyId: string) {
    return this.accountantPortalService.generateAccessCode(companyId, req.user.id);
}

@Get('company/:companyId/connected-accountant')
async getConnectedAccountant(@Req() req: any, @Param('companyId') companyId: string) {
    return this.accountantPortalService.getConnectedAccountant(companyId, req.user.id);
}

@Delete('company/:companyId/revoke-access')
async revokeAccountantAccess(@Req() req: any, @Param('companyId') companyId: string) {
    return this.accountantPortalService.revokeAccountantAccess(companyId, req.user.id);
}

// ==================== CONNEXION PAR CODE (Côté Comptable) ====================

@Post('connect-with-code')
@UseGuards(AccountantGuard)
async connectWithCode(@Req() req: any, @Body() body: { code: string }) {
    return this.accountantPortalService.connectWithCode(req.user.id, body.code);
}
```

---

## 🎨 FRONTEND - MODIFICATIONS NÉCESSAIRES

### 1. AccountantInvitationSection.tsx - **À MODIFIER**

**Emplacement** : `apps/web/src/components/AccountantInvitationSection.tsx`

```tsx
// Remplacer generateInvitation par :
const generateCode = async () => {
    setIsGenerating(true)
    try {
        const response = await api.post('/accountant-portal/company/generate-code')
        setCodeData(response.data) // { code: "ABC-123-XY", companyName: "..." }
    } catch (error: any) {
        alert(error.response?.data?.message || 'Erreur')
    } finally {
        setIsGenerating(false)
    }
}

// Afficher le CODE au lieu du lien :
{codeData && (
    <div className="bg-white p-6 rounded-xl border-2 border-indigo-600">
        <p className="text-xs text-gray-600 mb-2">VOTRE CODE D'ACCÈS</p>
        <p className="text-4xl font-black text-indigo-600 tracking-widest text-center">
            {codeData.code}
        </p>
        <button onClick={() => navigator.clipboard.writeText(codeData.code)}>
            Copier le code
        </button>
    </div>
)}
```

### 2. NewClientPage.tsx - **À MODIFIER**

**Emplacement** : `apps/web/src/pages/accountant/NewClientPage.tsx`

Ajouter un **Toggle** au début du formulaire :

```tsx
const [mode, setMode] = useState<'manual' | 'code'>('manual')
const [accessCode, setAccessCode] = useState('')

// Dans le JSX, avant le formulaire :
<div className="flex gap-4 mb-8">
    <button
        onClick={() => setMode('manual')}
        className={mode === 'manual' ? 'selected' : ''}
    >
        Créer Manuellement
    </button>
    <button
        onClick={() => setMode('code')}
        className={mode === 'code' ? 'selected' : ''}
    >
        Ajouter par Code
    </button>
</div>

{mode === 'code' ? (
    // Formulaire CODE
    <div className="text-center">
        <input
            type="text"
            placeholder="Entrez le code (ex: ABC-123-XY)"
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
            className="..."
        />
        <button onClick={handleConnectWithCode}>
            Ajouter le Client
        </button>
    </div>
) : (
    // Formulaire manuel existant
    <form onSubmit={handleSubmit}>...</form>
)}
```

Ajouter la fonction :

```tsx
const handleConnectWithCode = async () => {
    if (!accessCode || accessCode.length < 8) {
        setError('Code invalide')
        return
    }

    setIsLoading(true)
    try {
        const response = await api.post('/accountant-portal/connect-with-code', {
            code: accessCode
        })
        alert(`Client "${response.data.company.name}" ajouté avec succès !`)
        navigate('/portal/accountant')
    } catch (err: any) {
        setError(err.response?.data?.message || 'Code invalide')
    } finally {
        setIsLoading(false)
    }
}
```

### 3. SettingsPage.tsx - Section "Expert Comptable" - **À MODIFIER**

**Emplacement** : `apps/web/src/pages/SettingsPage.tsx`

Dans l'onglet "accountant", après l'affichage du code, ajouter :

```tsx
// Récupérer les infos du comptable connecté
const [connectedAccountant, setConnectedAccountant] = useState(null)

useEffect(() => {
    if (activeTab === 'accountant' && isAdmin) {
        fetchConnectedAccountant()
    }
}, [activeTab])

const fetchConnectedAccountant = async () => {
    try {
        const response = await api.get(`/accountant-portal/company/${company.id}/connected-accountant`)
        setConnectedAccountant(response.data)
    } catch (error) {
        // Pas de comptable connecté
    }
}

const revokeAccess = async () => {
    if (!confirm('Voulez-vous vraiment révoquer l\'accès de votre comptable ?')) return
    
    try {
        await api.delete(`/accountant-portal/company/${company.id}/revoke-access`)
        alert('Accès révoqué avec succès')
        setConnectedAccountant(null)
    } catch (error: any) {
        alert(error.response?.data?.message || 'Erreur')
    }
}

// Dans le JSX :
{connectedAccountant && (
    <div className="bg-green-50 border border-green-200 p-6 rounded-2xl mt-6">
        <h4 className="font-bold text-green-900 mb-2">✅ Comptable Connecté</h4>
        <p className="text-sm text-green-800">
            <strong>{connectedAccountant.accountant.firstName} {connectedAccountant.accountant.lastName}</strong>
        </p>
        <p className="text-xs text-green-700">{connectedAccountant.accountant.email}</p>
        
        <button
            onClick={revokeAccess}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
            Révoquer l'Accès
        </button>
    </div>
)}
```

---

## 📝 LISTE DES FICHIERS À MODIFIER

### Backend ✅ FAIT (sauf Prisma generate)
- [x] `apps/api/prisma/schema.prisma` - Ajout champ `accountantAccessCode`
- [x] `apps/api/src/accountant-portal/accountant-portal.service.ts` - Nouvelles méthodes
- [ ] `apps/api/src/accountant-portal/accountant-portal.controller.ts` - Nouveaux endpoints
- [ ] Exécuter `npx prisma generate`

### Frontend À FAIRE
- [ ] `apps/web/src/components/AccountantInvitationSection.tsx` - Afficher CODE
- [ ] `apps/web/src/pages/accountant/NewClientPage.tsx` - Ajout mode "Par code"
- [ ] `apps/web/src/pages/SettingsPage.tsx` - Afficher comptable + révoquer

---

## ✅ ÉTAPES D'IMPLÉMENTATION

### Étape 1 : Finaliser le Backend

```bash
cd apps/api

# 1. Générer Prisma Client
npx prisma generate

# 2. Créer la migration
npx prisma migrate dev --name add_accountant_access_code

# 3. Modifier le contrôleur (copier les endpoints ci-dessus)

# 4. Rebuild
npm run build

# 5. Redémarrer
npm run start:dev
```

### Étape 2 : Modifier le Frontend

1. **AccountantInvitationSection.tsx**
   - Remplacer `generateInvitation` par `generateCode`
   - Afficher le code en grand (format ABC-123-XY)
   - Bouton "Copier le code"

2. **NewClientPage.tsx**
   - Ajouter toggle "Créer Manuellement" / "Ajouter par Code"
   - Formulaire de saisie du code
   - Fonction `handleConnectWithCode`

3. **SettingsPage.tsx** (onglet accountant)
   - Fetch et afficher le comptable connecté
   - Bouton "Révoquer l'Accès"

### Étape 3 : Tester

1. Se connecter en **ADMIN**
2. Aller dans Paramètres → Expert Comptable
3. Générer un code → `ABC-123-XY`
4. Se déconnecter

5. Se connecter en **ACCOUNTANT**
6. Aller dans "Nouveau Client"
7. Cliquer "Ajouter par Code"
8. Enter le code
9. ✅ Client ajouté !

10. Retour en **ADMIN** → Voir le comptable + bouton Révoquer

---

## 🎯 AVANTAGES DU NOUVEAU SYSTÈME

✅ **Plus simple** : Pas besoin de créer des comptes
✅ **Plus sécurisé** : Code court et facile à communiquer
✅ **Contrôle admin** : Peut voir et révoquer à tout moment
✅ **Pas d'email** : Fonctionne même si le client n'a pas accès email
✅ **Réutilisable** : Le code reste actif tant qu'il n'est pas révoqué
✅ **Traçabilité** : L'admin voit qui est connecté

---

## 🔧 COMMANDES FINALES

```bash
# Backend
cd apps/api
npx prisma generate
npm run build
npm run start:dev

# Frontend (nouveau terminal)
cd apps/web
npm run dev
```

---

**Statut** : Backend 90% fait, Frontend 0% fait  
**Prochaine étape** : Modifier le contrôleur et les 3 fichiers frontend
