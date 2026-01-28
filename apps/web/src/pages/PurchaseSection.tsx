import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import {
    Plus,
    Search,
    Trash2,
    Filter,
    ChevronRight,
    FileText,
    Coins,
    ShoppingBag,
    Receipt,
    Eye,
    Edit,
    ArrowUpRight,
    TrendingDown,
    Download
} from 'lucide-react'
import Modal from '../components/Modal'
import ExportModal from '../components/ExportModal'

interface PurchaseDocument {
    id: string
    number: string
    type: 'PURCHASE_ORDER' | 'GOODS_RECEIPT' | 'PURCHASE_INVOICE'
    supplierId: string
    supplierName: string
    issueDate: string
    dueDate: string
    total: number
    paidAmount?: number
    status: string
    nature: 'PRODUCT' | 'CHARGE'
    paymentStatus: string
}

interface Supplier {
    id: string
    name: string
    email: string
    phone: string
}

export default function PurchaseSection() {
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const [documents, setDocuments] = useState<PurchaseDocument[]>([])
    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const [loading, setLoading] = useState(true)
    const [filterNature, setFilterNature] = useState<string>('')
    const [filterSupplier, setFilterSupplier] = useState<string>('')
    const [searchTerm, setSearchTerm] = useState<string>('')

    // Regulation State
    const [showRegModal, setShowRegModal] = useState(false)
    const [selectedDoc, setSelectedDoc] = useState<PurchaseDocument | null>(null)
    const [regAmount, setRegAmount] = useState<number>(0)
    const [paymentMode, setPaymentMode] = useState('CASH')
    const [paymentHistory, setPaymentHistory] = useState<any[]>([])
    const [loadingPayments, setLoadingPayments] = useState(false)
    const [attachment, setAttachment] = useState<{ base64: string; type: string } | null>(null)
    const [attachmentName, setAttachmentName] = useState<string>('')

    // Export State
    const [showExportModal, setShowExportModal] = useState(false)

    const documentCategories = [
        {
            id: 'PRODUCT',
            label: 'Achat Articles',
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
            icon: ShoppingBag,
            desc: "Réapprovisionnement des stocks produits",
            action: () => navigate(`/dashboard/purchase/create?type=PURCHASE_INVOICE&purchaseType=PRODUCT`)
        },
        {
            id: 'IMPORT',
            label: 'Import Facture',
            color: 'text-blue-600',
            bg: 'bg-blue-50',
            icon: FileText,
            desc: "Paiement direct de factures externes",
            action: () => navigate(`/dashboard/purchase/create?type=PURCHASE_INVOICE&purchaseType=PRODUCT&mode=IMPORT`)
        },
        {
            id: 'CHARGE',
            label: 'Frais de Structure',
            color: 'text-rose-600',
            bg: 'bg-rose-50',
            icon: Receipt,
            desc: "Loyer, Électricité, Gaz et charges fixes",
            action: () => navigate(`/dashboard/purchase/create?type=PURCHASE_INVOICE&purchaseType=CHARGE`)
        },
    ]

    useEffect(() => {
        if (!user) { navigate('/login'); return }
        loadData()
    }, [user, navigate])

    const loadData = async () => {
        try {
            setLoading(true)
            const [docsRes, suppliersRes] = await Promise.all([
                api.get('/purchase-orders'),
                api.get('/suppliers')
            ])
            setDocuments(docsRes.data || [])
            setSuppliers(suppliersRes.data || [])
        } catch (error) { console.error(error) } finally { setLoading(false) }
    }

    const handleDelete = async (id: string) => {
        if (!window.confirm('Supprimer cet enregistrement ?')) return
        try { await api.delete(`/purchase-orders/${id}`); loadData() } catch (error) { alert('Erreur') }
    }

    const openRegulation = async (doc: PurchaseDocument) => {
        setSelectedDoc(doc)
        setRegAmount(0)
        setAttachment(null)
        setAttachmentName('')
        setShowRegModal(true)

        setLoadingPayments(true)
        try {
            const res = await api.get(`/purchase-orders/${doc.id}/payments`)
            setPaymentHistory(res.data || [])
        } catch (error) {
            setPaymentHistory([])
        } finally {
            setLoadingPayments(false)
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setAttachmentName(file.name)
            const reader = new FileReader()
            reader.onload = () => {
                setAttachment({ base64: reader.result as string, type: file.type })
            }
            reader.readAsDataURL(file)
        }
    }

    const submitRegulation = async () => {
        if (!selectedDoc) return
        if (regAmount <= 0) return alert('Montant invalide')

        try {
            await api.post(`/purchase-orders/${selectedDoc.id}/payments`, {
                amount: regAmount,
                paymentMode,
                notes: `Règlement pour ${selectedDoc.number || selectedDoc.id}`,
                attachmentUrl: attachment?.base64,
                attachmentType: attachment?.type
            })
            alert('Règlement enregistré !')
            setShowRegModal(false)
            loadData()
        } catch (error) {
            alert('Erreur lors du règlement')
        }
    }

    const filteredDocuments = documents.filter(doc => {
        const supplierMatch = !filterSupplier || doc.supplierId === filterSupplier
        const natureMatch = !filterNature || doc.nature === filterNature
        const searchMatch = !searchTerm || doc.number.toLowerCase().includes(searchTerm.toLowerCase()) || doc.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
        return supplierMatch && natureMatch && searchMatch
    })

    return (
        <div className="min-h-screen space-y-8 animate-fade-in pb-20" style={{ background: 'transparent' }}>
            {/* Premium Header */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 bg-card p-10 rounded-[2.5rem] border border-app shadow-xl shadow-gray-200/20 relative overflow-hidden transition-colors">
                <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500 rounded-full blur-[100px] -mr-40 -mt-40 opacity-10"></div>

                <div className="flex items-center gap-6 relative z-10">
                    <div className="w-16 h-16 bg-blue-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-blue-600/20">
                        <ShoppingBag className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-4xl lg:text-6xl font-black text-app tracking-tighter leading-none uppercase">
                            Registre <span className="text-blue-600">Achats</span>
                        </h1>
                        <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mt-2 leading-relaxed">
                            Supervision des <span className="text-blue-600">acquisitions stratégiques</span>.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-6 bg-app p-6 rounded-[2rem] border border-app shadow-inner relative z-10 shrink-0">
                    <div className="w-14 h-14 rounded-2xl bg-card border border-app flex items-center justify-center text-rose-500 shadow-sm">
                        <TrendingDown className="w-7 h-7" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-muted uppercase tracking-widest leading-none mb-1.5 pl-1">Volume Mensuel</p>
                        <p className="text-2xl font-black text-app tracking-tighter">
                            {documents.reduce((acc, d) => acc + d.total, 0).toLocaleString()} <span className="text-xs text-blue-600 ml-1">TND</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Strategic Acquisition Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {documentCategories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={cat.action}
                        className="group bg-card border border-app p-10 rounded-[2.5rem] shadow-xl shadow-gray-200/50 hover:shadow-2xl hover:scale-[1.02] hover:border-blue-600 transition-all duration-500 text-left relative overflow-hidden"
                    >
                        <div className={`w-16 h-16 rounded-2xl ${cat.bg} ${cat.color} flex items-center justify-center mb-8 shadow-inner group-hover:rotate-12 transition-transform`}>
                            <cat.icon className="w-8 h-8" />
                        </div>

                        <h3 className="text-2xl font-black text-app uppercase tracking-tight mb-3">{cat.label}</h3>
                        <p className="text-xs font-black text-muted leading-relaxed mb-8 uppercase tracking-widest">{cat.desc}</p>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-app opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all font-black text-[10px] uppercase tracking-widest">
                                Ouvrir Dossier <ArrowUpRight className="w-4 h-4" />
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-app flex items-center justify-center text-muted">
                                <Plus className="w-5 h-5" />
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            {/* Filters Section */}
            <div className="bg-card rounded-[2.5rem] border border-app p-8 shadow-xl flex flex-col xl:flex-row gap-6 transition-colors">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="relative group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-blue-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Recherche rapide..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-app border border-app rounded-2xl py-5 pl-14 pr-10 text-[10px] font-black uppercase tracking-widest text-app outline-none focus:ring-4 focus:ring-blue-600/5 transition-all"
                        />
                    </div>

                    <div className="relative group">
                        <Filter className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-muted transition-colors group-focus-within:text-blue-600" />
                        <select value={filterNature} onChange={(e) => setFilterNature(e.target.value)} className="w-full bg-app border border-app rounded-2xl py-5 pl-16 pr-10 text-[10px] font-black uppercase tracking-widest text-app appearance-none outline-none focus:ring-4 focus:ring-blue-600/5 transition-all cursor-pointer">
                            <option value="">Toutes Natures Flux</option>
                            <option value="PRODUCT">Acquisition Stock</option>
                            <option value="CHARGE">Charges Structurelles</option>
                        </select>
                        <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 rotate-90" />
                    </div>

                    <div className="relative group">
                        <Filter className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-muted transition-colors group-focus-within:text-blue-600" />
                        <select value={filterSupplier} onChange={(e) => setFilterSupplier(e.target.value)} className="w-full bg-app border border-app rounded-2xl py-5 pl-16 pr-10 text-[10px] font-black uppercase tracking-widest text-app appearance-none outline-none focus:ring-4 focus:ring-blue-600/5 transition-all cursor-pointer">
                            <option value="">Source Fournisseur</option>
                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 rotate-90" />
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => setShowExportModal(true)}
                        className="px-10 py-5 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-emerald-600/10 hover:shadow-emerald-600/20 active:scale-95 flex items-center justify-center gap-3"
                    >
                        <Download className="w-4 h-4" />
                        Exporter
                    </button>
                    <button onClick={loadData} className="px-10 py-5 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-gray-900/10 hover:scale-105 active:scale-95 transition-all">
                        Actualiser les Dépenses
                    </button>
                </div>
            </div>

            {/* Table Section */}
            <div className="bg-card rounded-[3rem] border border-app shadow-xl overflow-hidden relative transition-colors">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                <div className="p-8 border-b border-app flex justify-between items-center bg-app/20">
                    <h3 className="text-xl font-black text-app uppercase tracking-tight flex items-center gap-4">
                        <Receipt className="w-6 h-6 text-blue-600" /> Registre des Acquisitions
                    </h3>
                    <span className="text-[10px] font-black text-muted uppercase tracking-widest bg-card px-4 py-2 rounded-xl border border-app shadow-sm">{filteredDocuments.length} écritures comptables</span>
                </div>

                {loading ? (
                    <div className="py-32 flex flex-col items-center gap-4">
                        <div className="w-12 h-12 rounded-full border-4 border-app border-t-blue-600 animate-spin"></div>
                        <p className="text-[10px] font-bold text-muted uppercase tracking-widest animate-pulse">Séquençage des dépenses...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-[10px] font-black text-muted uppercase tracking-[0.2em] border-b border-app">
                                    <th className="px-8 py-6">Date / Référence</th>
                                    <th className="px-8 py-6">Fournisseur / Nature</th>
                                    <th className="px-8 py-6 text-right">Montant Total</th>
                                    <th className="px-8 py-6 text-center">Règlement</th>
                                    <th className="px-8 py-6 text-center">Statut</th>
                                    <th className="px-8 py-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y border-app">
                                {filteredDocuments.map((doc) => (
                                    <tr key={doc.id} className="hover:bg-app/50 transition-all group border-b border-app">
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">{new Date(doc.issueDate).toLocaleDateString()}</span>
                                                <span className="font-black text-app tracking-tighter uppercase group-hover:text-blue-600 transition-colors">#{doc.number}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className="font-black text-app tracking-tight uppercase">{doc.supplierName}</span>
                                                <span className="text-[8px] font-black text-muted uppercase tracking-[0.2em] mt-1 bg-app border border-app px-2 py-0.5 rounded-md inline-block w-fit">{doc.nature}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="text-lg font-black text-app tracking-tighter">{doc.total.toLocaleString(undefined, { minimumFractionDigits: 3 })}</span>
                                                <span className="text-[9px] font-black text-muted uppercase tracking-widest">TND</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="flex justify-center">
                                                <button onClick={() => openRegulation(doc)} className={`px-4 py-2 rounded-xl border flex items-center gap-2 font-black text-[10px] uppercase tracking-widest transition-all ${(doc.paidAmount || 0) >= doc.total ? 'bg-emerald-600/10 border-emerald-600/20 text-emerald-600' :
                                                    (doc.paidAmount || 0) >= (doc.total * 0.4) ? 'bg-orange-600/10 border-orange-600/20 text-orange-600' :
                                                        'bg-rose-600/10 border-rose-600/20 text-rose-600'
                                                    }`}>
                                                    <div className={`w-2 h-2 rounded-full ${(doc.paidAmount || 0) >= doc.total ? 'bg-emerald-500' : (doc.paidAmount || 0) >= (doc.total * 0.4) ? 'bg-orange-500' : 'bg-rose-500'}`}></div>
                                                    {((doc.paidAmount || 0) / doc.total * 100).toFixed(0)}% Payé
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] border ${doc.status === 'PAID' ? 'bg-emerald-600/10 text-emerald-600 border-emerald-600/20' : doc.status === 'PARTIALLY_PAID' ? 'bg-orange-600/10 text-orange-600 border-orange-600/20' : 'bg-rose-600/10 text-rose-600 border-rose-600/20'}`}>
                                                {doc.status === 'PAID' ? 'Réglé' : doc.status === 'PARTIALLY_PAID' ? 'Partiel' : 'Impayé'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                                <button onClick={() => navigate(`/dashboard/purchase/${doc.id}`)} title="Voir Détails" className="p-3 bg-card text-muted hover:text-blue-600 rounded-xl border border-app hover:shadow-md transition-all"><Eye className="w-4 h-4" /></button>
                                                <button onClick={() => navigate(`/dashboard/purchase/${doc.id}/edit`)} title="Modifier" className="p-3 bg-card text-muted hover:text-emerald-600 rounded-xl border border-app hover:shadow-md transition-all"><Edit className="w-4 h-4" /></button>
                                                <button onClick={() => openRegulation(doc)} title="Régler" className="p-3 bg-card text-muted hover:text-orange-600 rounded-xl border border-app hover:shadow-md transition-all"><Coins className="w-4 h-4" /></button>
                                                <button onClick={() => handleDelete(doc.id)} title="Supprimer" className="p-3 bg-card text-muted hover:text-rose-600 rounded-xl border border-app hover:shadow-md transition-all"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Regulation Modal */}
            <Modal isOpen={showRegModal} onClose={() => setShowRegModal(false)} title="Gestion des Règlements" size="lg">
                <div className="space-y-6 py-4">
                    <div className="bg-blue-600/5 p-6 rounded-2xl border border-blue-600/20 flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Montant Total à Régler</p>
                            <p className="text-2xl font-black text-app">{selectedDoc?.total.toFixed(3)} <span className="text-xs">TND</span></p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Déjà Payé</p>
                            <p className="text-xl font-bold text-blue-600">{(selectedDoc?.paidAmount || 0).toFixed(3)}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-end mb-1">
                            <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Montant à régler</label>
                            <span className="text-xs font-black text-blue-600 bg-blue-600/10 px-2 py-0.5 rounded-lg">Reste: {((selectedDoc?.total || 0) - (selectedDoc?.paidAmount || 0)).toFixed(3)}</span>
                        </div>

                        <div className="relative">
                            <input
                                type="number"
                                step="0.001"
                                value={regAmount}
                                onChange={(e) => setRegAmount(Math.min(parseFloat(e.target.value) || 0, (selectedDoc?.total || 0) - (selectedDoc?.paidAmount || 0)))}
                                className="w-full bg-app border border-app rounded-2xl p-6 text-center font-black text-3xl text-app outline-none focus:ring-4 focus:ring-blue-600/5 transition-all"
                            />
                        </div>

                        <div className="px-2">
                            <input
                                type="range"
                                min="0"
                                max={(selectedDoc?.total || 0) - (selectedDoc?.paidAmount || 0)}
                                step="0.001"
                                value={regAmount}
                                onChange={(e) => setRegAmount(parseFloat(e.target.value))}
                                className="w-full h-2 bg-app rounded-lg appearance-none cursor-pointer accent-blue-600 border border-app"
                            />
                            <div className="flex justify-between mt-2 text-[9px] font-bold text-muted uppercase tracking-tighter">
                                <span>0 TND</span>
                                <span>{((selectedDoc?.total || 0) - (selectedDoc?.paidAmount || 0)).toFixed(3)} TND</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Mode de Règlement</label>
                        <div className="grid grid-cols-3 gap-3">
                            {['CASH', 'CHECK', 'TRANSFER'].map(mode => (
                                <button
                                    key={mode}
                                    onClick={() => setPaymentMode(mode)}
                                    className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${paymentMode === mode ? 'bg-blue-600 text-white border-blue-700 shadow-lg' : 'bg-app text-muted border-app hover:bg-card'}`}
                                >
                                    {mode === 'CASH' ? 'Espèces' : mode === 'CHECK' ? 'Chèque' : 'Virement'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {(paymentMode === 'CHECK' || paymentMode === 'TRANSFER') && (
                        <div className="space-y-3 p-4 bg-blue-600/5 rounded-2xl border-2 border-dashed border-blue-600/20">
                            <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest block text-center">Justificatif Obligatoire ({paymentMode === 'CHECK' ? 'Chèque' : 'Virement'})</label>
                            <div className="relative group">
                                <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <div className="py-8 border-2 border-dashed border-blue-600/20 rounded-xl bg-app/50 group-hover:bg-app transition-all flex flex-col items-center justify-center gap-2">
                                    <div className="p-3 bg-blue-600/10 rounded-full text-blue-600">
                                        <Plus className="w-5 h-5" />
                                    </div>
                                    <p className="text-[10px] font-black text-app px-4 text-center">
                                        {attachmentName || "Cliquez pour importer (IMG ou PDF)"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {paymentHistory.length > 0 && (
                        <div className="space-y-3">
                            <h4 className="text-[10px] font-black text-app uppercase tracking-widest ml-1">Historique des Flux Sortants</h4>
                            <div className="bg-app rounded-2xl p-4 max-h-[200px] overflow-y-auto space-y-2 border border-app">
                                {loadingPayments ? (
                                    <div className="text-center py-4">
                                        <div className="inline-block w-6 h-6 border-2 border-app border-t-blue-600 rounded-full animate-spin"></div>
                                    </div>
                                ) : (
                                    paymentHistory.map((payment, idx) => (
                                        <div key={idx} className="bg-card p-3 rounded-xl border border-app flex items-center justify-between">
                                            <div className="flex-1">
                                                <p className="text-xs font-black text-app">{payment.amount?.toFixed(3)} TND</p>
                                                <p className="text-[9px] text-muted font-bold uppercase tracking-wider mt-0.5">
                                                    {payment.paymentMode === 'CASH' ? 'Espèces' : payment.paymentMode === 'CHECK' ? 'Chèque' : payment.paymentMode === 'TRANSFER' ? 'Virement' : payment.paymentMode}
                                                </p>
                                            </div>
                                            <div className="text-right flex flex-col items-end gap-1">
                                                <p className="text-[9px] text-muted font-bold">
                                                    {new Date(payment.paymentDate || payment.createdAt).toLocaleDateString('fr-FR')}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    <button onClick={submitRegulation} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-blue-600/20 hover:scale-[1.01] transition-all">
                        Enregistrer le paiement
                    </button>
                </div>
            </Modal>

            {/* Export Modal */}
            <ExportModal
                isOpen={showExportModal}
                onClose={() => setShowExportModal(false)}
                section="purchase"
                documents={documents}
                suppliers={suppliers}
            />
        </div>
    )
}
