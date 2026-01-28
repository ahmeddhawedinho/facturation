# 🧪 TEST DU SYSTÈME DE PAIEMENT

## ⚠️ Important - Serveurs Redémarrés
Les serveurs ont été redémarrés. Attendez 15-20 secondes avant de tester.

## 📋 Procédure de Test

### 1. Vérifier que les serveurs sont prêts
- Ouvrez http://localhost:5173 (Frontend)
- Login si nécessaire
- Allez dans **Ventes** (Opérations Commerciales)

### 2. Tester l'enregistrement d'un paiement

#### Étape A: Sélectionner un document
1. Trouvez une facture/commande dans la liste
2. Regardez la colonne **"Règlement"**
3. Vous devriez voir un badge coloré (rouge/orange/vert) avec un pourcentage

#### Étape B: Ouvrir la modal de règlement
1. **Cliquez sur le badge coloré**
2. La modal "Gestion des Règlements" s'ouvre
3. Vous devriez voir:
   - Montant Total à Régler (ex: 121.190 TND)
   - Déjà Payé (ex: 0.000)
   - Zone de saisie pour le montant
   - Boutons de mode de paiement (Espèces/Chèque/Virement)
   - Section "Historique des Paiements" (vide si premier paiement)

#### Étape C: Enregistrer un paiement
1. **Saisissez un montant dans "Montant du Règlement"**
   - Exemple: Si total = 121.190 et déjà payé = 0
   - Saisissez: **50** (pour un paiement partiel de 50 TND)
   - OU saisissez: **121.190** (pour un paiement complet)

2. **Sélectionnez le mode de paiement**
   - Cliquez sur **ESPÈCES**, **CHÈQUE**, ou **VIREMENT**

3. **Cliquez sur "ENREGISTRER LE PAIEMENT"**

#### Étape D: Vérifier le résultat
Après avoir cliqué sur "Enregistrer":

✅ **Ce qui DOIT se passer:**
1. Une alerte "Paiement enregistré avec succès!" apparaît
2. La modal se ferme
3. Le badge de règlement se met à jour:
   - Si vous avez payé 50 TND sur 121.190 → **41% Payé** (badge ORANGE)
   - Si vous avez payé 121.190 TND → **100% Payé** (badge VERT)
4. Le document est automatiquement VALIDÉ si 100% payé

### 3. Vérifier l'historique

1. **Cliquez à nouveau sur le badge** du même document
2. La modal s'ouvre avec:
   - Déjà Payé: **50.000** (ou montant saisi)
   - Section "Historique des Paiements" visible
   - Une ligne montrant:
     - Montant: 50.000 TND
     - Mode: Espèces (ou ce que vous avez choisi)
     - Date: Aujourd'hui

3. **Ajouter un second paiement** (si partiel):
   - Saisissez le nouveau total cumulé
   - Ex: Si déjà payé = 50, saisissez **121.190** pour compléter
   - Cliquez "Enregistrer"
   - L'historique montrera maintenant **2 lignes**

### 4. Vérifier le PDF

1. Trouvez un document 100% payé (badge vert)
2. Cliquez sur l'icône "œil" (👁️) pour voir le document
3. Téléchargez le PDF
4. Vérifiez que le watermark **"VALIDE"** en vert apparaît
5. Le mode de paiement doit aussi apparaître en haut à droite

## 🐛 Si ça ne marche pas

### Symptôme: Le badge reste à 0% après enregistrement

**Causes possibles:**
1. Erreur API → Ouvrez F12 (Console) et regardez les erreurs rouges
2. Serveur backend pas prêt → Attendez 20 secondes et réessayez
3. Base de données pas migrée → Vérifiez les logs du serveur API

### Symptôme: "Erreur lors de l'enregistrement du règlement"

**Solutions:**
1. Ouvrez F12 → Console
2. Cherchez l'erreur exacte (en rouge)
3. Si "404" ou "Cannot POST" → Le serveur n'est pas prêt
4. Si "paidAmount" error → Le Prisma Client n'est pas regénéré
5. Si "companyId" error → Problème de session/auth

### Commande de Debug Backend

Si besoin de relancer le backend:
```powershell
cd c:\Users\ahmed\OneDrive\Bureau\projet\apps\api
npm run start:dev
```

Regardez les logs du terminal pour voir les erreurs.

## 📊 Résultat Attendu

Après avoir testé avec succès:
- ✅ Badge 0% → 41% → 100%
- ✅ Historique visible avec 1 ou plusieurs paiements
- ✅ PDF avec "VALIDE" si 100% payé
- ✅ Document auto-validé si complètement payé

---
**Date:** 18 janvier 2026  
**Status:** Prêt pour test
