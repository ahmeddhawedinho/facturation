import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../lib/api'
import {
    ArrowLeft, Mail, Phone, MapPin, FileText,
    Plus, DollarSign, TrendingUp, Calendar,
    ExternalLink, User, Building
} from 'lucide-react'

interface Document {
    id: string
    number: string
    type: string
    status: string
    total: number
    currency: string
    issueDate: string
}

interface ClientStats {
    totalSales: number
    outstandingBalance: number
    documentsCount: number
}

interface Client {
    id: string
    name: string
    type: 'INDIVIDUAL' | 'PROFESSIONAL'
    legalName?: string
    address?: string
    email?: string
    phone?: string
    fiscalNumber?: string
    city?: string
    postalCode?: string
    country?: string
    image?: string
    stats: ClientStats
    documents: Document[]
}

export default function ClientDetailsPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [client, setClient] = useState<Client | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (id) loadClient()
    }, [id])

    const loadClient = async () => {
        try {
            setLoading(true)
            const res = await api.get(`/clients/${id}`)
            setClient(res.data)
        } catch (error) {
            console.error('Error loading client:', error)
            alert('Impossible de charger le profil client')
            navigate('/dashboard/clients')
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Chargement du profil...</div>
    if (!client) return <div className="p-8 text-center text-red-500">Client non trouvé</div>

    const getTypeName = (type: string) => {
        const types: any = {
            'QUOTE': 'Devis',
            'SALES_ORDER': 'Bon de Commande',
            'DELIVERY_NOTE': 'Bon de Livraison',
            'INVOICE': 'Facture',
            'STOCK_OUTPUT': 'Bon de Sortie'
        }
        return types[type] || type
    }

    return (
        <div className="min-h-screen bg-app space-y-8 animate-fade-in pb-20">
            {/* Premium Header/Toolbar */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 bg-card p-8 rounded-[2.5rem] border border-app shadow-xl">
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate('/dashboard/clients')} className="p-4 bg-app hover:bg-[var(--app-card-hover)] text-muted hover:text-app rounded-2xl border border-app transition-all group active:scale-95">
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div className="flex items-center gap-5">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${client.type === 'INDIVIDUAL' ? 'bg-blue-600/10 text-blue-600' : 'bg-indigo-600/10 text-indigo-600'
                            }`}>
                            {client.type === 'INDIVIDUAL' ? <User className="w-7 h-7" /> : <Building className="w-7 h-7" />}
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-app tracking-tight">{client.name}</h1>
                            <p className="text-[10px] font-bold text-muted uppercase tracking-[0.2em]">Profil <span className={client.type === 'INDIVIDUAL' ? 'text-blue-600' : 'text-indigo-600'}>{client.type === 'INDIVIDUAL' ? 'Particulier' : 'Professionnel'}</span></p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3 w-full lg:w-auto">
                    <button onClick={() => navigate(`/dashboard/documents/create?clientId=${client.id}`)} className="flex-1 lg:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-xl shadow-blue-600/20 hover:scale-105 active:scale-95 transition-all">
                        <Plus className="w-5 h-5" /> Nouvelle Facture
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Sidebar: Profile Info */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-card p-8 rounded-[2.5rem] border border-app shadow-xl text-center relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-br from-blue-600/5 to-indigo-600/5 -z-0"></div>

                        <div className="relative z-10">
                            <div className="w-32 h-32 mx-auto rounded-[2rem] bg-card p-1.5 shadow-2xl border border-app mb-6 group-hover:scale-105 transition-transform duration-500">
                                <div className="w-full h-full rounded-[1.75rem] border border-app overflow-hidden flex items-center justify-center bg-app">
                                    {client.image ? (
                                        <img src={client.image} alt={client.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className={`w-full h-full flex items-center justify-center ${client.type === 'INDIVIDUAL' ? 'bg-blue-600/5' : 'bg-indigo-600/5'}`}>
                                            {client.type === 'INDIVIDUAL' ? <User className="w-16 h-16 text-blue-600/20" /> : <Building className="w-16 h-16 text-indigo-600/20" />}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <h2 className="text-2xl font-black text-app mb-1 tracking-tight leading-tight uppercase">{client.name}</h2>
                            <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-8">{client.legalName || 'SANS RAISON SOCIALE'}</p>

                            <div className="grid grid-cols-3 gap-4 py-6 border-y border-app">
                                <div>
                                    <p className="text-[9px] font-black text-muted uppercase tracking-widest mb-1.5 opacity-60">Total Ventes</p>
                                    <p className="text-sm font-black text-app tracking-tight">{client.stats.totalSales.toFixed(0)}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-muted uppercase tracking-widest mb-1.5 opacity-60">Encours</p>
                                    <p className="text-sm font-black text-rose-500 tracking-tight">{client.stats.outstandingBalance.toFixed(0)}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-muted uppercase tracking-widest mb-1.5 opacity-60">Docs Aktifs</p>
                                    <p className="text-sm font-black text-app tracking-tight">{client.stats.documentsCount}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-card p-8 rounded-[2.5rem] border border-app shadow-xl text-app">
                        <h3 className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-blue-600" /> Coordonnées Verifiées
                        </h3>
                        <div className="space-y-6">
                            {[
                                { icon: Mail, label: 'Email de contact', value: client.email || 'Non renseigné', color: 'text-blue-600' },
                                { icon: Phone, label: 'Ligne directe', value: client.phone || 'Non renseigné', color: 'text-emerald-500' },
                                { icon: MapPin, label: 'Siège social', value: `${client.address || ''} ${client.postalCode || ''} ${client.city || ''}, ${client.country || ''}`.trim() || 'Non renseigné', color: 'text-orange-500' },
                                { icon: FileText, label: 'Matricule Fiscal', value: client.fiscalNumber || 'Non renseigné', color: 'text-indigo-500' }
                            ].map((item, i) => (
                                <div key={i} className="flex items-start gap-4 group/item">
                                    <div className="w-10 h-10 rounded-xl bg-app border border-app flex items-center justify-center shadow-inner group-hover/item:scale-110 transition-transform">
                                        <item.icon className={`w-4 h-4 ${item.color}`} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-0.5 opacity-60">{item.label}</p>
                                        <p className="text-sm font-bold text-app leading-tight">{item.value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Content: Transactions & Reports */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-emerald-600 p-8 rounded-[2.5rem] border border-emerald-500 shadow-xl shadow-emerald-500/20 relative overflow-hidden group">
                            <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
                            <div className="flex justify-between items-center text-white mb-6">
                                <div className="p-3 bg-white/20 rounded-2xl shadow-inner">
                                    <DollarSign className="w-6 h-6" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 text-white/60">Revenue Cumulé</span>
                            </div>
                            <div>
                                <p className="text-4xl font-black text-white tracking-tighter leading-none mb-2">{client.stats.totalSales.toFixed(3)} <span className="text-sm font-bold opacity-40">TND</span></p>
                                <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest italic">Total Facturé à ce jour</p>
                            </div>
                        </div>

                        <div className="bg-card p-8 rounded-[2.5rem] border border-app shadow-xl relative overflow-hidden group">
                            <div className="absolute -right-8 -top-8 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
                            <div className="flex justify-between items-center text-app mb-6">
                                <div className="p-3 bg-blue-600/10 rounded-2xl shadow-inner">
                                    <Calendar className="w-6 h-6 text-blue-600" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted">Activités Récentes</span>
                            </div>
                            <div>
                                <p className="text-4xl font-black text-app tracking-tighter leading-none mb-2">{client.stats.documentsCount} <span className="text-sm font-bold text-blue-600 uppercase tracking-widest">Docs</span></p>
                                <p className="text-muted text-[10px] font-bold uppercase tracking-widest italic">Historique des échanges</p>
                            </div>
                        </div>
                    </div>

                    {/* Transactions Table */}
                    <div className="bg-card rounded-[2.5rem] border border-app shadow-xl overflow-hidden">
                        <div className="p-8 border-b border-app flex justify-between items-center bg-app/30">
                            <div>
                                <h3 className="text-sm font-black text-app uppercase tracking-widest leading-none mb-1">Registre des Transactions</h3>
                                <p className="text-[10px] font-bold text-muted uppercase tracking-[0.2em]">Affichage de tous les flux financiers</p>
                            </div>
                            <div className="w-10 h-10 rounded-xl bg-card border border-app flex items-center justify-center shadow-sm">
                                <FileText className="w-4 h-4 text-muted" />
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-app/50 border-b border-app">
                                    <tr>
                                        <th className="px-8 py-5 text-[10px] font-black text-muted uppercase tracking-[0.2em] text-left">Document</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-muted uppercase tracking-[0.2em] text-left">Emission</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-muted uppercase tracking-[0.2em] text-left">Etat</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-muted uppercase tracking-[0.2em] text-right">Valeur</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-muted uppercase tracking-[0.2em] text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-app">
                                    {client.documents.map((doc) => (
                                        <tr key={doc.id} className="hover:bg-app/50 transition-colors group/row">
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-app group-hover/row:text-blue-600 transition-colors uppercase tracking-tight">{doc.number}</span>
                                                    <span className="text-[10px] font-bold text-muted uppercase tracking-widest">{getTypeName(doc.type)}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="text-xs font-bold text-muted">{new Date(doc.issueDate).toLocaleDateString()}</span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${doc.status === 'VALIDATED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                    doc.status === 'DRAFT' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                                        'bg-app text-muted border-app shadow-sm'
                                                    }`}>
                                                    {doc.status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <span className="text-sm font-black text-app">{doc.total.toFixed(3)} <span className="text-[10px] text-muted ml-0.5 uppercase">{doc.currency}</span></span>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <button
                                                    onClick={() => navigate(`/dashboard/documents/${doc.id}`)}
                                                    className="p-3 bg-app text-muted hover:text-blue-600 hover:bg-blue-600/10 rounded-xl transition-all border border-app hover:border-blue-600/20 shadow-sm"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {client.documents.length === 0 && (
                            <div className="p-20 text-center">
                                <FileText className="w-12 h-12 text-muted/20 mx-auto mb-4" />
                                <p className="text-[10px] font-black text-muted/40 uppercase tracking-[0.2em]">Aucun document enregistré</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
