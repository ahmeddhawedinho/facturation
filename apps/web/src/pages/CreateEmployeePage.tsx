import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import {
    ArrowLeft, Upload, FileText, User,
    Briefcase, Check, Calendar, Banknote, ShieldCheck, CreditCard
} from 'lucide-react'

export default function CreateEmployeePage() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const [imagePreview, setImagePreview] = useState<string | null>(null)

    const [form, setForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        position: '',
        department: '',
        baseSalary: 0,
        paymentDay: 1,
        hireDate: new Date().toISOString().split('T')[0],
        cnssNumber: '',
        cin: '',
        bankAccount: '',
        image: '',
        contractDocument: '',
        cnssDocument: '',
        otherDocuments: ''
    })

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                const base64 = reader.result as string
                if (field === 'image') setImagePreview(base64)
                setForm({ ...form, [field]: base64 })
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            setLoading(true)
            await api.post('/employees', form)
            navigate('/dashboard/salary')
        } catch (error) {
            console.error('Erreur création employé:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50/50 space-y-8 animate-fade-in pb-20">
            {/* Premium Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/50">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => navigate('/dashboard/salary')}
                        className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 hover:bg-white hover:shadow-md transition-all group scale-90"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                    </button>
                    <div className="w-16 h-16 bg-blue-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-blue-600/20">
                        <User className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl lg:text-5xl font-black text-gray-900 tracking-tight leading-none uppercase">
                            Nouveau <span className="text-blue-600">Collaborateur</span>
                        </h1>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-2">
                            Initialisation du processus de recrutement et <span className="text-blue-600">intégration RH</span>.
                        </p>
                    </div>
                </div>

                <div className="flex gap-4 w-full lg:w-auto">
                    <button
                        type="button"
                        onClick={() => navigate('/dashboard/salary')}
                        className="flex-1 lg:flex-none px-8 py-4 bg-white border border-gray-200 text-gray-900 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-all"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-1 lg:flex-none px-12 py-4 bg-gray-900 text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-gray-900/10 flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
                        Valider le Recrutement
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Side: Photo & Identity */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="bg-white rounded-[2.5rem] border border-gray-100 p-10 shadow-xl shadow-gray-200/50 text-center relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50"></div>

                        <label className="relative inline-block cursor-pointer group/photo">
                            <div className="w-40 h-40 rounded-[3rem] bg-gray-50 p-1.5 shadow-inner border border-gray-100 overflow-hidden group-hover/photo:scale-105 transition-transform duration-500">
                                <div className="w-full h-full rounded-[2.5rem] bg-white overflow-hidden flex items-center justify-center">
                                    {imagePreview ? (
                                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <User className="w-16 h-16 text-gray-100" />
                                    )}
                                </div>
                            </div>
                            <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-xl border-4 border-white group-hover/photo:scale-110 transition-transform">
                                <Upload className="w-5 h-5" />
                            </div>
                            <input type="file" accept="image/*" onChange={e => handleImageUpload(e, 'image')} className="hidden" />
                        </label>

                        <div className="mt-8">
                            <h3 className="text-xl font-black text-gray-900 tracking-tight">Photo d'Identité</h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Format portrait recommandé</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-xl shadow-gray-200/50 space-y-6">
                        <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2 mb-2">
                            <ShieldCheck className="w-4 h-4 text-blue-600" /> Administrative Info
                        </h3>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Matricule CNSS</label>
                                <input type="text" className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all font-bold text-gray-700" placeholder="00000000-00" value={form.cnssNumber} onChange={e => setForm({ ...form, cnssNumber: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Numéro CIN</label>
                                <input type="text" className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all font-bold text-gray-700" placeholder="00000000" value={form.cin} onChange={e => setForm({ ...form, cin: e.target.value })} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Detailed Sections */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Personal Module */}
                    <div className="bg-white rounded-[2.5rem] border border-gray-100 p-10 shadow-xl shadow-gray-200/50">
                        <div className="flex items-center gap-4 mb-10 border-b border-gray-50 pb-6">
                            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner">
                                <User className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-gray-900 tracking-tight">Identification Personnelle</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Informations de contact de base</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Prénom</label>
                                <input type="text" className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all font-bold text-gray-700" placeholder="Ex: Ahmed" value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} required />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Nom</label>
                                <input type="text" className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all font-bold text-gray-700" placeholder="Ex: Ben Salah" value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} required />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Professionnel</label>
                                <input type="email" className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all font-bold text-gray-700" placeholder="contact@entreprise.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Téléphone Mobilie</label>
                                <input type="tel" className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all font-bold text-gray-700" placeholder="+216 -- --- ---" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                            </div>
                        </div>
                    </div>

                    {/* Operational Module */}
                    <div className="bg-white rounded-[2.5rem] border border-gray-100 p-10 shadow-xl shadow-gray-200/50">
                        <div className="flex items-center gap-4 mb-10 border-b border-gray-50 pb-6">
                            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner">
                                <Briefcase className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-gray-900 tracking-tight">Sphère Opérationnelle</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Poste, Salaire et Contrat</p>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Intitulé du Poste</label>
                                    <input type="text" className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-emerald-600/5 focus:border-emerald-600 outline-none transition-all font-bold text-gray-700" placeholder="Ex: Designer UI/UX" value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Département</label>
                                    <input type="text" className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-emerald-600/5 focus:border-emerald-600 outline-none transition-all font-bold text-gray-700" placeholder="Ex: Production" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} />
                                </div>
                            </div>

                            <div className="p-8 bg-gray-50 rounded-[2rem] border border-gray-100">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 block text-center">Salaire de Base Mensuel (TND)</label>
                                <div className="relative max-w-sm mx-auto">
                                    <input
                                        type="number"
                                        step="0.001"
                                        className="w-full bg-white border border-gray-200 text-3xl font-black rounded-2xl p-6 outline-none focus:ring-4 focus:ring-emerald-600/10 focus:border-emerald-600 transition-all text-center pr-16"
                                        value={form.baseSalary}
                                        onChange={e => setForm({ ...form, baseSalary: parseFloat(e.target.value) || 0 })}
                                        required
                                    />
                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs uppercase">TND</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> Jour de Paiement</label>
                                    <input type="number" min="1" max="31" className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-emerald-600/5 focus:border-emerald-600 transition-all font-bold text-gray-700 text-center" value={form.paymentDay} onChange={e => setForm({ ...form, paymentDay: parseInt(e.target.value) || 1 })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> Date d'Embauche</label>
                                    <input type="date" className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-emerald-600/5 focus:border-emerald-600 transition-all font-bold text-gray-700" value={form.hireDate} onChange={e => setForm({ ...form, hireDate: e.target.value })} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Financial Module */}
                    <div className="bg-white rounded-[2.5rem] border border-gray-100 p-10 shadow-xl shadow-gray-200/50">
                        <div className="flex items-center gap-4 mb-10 border-b border-gray-50 pb-6">
                            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner">
                                <CreditCard className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-gray-900 tracking-tight">Coordonnées Bancaires</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Versement automatique des salaires</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Banknote className="w-3.5 h-3.5" /> Relevé d'Identité Bancaire (RIB)</label>
                            <input type="text" className="w-full px-6 py-5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 outline-none transition-all font-mono font-bold text-gray-700 text-center tracking-widest" placeholder="TN00 0000 0000 0000 0000 0000" value={form.bankAccount} onChange={e => setForm({ ...form, bankAccount: e.target.value })} />
                        </div>
                    </div>

                    {/* Documents Module */}
                    <div className="bg-white rounded-[2.5rem] border border-gray-100 p-10 shadow-xl shadow-gray-200/50">
                        <div className="flex items-center gap-4 mb-10 border-b border-gray-50 pb-6">
                            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 shadow-inner">
                                <FileText className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-gray-900 tracking-tight">Pièces Jointes</h3>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Dossier administratif numérisé</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                                { label: 'Contrat de Travail', field: 'contractDocument', sub: 'PDF, Images supporté' },
                                { label: 'Attestation CNSS', field: 'cnssDocument', sub: 'Justificatif affiliation' }
                            ].map(doc => (
                                <label key={doc.field} className="relative group cursor-pointer">
                                    <div className="p-6 bg-gray-50 border border-dashed border-gray-200 rounded-[2rem] hover:bg-white hover:border-blue-600 hover:shadow-xl hover:shadow-blue-600/5 transition-all text-center">
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-gray-400 group-hover:text-blue-600 shadow-sm mx-auto mb-4 border border-gray-100 transition-colors">
                                            {(form as any)[doc.field] ? <Check className="w-6 h-6" /> : <Upload className="w-6 h-6" />}
                                        </div>
                                        <p className="text-xs font-black text-gray-900 uppercase tracking-tight">{(form as any)[doc.field] ? 'Document Chargé' : doc.label}</p>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">{doc.sub}</p>
                                    </div>
                                    <input type="file" onChange={e => handleImageUpload(e, doc.field)} className="hidden" />
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            </form>
        </div>
    )
}
