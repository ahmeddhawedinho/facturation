import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../lib/api'
import {
    ArrowLeft, Mail, Phone, MapPin, FileText,
    Plus,
    ExternalLink, ShoppingCart, Truck, CreditCard
} from 'lucide-react'

interface PurchaseOrder {
    id: string
    number: string
    status: string
    total: number
    currency: string
    issueDate: string
}

interface GoodsReceipt {
    id: string
    number: string
    receiptDate: string
}

interface SupplierStats {
    totalPurchases: number
    documentsCount: number
}

interface Supplier {
    id: string
    name: string
    legalName?: string
    address?: string
    email?: string
    phone?: string
    fiscalNumber?: string
    city?: string
    postalCode?: string
    country?: string
    image?: string
    bankRib?: string
    stats: SupplierStats
    purchaseOrders: PurchaseOrder[]
    goodsReceipts: GoodsReceipt[]
}

export default function SupplierDetailsPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [supplier, setSupplier] = useState<Supplier | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (id) loadSupplier()
    }, [id])

    const loadSupplier = async () => {
        try {
            setLoading(true)
            const res = await api.get(`/suppliers/${id}`)
            setSupplier(res.data)
        } catch (error) {
            console.error('Error loading supplier:', error)
            alert('Impossible de charger le profil fournisseur')
            navigate('/dashboard/suppliers')
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Chargement du profil...</div>
    if (!supplier) return <div className="p-8 text-center text-red-500">Fournisseur non trouvé</div>

    return (
        <div className="min-h-screen bg-app space-y-10 animate-fade-in pb-20">
            {/* Premium Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 bg-card p-8 rounded-[2.5rem] border border-app shadow-xl">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => navigate('/dashboard/suppliers')}
                        className="p-4 bg-app text-muted hover:text-app hover:bg-[var(--app-card-hover)] hover:shadow-lg rounded-2xl border border-app transition-all group"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-3xl font-black text-app tracking-tight leading-none uppercase">{supplier.name}</h1>
                            <span className="px-3 py-1 bg-blue-600/10 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-blue-600/20">
                                Partenaire Actif
                            </span>
                        </div>
                        <p className="text-[10px] font-bold text-muted uppercase tracking-[0.2em]">Profil stratégique fournisseur <span className="text-blue-600 font-black">#{supplier.id.split('-')[0].toUpperCase()}</span></p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <Link
                        to={`/dashboard/purchase/create?supplierId=${supplier.id}`}
                        className="group flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-xl shadow-blue-600/20 hover:scale-105 active:scale-95 transition-all"
                    >
                        <Plus className="w-5 h-5" /> Nouvel Achat
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Profile Sidebar */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="bg-card rounded-[2.5rem] border border-app shadow-xl overflow-hidden">
                        <div className="h-32 bg-slate-900 relative">
                            <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
                                <div className="w-24 h-24 rounded-3xl bg-card p-1 shadow-2xl border-4 border-app">
                                    {supplier.image ? (
                                        <img src={supplier.image} alt={supplier.name} className="w-full h-full object-cover rounded-2xl" />
                                    ) : (
                                        <div className="w-full h-full bg-app rounded-2xl flex items-center justify-center text-blue-600/20">
                                            <Truck className="w-10 h-10" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="pt-16 pb-8 px-8 text-center border-b border-app">
                            <h2 className="text-xl font-black text-app mb-1 uppercase">{supplier.name}</h2>
                            <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-6">{supplier.legalName || 'SANS RAISON SOCIALE'}</p>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-blue-600/5 rounded-2xl border border-blue-600/10">
                                    <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">Total Commandé</p>
                                    <p className="text-lg font-black text-blue-600">{supplier.stats.totalPurchases.toFixed(0)} <span className="text-[10px]">TND</span></p>
                                </div>
                                <div className="p-4 bg-app rounded-2xl border border-app">
                                    <p className="text-[9px] font-black text-muted uppercase tracking-widest mb-1">Documents</p>
                                    <p className="text-lg font-black text-app">{supplier.stats.documentsCount}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 space-y-6">
                            <h3 className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-4">Informations de Contact</h3>
                            <div className="space-y-4">
                                {[
                                    { icon: Mail, label: 'Email', value: supplier.email, color: 'text-blue-600', bg: 'bg-blue-600/5' },
                                    { icon: Phone, label: 'Téléphone', value: supplier.phone, color: 'text-emerald-500', bg: 'bg-emerald-500/5' },
                                    { icon: MapPin, label: 'Localisation', value: `${supplier.city || ''} ${supplier.country || ''}`, color: 'text-rose-500', bg: 'bg-rose-500/5' },
                                    { icon: FileText, label: 'Fiscalité', value: supplier.fiscalNumber, color: 'text-orange-500', bg: 'bg-orange-500/5' }
                                ].filter(item => item.value?.trim()).map((item, i) => (
                                    <div key={i} className="flex items-center gap-4 group">
                                        <div className={`w-10 h-10 rounded-xl ${item.bg} ${item.color} flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform border border-app`}>
                                            <item.icon className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-muted uppercase tracking-widest leading-none mb-1">{item.label}</p>
                                            <p className="text-xs font-bold text-app">{item.value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {supplier.bankRib && (
                            <div className="p-8 bg-app border-t border-app">
                                <div className="flex items-center gap-3 mb-4">
                                    <CreditCard className="w-4 h-4 text-muted" />
                                    <span className="text-[10px] font-black text-muted uppercase tracking-widest">Coordonnées Bancaires</span>
                                </div>
                                <div className="p-4 bg-card rounded-2xl border border-app shadow-sm">
                                    <p className="text-[9px] font-bold text-muted mb-1 uppercase">RIB Principal</p>
                                    <p className="text-xs font-black text-app tracking-widest break-all font-mono">{supplier.bankRib}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Performance Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-card p-8 rounded-[2.5rem] border border-app shadow-xl relative overflow-hidden group">
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-600/5 rounded-full blur-3xl"></div>
                            <div className="relative z-10 flex justify-between items-start">
                                <div>
                                    <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-4">Volume Economique</p>
                                    <h3 className="text-4xl font-black text-app mb-1 tracking-tighter">{supplier.stats.totalPurchases.toFixed(3)} <span className="text-sm">TND</span></h3>
                                    <p className="text-[10px] font-bold text-muted italic">Valeur totale des approvisionnements</p>
                                </div>
                                <div className="p-4 bg-blue-600/10 text-blue-600 rounded-2xl shadow-inner group-hover:rotate-12 transition-transform">
                                    <ShoppingCart className="w-6 h-6" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-card p-8 rounded-[2.5rem] border border-app shadow-xl group relative overflow-hidden">
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-600/5 rounded-full blur-3xl"></div>
                            <div className="relative z-10 flex justify-between items-start">
                                <div>
                                    <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-4">Activité Logistique</p>
                                    <h3 className="text-4xl font-black text-app mb-1 tracking-tighter">{supplier.stats.documentsCount} <span className="text-sm text-blue-600 font-bold uppercase tracking-widest ml-1">Flux</span></h3>
                                    <p className="text-[10px] font-bold text-muted italic">Nombre total de pièces traitées</p>
                                </div>
                                <div className="p-4 bg-blue-600/10 text-blue-600 rounded-2xl shadow-inner group-hover:rotate-12 transition-transform">
                                    <Truck className="w-6 h-6" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Table Container */}
                    <div className="bg-card rounded-[2.5rem] border border-app shadow-xl overflow-hidden">
                        <div className="p-8 border-b border-app flex flex-col md:flex-row justify-between items-start md:items-center bg-app/30 gap-4">
                            <div>
                                <h3 className="text-xl font-black text-app tracking-tight leading-none mb-2 uppercase">Historique des Commandes</h3>
                                <p className="text-[9px] font-bold text-muted uppercase tracking-widest italic leading-none">Suivi détaillé des transactions et engagements</p>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-app border-b border-app">
                                        <th className="px-8 py-6 text-left text-[9px] font-black text-muted uppercase tracking-widest">Document #</th>
                                        <th className="px-8 py-6 text-left text-[9px] font-black text-muted uppercase tracking-widest">Date Émission</th>
                                        <th className="px-8 py-6 text-right text-[9px] font-black text-muted uppercase tracking-widest">Montant Net</th>
                                        <th className="px-8 py-6 text-center text-[9px] font-black text-muted uppercase tracking-widest">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-app">
                                    {supplier.purchaseOrders.map((po) => (
                                        <tr key={po.id} className="group hover:bg-app transition-colors">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                                                    <span className="text-sm font-black text-app group-hover:text-blue-600 transition-colors uppercase tracking-tight">{po.number}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-xs font-bold text-muted uppercase">
                                                {new Date(po.issueDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <span className="text-sm font-black text-app">{po.total.toFixed(3)}</span>
                                                <span className="ml-1.5 text-[10px] font-bold text-muted uppercase">{po.currency}</span>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <button
                                                    onClick={() => navigate(`/dashboard/purchase/${po.id}`)}
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

                        {supplier.purchaseOrders.length === 0 && (
                            <div className="p-20 text-center">
                                <div className="w-16 h-16 bg-app rounded-full flex items-center justify-center mx-auto mb-4 border border-app shadow-inner">
                                    <ShoppingCart className="w-8 h-8 text-muted/20" />
                                </div>
                                <h3 className="text-lg font-black text-muted/40 uppercase tracking-widest">Aucune commande enregistrée</h3>
                                <p className="text-[10px] font-bold text-muted/30 uppercase tracking-widest mt-2">Le flux d'achat pour ce fournisseur est actuellement vide</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )

}
