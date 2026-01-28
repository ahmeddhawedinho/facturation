import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { Plus, Trash2, Save, X, Image as ImageIcon, Upload, FileText, ArrowLeft, Package, CreditCard, ShieldCheck } from 'lucide-react'

interface Supplier {
    id: string
    name: string
    legalName?: string
    email?: string
    phone?: string
    fiscalNumber?: string
    address?: string
    city?: string
    postalCode?: string
    country?: string
}

interface Product {
    id: string
    title: string
    purchasePrice: number
}

interface PaymentMethod {
    id: string
    name: string
}

interface TaxConfig {
    id: string
    name: string
    rate: number
    isDefault?: boolean
}

interface DocumentLine {
    description: string
    quantity: number
    unitPrice: number
    discount: number
    taxId: string
    fodec: boolean
    subtotal: number
    total: number
    productId?: string
}

interface PurchaseDocumentForm {
    type: string
    supplierId: string
    issueDate: string
    dueDate: string
    currency: string
    paymentMethodId: string
    notes: string
    timbreFiscale: number
    lines: DocumentLine[]
    scannedImage?: string
    purchaseType: 'PRODUCT' | 'CHARGE'
    paymentStatus: 'UNPAID' | 'PENDING' | 'PAID'
    subtype: 'STOCK' | 'GENERAL'
}

export default function CreatePurchaseDocumentPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const { user } = useAuthStore()
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(false)

    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const [products, setProducts] = useState<Product[]>([])
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
    const [taxes, setTaxes] = useState<TaxConfig[]>([])

    const [formData, setFormData] = useState<PurchaseDocumentForm>({
        type: searchParams.get('type') || 'PURCHASE_ORDER',
        supplierId: searchParams.get('supplierId') || '',
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        currency: 'TND',
        paymentMethodId: '',
        notes: '',
        timbreFiscale: 1.000,
        lines: [{ description: '', quantity: 1, unitPrice: 0, discount: 0, taxId: '', fodec: false, subtotal: 0, total: 0 }],
        scannedImage: '',
        purchaseType: (searchParams.get('purchaseType') as any) || 'PRODUCT',
        paymentStatus: 'UNPAID',
        subtype: (searchParams.get('purchaseType') === 'CHARGE' ? 'GENERAL' : 'STOCK') as any
    })

    const [isNewSupplierMode, setIsNewSupplierMode] = useState(false)
    const [newSupplierData, setNewSupplierData] = useState({
        name: '', legalName: '', fiscalNumber: '', email: '', phone: '', address: '', city: '', postalCode: '', country: 'Tunisie'
    })

    useEffect(() => {
        if (!user) { navigate('/login'); return }
        loadData()
        if (id) fetchDocument(id)
    }, [user, navigate, id])

    const fetchDocument = async (docId: string) => {
        try {
            setFetching(true)
            const res = await api.get(`/purchase-orders/${docId}`)
            const doc = res.data
            let type = 'PURCHASE_ORDER'; let notes = doc.notes || ''
            if (notes.startsWith('[Type:')) {
                const parts = notes.split(']'); type = parts[0].replace('[Type: ', ''); notes = parts.slice(1).join(']').trim()
            }
            setFormData({
                type, supplierId: doc.supplierId, issueDate: doc.issueDate ? new Date(doc.issueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                dueDate: doc.dueDate ? new Date(doc.dueDate).toISOString().split('T')[0] : '', currency: doc.currency || 'TND', paymentMethodId: doc.paymentMethodId || '',
                notes, timbreFiscale: doc.timbreFiscal || 1.0, purchaseType: (doc.nature as any) || 'PRODUCT', paymentStatus: (doc.paymentStatus as any) || 'UNPAID',
                subtype: (doc.subtype as any) || 'STOCK', scannedImage: doc.scannedImage || '',
                lines: (doc.lines || []).map((l: any) => ({
                    description: l.description || '', quantity: l.quantity || 1, unitPrice: l.unitPrice || 0, discount: l.discount || 0,
                    taxId: l.taxRateId || '', fodec: !!l.fodec, subtotal: l.subtotal || 0, total: l.total || 0, productId: l.productId
                }))
            })
        } catch (error) { console.error('Doc load fail', error) }
        finally { setFetching(false) }
    }

    const loadData = async () => {
        try {
            const results = await Promise.allSettled([api.get('/suppliers'), api.get('/products'), api.get('/companies/payment-methods'), api.get('/tax-rates')])
            if (results[0].status === 'fulfilled') setSuppliers(results[0].value.data || [])
            if (results[1].status === 'fulfilled') setProducts(results[1].value.data || [])
            if (results[2].status === 'fulfilled' && results[2].value.data?.length > 0) setPaymentMethods(results[2].value.data)
            else setPaymentMethods([{ id: 'cash', name: 'Espèces' }, { id: 'check', name: 'Chèque' }, { id: 'transfer', name: 'Virement' }])
            if (results[3].status === 'fulfilled' && results[3].value.data?.length > 0) setTaxes(results[3].value.data)
        } catch (error) { console.error('Data load fail', error) }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader(); reader.onloadend = () => { setFormData({ ...formData, scannedImage: reader.result as string }) }; reader.readAsDataURL(file)
        }
    }

    const handleCreateSupplier = async () => {
        if (!newSupplierData.name) { alert('Nom requis'); return }
        try {
            const res = await api.post('/suppliers', newSupplierData)
            setSuppliers([...suppliers, res.data]); setFormData({ ...formData, supplierId: res.data.id }); setIsNewSupplierMode(false)
        } catch (err: any) { alert(err.response?.data?.message || 'Erreur création fournisseur') }
    }

    const addLine = () => { setFormData({ ...formData, lines: [...formData.lines, { description: '', quantity: 1, unitPrice: 0, discount: 0, taxId: '', fodec: false, subtotal: 0, total: 0 }] }) }
    const removeLine = (index: number) => { if (formData.lines.length === 1) return; setFormData({ ...formData, lines: formData.lines.filter((_, i) => i !== index) }) }
    const updateLine = (index: number, field: keyof DocumentLine, value: any) => {
        const newLines = [...formData.lines]; newLines[index] = { ...newLines[index], [field]: value };
        if (field === 'description') { const p = products.find(prod => prod.title === value); if (p) { newLines[index].productId = p.id; newLines[index].unitPrice = p.purchasePrice } }
        calculateLineTotal(newLines[index]); setFormData({ ...formData, lines: newLines })
    }

    const calculateLineTotal = (line: DocumentLine) => {
        const subtotal = Math.max(0, (line.quantity * line.unitPrice) - (line.quantity * line.unitPrice * (line.discount / 100)))
        line.subtotal = subtotal; const taxBase = subtotal + (line.fodec ? subtotal * 0.01 : 0)
        const tax = taxes.find(t => t.id === line.taxId); line.total = taxBase + (tax ? taxBase * (tax.rate / 100) : 0)
    }

    const calculateDocTotals = () => {
        const totalHT = formData.lines.reduce((sum, l) => sum + l.subtotal, 0)
        const totalFodec = formData.lines.reduce((sum, l) => sum + (l.fodec ? l.subtotal * 0.01 : 0), 0)
        const totalTva = formData.lines.reduce((sum, l) => {
            const base = l.subtotal + (l.fodec ? l.subtotal * 0.01 : 0);
            const tax = taxes.find(t => t.id === l.taxId);
            return sum + (tax ? base * tax.rate / 100 : 0)
        }, 0)
        return { totalHT, totalFodec, totalTva, totalTTC: totalHT + totalFodec + totalTva + formData.timbreFiscale }
    }

    const totals = calculateDocTotals()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); if (!formData.supplierId) { alert('Fournisseur requis'); return }
        setLoading(true); try {
            const payload = { ...formData, total: totals.totalTTC, taxTotal: totals.totalTva, subtotal: totals.totalHT }
            if (id) await api.put(`/purchase-orders/${id}`, payload); else await api.post('/purchase-orders', payload)
            navigate('/dashboard/purchase')
        } catch (error) { setLoading(false) }
    }

    if (fetching) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="w-12 h-12 rounded-full border-4 border-gray-100 border-t-emerald-600 animate-spin"></div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest animate-pulse">Chargement du document...</p>
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <div className="flex items-center gap-4 mb-3">
                        <button onClick={() => navigate('/dashboard/purchase')} className="p-2.5 bg-white hover:bg-gray-50 rounded-xl border border-gray-200 text-gray-500 hover:text-gray-900 transition-all shadow-sm"><ArrowLeft className="w-5 h-5" /></button>
                        <div className="inline-block px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-[10px] font-bold uppercase tracking-widest">Achats & Stock</div>
                    </div>
                    <h1 className="text-3xl lg:text-5xl font-black text-gray-900 tracking-tight">
                        {id ? 'Modifier' : 'Nouvel'} <span className="text-emerald-600">Achat</span>
                    </h1>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                    <button type="button" onClick={() => navigate('/dashboard/purchase')} className="flex-1 md:flex-none px-6 py-4 bg-white border border-gray-200 text-gray-500 rounded-2xl font-bold text-sm hover:bg-gray-50 transition-all">Annuler</button>
                    <button onClick={handleSubmit} disabled={loading} className="flex-1 md:flex-none flex items-center justify-center gap-3 px-10 py-4 bg-emerald-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 active:scale-95 transition-all">
                        <Save className="w-4 h-4" /> {loading ? 'Enregistrement...' : 'Enregistrer'}
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                <div className="xl:col-span-2 space-y-8">
                    {/* General Settings */}
                    <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Type d'opération</label>
                                <div className="flex bg-gray-50 rounded-xl p-1 gap-1 border border-gray-100">
                                    <button type="button" onClick={() => setFormData({ ...formData, purchaseType: 'PRODUCT' })} className={`flex-1 py-2.5 px-2 rounded-lg text-[10px] font-bold uppercase transition-all ${formData.purchaseType === 'PRODUCT' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-400'}`}>Stock</button>
                                    <button type="button" onClick={() => setFormData({ ...formData, purchaseType: 'CHARGE' })} className={`flex-1 py-2.5 px-2 rounded-lg text-[10px] font-bold uppercase transition-all ${formData.purchaseType === 'CHARGE' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-400'}`}>Charge</button>
                                </div>
                            </div>
                            <div className="space-y-2 md:col-span-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Document</label>
                                <select className="w-full bg-gray-50 border border-gray-100 text-gray-900 rounded-xl py-3 px-4 font-bold text-sm outline-none focus:border-emerald-500 transition-all appearance-none" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                    <option value="PURCHASE_ORDER">Bon de Commande</option>
                                    <option value="GOODS_RECEIPT">Bon de Réception</option>
                                    <option value="PURCHASE_INVOICE">Facture d'Achat</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Date</label>
                                <input type="date" value={formData.issueDate} onChange={e => setFormData({ ...formData, issueDate: e.target.value })} className="w-full bg-gray-50 border border-gray-100 text-gray-900 rounded-xl py-2.5 px-4 font-bold text-sm outline-none focus:border-emerald-500" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Devise</label>
                                <select className="w-full bg-gray-50 border border-gray-100 text-gray-900 rounded-xl py-3 px-4 font-bold text-sm outline-none appearance-none" value={formData.currency} onChange={e => setFormData({ ...formData, currency: e.target.value })}>
                                    <option value="TND">TND</option><option value="EUR">EUR</option><option value="USD">USD</option>
                                </select>
                            </div>
                        </div>

                        {/* Scanner Module */}
                        <div className="bg-emerald-50/30 border border-emerald-100 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6">
                            <div className="flex-1 space-y-3">
                                <div className="flex items-center gap-3"><ImageIcon className="w-5 h-5 text-emerald-600" /><h3 className="text-sm font-bold text-gray-900">Document Original</h3></div>
                                <p className="text-xs font-medium text-gray-500">Importez une photo de la facture ou du bon reçu pour vos archives.</p>
                                <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-emerald-200 text-emerald-600 rounded-xl text-[10px] font-bold uppercase tracking-widest cursor-pointer hover:bg-emerald-50 transition-all shadow-sm"><Upload className="w-4 h-4" /> Choisir un fichier <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} /></label>
                            </div>

                            {formData.scannedImage && (
                                <div className="relative group shrink-0">
                                    <div className="w-32 h-32 rounded-xl overflow-hidden border border-gray-200 p-1 bg-white shadow-sm">
                                        <img src={formData.scannedImage} alt="Scan" className="w-full h-full object-cover rounded-lg" />
                                    </div>
                                    <button onClick={() => setFormData({ ...formData, scannedImage: '' })} className="absolute -top-2 -right-2 p-1.5 bg-rose-500 text-white rounded-full shadow-lg hover:scale-110 transition-all"><X className="w-3.5 h-3.5" /></button>
                                </div>
                            )}
                        </div>

                        {/* Supplier Box */}
                        <div className="space-y-6 pt-6 border-t border-gray-100">
                            <div className="flex justify-between items-center">
                                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">Fournisseur & Destination</h3>
                                {!isNewSupplierMode && <button type="button" onClick={() => setIsNewSupplierMode(true)} className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest hover:underline">+ Nouveau Fournisseur</button>}
                            </div>

                            {!isNewSupplierMode ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="relative group">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Entité Fournisseur</label>
                                        <select className="w-full bg-gray-50 border border-gray-100 text-gray-900 rounded-xl py-3 px-4 font-bold text-sm outline-none focus:border-emerald-500 transition-all" value={formData.supplierId} onChange={e => setFormData({ ...formData, supplierId: e.target.value })}>
                                            <option value="">Sélectionner un fournisseur</option>
                                            {formData.purchaseType === 'CHARGE' && (
                                                <optgroup label="Secteurs Publics">
                                                    <option value="STEG">STEG</option><option value="SONEDE">SONEDE</option><option value="TELECOM">TUNISIE TELECOM</option>
                                                </optgroup>
                                            )}
                                            <optgroup label="Mes Fournisseurs">
                                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                            </optgroup>
                                        </select>
                                    </div>
                                    <div className="relative group">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Affectation</label>
                                        <select className="w-full bg-gray-50 border border-gray-100 text-gray-900 rounded-xl py-3 px-4 font-bold text-sm outline-none focus:border-emerald-500 transition-all" value={formData.subtype} onChange={e => setFormData({ ...formData, subtype: e.target.value as any })}>
                                            <option value="STOCK">Vers Stock Central</option>
                                            <option value="GENERAL">Consommation / Usage Interne</option>
                                        </select>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 animate-fade-in grid grid-cols-1 md:grid-cols-2 gap-6 relative shadow-inner">
                                    <button onClick={() => setIsNewSupplierMode(false)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-900"><X className="w-5 h-5" /></button>
                                    <div className="md:col-span-2 space-y-2"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Nom du Fournisseur *</label><input className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl py-3 px-4 font-medium" value={newSupplierData.name} onChange={e => setNewSupplierData({ ...newSupplierData, name: e.target.value })} /></div>
                                    <div className="space-y-2"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Matricule Fiscal</label><input className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl py-3 px-4 font-medium" value={newSupplierData.fiscalNumber} onChange={e => setNewSupplierData({ ...newSupplierData, fiscalNumber: e.target.value })} /></div>
                                    <div className="space-y-2"><label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Téléphone</label><input className="w-full bg-white border border-gray-200 text-gray-900 rounded-xl py-3 px-4 font-medium" value={newSupplierData.phone} onChange={e => setNewSupplierData({ ...newSupplierData, phone: e.target.value })} /></div>
                                    <button type="button" onClick={handleCreateSupplier} className="md:col-span-2 py-4 bg-emerald-600 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-600/20 mt-4 hover:bg-emerald-700 transition-all">Enregistrer le fournisseur</button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Articles Grid */}
                    <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm space-y-6">
                        <div className="flex justify-between items-center"><h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-3"><Package className="w-6 h-6 text-emerald-600" /> Lignes de document</h2></div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-y border-gray-100">
                                    <tr><th className="py-4 px-4 text-center w-12">#</th><th className="py-4 px-4 text-left">Article / Description</th><th className="py-4 px-4 text-center w-24">Qté</th><th className="py-4 px-4 text-right w-32">P.U HT</th><th className="py-4 px-4 text-center w-20">Fodec</th><th className="py-4 px-4 text-center w-20">Rem.%</th><th className="py-4 px-4 text-left w-24">TVA</th><th className="py-4 px-4 text-right w-32">Total HT</th><th className="py-4 px-4 w-12"></th></tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {formData.lines.map((line, idx) => (
                                        <tr key={idx} className="group transition-colors">
                                            <td className="py-4 px-4 text-[10px] font-bold text-gray-300 text-center">{idx + 1}</td>
                                            <td className="py-4 px-4">
                                                <input className="w-full bg-transparent border-b border-gray-100 focus:border-emerald-500 focus:ring-0 px-0 py-2 text-gray-900 font-bold outline-none placeholder-gray-300" placeholder="Chercher un article..." value={line.description} onChange={e => updateLine(idx, 'description', e.target.value)} list={`pl-${idx}`} />
                                                <datalist id={`pl-${idx}`}>{products.map(p => <option key={p.id} value={p.title} />)}</datalist>
                                            </td>
                                            <td className="py-4 px-4"><input type="number" className="w-full bg-gray-50 border border-gray-100 rounded-lg py-1.5 px-2 text-gray-900 text-center font-bold" value={line.quantity} onChange={e => updateLine(idx, 'quantity', parseFloat(e.target.value) || 0)} /></td>
                                            <td className="py-4 px-4"><input type="number" className="w-full bg-gray-50 border border-gray-100 rounded-lg py-1.5 px-2 text-gray-900 text-right font-bold" value={line.unitPrice} onChange={e => updateLine(idx, 'unitPrice', parseFloat(e.target.value) || 0)} /></td>
                                            <td className="py-4 px-4 text-center"><input type="checkbox" className="w-4 h-4 bg-gray-50 border-gray-200 rounded text-emerald-600 focus:ring-emerald-500/20" checked={line.fodec} onChange={e => updateLine(idx, 'fodec', e.target.checked)} /></td>
                                            <td className="py-4 px-4"><input type="number" className="w-full bg-gray-50 border border-gray-100 rounded-lg py-1.5 px-2 text-orange-600 text-center font-bold" value={line.discount} onChange={e => updateLine(idx, 'discount', parseFloat(e.target.value) || 0)} /></td>
                                            <td className="py-4 px-4">
                                                <select className="w-full bg-gray-50 border border-gray-100 rounded-lg py-1.5 px-2 text-gray-500 font-bold text-[10px] outline-none" value={line.taxId} onChange={e => updateLine(idx, 'taxId', e.target.value)}>
                                                    <option value="">0%</option>{taxes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                                </select>
                                            </td>
                                            <td className="py-4 px-4 text-right text-sm font-black text-gray-900">{line.subtotal.toFixed(3)}</td>
                                            <td className="py-4 px-4 text-center"><button type="button" onClick={() => removeLine(idx)} className="p-2 text-gray-300 hover:text-rose-500 transition-colors"><Trash2 className="w-4 h-4" /></button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <button type="button" onClick={addLine} className="flex items-center gap-3 px-8 py-4 bg-gray-50 border-2 border-dashed border-gray-200 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 rounded-2xl w-full justify-center transition-all font-bold text-sm">
                            <Plus className="w-5 h-5" /> Ajouter un article
                        </button>
                    </div>
                </div>

                <div className="xl:col-span-1 space-y-8">
                    {/* Settlement Config */}
                    <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2"><CreditCard className="w-3 h-3 text-emerald-600" /> Mode de Règlement</label>
                                <select className="w-full bg-gray-50 border border-gray-100 text-gray-900 rounded-xl py-3 px-4 font-bold text-sm outline-none" value={formData.paymentMethodId} onChange={e => setFormData({ ...formData, paymentMethodId: e.target.value })}>
                                    <option value="">Sélectionner</option>{paymentMethods.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Statut Paiement</label>
                                <select className="w-full bg-gray-50 border border-gray-100 text-gray-900 rounded-xl py-3 px-4 font-bold text-sm outline-none" value={formData.paymentStatus} onChange={e => setFormData({ ...formData, paymentStatus: e.target.value as any })}>
                                    <option value="UNPAID">Non payé</option><option value="PENDING">En attente</option><option value="PAID">Payé / Réglé</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2"><FileText className="w-3 h-3 text-emerald-600" /> Notes Internes</label>
                                <textarea className="w-full bg-gray-50 border border-gray-100 text-gray-900 rounded-xl py-4 px-4 text-sm font-medium h-24 outline-none focus:border-emerald-500" placeholder="Observations facultatives..." value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
                            </div>
                        </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="bg-emerald-900 rounded-[2.5rem] p-10 shadow-xl shadow-emerald-900/40 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl"></div>
                        <h3 className="text-[10px] font-bold text-emerald-400/60 uppercase tracking-widest mb-8 text-center">Récapulatif Financier</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-emerald-400/50 uppercase tracking-widest">Total HT</span><span className="text-white text-base font-black">{totals.totalHT.toFixed(3)}</span></div>
                            <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-emerald-400/50 uppercase tracking-widest">Total FODEC</span><span className="text-white text-base font-black">{totals.totalFodec.toFixed(3)}</span></div>
                            <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-emerald-400/50 uppercase tracking-widest">Total TVA</span><span className="text-white text-base font-black">{totals.totalTva.toFixed(3)}</span></div>
                            <div className="flex justify-between items-center py-5 border-y border-white/10">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-emerald-400/50 uppercase tracking-widest block">Droit de Timbre</span>
                                    <select className="bg-emerald-800 border-none text-[8px] font-black text-emerald-400 uppercase tracking-widest rounded-lg px-2 py-1 outline-none" value={formData.timbreFiscale} onChange={e => setFormData({ ...formData, timbreFiscale: parseFloat(e.target.value) })}>
                                        <option value={1.0}>1.000</option><option value={0.6}>0.600</option><option value={0}>0.000</option>
                                    </select>
                                </div>
                                <span className="text-white text-lg font-black">{formData.timbreFiscale.toFixed(3)}</span>
                            </div>
                            <div className="pt-8 flex flex-col items-center gap-1">
                                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-[0.3em] mb-1">Total TTC</span>
                                <div className="text-4xl lg:text-5xl font-black text-white tracking-tighter flex items-end gap-2">
                                    {totals.totalTTC.toFixed(3)}
                                    <span className="text-xs font-bold text-emerald-400/40 mb-2">{formData.currency}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 flex gap-4 items-start shadow-sm">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 border border-blue-100 shadow-sm"><ShieldCheck className="w-5 h-5 text-blue-600" /></div>
                        <div>
                            <p className="text-[10px] font-bold text-blue-800 uppercase tracking-widest mb-1">Stock & Trésorerie</p>
                            <p className="text-xs font-medium text-blue-600/80 leading-relaxed">Les niveaux de stock seront mis à jour dès la validation de ce document.</p>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    )
}
