# 💰 Système de Suivi des Paiements - Guide d'Utilisation

## ✅ Fonctionnalités Implémentées

### 1. **Champ `paidAmount` dans Document**
- Chaque facture/commande suit maintenant le montant total payé
- Mise à jour automatique lors de chaque paiement

### 2. **Table `Payment` pour l'Historique**
- Enregistre chaque paiement individuellement
- Informations sauvegardées:
  - 💵 Montant du paiement
  - 📅 Date du paiement
  - 💳 Mode de paiement (Espèces / Chèque / Virement)
  - 📝 Notes optionnelles
  - 🔗 Référence (numéro de chèque, etc.)

### 3. **Indicateurs Visuels par Couleur**
Dans la liste des documents (Opérations Commerciales):

- 🟢 **VERT** : 100% payé (paidAmount >= total)
- 🟠 **ORANGE** : 40-99% payé (partiellement réglé)
- 🔴 **ROUGE** : 0-39% payé (peu ou pas payé)

### 4. **Modal de Gestion des Règlements**
En cliquant sur le badge coloré, vous accédez à:

#### Informations Affichées:
- Montant Total à Régler
- Montant Déjà Payé
- Solde Restant (calculé automatiquement)

#### Actions Disponibles:
1. **Saisir un nouveau paiement**:
   - Montant (cumulé)
   - Mode de paiement (Espèces / Chèque / Virement)

2. **Voir l'historique**:
   - Liste de tous les paiements antérieurs
   - Date, montant et mode pour chaque paiement

3. **Validation Automatique**:
   - Si montant payé >= total
   - Le document passe automatiquement en statut VALIDATED
   - Le PDF affichera "VALIDE" en vert

### 5. **Watermark PDF "VALIDE"**
Sur les factures PDF exportées:
- ✅ **"VALIDE" en vert** si status = VALIDATED ou PAID
- ❌ **"NON VALIDE" en rouge** si status = DRAFT

### 6. **Affichage du Mode de Paiement sur le PDF**
- Mode de paiement affiché en haut à droite
- Notes de règlement affichées (ex: "Partie Espèces + Virement")

## 📌 Comment Utiliser

### Enregistrer un Paiement:

1. Allez dans **Opérations Commerciales** (menu Ventes)
2. Cliquez sur le **badge coloré** dans la colonne "Règlement"
3. La modal "Gestion des Règlements" s'ouvre avec:
   - Total à régler
   - Déjà payé
   - **Historique des paiements précédents** (si existant)
4. **Saisissez le montant cumulé** total déjà payé
5. Sélectionnez le **mode de paiement**
6. Cliquez sur **"Enregistrer le paiement"**

### Voir l'Historique:
- L'historique s'affiche automatiquement dans la modal
- Chaque ligne montre:
  - Montant payé
  - Mode de paiement
  - Date

### Validation Automatique:
- Si vous saisissez un montant >= au total
- Le document sera automatiquement validé
- Un message apparaît : "Le document sera automatiquement marqué comme COMPLET"

## 🛠️ API Endpoints Créés

```
POST   /documents/:id/payments      # Ajouter un paiement
GET    /documents/:id/payments      # Récupérer l'historique
DELETE /documents/:id/payments/:paymentId  # Supprimer un paiement
```

## 🗄️ Modèles Base de Données

### Document (modifié):
```prisma
model Document {
  ...
  paidAmount Float @default(0)  // Nouveau champ
  payments   Payment[]          // Relation
  ...
}
```

### Payment (nouveau):
```prisma
model Payment {
  id           String   @id @default(uuid())
  amount       Float
  paymentDate  DateTime @default(now())
  paymentMode  String   // CASH, CHECK, TRANSFER, OTHER
  reference    String?
  notes        String?
  documentId   String
  document     Document @relation(...)
  companyId    String
  company      Company  @relation(...)
}
```

## 🚀 Migration Effectuée

La migration Prisma a été exécutée avec succès :
- Ajout du champ `paidAmount` à tous les documents existants (valeur par défaut: 0)
- Création de la table `Payment`
- Les serveurs ont été redémarrés automatiquement

## ✨ Prochaines Étapes Recommandées

1. **Tester l'enregistrement d'un paiement** sur une facture existante
2. **Vérifier l'affichage des couleurs** (rouge → orange → vert)
3. **Générer un PDF** pour voir le watermark "VALIDE"
4. **Consulter l'historique** d'une facture avec plusieurs paiements

## 🐛 Debug Si Nécessaire

Si le système ne fonctionne pas:
1. Vérifiez que les serveurs sont bien redémarrés
2. Vérifiez la console du navigateur (F12) pour les erreurs API
3. Vérifiez les logs du serveur backend

---
**Date de mise à jour:** 18 janvier 2026
**Status:** ✅ Opérationnel
