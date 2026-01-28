import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { Save, Plus, Trash2, AlertCircle, Building2, Landmark, Percent, CreditCard, Image as ImageIcon, Globe, MapPin, Hash, Phone, Mail, UserPlus, ShieldCheck, ChevronRight, Check, Briefcase } from 'lucide-react'
import AccountantInvitationSection from '../components/AccountantInvitationSection'

interface CompanySettings {
    id: string
    name: string
    legalName: string
    logo?: string
    fiscalNumber: string
    address: string
    postalCode: string
    city: string
    phone: string
    email: string
    website?: string
    sector?: string
    employeesCount?: number
    bankRib?: string
    bankIban?: string
    bankName?: string
    bankInfo?: string
    pdfTemplate: 'CLASSIC' | 'MODERN' | 'PREMIUM'
}

interface TaxConfig {
    id: string
    name: string
    value: number
    type: 'FIXED' | 'PERCENTAGE'
    isActive: boolean
}

interface PaymentMethod {
    id: string
    name: string
    isActive: boolean
}

export default function SettingsPage() {
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const isAdmin = user?.role === 'ADMIN'

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [activeTab, setActiveTab] = useState('company')

    const [company, setCompany] = useState<CompanySettings | null>(null)
    const [logoPreview, setLogoPreview] = useState<string>('')
    const [pageError, setPageError] = useState<string | null>(null)

    const [taxes, setTaxes] = useState<TaxConfig[]>([])
    const [newTax, setNewTax] = useState({ name: '', value: 0, type: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED' })

    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
    const [newPaymentMethod, setNewPaymentMethod] = useState('')

    useEffect(() => {
        if (!user) { navigate('/login'); return }
        loadSettings()
    }, [user, navigate])

    const loadSettings = async () => {
        try {
            setLoading(true)
            setPageError(null)
            const [companyRes, taxesRes, paymentsRes] = await Promise.all([
                api.get('/companies/settings'),
                api.get('/companies/taxes'),
                api.get('/companies/payment-methods'),
            ])
            setCompany(companyRes.data)
            setTaxes(taxesRes.data || [])
            setPaymentMethods(paymentsRes.data || [])
            if (companyRes.data?.logo) setLogoPreview(companyRes.data.logo)
        } catch (error: any) { setPageError(error.response?.data?.message || error.message) }
        finally { setLoading(false) }
    }

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = (e) => setLogoPreview(e.target?.result as string)
            reader.readAsDataURL(file)
        }
    }

    const handleCompanyChange = (field: keyof CompanySettings, value: any) => { if (company) setCompany({ ...company, [field]: value }) }

    const saveCompanySettings = async () => {
        if (!company) return
        setSaving(true)
        try {
            const data = { ...company, logo: logoPreview || undefined }
            await api.put(`/companies/${company.id}/settings`, data)
            alert('Protocoles sauvegardés avec succès !')
        } catch (error: any) { alert('Échec de la synchronisation') }
        finally { setSaving(false) }
    }

    const addTax = async () => {
        if (!newTax.name || newTax.value <= 0) return
        try {
            const response = await api.post('/companies/taxes', { ...newTax, value: parseFloat(newTax.value.toString()) })
            setTaxes([...taxes, response.data])
            setNewTax({ name: '', value: 0, type: 'PERCENTAGE' })
        } catch (error) { alert('Erreur') }
    }

    const deleteTax = async (taxId: string) => {
        try { await api.delete(`/companies/taxes/${taxId}`); setTaxes(taxes.filter(t => t.id !== taxId)) }
        catch (error) { alert('Erreur') }
    }

    const addPaymentMethod = async () => {
        if (!newPaymentMethod.trim()) return
        try {
            const response = await api.post('/companies/payment-methods', { name: newPaymentMethod })
            setPaymentMethods([...paymentMethods, response.data])
            setNewPaymentMethod('')
        } catch (error) { alert('Erreur') }
    }

    const deletePaymentMethod = async (methodId: string) => {
        try { await api.delete(`/companies/payment-methods/${methodId}`); setPaymentMethods(paymentMethods.filter(m => m.id !== methodId)) }
        catch (error) { alert('Erreur') }
    }

    if (loading) return (
        <div className="py-40 flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-gray-100 border-t-blue-600 animate-spin"></div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest animate-pulse">Initialisation du système...</p>
        </div>
    )

    if (pageError || !company) return (
        <div className="bg-white rounded-[3rem] border border-gray-100 p-20 text-center shadow-xl shadow-gray-200/50 min-h-[60vh] flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-rose-50 rounded-[2rem] flex items-center justify-center text-rose-500 mb-8">
                <AlertCircle className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Erreur de Protocole</h2>
            <p className="text-gray-400 mb-10 font-bold uppercase text-[10px] tracking-widest">Impossible de charger les paramètres de structure.</p>
            <button onClick={loadSettings} className="px-10 py-5 bg-gray-900 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-gray-900/20 active:scale-95">
                Relancer l'initialisation
            </button>
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-50/50 space-y-8 animate-fade-in pb-20">
            {/* Premium Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-[80px] -mr-32 -mt-32 opacity-50"></div>
                <div className="flex items-center gap-6 relative z-10">
                    <div className="w-16 h-16 bg-blue-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-blue-600/20">
                        <Landmark className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl lg:text-5xl font-black text-gray-900 tracking-tight mb-2 leading-none uppercase">
                            Paramètres <span className="text-blue-600">Système</span>
                        </h1>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] leading-relaxed">
                            Configuration de la structure légale et <span className="text-blue-600">protocoles métier</span>.
                        </p>
                    </div>
                </div>

                {isAdmin && activeTab === 'company' && (
                    <button onClick={saveCompanySettings} disabled={saving} className="relative z-10 flex items-center gap-3 px-10 py-5 bg-gray-900 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-gray-900/20 disabled:opacity-50">
                        {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" /> : <Save className="w-5 h-5" />}
                        Enregistrer les modifications
                    </button>
                )}
            </div>

            {/* Premium Tab Navigation */}
            <div className="flex p-2 bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/30 gap-2 max-w-3xl mx-auto w-full">
                {[
                    { id: 'company', label: 'Entreprise', icon: Building2 },
                    { id: 'accountant', label: 'Expert Comptable', icon: Briefcase },
                    { id: 'taxes', label: 'Taxes & TVA', icon: Percent },
                    { id: 'payments', label: 'Paiements', icon: CreditCard }
                ].map(tab => (isAdmin || tab.id === 'company') && (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all duration-300 ${activeTab === tab.id ? 'bg-gray-900 text-white shadow-xl' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'}`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content Sections */}
            <div className="animate-fade-in-up">
                {activeTab === 'company' && (
                    <div className="space-y-8">
                        {/* Hero Settings Card */}
                        <div className="bg-white rounded-[2.5rem] border border-gray-100 p-10 lg:p-14 shadow-xl shadow-gray-200/50 relative overflow-hidden group">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-14 relative z-10">
                                {/* Logo Module */}
                                <div className="lg:col-span-4 space-y-6">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-4 text-center">Identité Visuelle</label>
                                    <div className="relative group/logo w-full aspect-square bg-gray-50 rounded-[3rem] p-1.5 shadow-inner border border-gray-100 flex flex-col items-center justify-center overflow-hidden transition-transform duration-500 hover:scale-[1.02]">
                                        <div className="w-full h-full rounded-[2.75rem] bg-white flex items-center justify-center overflow-hidden relative">
                                            {logoPreview ? (
                                                <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-8 group-hover/logo:scale-110 transition-transform duration-700" />
                                            ) : (
                                                <div className="text-center">
                                                    <ImageIcon className="w-16 h-16 text-gray-100 mx-auto mb-4" />
                                                    <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Aucun Logo</span>
                                                </div>
                                            )}
                                            {isAdmin && (
                                                <div className="absolute inset-0 bg-gray-900/80 opacity-0 group-hover/logo:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm cursor-pointer">
                                                    <input type="file" accept="image/*" onChange={handleLogoChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                                    <div className="text-center px-4">
                                                        <UserPlus className="w-10 h-10 text-white mx-auto mb-2" />
                                                        <p className="text-[10px] font-black text-white uppercase tracking-widest">Télécharger un nouveau Logo</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-[9px] font-bold text-gray-400 text-center uppercase tracking-widest">Optimisé pour les rapports PDF PDF</p>
                                </div>

                                {/* Main Form Module */}
                                <div className="lg:col-span-8 space-y-10">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-2 pl-1"><Building2 className="w-3.5 h-3.5" /> Nom Commercial</label>
                                            <input type="text" value={company.name} onChange={e => handleCompanyChange('name', e.target.value)} readOnly={!isAdmin} className="w-full bg-gray-50 border border-gray-100 text-gray-900 rounded-2xl py-5 px-6 font-black text-xl focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all shadow-inner" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-2 pl-1"><ShieldCheck className="w-3.5 h-3.5" /> Raison Sociale</label>
                                            <input type="text" value={company.legalName} onChange={e => handleCompanyChange('legalName', e.target.value)} readOnly={!isAdmin} className="w-full bg-gray-50 border border-gray-100 text-gray-600 rounded-2xl py-5 px-6 font-bold focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all shadow-inner" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-2 pl-1"><Hash className="w-3.5 h-3.5 text-blue-600" /> Matricule Fiscal (MF)</label>
                                            <input type="text" value={company.fiscalNumber} onChange={e => handleCompanyChange('fiscalNumber', e.target.value)} readOnly={!isAdmin} className="w-full bg-gray-50 border border-gray-100 text-blue-600 rounded-2xl py-5 px-6 font-mono font-black tracking-widest focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all shadow-inner" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-2 pl-1"><Phone className="w-3.5 h-3.5" /> Support Téléphonique</label>
                                            <input type="tel" value={company.phone} onChange={e => handleCompanyChange('phone', e.target.value)} readOnly={!isAdmin} className="w-full bg-gray-50 border border-gray-100 text-gray-600 rounded-2xl py-5 px-6 font-bold shadow-inner" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-2 pl-1"><Mail className="w-3.5 h-3.5" /> Email Administratif</label>
                                            <input type="email" value={company.email} onChange={e => handleCompanyChange('email', e.target.value)} readOnly={!isAdmin} className="w-full bg-gray-50 border border-gray-100 text-gray-600 rounded-2xl py-5 px-6 font-bold shadow-inner" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-2 pl-1"><Globe className="w-3.5 h-3.5" /> URL Site Web</label>
                                            <input type="url" value={company.website || ''} onChange={e => handleCompanyChange('website', e.target.value)} readOnly={!isAdmin} className="w-full bg-gray-50 border border-gray-100 text-gray-600 rounded-2xl py-5 px-6 font-bold shadow-inner" placeholder="https://..." />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Secondary Modular Cards */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Geo & Sector Card */}
                            <div className="bg-white rounded-[2.5rem] border border-gray-100 p-10 shadow-xl shadow-gray-200/50">
                                <h3 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-4"><MapPin className="w-6 h-6 text-blue-600" /> Géolocalisation & Marché</h3>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block pl-1">Siège Social (Adresse)</label>
                                        <input type="text" value={company.address} onChange={e => handleCompanyChange('address', e.target.value)} readOnly={!isAdmin} className="w-full bg-gray-50 border border-gray-100 text-gray-600 rounded-2xl py-5 px-6 font-medium shadow-inner outline-none transition-all" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block pl-1">Code Postal</label>
                                            <input type="text" value={company.postalCode} onChange={e => handleCompanyChange('postalCode', e.target.value)} readOnly={!isAdmin} className="w-full bg-gray-50 border border-gray-100 text-gray-900 rounded-2xl py-4 px-6 font-black text-center shadow-inner outline-none transition-all" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block pl-1">Ville</label>
                                            <input type="text" value={company.city} onChange={e => handleCompanyChange('city', e.target.value)} readOnly={!isAdmin} className="w-full bg-gray-50 border border-gray-100 text-gray-900 rounded-2xl py-4 px-6 font-black text-center shadow-inner outline-none transition-all" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block pl-1">Secteur Principal</label>
                                            <div className="relative">
                                                <select value={company.sector || ''} onChange={e => handleCompanyChange('sector', e.target.value)} disabled={!isAdmin} className="w-full bg-gray-50 border border-gray-100 text-gray-900 rounded-2xl py-4 px-6 font-black uppercase text-[10px] tracking-widest appearance-none cursor-pointer outline-none">
                                                    <option value="">Sélectionner</option>
                                                    <option value="commerce">Commerce</option>
                                                    <option value="services">Services</option>
                                                    <option value="industrie">Industrie</option>
                                                    <option value="informatique">Informatique</option>
                                                </select>
                                                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 rotate-90 pointer-events-none" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block pl-1">Effectif Global</label>
                                            <input type="number" value={company.employeesCount || ''} onChange={e => handleCompanyChange('employeesCount', parseInt(e.target.value) || null)} readOnly={!isAdmin} className="w-full bg-gray-50 border border-gray-100 text-gray-900 rounded-2xl py-4 px-6 font-black text-center shadow-inner outline-none transition-all" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Financia & Banking Card */}
                            <div className="bg-white rounded-[2.5rem] border border-gray-100 p-10 shadow-xl shadow-gray-200/50">
                                <h3 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-4"><Landmark className="w-6 h-6 text-emerald-600" /> Flux Bancaires</h3>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block pl-1">Désignation Établissement</label>
                                        <input type="text" value={company.bankName || ''} onChange={e => handleCompanyChange('bankName', e.target.value)} readOnly={!isAdmin} className="w-full bg-gray-50 border border-gray-100 text-gray-900 rounded-2xl py-5 px-6 font-black uppercase tracking-widest text-[10px] shadow-inner outline-none" placeholder="Ex: AMEN BANK" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block pl-1">RIB (Relevé d'Identité Bancaire)</label>
                                        <input type="text" value={company.bankRib || ''} onChange={e => handleCompanyChange('bankRib', e.target.value)} readOnly={!isAdmin} className="w-full bg-gray-50 border border-gray-100 text-emerald-600 rounded-2xl py-5 px-6 font-mono font-black tracking-widest shadow-inner text-sm outline-none" placeholder="TN00 00..." />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block pl-1">IBAN / SWIFT International</label>
                                        <input type="text" value={company.bankIban || ''} onChange={e => handleCompanyChange('bankIban', e.target.value)} readOnly={!isAdmin} className="w-full bg-gray-50 border border-gray-100 text-emerald-600 rounded-2xl py-5 px-6 font-mono font-black shadow-inner text-sm outline-none" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* PDF Templates High-End Selector */}
                        <div className="bg-white rounded-[2.5rem] border border-gray-100 p-12 shadow-xl shadow-gray-200/50">
                            <h3 className="text-2xl font-black text-gray-900 mb-4 text-center tracking-tight uppercase">Thèmes de Documents PDF</h3>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center mb-10">
                                Choisissez le style de vos factures, devis et documents
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {[
                                    {
                                        id: 'CLASSIC',
                                        label: 'Classic',
                                        desc: 'Simple et Professionnel',
                                        details: 'Design épuré et classique, parfait pour tous types de documents',
                                        color: 'from-gray-500 to-gray-700',
                                        preview: 'linear'
                                    },
                                    {
                                        id: 'MODERN',
                                        label: 'Modern',
                                        desc: 'Stylé et Coloré',
                                        details: 'Design moderne avec touches de couleur et mise en page dynamique',
                                        color: 'from-blue-500 to-indigo-600',
                                        preview: 'gradient'
                                    },
                                    {
                                        id: 'PREMIUM',
                                        label: 'Premium',
                                        desc: 'Ultra Moderne',
                                        details: 'Design haut de gamme avec mise en page avancée et effets visuels',
                                        color: 'from-purple-600 to-pink-600',
                                        preview: 'premium'
                                    }
                                ].map(tpl => (
                                    <button
                                        key={tpl.id}
                                        onClick={() => isAdmin && handleCompanyChange('pdfTemplate', tpl.id as any)}
                                        disabled={!isAdmin}
                                        className={`group relative p-6 rounded-[2rem] border-4 transition-all duration-500 overflow-hidden ${company.pdfTemplate === tpl.id
                                            ? 'border-blue-600 bg-blue-50/50 scale-105'
                                            : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-xl'
                                            }`}
                                    >
                                        {/* Preview Card */}
                                        <div className="w-full h-48 bg-white rounded-xl mb-6 relative overflow-hidden shadow-lg border border-gray-100 group-hover:scale-105 transition-transform duration-500">
                                            {/* Header with gradient */}
                                            <div className={`h-12 bg-gradient-to-r ${tpl.color} flex items-center justify-between px-4`}>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                                                        <ImageIcon className="w-4 h-4 text-white" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <div className="w-16 h-1.5 bg-white/40 rounded"></div>
                                                        <div className="w-12 h-1 bg-white/30 rounded"></div>
                                                    </div>
                                                </div>
                                                <div className="space-y-1 text-right">
                                                    <div className="w-20 h-1.5 bg-white/40 rounded ml-auto"></div>
                                                    <div className="w-16 h-1 bg-white/30 rounded ml-auto"></div>
                                                </div>
                                            </div>

                                            {/* Client Block */}
                                            <div className={`mx-4 mt-4 p-3 rounded-lg ${tpl.preview === 'gradient' ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200' :
                                                tpl.preview === 'premium' ? 'bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 shadow-md' :
                                                    'bg-gray-50 border border-gray-200'
                                                }`}>
                                                <div className="w-20 h-2 bg-gray-300 rounded mb-2"></div>
                                                <div className="w-full h-1.5 bg-gray-200 rounded mb-1"></div>
                                                <div className="w-3/4 h-1.5 bg-gray-200 rounded"></div>
                                            </div>

                                            {/* Table */}
                                            <div className="mx-4 mt-4 space-y-1">
                                                <div className={`h-6 rounded flex items-center px-2 ${tpl.preview === 'gradient' ? 'bg-gradient-to-r from-blue-500 to-indigo-500' :
                                                    tpl.preview === 'premium' ? 'bg-gradient-to-r from-purple-600 to-pink-600' :
                                                        'bg-gray-200'
                                                    }`}>
                                                    <div className={`w-full h-1 rounded ${tpl.preview === 'linear' ? 'bg-gray-400' : 'bg-white/50'
                                                        }`}></div>
                                                </div>
                                                <div className="h-4 bg-gray-50 rounded flex items-center px-2">
                                                    <div className="w-full h-1 bg-gray-200 rounded"></div>
                                                </div>
                                                <div className={`h-4 rounded flex items-center px-2 ${tpl.preview === 'gradient' ? 'bg-blue-50/50' : 'bg-white'
                                                    }`}>
                                                    <div className="w-full h-1 bg-gray-200 rounded"></div>
                                                </div>
                                            </div>

                                            {/* Total */}
                                            <div className="absolute bottom-3 right-4">
                                                <div className={`px-3 py-1.5 rounded-lg ${tpl.preview === 'gradient' ? 'bg-gradient-to-r from-blue-500 to-indigo-500' :
                                                    tpl.preview === 'premium' ? 'bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg' :
                                                        'bg-gray-200'
                                                    }`}>
                                                    <div className={`w-16 h-1.5 rounded ${tpl.preview === 'linear' ? 'bg-gray-400' : 'bg-white/70'
                                                        }`}></div>
                                                </div>
                                            </div>

                                            {/* Watermark */}
                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-45deg] opacity-10">
                                                <span className={`text-4xl font-black bg-gradient-to-r ${tpl.color} bg-clip-text text-transparent`}>
                                                    VALIDE
                                                </span>
                                            </div>
                                        </div>

                                        {/* Theme Info */}
                                        <div className="space-y-2 mb-4">
                                            <div className="flex items-center justify-between">
                                                <span className={`text-lg font-black uppercase tracking-tight bg-gradient-to-r ${tpl.color} bg-clip-text text-transparent`}>
                                                    {tpl.label}
                                                </span>
                                                {company.pdfTemplate === tpl.id && (
                                                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg">
                                                        <Check className="w-4 h-4" />
                                                    </div>
                                                )}
                                            </div>
                                            <span className="text-xs font-bold text-gray-600 uppercase tracking-wider block">
                                                {tpl.desc}
                                            </span>
                                            <p className="text-[10px] text-gray-400 leading-relaxed">
                                                {tpl.details}
                                            </p>
                                        </div>

                                        {/* Features */}
                                        <div className="space-y-1.5 pt-4 border-t border-gray-100">
                                            <div className="flex items-center gap-2 text-[9px] text-gray-500">
                                                <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${tpl.color}`}></div>
                                                <span>Logo redimensionné automatiquement</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-[9px] text-gray-500">
                                                <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${tpl.color}`}></div>
                                                <span>Filigrane VALIDE/NON VALIDE</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-[9px] text-gray-500">
                                                <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${tpl.color}`}></div>
                                                <span>Toutes informations incluses</span>
                                            </div>
                                        </div>

                                        {/* Hover Effect */}
                                        <div className={`absolute inset-0 bg-gradient-to-br ${tpl.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500 rounded-[2rem] pointer-events-none`}></div>
                                    </button>
                                ))}
                            </div>

                            {/* Info Banner */}
                            <div className="mt-10 p-6 bg-blue-50 rounded-2xl border border-blue-100">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <AlertCircle className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-blue-900 uppercase tracking-wide mb-2">
                                            Gestion Intelligente du Logo
                                        </h4>
                                        <p className="text-xs text-blue-700 leading-relaxed">
                                            Votre logo sera automatiquement redimensionné pour s'adapter au thème choisi,
                                            <span className="font-bold"> sans jamais être recadré ou déformé</span>.
                                            Le ratio d'aspect original est toujours préservé pour une qualité optimale.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'accountant' && (
                    <div className="space-y-8">
                        <AccountantInvitationSection />
                    </div>
                )}

                {activeTab === 'taxes' && (
                    <div className="space-y-10">
                        <div className="bg-white rounded-[2.5rem] border border-gray-100 p-12 shadow-xl shadow-gray-200/50">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-4 uppercase"><Percent className="w-8 h-8 text-blue-600" /> Registre Fiscal</h2>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2 ml-12">Configuration des taxes et prélèvements</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                                {taxes.map((tax) => (
                                    <div key={tax.id} className="group bg-gray-50 p-8 rounded-[2rem] border border-gray-100 flex flex-col justify-between hover:bg-white hover:border-blue-600 hover:shadow-2xl hover:shadow-blue-600/5 transition-all duration-500 relative">
                                        <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => deleteTax(tax.id)} className="p-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                        <div>
                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1.5">Libellé Taxe</span>
                                            <h3 className="text-xl font-black text-gray-900 tracking-tight transition-colors uppercase">{tax.name}</h3>
                                        </div>
                                        <div className="mt-10 flex items-end justify-between border-t border-gray-200/50 pt-6">
                                            <div className="text-3xl font-black text-gray-900 tracking-tighter">{tax.value} <span className="text-sm text-gray-400 ml-1 font-bold">{tax.type === 'PERCENTAGE' ? '%' : 'TND'}</span></div>
                                            <div className="px-3 py-1 bg-white rounded-lg text-[9px] font-black text-blue-600 uppercase tracking-widest border border-gray-100 shadow-sm">{tax.type === 'PERCENTAGE' ? 'Variable' : 'Taxe Fixe'}</div>
                                        </div>
                                    </div>
                                ))}

                                {taxes.length === 0 && (
                                    <div className="lg:col-span-3 py-20 text-center bg-gray-50 rounded-[2.5rem] border border-dashed border-gray-200 grayscale opacity-80">
                                        <Percent className="w-16 h-16 mx-auto mb-4 text-gray-200" />
                                        <p className="font-black uppercase tracking-widest text-[10px] text-gray-400">Aucune configuration fiscale active</p>
                                    </div>
                                )}
                            </div>

                            <div className="bg-gray-50/50 p-10 rounded-[2.5rem] border border-gray-100">
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-10 text-center flex items-center justify-center gap-4">
                                    <Plus className="w-5 h-5 text-blue-600" /> Ajouter un nouveau schéma fiscal
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-1 text-center">Désignation</label>
                                        <input type="text" value={newTax.name} onChange={e => setNewTax({ ...newTax, name: e.target.value })} className="w-full bg-white border border-gray-100 text-gray-900 rounded-xl py-4 px-6 font-bold shadow-sm outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all text-center" placeholder="Ex: TVA 19%" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-1 text-center">Valeur Numérique</label>
                                        <input type="number" value={newTax.value} onChange={e => setNewTax({ ...newTax, value: parseFloat(e.target.value) || 0 })} className="w-full bg-white border border-gray-100 text-gray-900 rounded-xl py-4 px-6 font-black text-center shadow-sm outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block ml-1 text-center">Type Appliqué</label>
                                        <div className="relative">
                                            <select value={newTax.type} onChange={e => setNewTax({ ...newTax, type: e.target.value as any })} className="w-full bg-white border border-gray-100 text-gray-900 rounded-xl py-4 px-6 font-black uppercase text-[10px] tracking-widest appearance-none cursor-pointer outline-none text-center">
                                                <option value="PERCENTAGE">Pourcentage (%)</option>
                                                <option value="FIXED">Montant Fixe (TND)</option>
                                            </select>
                                            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 rotate-90" />
                                        </div>
                                    </div>
                                </div>
                                <button onClick={addTax} className="w-full max-w-md mx-auto mt-12 py-5 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all shadow-xl shadow-gray-900/10 active:scale-95 flex items-center justify-center gap-3">
                                    <Save className="w-4 h-4" /> Provisionner Taxe
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'payments' && (
                    <div className="space-y-10">
                        <div className="bg-white rounded-[2.5rem] border border-gray-100 p-12 shadow-xl shadow-gray-200/50">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-4 uppercase mb-10"><CreditCard className="w-8 h-8 text-emerald-600" /> Architecture de Règlement</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                                {paymentMethods.map((method) => (
                                    <div key={method.id} className="group bg-gray-50 p-10 rounded-[2.5rem] border border-gray-100 flex flex-col items-center justify-center text-center hover:bg-white hover:border-emerald-600 hover:shadow-2xl hover:shadow-emerald-600/5 transition-all duration-500 relative overflow-hidden">
                                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => deletePaymentMethod(method.id)} className="p-2.5 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                        <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-sm border border-gray-100 group-hover:scale-110 group-hover:bg-emerald-50 transition-all duration-500">
                                            <CreditCard className="w-7 h-7 text-emerald-600" />
                                        </div>
                                        <h3 className="text-lg font-black text-gray-900 tracking-tight uppercase mb-2">{method.name}</h3>
                                        <div className="px-3 py-1 bg-emerald-50 text-[8px] font-black text-emerald-600 uppercase tracking-widest rounded-full border border-emerald-100">Standardisé</div>
                                    </div>
                                ))}
                            </div>

                            <div className="max-w-2xl mx-auto pt-10 border-t border-gray-100">
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-8 text-center flex items-center justify-center gap-4">
                                    <Plus className="w-5 h-5 text-emerald-600" /> Nouveau Canal de Règlement
                                </h3>
                                <div className="flex flex-col md:flex-row gap-4">
                                    <input type="text" value={newPaymentMethod} onChange={e => setNewPaymentMethod(e.target.value)} className="flex-[2] bg-gray-50 border border-gray-100 text-gray-900 rounded-2xl py-5 px-8 font-black uppercase text-[10px] tracking-widest outline-none focus:ring-4 focus:ring-emerald-600/5 focus:border-emerald-600 transition-all sm:text-center" placeholder="Ex: Virement Bancaire" />
                                    <button onClick={addPaymentMethod} className="flex-1 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-emerald-600/20 hover:scale-[1.02] active:scale-95 transition-all py-5">
                                        Ajouter Protocole
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
