import { useState, useEffect } from 'react'
import api from '../lib/api'
import {
    Download,
    Upload,
    CheckCircle2,
    AlertCircle,
    HelpCircle,
    ShoppingCart,
    ShoppingBag,
    Database,
    FileSpreadsheet,
    Calendar,
    Filter,
    ArrowUpRight,
    FileText,
    Zap,
    ChevronRight,
    Check
} from 'lucide-react'

interface Partner {
    id: string
    name: string
}

export default function ImportExportPage() {
    const [partners, setPartners] = useState<Partner[]>([])
    const [section, setSection] = useState<'sales' | 'purchase'>('sales')
    const [exportFilters, setExportFilters] = useState({
        startDate: '',
        endDate: '',
        type: '',
        clientId: '',
        format: 'csv'
    })
    const [importFile, setImportFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null)

    useEffect(() => {
        loadPartners()
    }, [section])

    const loadPartners = async () => {
        try {
            const endpoint = section === 'sales' ? '/clients' : '/suppliers'
            const res = await api.get(endpoint)
            setPartners(res.data || [])
        } catch (error) {
            console.error('Erreur partenaires:', error)
        }
    }

    const handleExport = async () => {
        setLoading(true)
        try {
            const params = { ...exportFilters, section }
            const query = new URLSearchParams(params).toString()
            const response = await api.get(`/import-export/export?${query}`, {
                responseType: 'blob'
            })

            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `export_${section}_${new Date().toISOString().split('T')[0]}.${exportFilters.format === 'excel' ? 'csv' : 'csv'}`)
            document.body.appendChild(link)
            link.click()
            link.remove()
        } catch (error) {
            console.error('Export error:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleImport = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!importFile) return

        setLoading(true)
        setStatus(null)
        const formData = new FormData()
        formData.append('file', importFile)
        formData.append('section', section)

        try {
            const res = await api.post('/import-export/import', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            setStatus({
                type: 'success',
                message: `${res.data.count} documents (${section === 'sales' ? 'Vente' : 'Achat'}) importés avec succès !`
            })
            setImportFile(null)
            const input = document.getElementById('file-upload') as HTMLInputElement
            if (input) input.value = ''
        } catch (error: any) {
            setStatus({
                type: 'error',
                message: error.response?.data?.message || 'Erreur lors de l\'importation'
            })
        } finally {
            setLoading(false)
        }
    }

    const downloadTemplate = async () => {
        try {
            const response = await api.get('/import-export/template', { responseType: 'blob' })
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', 'template_import_documents.csv')
            document.body.appendChild(link)
            link.click()
            link.remove()
        } catch (error) {
            alert('Erreur téléchargement template')
        }
    }

    return (
        <div className="min-h-screen bg-gray-50/50 space-y-8 animate-fade-in pb-20">
            {/* Premium Header Section */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-50 rounded-full blur-[100px] -mr-40 -mt-40 opacity-60"></div>
                <div className="relative z-10">
                    <div className="inline-block px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-[10px] font-black uppercase tracking-[0.2em] mb-6">
                        Migration des données • Stockage Cloud
                    </div>
                    <h1 className="text-4xl lg:text-6xl font-black text-gray-900 mb-4 tracking-tighter leading-none uppercase">
                        Import <span className="text-indigo-600">& Export</span>
                    </h1>
                    <p className="text-gray-400 text-lg max-w-2xl font-bold uppercase text-[10px] tracking-widest leading-relaxed">
                        Synchronisez vos registres commerciaux massivement via <span className="text-indigo-600">protocoles CSV et Excel</span>.
                    </p>
                </div>

                {/* Section Toggle Switch */}
                <div className="bg-gray-50 p-2 rounded-[2rem] border border-gray-100 shadow-inner flex max-w-md w-full relative z-10 shrink-0">
                    <button
                        onClick={() => setSection('sales')}
                        className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-3 relative z-10 ${section === 'sales' ? 'text-white' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <ShoppingCart className="w-4 h-4" />
                        Flux de Vente
                    </button>
                    <button
                        onClick={() => setSection('purchase')}
                        className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-3 relative z-10 ${section === 'purchase' ? 'text-white' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <ShoppingBag className="w-4 h-4" />
                        Flux d'Achat
                    </button>
                    <div className={`absolute top-2 bottom-2 w-[calc(50%-8px)] bg-gray-900 rounded-2xl transition-all duration-500 ease-out shadow-xl ${section === 'sales' ? 'left-2' : 'left-[50%]'}`}></div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Export Card */}
                <div className="bg-white rounded-[2.5rem] border border-gray-100 p-10 shadow-xl shadow-gray-200/50 relative overflow-hidden group">
                    <div className="flex items-center gap-5 mb-10 pb-8 border-b border-gray-50">
                        <div className={`w-16 h-16 rounded-[1.5rem] bg-indigo-50 flex items-center justify-center ${section === 'sales' ? 'text-blue-600' : 'text-purple-600'} shadow-inner border border-indigo-100 transition-transform group-hover:scale-110`}>
                            <Download className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Extraction Master</h2>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Exportation vers registre externe</p>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 ml-1"><Calendar className="w-3.5 h-3.5" /> Date Initiale</label>
                                <input type="date" value={exportFilters.startDate} onChange={e => setExportFilters({ ...exportFilters, startDate: e.target.value })} className="w-full bg-gray-50 border border-gray-100 text-gray-900 rounded-2xl py-5 px-6 font-bold shadow-inner outline-none focus:ring-4 focus:ring-indigo-600/5 transition-all" />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 ml-1"><Calendar className="w-3.5 h-3.5" /> Date Terminale</label>
                                <input type="date" value={exportFilters.endDate} onChange={e => setExportFilters({ ...exportFilters, endDate: e.target.value })} className="w-full bg-gray-50 border border-gray-100 text-gray-900 rounded-2xl py-5 px-6 font-bold shadow-inner outline-none focus:ring-4 focus:ring-indigo-600/5 transition-all" />
                            </div>
                        </div>

                        {section === 'sales' && (
                            <div className="space-y-3">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 ml-1"><Filter className="w-3.5 h-3.5" /> Nature du Document</label>
                                <div className="relative">
                                    <select value={exportFilters.type} onChange={e => setExportFilters({ ...exportFilters, type: e.target.value })} className="w-full bg-gray-50 border border-gray-100 text-gray-600 rounded-2xl py-5 px-6 font-black uppercase text-[10px] tracking-widest appearance-none cursor-pointer outline-none focus:ring-4 focus:ring-indigo-600/5 transition-all">
                                        <option value="">Tous les protocoles</option>
                                        <option value="QUOTE">Devis</option>
                                        <option value="INVOICE">Facture</option>
                                        <option value="SALES_ORDER">Commande</option>
                                        <option value="DELIVERY_NOTE">Livraison</option>
                                    </select>
                                    <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 rotate-90" />
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 ml-1"><Database className="w-3.5 h-3.5" /> Partenaire Cible</label>
                            <div className="relative">
                                <select value={exportFilters.clientId} onChange={e => setExportFilters({ ...exportFilters, clientId: e.target.value })} className="w-full bg-gray-50 border border-gray-100 text-gray-600 rounded-2xl py-5 px-6 font-black uppercase text-[10px] tracking-widest appearance-none cursor-pointer outline-none focus:ring-4 focus:ring-indigo-600/5 transition-all">
                                    <option value="">Tous les {section === 'sales' ? 'clients' : 'fournisseurs'}</option>
                                    {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                                <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 rotate-90" />
                            </div>
                        </div>

                        <div className="pt-4">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-6 text-center">Format du Registre</label>
                            <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100 gap-2">
                                {['csv', 'excel'].map(fmt => (
                                    <button
                                        key={fmt}
                                        onClick={() => setExportFilters({ ...exportFilters, format: fmt })}
                                        className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${exportFilters.format === fmt ? 'bg-white text-indigo-600 shadow-sm border border-gray-100' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        {fmt === 'csv' ? 'CSV Standard' : 'Excel Mapping'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={handleExport}
                            disabled={loading}
                            className={`w-full py-6 rounded-[2rem] font-black text-white flex items-center justify-center gap-4 transition-all shadow-xl active:scale-95 disabled:opacity-50 text-[10px] uppercase tracking-[0.3em] bg-gray-900 border-b-4 border-gray-700 shadow-gray-900/10 mt-4`}
                        >
                            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Download className="w-5 h-5" />}
                            Initialiser l'extraction
                        </button>
                    </div>
                </div>

                {/* Import Card */}
                <div className="bg-white rounded-[2.5rem] border border-gray-100 p-10 shadow-xl shadow-gray-200/50 relative overflow-hidden group">
                    <div className="flex items-center gap-5 mb-10 pb-8 border-b border-gray-50">
                        <div className={`w-16 h-16 rounded-[1.5rem] bg-amber-50 flex items-center justify-center text-amber-600 shadow-inner border border-amber-100 transition-transform group-hover:scale-110`}>
                            <Upload className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Injection Massive</h2>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Intégration de flux externes</p>
                        </div>
                    </div>

                    <form onSubmit={handleImport} className="space-y-8">
                        <div className="relative group/drop">
                            <input
                                id="file-upload"
                                type="file"
                                accept=".csv"
                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                onChange={e => setImportFile(e.target.files?.[0] || null)}
                            />
                            <div className="w-full min-h-[250px] border-2 border-dashed border-gray-200 rounded-[2.5rem] flex flex-col items-center justify-center bg-gray-50 group-hover/drop:bg-indigo-50/50 group-hover/drop:border-indigo-600 group-hover/drop:shadow-2xl group-hover/drop:shadow-indigo-600/5 transition-all duration-500 relative p-8 text-center">
                                <div className="w-20 h-20 bg-white rounded-[1.5rem] flex items-center justify-center shadow-xl border border-gray-100 mb-6 group-hover/drop:scale-110 transition-transform duration-500">
                                    <CloudUpload className="hidden group-hover/drop:inline" />
                                    <FileSpreadsheet className="w-10 h-10 text-gray-300 group-hover/drop:text-indigo-600 transition-colors" />
                                </div>
                                <p className="text-gray-900 font-black text-xl tracking-tight leading-none mb-3">
                                    {importFile ? importFile.name : 'Déposez votre fichier CSV'}
                                </p>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] max-w-[200px] leading-relaxed">
                                    Format .csv uniquement • Max 20MB
                                </p>
                            </div>
                        </div>

                        <div className="bg-indigo-50/30 p-8 rounded-[2rem] border border-indigo-100/50 flex flex-col sm:flex-row gap-6 items-center text-center sm:text-left shadow-sm">
                            <div className="w-14 h-14 rounded-3xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-indigo-600/20">
                                <Zap className="w-7 h-7" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Optimisation de Structure</p>
                                <p className="text-[10px] font-bold text-gray-400 leading-snug uppercase tracking-widest">Utilisez le gabarit officiel pour une synchro parfaite.</p>
                                <button type="button" onClick={downloadTemplate} className="inline-flex items-center gap-2 text-[10px] font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-widest mt-3 underline decoration-indigo-600/20 underline-offset-4">
                                    Télécharger le gabarit CSV <ArrowUpRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>

                        {status && (
                            <div className={`p-6 rounded-[2rem] flex gap-4 items-center border animate-fade-in-up ${status.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'}`}>
                                <div className={`w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm`}>
                                    {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest leading-relaxed">{status.message}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={!importFile || loading}
                            className={`w-full py-6 rounded-[2rem] font-black text-white flex items-center justify-center gap-4 transition-all shadow-xl active:scale-95 disabled:opacity-50 text-[10px] uppercase tracking-[0.3em] bg-gray-900 border-b-4 border-gray-700 shadow-gray-900/10`}
                        >
                            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="w-5 h-5" />}
                            Exécuter l'injection
                        </button>
                    </form>
                </div>
            </div>

            {/* Analytical Guide Section */}
            <div className="bg-white border border-gray-100 rounded-[3rem] p-12 shadow-xl shadow-gray-200/50 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                <div className="flex items-center gap-6 mb-16 px-4">
                    <div className="w-20 h-20 bg-gray-50 rounded-[2.5rem] border border-gray-100 flex items-center justify-center text-indigo-600 shadow-inner">
                        <HelpCircle className="w-10 h-10" />
                    </div>
                    <div>
                        <h3 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Base de Connaissance</h3>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2 ml-1">Protocoles et Directives de Migration</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 px-4">
                    {[
                        { title: 'Regroupement', desc: 'Les documents avec UID identiques sont agrégés en entités cohérentes.', icon: Database, color: 'text-indigo-600' },
                        { title: 'Provisionnement', desc: `Les entités (${section === 'sales' ? 'clients' : 'fournisseurs'}) sont créées automatiquement durant l'injection.`, icon: UserPlus, color: 'text-blue-600' },
                        { title: 'Chronologie', desc: 'Séquençage ISO-8601 (YYYY-MM-DD) recommandé pour une traçabilité totale.', icon: Calendar, color: 'text-emerald-600' },
                        { title: 'Vecteurs Taxe', desc: 'Indiquez les taux de TVA pour un calcul précis des cotisations administratives.', icon: FileText, color: 'text-amber-600' }
                    ].map((step, i) => (
                        <div key={i} className="space-y-6 relative group/step">
                            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center transition-all group-hover/step:bg-gray-900 group-hover/step:text-white group-hover/step:scale-110 shadow-sm border border-gray-100">
                                <step.icon className="w-6 h-6" />
                            </div>
                            <div className="space-y-3">
                                <span className="text-[9px] font-black text-gray-300 uppercase tracking-[0.3em]">Module 0{i + 1}</span>
                                <h4 className="font-black text-gray-900 text-xl tracking-tight uppercase">{step.title}</h4>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">{step.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

function CloudUpload(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-10 h-10 text-indigo-600"
        >
            <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
            <path d="M12 12v9" />
            <path d="m16 16-4-4-4 4" />
        </svg>
    )
}

function UserPlus(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" x2="19" y1="8" y2="14" />
            <line x1="22" x2="16" y1="11" y2="11" />
        </svg>
    )
}
