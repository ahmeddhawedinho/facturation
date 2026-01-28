import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { Truck, Plus, Search, Mail, Phone, MapPin, Building2, Upload, X, Zap, Package, ArrowRight } from 'lucide-react'
import Modal from '../components/Modal'

interface Supplier {
    id: string
    name: string
    legalName?: string
    email?: string
    phone?: string
    address?: string
    city?: string
    country?: string
    fiscalNumber?: string
    image?: string
    logo?: string
    category: 'PRODUCT' | 'CHARGE'
    bankRib?: string
    bankIban?: string
}

export default function SuppliersPage() {
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterCategory, setFilterCategory] = useState<'ALL' | 'PRODUCT' | 'CHARGE'>('ALL')
    const [showModal, setShowModal] = useState(false)
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
    const [imagePreview, setImagePreview] = useState<string>('')

    const [formData, setFormData] = useState({
        name: '',
        legalName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        country: 'Tunisie',
        fiscalNumber: '',
        category: 'PRODUCT' as 'PRODUCT' | 'CHARGE',
        bankRib: '',
        bankIban: '',
        image: '',
        logo: ''
    })

    useEffect(() => {
        if (!user) {
            navigate('/login')
            return
        }
        loadSuppliers()
    }, [user, navigate])

    const loadSuppliers = async () => {
        try {
            setLoading(true)
            const res = await api.get('/suppliers')
            setSuppliers(res.data || [])
        } catch (error) {
            console.error('Erreur chargement fournisseurs:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                const base64 = reader.result as string
                setImagePreview(base64)
                setFormData({ ...formData, image: base64, logo: base64 })
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = async () => {
        try {
            if (editingSupplier) {
                await api.put(`/suppliers/${editingSupplier.id}`, formData)
            } else {
                await api.post('/suppliers', formData)
            }
            setShowModal(false)
            resetForm()
            loadSuppliers()
        } catch (error) {
            console.error('Erreur:', error)
            alert('Erreur lors de l\'opération')
        }
    }

    const handleEdit = (supplier: Supplier) => {
        setEditingSupplier(supplier)
        setFormData({
            name: supplier.name,
            legalName: supplier.legalName || '',
            email: supplier.email || '',
            phone: supplier.phone || '',
            address: supplier.address || '',
            city: supplier.city || '',
            country: supplier.country || 'Tunisie',
            fiscalNumber: supplier.fiscalNumber || '',
            category: supplier.category,
            bankRib: supplier.bankRib || '',
            bankIban: supplier.bankIban || '',
            image: supplier.image || '',
            logo: supplier.logo || ''
        })
        setImagePreview(supplier.logo || supplier.image || '')
        setShowModal(true)
    }

    const resetForm = () => {
        setEditingSupplier(null)
        setFormData({
            name: '',
            legalName: '',
            email: '',
            phone: '',
            address: '',
            city: '',
            country: 'Tunisie',
            fiscalNumber: '',
            category: 'PRODUCT',
            bankRib: '',
            bankIban: '',
            image: '',
            logo: ''
        })
        setImagePreview('')
    }

    const filteredSuppliers = suppliers.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.phone?.includes(searchTerm)
        const matchesCategory = filterCategory === 'ALL' || s.category === filterCategory
        return matchesSearch && matchesCategory
    })

    return (
        <div className="min-h-screen space-y-8 animate-fade-in pb-20" style={{ background: 'transparent' }}>
            {/* Premium Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 bg-card p-8 rounded-[2.5rem] border border-app shadow-xl transition-colors">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-blue-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-blue-600/20">
                        <Truck className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl lg:text-5xl font-black text-app tracking-tight leading-none mb-2">Partenaires <span className="text-blue-600">Fournisseurs</span></h1>
                        <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">Contrôle centralisé de votre <span className="text-blue-600">chaîne d'approvisionnement</span></p>
                    </div>
                </div>
                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="group flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-xl shadow-blue-600/20 hover:scale-105 active:scale-95 transition-all outline-none"
                >
                    <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" /> Nouveau Partenaire
                </button>
            </div>

            {/* KPIs & Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Réseau Global', value: suppliers.length, sub: 'Partenaires actifs', icon: Building2, color: 'text-app', bg: 'bg-app' },
                    { label: 'Flux Produits', value: suppliers.filter(s => s.category === 'PRODUCT').length, sub: 'Stock & Logistique', icon: Package, color: 'text-blue-600', bg: 'bg-blue-600/10' },
                    { label: 'Flux Charges', value: suppliers.filter(s => s.category === 'CHARGE').length, sub: 'Frais fixes & Opérations', icon: Zap, color: 'text-amber-600', bg: 'bg-amber-600/10' }
                ].map((stat, i) => (
                    <div key={i} className="bg-card p-7 rounded-3xl border border-app shadow-xl flex items-center gap-5 hover:shadow-2xl transition-all group cursor-default relative overflow-hidden">
                        <div className={`absolute -right-4 -top-4 w-20 h-20 ${stat.bg} rounded-full blur-[40px] opacity-20 group-hover:scale-150 transition-transform`}></div>
                        <div className={`w-14 h-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300 relative z-10`}>
                            <stat.icon className="w-7 h-7" />
                        </div>
                        <div className="relative z-10">
                            <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em] leading-none mb-1.5">{stat.label}</p>
                            <p className={`text-3xl font-black ${stat.color} tracking-tighter`}>{stat.value}</p>
                            <p className="text-[9px] font-bold text-muted italic mt-0.5">{stat.sub}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-6 items-center justify-center max-w-4xl mx-auto w-full">
                <div className="flex-1 relative w-full group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted group-focus-within:text-app transition-colors shadow-sm" />
                    <input
                        type="text"
                        placeholder="Rechercher par nom, mail ou mobile..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-16 pr-8 py-5 bg-card border border-app rounded-2xl shadow-xl focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all font-medium text-app placeholder:text-muted"
                    />
                </div>
                <div className="flex p-2 bg-card rounded-2xl border border-app shadow-xl gap-2 shrink-0">
                    {[
                        { id: 'ALL', label: 'Tout', icon: Building2 },
                        { id: 'PRODUCT', label: 'Produits', icon: Package },
                        { id: 'CHARGE', label: 'Charges', icon: Zap }
                    ].map(btn => (
                        <button
                            key={btn.id}
                            onClick={() => setFilterCategory(btn.id as any)}
                            className={`px-6 py-3 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${filterCategory === btn.id
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'text-muted hover:text-app hover:bg-app'
                                }`}
                        >
                            <btn.icon className="w-4 h-4" />
                            {btn.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Cards Grid */}
            {loading ? (
                <div className="py-20 text-center animate-pulse">
                    <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-4"></div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Initialisation du réseau...</p>
                </div>
            ) : filteredSuppliers.length === 0 ? (
                <div className="py-32 text-center bg-card rounded-[3rem] border border-dashed border-app shadow-sm leading-relaxed">
                    <Truck className="w-16 h-16 text-app/5 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-muted uppercase tracking-widest">Aucun partenaire trouvé</h3>
                    <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-2">Affinez votre recherche ou créez une nouvelle fiche</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredSuppliers.map(supplier => (
                        <div
                            key={supplier.id}
                            className="group bg-card rounded-[2.5rem] border border-app shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden cursor-pointer flex flex-col h-full"
                        >
                            {/* Elegant Header Accent */}
                            <div className={`relative h-24 overflow-hidden`}>
                                <div className={`absolute inset-0 opacity-[0.03] pattern-hex`} style={{ backgroundColor: supplier.category === 'PRODUCT' ? '#3B82F6' : '#F59E0B' }}></div>
                                <div className="absolute top-6 right-6 flex items-center gap-2">
                                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${supplier.category === 'PRODUCT'
                                        ? 'bg-blue-600/10 text-blue-600 border border-blue-600/20'
                                        : 'bg-amber-600/10 text-amber-600 border border-amber-600/20'
                                        } shadow-sm`}>
                                        {supplier.category === 'PRODUCT' ? 'Flux Stock' : 'Charge Op.'}
                                    </span>
                                </div>
                            </div>

                            {/* Profile Info Overlay */}
                            <div className="px-8 -mt-12 flex items-end justify-between relative z-10">
                                <div className="w-24 h-24 rounded-3xl bg-card p-1.5 shadow-xl group-hover:scale-105 transition-transform duration-500">
                                    <div className="w-full h-full rounded-[1.25rem] bg-app flex items-center justify-center overflow-hidden border border-app">
                                        {supplier.logo || supplier.image ? (
                                            <img src={supplier.logo || supplier.image} alt={supplier.name} className="w-full h-full object-cover rounded-[1rem]" />
                                        ) : (
                                            <div className={`w-full h-full rounded-[1rem] flex items-center justify-center ${supplier.category === 'PRODUCT' ? 'bg-blue-600/10 text-blue-600' : 'bg-amber-600/10 text-amber-600'
                                                }`}>
                                                {supplier.category === 'PRODUCT' ? <Package className="w-10 h-10" /> : <Zap className="w-10 h-10" />}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-2 mb-2 translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                                    <button onClick={() => handleEdit(supplier)} className="p-3 bg-card text-muted hover:text-blue-600 rounded-xl shadow-lg border border-app transition-all active:scale-95">
                                        <Plus className="w-4 h-4 rotate-45" />
                                    </button>
                                </div>
                            </div>

                            {/* Body Details */}
                            <div className="px-8 pt-6 pb-8 flex flex-col flex-1">
                                <h3 className="text-xl font-black text-app group-hover:text-blue-600 transition-colors tracking-tight leading-tight mb-1">
                                    {supplier.name}
                                </h3>
                                <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-6 border-l-2 border-blue-600/30 pl-3">
                                    {supplier.legalName || 'SANS RAISON SOCIALE'}
                                </p>

                                <div className="space-y-4 flex-1">
                                    {[
                                        { icon: Mail, value: supplier.email, color: 'text-blue-600', bg: 'bg-blue-600/10' },
                                        { icon: Phone, value: supplier.phone, color: 'text-blue-600', bg: 'bg-blue-600/10' },
                                        { icon: MapPin, value: supplier.city, color: 'text-blue-600', bg: 'bg-blue-600/10' }
                                    ].filter(item => item.value).map((item, i) => (
                                        <div key={i} className="flex items-center gap-4 group/item">
                                            <div className={`w-8 h-8 rounded-lg ${item.bg} ${item.color} flex items-center justify-center shadow-inner group-hover/item:scale-110 transition-transform`}>
                                                <item.icon className="w-3.5 h-3.5" />
                                            </div>
                                            <span className="text-xs font-black text-muted group-hover/item:text-app transition-colors truncate">{item.value}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-8 pt-6 border-t border-app flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-muted uppercase tracking-[0.2em] leading-none mb-1">Matricule Fiscal</span>
                                        <span className="text-[11px] font-black text-app font-mono tracking-widest">{supplier.fiscalNumber || '---'}</span>
                                    </div>
                                    <button
                                        onClick={() => navigate(`/dashboard/suppliers/${supplier.id}`)}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600/10 text-blue-600 rounded-xl transition-all hover:bg-blue-600 hover:text-white group/btn outline-none"
                                    >
                                        <span className="text-[10px] font-black uppercase tracking-widest">Profil</span>
                                        <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => { setShowModal(false); resetForm(); }}
                title={editingSupplier ? 'Modifier le Fournisseur' : 'Nouveau Fournisseur'}
            >
                <div className="space-y-4">
                    {/* Image Upload */}
                    <div>
                        <label className="text-[10px] font-black text-muted uppercase tracking-widest mb-4 block">Logo / Identité Visuelle</label>
                        <div className="flex items-center gap-6">
                            <div className="w-24 h-24 rounded-2xl bg-app border border-app overflow-hidden flex items-center justify-center shadow-inner">
                                {imagePreview ? (
                                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <Truck className="w-10 h-10 text-muted/20" />
                                )}
                            </div>
                            <div className="flex-1">
                                <label className="cursor-pointer inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-600/10">
                                    <Upload className="w-4 h-4" />
                                    <span>Télécharger</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                    />
                                </label>
                                {imagePreview && (
                                    <button
                                        onClick={() => { setImagePreview(''); setFormData({ ...formData, image: '', logo: '' }); }}
                                        className="ml-3 p-3 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Category */}
                    <div>
                        <label className="text-[10px] font-black text-muted uppercase tracking-widest mb-4 block">Classification Strategique</label>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, category: 'PRODUCT' })}
                                className={`flex-1 py-4 px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border ${formData.category === 'PRODUCT'
                                    ? 'bg-blue-600 text-white border-blue-700 shadow-lg'
                                    : 'bg-app text-muted border-app hover:bg-app/80'
                                    }`}
                            >
                                <Package className="w-4 h-4 inline mr-2" />
                                Fournisseur Produits
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, category: 'CHARGE' })}
                                className={`flex-1 py-4 px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border ${formData.category === 'CHARGE'
                                    ? 'bg-blue-600 text-white border-blue-700 shadow-lg'
                                    : 'bg-app text-muted border-app hover:bg-app/80'
                                    }`}
                            >
                                <Zap className="w-4 h-4 inline mr-2" />
                                Bénéficiaire Charges
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-app">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-1">Nom Usuel *</label>
                            <input
                                type="text"
                                className="w-full px-5 py-4 bg-app border border-app rounded-2xl focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all font-bold text-app placeholder:text-muted"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-1">Raison Sociale</label>
                            <input
                                type="text"
                                className="w-full px-5 py-4 bg-app border border-app rounded-2xl focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all font-bold text-app placeholder:text-muted"
                                value={formData.legalName}
                                onChange={e => setFormData({ ...formData, legalName: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-1">Email Professionnel</label>
                            <input
                                type="email"
                                className="w-full px-5 py-4 bg-app border border-app rounded-2xl focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all font-bold text-app"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-1">Ligne Directe</label>
                            <input
                                type="tel"
                                className="w-full px-5 py-4 bg-app border border-app rounded-2xl focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all font-bold text-app"
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-1">Adresse Complète</label>
                        <input
                            type="text"
                            className="w-full px-5 py-4 bg-app border border-app rounded-2xl focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all font-bold text-app"
                            value={formData.address}
                            onChange={e => setFormData({ ...formData, address: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-1">Ville</label>
                            <input
                                type="text"
                                className="w-full px-5 py-4 bg-app border border-app rounded-2xl focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all font-bold text-app"
                                value={formData.city}
                                onChange={e => setFormData({ ...formData, city: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-muted uppercase tracking-widest ml-1">Matricule Fiscal</label>
                            <input
                                type="text"
                                className="w-full px-5 py-4 bg-app border border-app rounded-2xl focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all font-bold text-app"
                                value={formData.fiscalNumber}
                                onChange={e => setFormData({ ...formData, fiscalNumber: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="pt-6">
                        <button
                            onClick={handleSubmit}
                            className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl shadow-blue-600/20 hover:scale-[1.02] active:scale-95 transition-all outline-none"
                        >
                            {editingSupplier ? 'Valider les Modifications' : 'Enregistrer le Partenaire'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
