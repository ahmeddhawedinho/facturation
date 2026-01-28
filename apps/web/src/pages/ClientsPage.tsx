import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { Users, Plus, Search, Mail, Phone, MapPin, Building2, Upload, Trash2, Edit2, TrendingUp, ShieldCheck, Check } from 'lucide-react'
import Modal from '../components/Modal'

interface Client {
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
    type: 'INDIVIDUAL' | 'PROFESSIONAL'
}

export default function ClientsPage() {
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const [clients, setClients] = useState<Client[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [editingClient, setEditingClient] = useState<Client | null>(null)

    const [formData, setFormData] = useState({
        name: '',
        legalName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        country: 'Tunisia',
        fiscalNumber: '',
        type: 'PROFESSIONAL' as 'INDIVIDUAL' | 'PROFESSIONAL'
    })

    useEffect(() => {
        if (!user) {
            navigate('/login')
            return
        }
        loadClients()
    }, [user, navigate])

    const loadClients = async () => {
        try {
            setLoading(true)
            const response = await api.get('/clients')
            setClients(response.data || [])
        } catch (error) {
            console.error('Erreur chargement clients:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setImagePreview(reader.result as string)
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = async () => {
        if (!formData.name) return
        try {
            const payload = { ...formData, image: imagePreview }
            if (editingClient) {
                await api.put(`/clients/${editingClient.id}`, payload)
            } else {
                await api.post('/clients', payload)
            }
            loadClients()
            setShowModal(false)
            resetForm()
        } catch (error) {
            console.error('Erreur sauvegarde client:', error)
        }
    }

    const handleEdit = (client: Client, e: React.MouseEvent) => {
        e.stopPropagation()
        setEditingClient(client)
        setFormData({
            name: client.name || '',
            legalName: client.legalName || '',
            email: client.email || '',
            phone: client.phone || '',
            address: client.address || '',
            city: client.city || '',
            country: client.country || 'Tunisia',
            fiscalNumber: client.fiscalNumber || '',
            type: client.type || 'PROFESSIONAL'
        })
        setImagePreview(client.image || null)
        setShowModal(true)
    }

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation()
        if (window.confirm('Supprimer ce client ?')) {
            try {
                await api.delete(`/clients/${id}`)
                loadClients()
            } catch (error) {
                console.error('Erreur suppression:', error)
            }
        }
    }

    const resetForm = () => {
        setFormData({
            name: '', legalName: '', email: '', phone: '',
            address: '', city: '', country: 'Tunisia',
            fiscalNumber: '', type: 'PROFESSIONAL'
        })
        setImagePreview(null)
        setEditingClient(null)
    }

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.legalName?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="min-h-screen space-y-10 animate-fade-in pb-20" style={{ background: 'transparent' }}>
            {/* Premium Header */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 bg-card p-10 rounded-[2.5rem] border border-app shadow-xl transition-colors relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/5 rounded-full blur-[100px] -mr-40 -mt-40 opacity-60"></div>

                <div className="flex items-center gap-6 relative z-10">
                    <div className="w-16 h-16 bg-blue-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-blue-600/20">
                        <Users className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-4xl lg:text-6xl font-black text-app tracking-tighter leading-none uppercase">
                            Gestion des <span className="text-blue-600">Clients</span>
                        </h1>
                        <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mt-2 leading-relaxed">
                            Contrôle centralisé de votre <span className="text-blue-600">capital relationnel</span>.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-6 bg-app p-6 rounded-[2rem] border border-app shadow-inner relative z-10 shrink-0">
                    <div className="w-14 h-14 rounded-2xl bg-card border border-app flex items-center justify-center text-emerald-600 shadow-sm">
                        <TrendingUp className="w-7 h-7" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-muted uppercase tracking-widest leading-none mb-1.5 pl-1">Partenaires Indexés</p>
                        <p className="text-3xl font-black text-app tracking-tighter leading-none">
                            {clients.length} <span className="text-xs text-blue-600 ml-1">ENTITÉS</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Strategic Top Bar */}
            <div className="flex flex-col xl:flex-row gap-6">
                <div className="flex-1 relative group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-muted group-focus-within:text-blue-600 transition-colors" />
                    <input type="text" placeholder="Recherche rapide d'entité (Nom, Email, RS)..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-16 pr-8 py-5 bg-card border border-app rounded-[2rem] text-sm font-black text-app shadow-xl focus:ring-8 focus:ring-blue-600/5 outline-none transition-all placeholder:text-muted" />
                </div>
                <button onClick={() => { resetForm(); setShowModal(true); }} className="px-10 py-5 bg-blue-600 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3 outline-none">
                    <Plus className="w-5 h-5" /> Enregistrer un Partenaire
                </button>
            </div>

            {/* Client Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {filteredClients.map(client => (
                    <div key={client.id} onClick={() => navigate(`/dashboard/clients/${client.id}`)} className="group bg-card rounded-[2.5rem] border border-app p-8 shadow-xl hover:shadow-2xl hover:shadow-blue-600/5 transition-all duration-500 relative overflow-hidden cursor-pointer">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="flex justify-between items-start mb-8">
                            <div className="w-16 h-16 rounded-2xl bg-app border border-app shadow-inner overflow-hidden flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                {client.image ? (
                                    <img src={client.image} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-xl font-black text-muted/30">{client.name[0]}</div>
                                )}
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all">
                                <button onClick={(e) => handleEdit(client, e)} className="p-3 bg-card text-muted hover:text-blue-600 rounded-xl border border-app shadow-sm transition-all"><Edit2 className="w-4 h-4" /></button>
                                <button onClick={(e) => handleDelete(client.id, e)} className="p-3 bg-card text-muted hover:text-rose-600 rounded-xl border border-app shadow-sm transition-all"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>

                        <div className="mb-8">
                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border mb-3 inline-block ${client.type === 'PROFESSIONAL' ? 'bg-blue-600/10 text-blue-600 border-blue-600/20' : 'bg-indigo-600/10 text-indigo-600 border-indigo-600/20'}`}>
                                {client.type === 'PROFESSIONAL' ? 'ENTREPRISE' : 'PARTICULIER'}
                            </span>
                            <h3 className="text-xl font-black text-app group-hover:text-blue-600 transition-colors uppercase tracking-tight truncate leading-none mb-1">{client.name}</h3>
                            <p className="text-[10px] font-bold text-muted uppercase tracking-widest truncate">{client.legalName || 'Aucune raison sociale'}</p>
                        </div>

                        <div className="space-y-4 pt-6 border-t border-app">
                            <div className="flex items-center gap-3 text-muted group-hover:text-app transition-colors">
                                <Mail className="w-4 h-4 text-blue-500" />
                                <span className="text-xs font-bold truncate">{client.email || 'Email non fourni'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-muted group-hover:text-app transition-colors">
                                <Phone className="w-4 h-4 text-blue-500" />
                                <span className="text-xs font-bold">{client.phone || '-- --- ---'}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty Context */}
            {filteredClients.length === 0 && !loading && (
                <div className="py-40 text-center">
                    <Users className="w-20 h-20 text-muted/10 mx-auto mb-6 opacity-20" />
                    <p className="text-[10px] font-black text-muted uppercase tracking-[0.3em]">Aucune entité commerciale détectée</p>
                </div>
            )}

            {/* REFINED MODAL */}
            <Modal isOpen={showModal} onClose={() => { setShowModal(false); resetForm(); }} title={editingClient ? 'Modification Partenaire' : 'Indexation Nouveau Partenaire'} size="lg">
                <div className="space-y-8 py-4">
                    {/* Visual Identity Section */}
                    <div className="flex flex-col md:flex-row items-center gap-8 bg-app p-8 rounded-[2.5rem] border border-app shadow-inner">
                        <div className="relative group cursor-pointer">
                            <div className="w-24 h-24 rounded-[2rem] bg-card border border-app p-1.5 shadow-xl group-hover:scale-105 transition-all">
                                <div className="w-full h-full rounded-[1.8rem] bg-app overflow-hidden flex items-center justify-center">
                                    {imagePreview ? <img src={imagePreview as string} className="w-full h-full object-cover" /> : <Users className="w-10 h-10 text-muted/20" />}
                                </div>
                            </div>
                            <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 text-white rounded-xl shadow-lg flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 transition-all border-4 border-app">
                                <Upload className="w-4 h-4" />
                                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                            </label>
                        </div>
                        <div className="flex-1 space-y-4">
                            <div>
                                <p className="text-[10px] font-black text-app uppercase tracking-widest mb-3">Protocole d'Identification</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <button type="button" onClick={() => setFormData({ ...formData, type: 'PROFESSIONAL' })} className={`py-3.5 px-6 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 border ${formData.type === 'PROFESSIONAL' ? 'bg-blue-600 text-white border-blue-600 shadow-xl' : 'bg-card text-muted border-app hover:bg-app'}`}>
                                        <Building2 className="w-4 h-4" /> Professionnel
                                    </button>
                                    <button type="button" onClick={() => setFormData({ ...formData, type: 'INDIVIDUAL' })} className={`py-3.5 px-6 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 border ${formData.type === 'INDIVIDUAL' ? 'bg-blue-600 text-white border-blue-600 shadow-xl' : 'bg-card text-muted border-app hover:bg-app'}`}>
                                        <Users className="w-4 h-4" /> Particulier
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Data Matrix */}
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Nom du Partenaire *</label>
                                <input type="text" className="w-full bg-app border border-app rounded-2xl py-4 px-6 text-app font-black text-sm focus:bg-card focus:ring-8 focus:ring-blue-600/5 outline-none transition-all shadow-inner uppercase" placeholder="Désignation complète..." value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Raison Sociale</label>
                                <input type="text" className="w-full bg-app border border-app rounded-2xl py-4 px-6 text-app font-bold text-sm focus:bg-card focus:ring-8 focus:ring-blue-600/5 outline-none transition-all shadow-inner" placeholder="Nom légal de l'entreprise..." value={formData.legalName} onChange={e => setFormData({ ...formData, legalName: e.target.value })} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1 flex items-center gap-2"><Mail className="w-3 h-3 text-blue-500" /> Adresse de Correspondance</label>
                                <input type="email" className="w-full bg-app border border-app rounded-2xl py-4 px-6 text-app font-bold text-sm focus:bg-card focus:ring-8 focus:ring-blue-600/5 outline-none transition-all shadow-inner" placeholder="email@domaine.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1 flex items-center gap-2"><Phone className="w-3 h-3 text-emerald-500" /> Ligne Directe</label>
                                <input type="tel" className="w-full bg-app border border-app rounded-2xl py-4 px-6 text-app font-bold text-sm focus:bg-card focus:ring-8 focus:ring-blue-600/5 outline-none transition-all shadow-inner" placeholder="+216 -- --- ---" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1 flex items-center gap-2"><MapPin className="w-3 h-3 text-rose-500" /> Siège Opérationnel</label>
                            <input type="text" className="w-full bg-app border border-app rounded-2xl py-4 px-6 text-app font-medium text-sm focus:bg-card focus:ring-8 focus:ring-blue-600/5 outline-none transition-all shadow-inner" placeholder="Numéro, Rue, Immeuble..." value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-muted uppercase tracking-widest ml-1">Zone Urbaine / Ville</label>
                                <input type="text" className="w-full bg-app border border-app rounded-2xl py-4 px-6 text-app font-black text-xs focus:bg-card focus:ring-8 focus:ring-blue-600/5 outline-none transition-all shadow-inner uppercase" placeholder="TUNIS, ARIANA..." value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-indigo-500 uppercase tracking-widest ml-1 flex items-center gap-2"><ShieldCheck className="w-3 h-3" /> Matricule Fiscal</label>
                                <input type="text" className="w-full bg-app border border-app rounded-2xl py-4 px-6 text-app font-black text-xs font-mono focus:bg-card focus:ring-8 focus:ring-indigo-600/5 outline-none transition-all shadow-inner" placeholder="0000000/X/X/XXX/000" value={formData.fiscalNumber} onChange={e => setFormData({ ...formData, fiscalNumber: e.target.value })} />
                            </div>
                        </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex gap-4 pt-6">
                        <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-5 bg-card border border-app text-muted rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-app transition-all outline-none">Abandonner</button>
                        <button type="button" onClick={handleSubmit} className="flex-[2] py-5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-600/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 outline-none">
                            <Check className="w-5 h-5" /> {editingClient ? 'Modifier Partenaire' : 'Valider l\'Indexation'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
