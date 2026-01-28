import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { FileText, Edit, Trash2, Eye, ShoppingCart, Truck, Receipt, LogOut, ClipboardList, Check, Copy, Search, Filter, Calendar, TrendingUp, ChevronRight, Plus, Download } from 'lucide-react'
import Modal from '../components/Modal'
import ExportModal from '../components/ExportModal'

interface SalesDocument {
    id: string
    number: string
    type: 'QUOTE' | 'SALES_ORDER' | 'DELIVERY_NOTE' | 'INVOICE' | 'STOCK_OUTPUT'
    clientId: string
    client?: { name: string }
    clientName?: string
    issueDate: string
    dueDate: string
    total: number
    status: string
    paidAmount?: number
}

interface Client {
    id: string
    name: string
    firstName?: string
    lastName?: string
}

export default function SalesSection() {
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const [documents, setDocuments] = useState<SalesDocument[]>([])
    const [clients, setClients] = useState<Client[]>([])
    const [loading, setLoading] = useState(true)
    const [filterType, setFilterType] = useState<string>('')
    const [filterClient, setFilterClient] = useState<string>('')
    const [filterStatus, setFilterStatus] = useState<string>('')

    // Regulation State
    const [showRegModal, setShowRegModal] = useState(false)
    const [selectedDoc, setSelectedDoc] = useState<SalesDocument | null>(null)
    const [regAmount, setRegAmount] = useState<number>(0)
    const [paymentMode, setPaymentMode] = useState('CASH')
    const [paymentHistory, setPaymentHistory] = useState<any[]>([])
    const [loadingPayments, setLoadingPayments] = useState(false)
    const [attachment, setAttachment] = useState<{ base64: string; type: string } | null>(null)
    const [attachmentName, setAttachmentName] = useState<string>('')

    // Export State
    const [showExportModal, setShowExportModal] = useState(false)

    const documentTypes = [
        { value: 'QUOTE', label: 'Devis', color: 'text-blue-600', bg: 'bg-blue-50', icon: ClipboardList, desc: "Créez des estimations pour vos clients" },
        { value: 'SALES_ORDER', label: 'Commande', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: ShoppingCart, desc: "Gérez les commandes confirmées" },
        { value: 'DELIVERY_NOTE', label: 'Livraison', color: 'text-purple-600', bg: 'bg-purple-50', icon: Truck, desc: "Bons de livraison et expéditions" },
        { value: 'INVOICE', label: 'Facture', color: 'text-orange-600', bg: 'bg-orange-50', icon: Receipt, desc: "Facturez vos produits et services" },
        { value: 'STOCK_OUTPUT', label: 'Sortie Stock', color: 'text-indigo-600', bg: 'bg-indigo-50', icon: LogOut, desc: "Sorties de stock manuelles" },
    ]

    useEffect(() => {
        if (!user) { navigate('/login'); return }
        loadData()
    }, [user, navigate])

    const loadData = async () => {
        try {
            setLoading(true)
            const [docsRes, clientsRes] = await Promise.all([
                api.get('/documents'),
                api.get('/clients')
            ])
            setDocuments(docsRes.data || [])
            setClients(clientsRes.data || [])
        } catch (error) {
            console.error('Erreur chargement données:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (doc: SalesDocument) => {
        let message = 'Voulez-vous supprimer ce document ?'
        if (doc.status === 'TRASHED') message = 'ATTENTION: Voulez-vous supprimer ce document DÉFINITIVEMENT ?'
        else if (doc.status === 'VALIDATED') message = 'Ce document est validé. Êtes-vous sûr de vouloir le supprimer ?'

        if (window.confirm(message)) {
            try { await api.delete(`/documents/${doc.id}`); loadData() }
            catch (error) { alert('Erreur lors de la suppression') }
        }
    }

    const handleCopy = async (id: string, targetType: string) => {
        const typeLabel = documentTypes.find(t => t.value === targetType)?.label || targetType
        if (!window.confirm(`Voulez-vous créer une copie de ce document en tant que ${typeLabel} ?`)) return

        try {
            const res = await api.post(`/documents/${id}/copy`, { type: targetType })
            const newDoc = res.data
            alert(`${typeLabel} créé avec succès !`)
            navigate(`/dashboard/documents/${newDoc.id}/edit`)
        } catch (error: any) { alert(error.response?.data?.message || 'Erreur lors de la création de la copie') }
    }

    const handleConvert = (id: string) => {
        const target = window.prompt('Destination (FACT, DEVIS, BL, CMD, BS):', 'FACT')
        if (!target) return
        let typeMap: any = { 'FACT': 'INVOICE', 'DEVIS': 'QUOTE', 'BL': 'DELIVERY_NOTE', 'CMD': 'SALES_ORDER', 'BS': 'STOCK_OUTPUT' }
        const targetType = typeMap[target.toUpperCase()]
        if (targetType) handleCopy(id, targetType)
        else alert('Type invalide')
    }

    const openRegulation = async (doc: SalesDocument) => {
        setSelectedDoc(doc)
        setRegAmount(0) // Default to 0 new payment
        setAttachment(null)
        setAttachmentName('')
        setShowRegModal(true)

        // Fetch payment history
        setLoadingPayments(true)
        try {
            const res = await api.get(`/documents/${doc.id}/payments`)
            setPaymentHistory(res.data || [])
        } catch (error) {
            console.error('Error loading payment history:', error)
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
                setAttachment({
                    base64: reader.result as string,
                    type: file.type
                })
            }
            reader.readAsDataURL(file)
        }
    }

    const submitRegulation = async () => {
        if (!selectedDoc) return

        if (regAmount <= 0) {
            alert('Le montant du règlement doit être supérieur à zéro')
            return
        }

        // Obligatoire pour chèque et virement
        if ((paymentMode === 'CHECK' || paymentMode === 'TRANSFER') && !attachment) {
            alert(`Veuillez importer un justificatif (photo ou PDF) pour le règlement par ${paymentMode === 'CHECK' ? 'Chèque' : 'Virement'}`)
            return
        }

        try {
            await api.post(`/documents/${selectedDoc.id}/payments`, {
                amount: regAmount,
                paymentMode: paymentMode,
                notes: `Règlement ${paymentMode === 'CASH' ? 'Espèces' : paymentMode === 'CHECK' ? 'Chèque' : 'Virement'}`,
                attachmentUrl: attachment?.base64,
                attachmentType: attachment?.type
            })

            loadData()
            setShowRegModal(false)
            alert('Règlement enregistré avec succès')
        } catch (error: any) {
            console.error(error)
            alert(error.response?.data?.message || 'Erreur lors de l\'enregistrement du règlement')
        }
    }

    const filteredDocuments = documents.filter(doc => {
        const typeMatch = !filterType || doc.type === filterType
        const clientMatch = !filterClient || doc.clientId === filterClient
        const statusMatch = !filterStatus || doc.status === filterStatus
        return typeMatch && clientMatch && statusMatch
    })

    const getDocumentTypeInfo = (type: string) => documentTypes.find(dt => dt.value === type)

    return (
        <div className="min-h-screen space-y-10 animate-fade-in pb-20" style={{ background: 'transparent' }}>
            {/* Premium Header */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 bg-card p-10 rounded-[2.5rem] border border-app shadow-xl shadow-gray-200/20 relative overflow-hidden transition-colors">
                <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500 rounded-full blur-[100px] -mr-40 -mt-40 opacity-10"></div>

                <div className="flex items-center gap-6 relative z-10">
                    <div className="w-16 h-16 bg-blue-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-blue-600/20">
                        <Receipt className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-4xl lg:text-6xl font-black text-app tracking-tighter leading-none uppercase">
                            Opérations <span className="text-blue-600">Commerciales</span>
                        </h1>
                        <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mt-2 leading-relaxed">
                            Gouvernance des flux sortants et <span className="text-blue-600">cycle de facturation</span>.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-6 bg-app p-6 rounded-[2rem] border border-app shadow-inner relative z-10 shrink-0">
                    <div className="w-14 h-14 rounded-2xl bg-card border border-app flex items-center justify-center text-emerald-600 shadow-sm">
                        <TrendingUp className="w-7 h-7" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-muted uppercase tracking-widest leading-none mb-1.5 pl-1">Volume de Ventes</p>
                        <p className="text-2xl font-black text-app tracking-tighter">
                            {documents.filter(d => d.status !== 'TRASHED').reduce((sum, d) => sum + d.total, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-xs text-blue-600 ml-1">TND</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Premium Strategic Actions Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                {documentTypes.map(type => (
                    <button
                        key={type.value}
                        onClick={() => navigate(`/dashboard/documents/create?type=${type.value}`)}
                        className="group bg-card border border-app p-8 rounded-[2.5rem] shadow-xl hover:shadow-2xl hover:scale-105 hover:border-blue-600 transition-all duration-500 text-left relative overflow-hidden"
                    >
                        <div className={`w-14 h-14 rounded-2xl ${type.color} bg-blue-600/10 flex items-center justify-center mb-6 shadow-inner group-hover:rotate-12 transition-transform`}>
                            <type.icon className="w-7 h-7" />
                        </div>
                        <h3 className="text-sm font-black text-app uppercase tracking-tight mb-1 leading-none">{type.label}</h3>
                        <p className="text-[8px] font-bold text-muted uppercase tracking-widest leading-tight mb-4 group-hover:text-blue-500 transition-colors">{type.desc}</p>
                        <div className="flex items-center gap-2 text-[9px] font-black text-blue-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all">
                            Nouveau <Plus className="w-3.5 h-3.5" />
                        </div>
                    </button>
                ))}
            </div>

            {/* Modular Filtering System */}
            <div className="bg-card rounded-[2.5rem] border border-app p-8 shadow-xl flex flex-col xl:flex-row gap-6 transition-colors">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="relative group">
                        <Filter className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-blue-600 transition-colors" />
                        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full bg-app border border-app rounded-2xl py-5 pl-14 pr-10 text-[10px] font-black uppercase tracking-widest text-app appearance-none outline-none focus:ring-4 focus:ring-blue-600/5 transition-all cursor-pointer">
                            <option value="">Tous Actes</option>
                            {documentTypes.map(dt => <option key={dt.value} value={dt.value}>{dt.label}</option>)}
                        </select>
                        <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/30 rotate-90" />
                    </div>

                    <div className="relative group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-blue-600 transition-colors" />
                        <select value={filterClient} onChange={(e) => setFilterClient(e.target.value)} className="w-full bg-app border border-app rounded-2xl py-5 pl-14 pr-10 text-[10px] font-black uppercase tracking-widest text-app appearance-none outline-none focus:ring-4 focus:ring-blue-600/5 transition-all cursor-pointer">
                            <option value="">Clients Actifs</option>
                            {clients.map(c => <option key={c.id} value={c.id}>{c.name || `${c.firstName} ${c.lastName}`}</option>)}
                        </select>
                        <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/30 rotate-90" />
                    </div>

                    <div className="relative group">
                        <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-blue-600 transition-colors" />
                        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full bg-app border border-app rounded-2xl py-5 pl-14 pr-10 text-[10px] font-black uppercase tracking-widest text-app appearance-none outline-none focus:ring-4 focus:ring-blue-600/5 transition-all cursor-pointer">
                            <option value="">Cycle Statut</option>
                            <option value="DRAFT">Projet (Draft)</option>
                            <option value="VALIDATED">Protocole Validé</option>
                            <option value="TRASHED">Archives / Corbeille</option>
                        </select>
                        <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/30 rotate-90" />
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
                    <button onClick={loadData} className="px-10 py-5 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-gray-900/10 active:scale-95 flex items-center justify-center gap-3">
                        Actualiser les flux
                    </button>
                </div>
            </div>

            {/* High-Performance Documents Table */}
            <div className="bg-card rounded-[3rem] border border-app shadow-xl overflow-hidden relative transition-colors">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                <div className="p-8 border-b border-app bg-app/20 flex justify-between items-center">
                    <h2 className="text-xl font-black text-app uppercase tracking-tight flex items-center gap-4">
                        <FileText className="w-6 h-6 text-blue-600" /> Registre Chronologique
                    </h2>
                    <span className="text-[10px] font-black text-muted uppercase tracking-widest bg-card px-4 py-2 rounded-xl border border-app">{filteredDocuments.length} Documents Indexés</span>
                </div>

                {loading ? (
                    <div className="py-32 flex flex-col items-center gap-4">
                        <div className="w-12 h-12 rounded-full border-4 border-gray-100 border-t-blue-600 animate-spin"></div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest animate-pulse">Séquençage des registres...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-[10px] font-black text-muted uppercase tracking-[0.2em] border-b border-app">
                                    <th className="px-10 py-6">Référence Unique</th>
                                    <th className="px-10 py-6">Entité Bénéficiaire</th>
                                    <th className="px-10 py-6">Horodatage</th>
                                    <th className="px-10 py-6 text-right">Volume Net (TND)</th>
                                    <th className="px-10 py-6 text-center">Règlement</th>
                                    <th className="px-10 py-6 text-right">Habilitation</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y border-app" style={{ borderColor: 'var(--app-border)' }}>
                                {filteredDocuments.map(doc => {
                                    const typeInfo = getDocumentTypeInfo(doc.type)
                                    const isDraft = doc.status === 'DRAFT'
                                    const isTrashed = doc.status === 'TRASHED'

                                    return (
                                        <tr key={doc.id} className={`hover:bg-app/50 transition-all group border-b border-app ${isTrashed ? 'opacity-40 grayscale' : ''}`} style={{ borderColor: 'var(--app-border)' }}>
                                            <td className="px-10 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border border-app shadow-sm bg-app text-blue-600 group-hover:scale-110 transition-transform`}>
                                                        <FileText className="w-5 h-5" />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-black text-app uppercase text-sm tracking-tighter group-hover:text-blue-600 transition-colors">{doc.number || 'SYSTEM_DRAFT'}</span>
                                                        <span className={`text-[9px] font-black uppercase tracking-widest mt-0.5 ${isDraft ? 'text-amber-500' : 'text-blue-500'}`}>
                                                            Projet • {typeInfo?.label}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-6">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-app uppercase tracking-tight">{doc.client?.name || doc.clientName || 'ENTITÉ EXTERNE'}</span>
                                                    <span className="text-[9px] font-black text-muted uppercase tracking-widest mt-0.5">Partenaire Identifié</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-6">
                                                <div className="flex items-center gap-2 text-muted">
                                                    <Calendar className="w-3.5 h-3.5 opacity-40" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">{new Date(doc.issueDate).toLocaleDateString('fr-FR')}</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-6 text-right">
                                                <span className="text-xl font-black text-app tracking-tighter">{doc.total.toFixed(3)}</span>
                                            </td>
                                            <td className="px-10 py-6 text-center">
                                                <div className="flex justify-center">
                                                    <button onClick={() => openRegulation(doc)} className={`px-4 py-2 rounded-xl border flex items-center gap-2 font-black text-[10px] uppercase tracking-widest transition-all ${(doc.paidAmount || 0) >= doc.total ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                                                        (doc.paidAmount || 0) >= (doc.total * 0.4) ? 'bg-orange-50 border-orange-100 text-orange-600' :
                                                            'bg-rose-50 border-rose-100 text-rose-600'
                                                        }`}>
                                                        <div className={`w-2 h-2 rounded-full ${(doc.paidAmount || 0) >= doc.total ? 'bg-emerald-500' : (doc.paidAmount || 0) >= (doc.total * 0.4) ? 'bg-orange-500' : 'bg-rose-500'}`}></div>
                                                        {((doc.paidAmount || 0) / doc.total * 100).toFixed(0)}% Payé
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-10 py-6">
                                                <div className="flex justify-end gap-2 transition-all">
                                                    {isDraft && (
                                                        <button
                                                            onClick={async () => { if (confirm('Valider cet acte ?')) { await api.post(`/documents/${doc.id}/validate`); loadData(); } }}
                                                            className="p-3 bg-app text-emerald-600 hover:shadow-md rounded-xl border border-app transition-all"
                                                        >
                                                            <Check className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button onClick={() => navigate(`/dashboard/documents/${doc.id}`)} className="p-3 bg-app text-blue-600 hover:shadow-md rounded-xl border border-app transition-all"><Eye className="w-4 h-4" /></button>
                                                    <button onClick={() => navigate(`/dashboard/documents/${doc.id}/edit`)} className="p-3 bg-app text-indigo-600 hover:shadow-md rounded-xl border border-app transition-all"><Edit className="w-4 h-4" /></button>
                                                    <button onClick={() => handleConvert(doc.id)} className="p-3 bg-app text-amber-600 hover:shadow-md rounded-xl border border-app transition-all"><Copy className="w-4 h-4" /></button>
                                                    <button onClick={() => handleDelete(doc)} className="p-3 bg-app text-rose-600 hover:shadow-md rounded-xl border border-app transition-all"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Regulation Modal */}
            <Modal isOpen={showRegModal} onClose={() => setShowRegModal(false)} title="Gestion des Règlements" size="md">
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
                    </div>

                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Mode de Paiement</label>
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

                    {/* Payment History */}
                    {paymentHistory.length > 0 && (
                        <div className="space-y-3">
                            <h4 className="text-[10px] font-black text-app uppercase tracking-widest ml-1">Historique des Paiements</h4>
                            <div className="bg-app rounded-2xl p-4 max-h-[200px] overflow-y-auto space-y-2 border border-app">
                                {loadingPayments ? (
                                    <div className="text-center py-4">
                                        <div className="inline-block w-6 h-6 border-2 border-app border-t-blue-600 rounded-full animate-spin"></div>
                                    </div>
                                ) : (
                                    paymentHistory.map((payment, idx) => (
                                        <div key={idx} className="bg-card p-3 rounded-xl border border-app flex items-center justify-between">
                                            <div className="flex-1 text-left">
                                                <p className="text-xs font-black text-app">{payment.amount?.toFixed(3)} TND</p>
                                                <p className="text-[9px] text-muted font-bold uppercase tracking-wider mt-0.5">
                                                    {payment.paymentMode === 'CASH' ? 'Espèces' : payment.paymentMode === 'CHECK' ? 'Chèque' : payment.paymentMode === 'TRANSFER' ? 'Virement' : payment.paymentMode}
                                                </p>
                                            </div>
                                            <div className="text-right flex flex-col items-end gap-1">
                                                <p className="text-[9px] text-muted font-bold">
                                                    {new Date(payment.paymentDate).toLocaleDateString('fr-FR')}
                                                </p>
                                                {payment.attachmentUrl && (
                                                    <button
                                                        onClick={() => {
                                                            const link = document.createElement('a');
                                                            link.href = payment.attachmentUrl;
                                                            link.download = `justificatif_${payment.id}.${payment.attachmentType?.split('/')[1] || 'bin'}`;
                                                            link.click();
                                                        }}
                                                        className="p-1 px-2 bg-blue-600/10 text-blue-600 rounded-md text-[8px] font-black uppercase tracking-tighter hover:bg-blue-600/20 transition-all flex items-center gap-1"
                                                    >
                                                        <Eye className="w-2.5 h-2.5" /> Voir
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    <button onClick={submitRegulation} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-blue-600/20 hover:scale-[1.01] transition-all outline-none">
                        Enregistrer le paiement
                    </button>

                    {regAmount + (selectedDoc?.paidAmount || 0) >= (selectedDoc?.total || 0) && (
                        <p className="text-center text-[10px] font-bold text-emerald-500 uppercase tracking-widest animate-pulse">
                            Le document sera automatiquement marqué comme COMPLET
                        </p>
                    )}
                </div>
            </Modal>

            {/* Export Modal */}
            <ExportModal
                isOpen={showExportModal}
                onClose={() => setShowExportModal(false)}
                section="sales"
                documents={documents}
                clients={clients}
            />
        </div>
    )
}
