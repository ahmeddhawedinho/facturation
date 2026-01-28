# 📎 SYSTÈME DE JUSTIFICATIFS DE PAIEMENT - PLAN D'IMPLÉMENTATION

## 🎯 OBJECTIFS

Permettre au comptable de :
1. ✅ Voir les justificatifs de paiement sur chaque facture
2. ✅ Télécharger les justificatifs séparément  
3. ✅ Télécharger facture + justificatifs combinés (PDF/ZIP)
4. ✅ Sélection manuelle de factures pour export personnalisé
5. ✅ Export sélectif (pas seulement par date)

---

## 🗄️ DONNÉES EXISTANTES

### Modèle `Payment`
```prisma
model Payment {
  id              String    @id @default(uuid())
  amount          Float
  paymentDate     DateTime
  paymentMode     String    // ESPÈCES, CHÈQUE, VIREMENT
  reference       String?
  attachmentUrl   String?   // ✅ Justificatif (chèque scanné, virement)
  attachmentType  String?   // image/jpeg, application/pdf
  documentId      String?   // Lien vers la facture
}
```

### Modèle `DocumentAttachment`
```prisma
model DocumentAttachment {
  id          String   @id
  documentId  String
  fileName    String
  fileUrl     String   // ✅ Document original (facture scannée)
  fileType    String
}
```

---

## ✅ DÉJÀ IMPLÉMENTÉ

### Backend
- [x] Modèles Prisma existants
- [x] Inclusion des payments dans `getSalesJournal()`
- [x] Export Excel/CSV/PDF de base

### Frontend  
- [ ] Affichage justificatifs
- [ ] Téléchargement justificatifs
- [ ] Sélection manuelle  
- [ ] Export sélectif

---

## 🔧 À IMPLÉMENTER

### 1️⃣ Backend - Nouveaux Endpoints

#### a) Télécharger justificatifs d'une facture
```typescript
GET /accountant-portal/documents/:docId/payment-proofs
→ Retourne liste des URLs de justificatifs
```

#### b) Télécharger facture + justificatifs combinés
```typescript
POST /accountant-portal/documents/:docId/download-with-proofs
→ Génère ZIP : facture.pdf + justificatif_1.pdf + justificatif_2.jpg...
```

#### c) Export sélectif (liste d'IDs)
```typescript
POST /accountant-portal/export-selected
Body: { documentIds: string[], format: 'excel'|'csv'|'pdf' }
→ Export uniquement les factures sélectionnées
```

---

### 2️⃣ Frontend - ClientDetailPage

#### a) Nouvelle colonne "Justificatifs"
```tsx
<th>Justif.</th>

// Dans le body :
<td>
  {doc.payments?.length > 0 && (
    <button onClick={() => downloadProofs(doc.id)}>
      <Paperclip className="w-4 h-4" />
      <span>{doc.payments.filter(p => p.attachmentUrl).length}</span>
    </button>
  )}
</td>
```

#### b) Checkboxes pour sélection manuelle
```tsx
const [selectedDocs, setSelectedDocs] = useState<string[]>([])

<th><input type="checkbox" onChange={selectAll} /></th>

// Dans tbody :
<td>
  <input 
    type="checkbox"
    checked={selectedDocs.includes(doc.id)}
    onChange={() => toggleSelect(doc.id)}
  />
</td>
```

#### c) Boutons d'action
```tsx
<div className="flex gap-2">
  <button onClick={() => exportSelected('excel')}>
    Export Sélection Excel
  </button>
  <button onClick={() => exportSelected('pdf')}>
    Export Sélection PDF
  </button>
</div>
```

---

## 📐 DESIGN UI

### Colonne Justificatifs
```
┌────────────────┐
│ Justif.        │
├────────────────┤
│ 📎 2           │ ← Badge avec nombre
│ 📎 1           │
│ -              │ ← Pas de justificatif
└────────────────┘
```

### Menu contextuel
Clic sur 📎 → Dropdown :
```
┌──────────────────────────────┐
│ Télécharger justificatifs    │
│ Facture + justificatifs (ZIP)│
└──────────────────────────────┘
```

### Sélection
```
┌─┬──────────┬────────┬─────────┐
│☑│ FACT-001 │ Client │ 📎 2    │
│☑│ FACT-002 │ Client │ 📎 1    │
│☐│ FACT-003 │ Client │ -       │
└─┴──────────┴────────┴─────────┘

[Exporter 2 sélectionnés ▼]
```

---

## 🚀 ORDRE D'IMPLÉMENTATION

### Phase 1 : Backend (30 min)
1. Endpoint téléchargement justificatifs
2. Endpoint facture + justificatifs ZIP
3. Endpoint export sélectif

### Phase 2 : Frontend (45 min)
1. Colonne justificatifs + badge
2. Bouton téléchargement
3. Checkboxes sélection
4. Export sélectif

### Phase 3 : Tests (15 min)
1. Tester téléchargement  
2. Tester export sélectif
3. Vérifier ZIP combiné

---

## 📝 EXEMPLE D'UTILISATION

### Scénario 1 : Télécharger justificatifs d'une facture
```
1. Comptable ouvre "Journal des Ventes"
2. Voit facture FACT-123 avec badge "📎 2"
3. Clic sur 📎 → Menu dropdown
4. Clic "Télécharger justificatifs"
5. ✅ ZIP téléchargé : 
   - cheque_001.pdf
   - virement_002.jpg
```

### Scénario 2 : Export sélectif
```
1. Comptable filtre : 01/01/2026 → 31/01/2026
2. 50 factures affichées
3. Coche 5 factures spécifiques
4. Clic "Exporter sélection Excel"
5. ✅ Excel contenant uniquement ces 5 factures
```

### Scénario 3 : Facture + justificatifs combinés
```
1. Clic sur 📎 de FACT-123
2. Clic "Facture + justificatifs (ZIP)"
3. ✅ ZIP téléchargé :
   - FACT-123.pdf (facture originale)
   - paiement_cheque_20260115.pdf
   - paiement_virement_20260120.jpg
```

---

## ✅ CHECKLIST FINALE

### Backend
- [x] Payments inclus dans getSalesJournal
- [ ] Endpoint téléchargement justificatifs
- [ ] Endpoint facture + justificatifs ZIP
- [ ] Endpoint export sélectif

### Frontend
- [ ] Colonne "Justif." avec badge
- [ ] Dropdown menu téléchargement
- [ ] Checkboxes sélection
- [ ] Bouton "Exporter sélection"
- [ ] État selectedDocs

### Tests
- [ ] Télécharger justificatifs seuls
- [ ] Télécharger facture + justificatifs
- [ ] Sélection manuelle fonctionnelle
- [ ] Export sélection Excel/PDF

---

**Temps estimé total : 90 minutes**
**Statut actuel : Backend 30% / Frontend 0%**

**Prochaine étape : Implémenter les 3 nouveaux endpoints backend**
