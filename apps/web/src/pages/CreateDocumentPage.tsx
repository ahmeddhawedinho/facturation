import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { Plus, Trash2, Save, RefreshCcw, ArrowLeft, UserPlus, Package, CreditCard, FileText, ChevronRight, X, CheckCircle2 } from 'lucide-react'

interface Client {
    id: string
    name: string
    legalName?: string
    email?: string
    phone?: string
    fiscalNumber?: string
    address?: string
    city?: string
    type: 'INDIVIDUAL' | 'PROFESSIONAL'
}

interface Product {
    id: string
    title: string
    sellingPrice: number
}

interface PaymentMethod {
    id: string
    name: string
}

interface TaxRate {
    id: string
    name: string
    rate: number
}

interface DocumentLine {
    description: string
    quantity: number
    unitPrice: number
    discount: number
    taxRateId: string
    fodec: boolean
    subtotal: number
    total: number
    productId?: string
}

interface DocumentForm {
    type: string
    clientId: string
    issueDate: string
    dueDate: string
    currency: string
    paymentMethodId: string
    notes: string
    timbreFiscale: number
    lines: DocumentLine[]
}

export default function CreateDocumentPage() {
    const navigate = useNavigate()
    const { id } = useParams()
    const [searchParams] = useSearchParams()
    const { user } = useAuthStore()
    const [loading, setLoading] = useState(false)
    const isEditMode = !!id

    const [clients, setClients] = useState<Client[]>([])
    const [products, setProducts] = useState<Product[]>([])
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
    const [taxes, setTaxes] = useState<TaxRate[]>([])

    const [formData, setFormData] = useState<DocumentForm>({
        type: searchParams.get('type') || 'INVOICE',
        clientId: searchParams.get('clientId') || '',
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        currency: 'TND',
        paymentMethodId: '',
        notes: '',
        timbreFiscale: 1.000,
        lines: [{ description: '', quantity: 1, unitPrice: 0, discount: 0, taxRateId: '', fodec: false, subtotal: 0, total: 0 }]
    })

    const [isNewClientMode, setIsNewClientMode] = useState(false)
    const [newClientData, setNewClientData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        type: 'PROFESSIONAL' as 'INDIVIDUAL' | 'PROFESSIONAL',
        companyName: '',
        legalName: '',
        fiscalNumber: '',
        address: '',
        city: '',
        postalCode: '',
        country: 'Tunisie'
    })

    useEffect(() => {
        if (!user) { navigate('/login'); return }
        loadData()
    }, [user, navigate])

    useEffect(() => {
        if (id && user && taxes.length >= 0) loadDocument(id)
    }, [id, user, taxes.length])

    const loadData = async () => {
        try {
            const results = await Promise.allSettled([
                api.get('/clients'),
                api.get('/products'),
                api.get('/companies/payment-methods'),
                api.get('/tax-rates')
            ])

            if (results[0].status === 'fulfilled' && 'value' in results[0]) setClients(results[0].value.data || [])
            if (results[1].status === 'fulfilled' && 'value' in results[1]) setProducts(results[1].value.data || [])
            if (results[2].status === 'fulfilled' && 'value' in results[2] && results[2].value.data?.length > 0) setPaymentMethods(results[2].value.data)
            else setPaymentMethods([{ id: 'cash', name: 'Espèces' }, { id: 'check', name: 'Chèque' }, { id: 'transfer', name: 'Virement Bancaire' }])

            if (results[3].status === 'fulfilled' && 'value' in results[3] && (results[3].value.data as any)?.length > 0) {
                const fetchedTaxes = (results[3].value.data as any)
                setTaxes(fetchedTaxes)
                const defaultTax = fetchedTaxes.find((t: any) => t.isDefault) || fetchedTaxes[0]
                if (!isEditMode && formData.lines[0].taxRateId === '') {
                    setFormData(prev => ({ ...prev, lines: prev.lines.map((l, i) => i === 0 ? { ...l, taxRateId: defaultTax.id } : l) }))
                }
            }
        } catch (error) { console.error('Data load fail', error) }
    }

    const loadDocument = async (docId: string) => {
        try {
            const res = await api.get(`/documents/${docId}`)
            const doc = res.data
            const mappedLines = doc.lines.map((l: any) => ({
                description: l.description,
                quantity: l.quantity,
                unitPrice: l.unitPrice,
                discount: l.discount || 0,
                taxRateId: l.taxRateId || '',
                fodec: l.fodec,
                subtotal: l.subtotal,
                total: l.total,
                productId: l.productId
            }))
            setFormData({
                type: doc.type,
                clientId: doc.clientId,
                issueDate: doc.issueDate ? new Date(doc.issueDate).toISOString().split('T')[0] : '',
                dueDate: doc.dueDate ? new Date(doc.dueDate).toISOString().split('T')[0] : '',
                currency: doc.currency,
                paymentMethodId: doc.paymentMethodId || '',
                notes: doc.notes || '',
                timbreFiscale: doc.timbreFiscal || 0,
                lines: mappedLines
            })
        } catch (error) { console.error('Doc load fail', error) }
    }

    const handleCreateClient = async () => {
        let fullName = newClientData.type === 'PROFESSIONAL' ? (newClientData.companyName || `${newClientData.firstName} ${newClientData.lastName}`.trim()) : `${newClientData.firstName} ${newClientData.lastName}`.trim()
        if (!fullName) { alert('Nom requis'); return }
        try {
            const res = await api.post('/clients', { ...newClientData, name: fullName, legalName: newClientData.legalName || fullName })
            setClients([...clients, res.data])
            setFormData({ ...formData, clientId: res.data.id })
            setIsNewClientMode(false)
        } catch (err: any) { alert(err.response?.data?.message || 'Erreur création client') }
    }

    const addLine = () => {
        setFormData({ ...formData, lines: [...formData.lines, { description: '', quantity: 1, unitPrice: 0, discount: 0, taxRateId: taxes[0]?.id || '', fodec: false, subtotal: 0, total: 0 }] })
    }
    const removeLine = (index: number) => {
        if (formData.lines.length === 1) return
        setFormData({ ...formData, lines: formData.lines.filter((_, i) => i !== index) })
    }
    const updateLine = (index: number, field: keyof DocumentLine, value: any) => {
        const newLines = [...formData.lines]
        newLines[index] = { ...newLines[index], [field]: value }
        if (field === 'description') {
            const product = products.find(p => p.title === value)
            if (product) { newLines[index].productId = product.id; newLines[index].unitPrice = product.sellingPrice }
        }
        calculateLineTotal(newLines[index])
        setFormData({ ...formData, lines: newLines })
    }

    const calculateLineTotal = (line: DocumentLine) => {
        const subtotal = Math.max(0, (line.quantity * line.unitPrice) - (line.quantity * line.unitPrice * (line.discount / 100)))
        line.subtotal = subtotal
        const taxBase = subtotal + (line.fodec ? subtotal * 0.01 : 0)
        const tax = taxes.find(t => t.id === line.taxRateId)
        line.total = taxBase + (tax ? taxBase * (tax.rate / 100) : 0)
    }

    const calculateDocTotals = () => {
        const totalHT = formData.lines.reduce((sum, l) => sum + l.subtotal, 0)
        const totalFodec = formData.lines.reduce((sum, l) => sum + (l.fodec ? l.subtotal * 0.01 : 0), 0)
        const totalTva = formData.lines.reduce((sum, l) => {
            const base = l.subtotal + (l.fodec ? l.subtotal * 0.01 : 0)
            const tax = taxes.find(t => t.id === l.taxRateId)
            return sum + (tax ? base * tax.rate / 100 : 0)
        }, 0)
        return { totalHT, totalFodec, totalTva, totalTTC: totalHT + totalFodec + totalTva + formData.timbreFiscale }
    }

    const totals = calculateDocTotals()

    const handleConvert = async () => {
        if (!isEditMode || !id) return
        setLoading(true)
        try {
            const res = await api.post(`/documents/${id}/convert`)
            alert('Facture créée !')
            navigate(`/dashboard/documents/${res.data.id}/edit`)
        } catch (error) { setLoading(false) }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.clientId) { alert('Client requis'); return }
        setLoading(true)
        try {
            const payload = { ...formData, total: totals.totalTTC, taxTotal: totals.totalTva, subtotal: totals.totalHT }
            if (isEditMode) await api.put(`/documents/${id}`, payload)
            else await api.post('/documents', payload)
            navigate('/dashboard/sales')
        } catch (error) { setLoading(false) }
    }

    return (
        <div className="space-y-6 animate-fade-in pb-20 font-outfit min-h-screen" style={{ background: 'transparent' }}>
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-card p-6 lg:p-8 rounded-3xl border border-app shadow-sm transition-colors">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <button onClick={() => navigate('/dashboard/sales')} className="p-2.5 hover:bg-app rounded-xl transition-all active:scale-95 text-muted hover:text-app">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-600/10 px-3 py-1 rounded-full uppercase tracking-widest border border-blue-600/20">
                            Flux Commercial • {isEditMode ? 'Édition' : 'Création'}
                        </span>
                    </div>
                    <h1 className="text-3xl lg:text-4xl font-black text-app tracking-tight">
                        {isEditMode ? 'Modifier' : 'Nouveau'} <span className="text-blue-600">Document</span>
                    </h1>
                </div>

                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    {isEditMode && (formData.type === 'QUOTE' || formData.type === 'SALES_ORDER') && (
                        <button type="button" onClick={handleConvert} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-purple-600/10 text-purple-600 border border-purple-600/20 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-purple-600/20 transition-all">
                            <RefreshCcw className="w-4 h-4" /> Convertir en Facture
                        </button>
                    )}
                    <button type="button" onClick={() => navigate('/dashboard/sales')} className="flex-1 md:flex-none flex items-center justify-center px-6 py-3 bg-card border border-app text-muted rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-app transition-all">
                        Annuler
                    </button>
                    <button onClick={handleSubmit} disabled={loading} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-600/20 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50">
                        <Save className="w-4 h-4" /> {loading ? 'Enregistrement...' : 'Valider'}
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Left Side: General Config */}
                <div className="xl:col-span-2 space-y-8">
                    <div className="bg-card rounded-[2.5rem] border border-app p-8 lg:p-10 shadow-sm space-y-10 transition-colors">
                        <div className="flex items-center gap-4 border-b border-app pb-6">
                            <div className="w-10 h-10 rounded-xl bg-app flex items-center justify-center text-blue-600 border border-app">
                                <FileText className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-bold text-app tracking-tight">Configuration Générale</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1 block">Nature du Document</label>
                                <select className="w-full bg-app border border-app text-app rounded-xl py-3 px-4 font-bold text-sm appearance-none cursor-pointer focus:border-blue-500 outline-none transition-all" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })}>
                                    <option value="QUOTE" className="bg-card">Devis</option>
                                    <option value="SALES_ORDER" className="bg-card">Bon de Commande</option>
                                    <option value="DELIVERY_NOTE" className="bg-card">Bon de Livraison</option>
                                    <option value="INVOICE" className="bg-card">Facture de Vente</option>
                                    <option value="STOCK_OUTPUT" className="bg-card">Bon de Sortie</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1 block">Date d'Émission</label>
                                <input type="date" value={formData.issueDate} onChange={e => setFormData({ ...formData, issueDate: e.target.value })} className="w-full bg-app border border-app text-app rounded-xl py-3 px-4 font-bold text-sm focus:border-blue-500 outline-none transition-all" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1 block">Échéance</label>
                                <input type="date" value={formData.dueDate} onChange={e => setFormData({ ...formData, dueDate: e.target.value })} className="w-full bg-app border border-app text-rose-500 rounded-xl py-3 px-4 font-bold text-sm focus:border-blue-500 outline-none transition-all" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1 block">Devise</label>
                                <select className="w-full bg-app border border-app text-app rounded-xl py-3 px-4 font-bold text-sm appearance-none cursor-pointer focus:border-blue-500 outline-none transition-all" value={formData.currency} onChange={e => setFormData({ ...formData, currency: e.target.value })}>
                                    <option value="TND" className="bg-card">TND (Dinar Tunisien)</option>
                                    <option value="EUR" className="bg-card">EUR (Euro)</option>
                                    <option value="USD" className="bg-card">USD (Dollar)</option>
                                </select>
                            </div>
                        </div>

                        {/* Client Selection Module */}
                        <div className="pt-8 border-t border-app">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest flex items-center gap-2">
                                    <UserPlus className="w-4 h-4 text-blue-600" /> Informations Client
                                </h3>
                                {!isNewClientMode && (
                                    <button type="button" onClick={() => setIsNewClientMode(true)} className="text-[10px] font-bold text-blue-600 hover:bg-blue-600/10 transition-colors uppercase tracking-widest px-4 py-2 rounded-xl">
                                        + Nouveau Client
                                    </button>
                                )}
                            </div>

                            {!isNewClientMode ? (
                                <div className="relative group">
                                    <select className="w-full bg-app border border-app text-app rounded-2xl py-4 px-6 font-bold text-lg appearance-none cursor-pointer focus:border-blue-600 focus:bg-card outline-none transition-all shadow-sm" value={formData.clientId} onChange={e => setFormData({ ...formData, clientId: e.target.value })}>
                                        <option value="" className="bg-card">Sélectionner un client...</option>
                                        {clients.map(c => <option key={c.id} value={c.id} className="bg-card">{c.name} {c.fiscalNumber ? `• MF: ${c.fiscalNumber}` : ''}</option>)}
                                    </select>
                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-muted group-hover:text-blue-600 transition-colors">
                                        <ChevronRight className="rotate-90 w-5 h-5" />
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-app p-8 rounded-[2rem] border border-app animate-slide-up space-y-6 relative">
                                    <button onClick={() => setIsNewClientMode(false)} className="absolute top-6 right-6 p-2 text-muted hover:text-app transition-colors">
                                        <X className="w-5 h-5" />
                                    </button>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="md:col-span-2 flex gap-8">
                                            {['PROFESSIONAL', 'INDIVIDUAL'].map(t => (
                                                <label key={t} className="flex items-center gap-2.5 cursor-pointer group">
                                                    <input type="radio" className="sr-only peer" checked={newClientData.type === t} onChange={() => setNewClientData({ ...newClientData, type: t as any })} />
                                                    <div className="w-5 h-5 rounded-full border-2 border-app peer-checked:border-blue-600 flex items-center justify-center transition-all">
                                                        <div className="w-2.5 h-2.5 bg-blue-600 rounded-full scale-0 peer-checked:scale-100 transition-transform"></div>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-muted peer-checked:text-app uppercase tracking-widest transition-colors">
                                                        {t === 'PROFESSIONAL' ? 'Professionnel' : 'Particulier'}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                        {newClientData.type === 'PROFESSIONAL' ? (
                                            <>
                                                <div className="md:col-span-2 space-y-1">
                                                    <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Raison Sociale *</label>
                                                    <input className="w-full bg-card border border-app text-app rounded-xl py-3 px-4 font-bold focus:border-blue-500 outline-none transition-all" placeholder="Nom de l'entreprise" value={newClientData.companyName} onChange={e => setNewClientData({ ...newClientData, companyName: e.target.value })} />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Matricule Fiscal</label>
                                                    <input className="w-full bg-card border border-app text-blue-600 font-mono rounded-xl py-3 px-4 font-bold focus:border-blue-500 outline-none transition-all" placeholder="0000000/X/M/000" value={newClientData.fiscalNumber} onChange={e => setNewClientData({ ...newClientData, fiscalNumber: e.target.value })} />
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Prénom</label>
                                                    <input className="w-full bg-card border border-app text-app rounded-xl py-3 px-4 font-bold focus:border-blue-500 outline-none transition-all" value={newClientData.firstName} onChange={e => setNewClientData({ ...newClientData, firstName: e.target.value })} />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Nom</label>
                                                    <input className="w-full bg-card border border-app text-app rounded-xl py-3 px-4 font-bold focus:border-blue-500 outline-none transition-all" value={newClientData.lastName} onChange={e => setNewClientData({ ...newClientData, lastName: e.target.value })} />
                                                </div>
                                            </>
                                        )}
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Email</label>
                                            <input className="w-full bg-card border border-app text-app rounded-xl py-3 px-4 font-bold focus:border-blue-500 outline-none transition-all" value={newClientData.email} onChange={e => setNewClientData({ ...newClientData, email: e.target.value })} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Téléphone</label>
                                            <input className="w-full bg-card border border-app text-app rounded-xl py-3 px-4 font-bold focus:border-blue-500 outline-none transition-all" value={newClientData.phone} onChange={e => setNewClientData({ ...newClientData, phone: e.target.value })} />
                                        </div>
                                    </div>
                                    <button type="button" onClick={handleCreateClient} className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-black transition-all shadow-md active:scale-95">
                                        Enregistrer et Sélectionner
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Lines Management Table */}
                    <div className="bg-card rounded-[2.5rem] border border-app p-8 lg:p-10 shadow-sm space-y-6 transition-colors">
                        <div className="flex items-center gap-4 border-b border-app pb-6">
                            <div className="w-10 h-10 rounded-xl bg-app flex items-center justify-center text-blue-600 border border-app">
                                <Package className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-bold text-app tracking-tight">Articles & Services</h2>
                        </div>

                        <div className="overflow-x-auto rounded-2xl border border-app">
                            <table className="w-full">
                                <thead className="bg-app text-[10px] font-bold text-muted uppercase tracking-widest">
                                    <tr>
                                        <th className="py-4 px-4 text-center w-12">#</th>
                                        <th className="py-4 px-4 text-left">Désignation</th>
                                        <th className="py-4 px-4 text-center w-24">QTÉ</th>
                                        <th className="py-4 px-4 text-right w-32">P.U HT</th>
                                        <th className="py-4 px-4 text-center w-20">REM.%</th>
                                        <th className="py-4 px-4 text-left w-24">TVA</th>
                                        <th className="py-4 px-4 text-center w-16">FODEC</th>
                                        <th className="py-4 px-4 text-right w-32">TOTAL HT</th>
                                        <th className="py-4 px-4 w-12"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y border-app" style={{ borderColor: 'var(--app-border)' }}>
                                    {formData.lines.map((line, idx) => (
                                        <tr key={idx} className="group hover:bg-app/30 transition-colors border-b border-app" style={{ borderColor: 'var(--app-border)' }}>
                                            <td className="py-6 px-4 text-xs font-bold text-muted text-center">{idx + 1}</td>
                                            <td className="py-6 px-4 min-w-[200px]">
                                                <input className="w-full bg-transparent border-b border-app focus:border-blue-500 focus:ring-0 px-0 py-1 text-app font-bold outline-none placeholder:text-muted" placeholder="Rechercher ou saisir l'article..." value={line.description} onChange={e => updateLine(idx, 'description', e.target.value)} list={`p-list-${idx}`} />
                                                <datalist id={`p-list-${idx}`}>{products.map(p => <option key={p.id} value={p.title} />)}</datalist>
                                                {line.productId && <span className="text-[8px] font-bold text-blue-500 uppercase tracking-widest mt-1 block">Référencé</span>}
                                            </td>
                                            <td className="py-6 px-4">
                                                <input type="number" className="w-full bg-app border border-app rounded-lg py-1.5 px-2 text-app text-center font-bold focus:bg-card focus:border-blue-500 outline-none transition-all" value={line.quantity} onChange={e => updateLine(idx, 'quantity', parseFloat(e.target.value) || 0)} />
                                            </td>
                                            <td className="py-6 px-4">
                                                <input type="number" step="0.001" className="w-full bg-app border border-app rounded-lg py-1.5 px-2 text-app text-right font-bold focus:bg-card focus:border-blue-500 outline-none transition-all" value={line.unitPrice} onChange={e => updateLine(idx, 'unitPrice', parseFloat(e.target.value) || 0)} />
                                            </td>
                                            <td className="py-6 px-4">
                                                <input type="number" className="w-full bg-app border border-app rounded-lg py-1.5 px-2 text-rose-600 text-center font-bold focus:bg-card focus:border-blue-500 outline-none transition-all" value={line.discount} onChange={e => updateLine(idx, 'discount', parseFloat(e.target.value) || 0)} />
                                            </td>
                                            <td className="py-6 px-4">
                                                <select className="w-full bg-app border border-app rounded-lg py-1.5 px-2 text-muted font-bold text-[10px] uppercase focus:bg-card focus:border-blue-500 outline-none transition-all cursor-pointer" value={line.taxRateId} onChange={e => updateLine(idx, 'taxRateId', e.target.value)}>
                                                    <option value="" className="bg-card">0%</option>
                                                    {taxes.map(t => <option key={t.id} value={t.id} className="bg-card">{t.name}</option>)}
                                                </select>
                                            </td>
                                            <td className="py-6 px-4 text-center">
                                                <input type="checkbox" className="w-4 h-4 text-blue-600 rounded border-app bg-app focus:ring-blue-500" checked={line.fodec} onChange={e => updateLine(idx, 'fodec', e.target.checked)} />
                                            </td>
                                            <td className="py-6 px-4 text-right">
                                                <div className="text-sm font-black text-app">{line.subtotal.toFixed(3)}</div>
                                            </td>
                                            <td className="py-6 px-4 text-center">
                                                <button type="button" onClick={() => removeLine(idx)} className="p-2 text-muted/40 hover:text-red-500 transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <button type="button" onClick={addLine} className="flex items-center gap-2 px-6 py-4 border border-dashed border-app text-muted hover:text-blue-600 hover:bg-blue-600/10 rounded-2xl w-full justify-center transition-all group active:scale-[0.99] font-bold text-xs uppercase tracking-widest">
                            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                            Ajouter une ligne
                        </button>
                    </div>
                </div>

                {/* Right Side: Totals & Summary */}
                <div className="xl:col-span-1 space-y-8">
                    {/* Settlement Settings Card */}
                    <div className="bg-card rounded-[2.5rem] border border-app p-8 shadow-sm space-y-6 transition-colors">
                        <h3 className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1">Règlement & Notes</h3>
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <CreditCard className="w-3 h-3" /> Mode de Paiement
                                </label>
                                <select className="w-full bg-app border border-app text-app rounded-xl py-3 px-4 font-bold text-xs uppercase appearance-none cursor-pointer focus:border-blue-500 outline-none transition-all" value={formData.paymentMethodId} onChange={e => setFormData({ ...formData, paymentMethodId: e.target.value })}>
                                    <option value="" className="bg-card">Non Défini</option>
                                    {paymentMethods.map(m => <option key={m.id} value={m.id} className="bg-card">{m.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-muted uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <FileText className="w-3 h-3" /> Notes Conditions
                                </label>
                                <textarea className="w-full bg-app border border-app text-app rounded-xl py-4 px-4 text-sm font-medium h-32 focus:bg-card focus:border-blue-500 outline-none transition-all" placeholder="Notes visibles sur le document..." value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
                            </div>
                        </div>
                    </div>

                    {/* Summary Card */}
                    <div className="bg-gray-900 rounded-[2.5rem] p-10 shadow-xl relative overflow-hidden text-white">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[40px]"></div>
                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-8 text-center">Récapitulatif Financier</h3>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total HT</span>
                                <span className="text-lg font-black">{totals.totalHT.toFixed(3)}</span>
                            </div>
                            {totals.totalFodec > 0 && (
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">FODEC (1%)</span>
                                    <span className="text-lg font-black">{totals.totalFodec.toFixed(3)}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total TVA</span>
                                <span className="text-lg font-black">{totals.totalTva.toFixed(3)}</span>
                            </div>

                            <div className="flex justify-between items-center py-5 border-y border-white/5">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Timbre</span>
                                    <select className="bg-gray-800 border-none text-[9px] font-bold text-blue-400 uppercase tracking-widest rounded-lg px-2 py-1 outline-none" value={formData.timbreFiscale} onChange={e => setFormData({ ...formData, timbreFiscale: parseFloat(e.target.value) })}>
                                        <option value={1.0}>1.000</option>
                                        <option value={0.6}>0.600</option>
                                        <option value={0}>0.000</option>
                                    </select>
                                </div>
                                <span className="text-lg font-black">{formData.timbreFiscale.toFixed(3)}</span>
                            </div>

                            <div className="pt-6 flex flex-col items-center gap-1">
                                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-[0.3em]">Total TTC</span>
                                <div className="text-4xl lg:text-5xl font-black text-white tracking-tighter flex items-end gap-2">
                                    {totals.totalTTC.toFixed(3)}
                                    <span className="text-xs font-bold text-gray-500 mb-2">{formData.currency}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Guidance */}
                    <div className="bg-blue-600/10 border border-blue-600/20 rounded-2xl p-6">
                        <div className="flex gap-4 items-start">
                            <div className="w-10 h-10 rounded-xl bg-card border border-blue-600/20 flex items-center justify-center shrink-0">
                                <CheckCircle2 className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Système de Validation</p>
                                <p className="text-xs font-medium text-blue-500/70 leading-relaxed">Les calculs sont mis à jour instantanément. Pensez à vérifier l'échéance avant de valider.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    )
}
