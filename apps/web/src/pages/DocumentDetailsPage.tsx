import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { ArrowLeft, Printer, Download, Mail, Edit, FileText, Building2, Quote, CheckCircle2, ShoppingCart, Truck, Receipt, MapPin, Phone, Hash } from 'lucide-react'

interface DocumentLine {
    description: string
    quantity: number
    unitPrice: number
    discount: number
    subtotal: number
    total: number
    taxRate?: { name: string; rate: number }
}

interface DocumentDetail {
    id: string
    number: string
    type: string
    issueDate: string
    dueDate: string
    status: string
    client: {
        id: string
        name: string
        email: string
        address: string
        fiscalNumber: string
    }
    company: {
        name: string
        address: string
        fiscalNumber: string
        phone: string
        email: string
        logo: string
    }
    lines: DocumentLine[]
    subtotal: number
    taxTotal: number
    total: number
    currency: string
    notes: string
    timbreFiscal?: number
    fodecTotal?: number
}

export default function DocumentDetailsPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [currentDoc, setCurrentDoc] = useState<DocumentDetail | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (id) loadDocument(id)
    }, [id])

    const loadDocument = async (docId: string) => {
        try {
            setLoading(true)
            const res = await api.get(`/documents/${docId}`)
            setCurrentDoc(res.data)
        } catch (error) { navigate('/dashboard/sales') }
        finally { setLoading(false) }
    }

    const handlePrint = () => window.print()

    const handleDownloadPdf = async () => {
        try {
            const response = await api.get(`/documents/${id}/pdf`, { responseType: 'blob' })
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${currentDoc?.number || 'document'}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) { alert('Erreur PDF') }
    }

    if (loading) return <div className="py-40 flex flex-col items-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" /></div>
    if (!currentDoc) return <div className="py-40 text-center text-rose-500 font-black uppercase tracking-widest">Document Introuvable</div>

    const getTypeName = (type: string) => {
        const types: any = {
            'QUOTE': 'Devis Commercial',
            'SALES_ORDER': 'Bon de Commande',
            'DELIVERY_NOTE': 'Bon de Livraison',
            'INVOICE': 'Facture Vente',
            'STOCK_OUTPUT': 'Bon de Sortie'
        }
        return types[type] || type
    }

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'QUOTE': return <Quote className="w-6 h-6 text-blue-400" />
            case 'INVOICE': return <Receipt className="w-6 h-6 text-emerald-400" />
            case 'SALES_ORDER': return <ShoppingCart className="w-6 h-6 text-amber-400" />
            case 'DELIVERY_NOTE': return <Truck className="w-6 h-6 text-purple-400" />
            default: return <FileText className="w-6 h-6 text-gray-400" />
        }
    }

    return (
        <div className="space-y-10 animate-fade-in relative pb-20">
            {/* Ambient Background */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none -z-10"></div>

            {/* Premium Header/Toolbar */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/50">
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate('/dashboard/sales')} className="p-4 bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-900 rounded-2xl border border-gray-100 transition-all group active:scale-95">
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div className="flex items-center gap-5">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${currentDoc.type === 'QUOTE' ? 'bg-blue-50 text-blue-600' :
                                currentDoc.type === 'INVOICE' ? 'bg-orange-50 text-orange-600' :
                                    currentDoc.type === 'SALES_ORDER' ? 'bg-emerald-50 text-emerald-600' :
                                        'bg-purple-50 text-purple-600'
                            }`}>
                            {getTypeIcon(currentDoc.type)}
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 tracking-tight">{getTypeName(currentDoc.type)}</h1>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">IDENTIFIANT DOC: <span className="text-blue-600">#{currentDoc.number}</span></p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3 w-full lg:w-auto">
                    <button onClick={() => navigate(`/dashboard/documents/${id}/edit`)} className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-gray-50 border border-gray-100 text-gray-600 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-all">
                        <Edit className="w-4 h-4" /> Configurer
                    </button>
                    <button onClick={handlePrint} className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-gray-50 border border-gray-100 text-gray-600 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-all">
                        <Printer className="w-4 h-4" /> Impression
                    </button>
                    <button onClick={handleDownloadPdf} className="flex-1 lg:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-gray-900 text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-xl shadow-gray-900/20 hover:scale-105 active:scale-95 transition-all">
                        <Download className="w-5 h-5" /> Exporter PDF
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-10">
                {/* Meta Sidebar */}
                <div className="xl:col-span-1 space-y-8">
                    {/* Status Card */}
                    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-lg shadow-gray-200/50 overflow-hidden relative group">
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full"></div>
                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6 block">État du Cycle</h3>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100 shadow-inner">
                                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-xl font-black text-gray-900 tracking-tight uppercase">{currentDoc.status}</p>
                                <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Document Validé</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-gray-400 uppercase tracking-tighter">Émission</span>
                                <span className="font-black text-gray-900">{new Date(currentDoc.issueDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-gray-400 uppercase tracking-tighter">Échéance</span>
                                <span className="font-black text-rose-500 font-mono">{new Date(currentDoc.dueDate).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Client Context Card */}
                    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-lg shadow-gray-200/50 relative group cursor-pointer" onClick={() => navigate(`/dashboard/clients/${currentDoc.client.id}`)}>
                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6 block">Profil Destinataire</h3>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center font-black text-xl text-blue-600 shadow-inner group-hover:scale-110 transition-transform">
                                {currentDoc.client.name.charAt(0)}
                            </div>
                            <div>
                                <h4 className="text-lg font-black text-gray-900 tracking-tight leading-none mb-1 group-hover:text-blue-600 transition-colors uppercase">{currentDoc.client.name}</h4>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter leading-none mt-1">CODE: CL-{currentDoc.client.id.slice(0, 5)}</p>
                            </div>
                        </div>
                        <div className="space-y-3 pt-4 border-t border-gray-50">
                            <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                                <Mail className="w-3.5 h-3.5 text-blue-500" /> {currentDoc.client.email || 'Email non défini'}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                                <Building2 className="w-3.5 h-3.5 text-blue-500" /> {currentDoc.client.address || 'Adresse non spécifiée'}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-blue-600 font-bold font-mono">
                                <Hash className="w-3.5 h-3.5 text-blue-600" /> {currentDoc.client.fiscalNumber || 'Fiche Native'}
                            </div>
                        </div>
                    </div>

                    {/* Quick Analytics */}
                    <div className="bg-blue-600 p-8 rounded-[2.5rem] border border-blue-700 shadow-xl shadow-blue-500/20">
                        <h3 className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-4">Valeur Nette HT</h3>
                        <p className="text-4xl font-black text-white tracking-tighter">{currentDoc.subtotal.toFixed(3)} <span className="text-sm font-bold text-white/30 ml-1">TND</span></p>
                    </div>
                </div>

                {/* Main Document Content */}
                <div className="xl:col-span-3 space-y-10">
                    <div className="bg-white rounded-[3rem] p-12 lg:p-20 shadow-2xl shadow-gray-300/50 text-gray-900 min-h-[1000px] flex flex-col print:shadow-none print:p-0" id="document-preview">
                        {/* Internal Header */}
                        <div className="flex flex-col md:flex-row justify-between items-start gap-12 border-b-4 border-gray-900 pb-12 mb-16">
                            <div className="space-y-6 max-w-sm">
                                {currentDoc.company.logo ? (
                                    <img src={currentDoc.company.logo} alt="Logo" className="h-24 object-contain" />
                                ) : (
                                    <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center font-black text-2xl text-gray-300 border-2 border-dashed border-gray-200">LOGO</div>
                                )}
                                <div>
                                    <h2 className="text-3xl font-black tracking-tight text-gray-900 uppercase leading-none mb-4">{currentDoc.company.name}</h2>
                                    <div className="text-[11px] font-bold text-gray-500 space-y-1 uppercase tracking-wider">
                                        <p className="flex items-center gap-2"><MapPin className="w-3 h-3" /> {currentDoc.company.address}</p>
                                        <p className="flex items-center gap-2"><Mail className="w-3 h-3" /> {currentDoc.company.email}</p>
                                        <p className="flex items-center gap-2"><Phone className="w-3 h-3" /> {currentDoc.company.phone}</p>
                                        <p className="flex items-center gap-2"><Hash className="w-3 h-3" /> MF: {currentDoc.company.fiscalNumber}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="text-right flex-1">
                                <div className="text-5xl font-black text-gray-900 tracking-tighter uppercase mb-2 leading-none">{getTypeName(currentDoc.type).split(' ')[0]}</div>
                                <div className="text-xl font-bold text-gray-400 uppercase tracking-[0.3em] mb-10">{getTypeName(currentDoc.type).split(' ').slice(1).join(' ')}</div>

                                <div className="inline-grid grid-cols-2 gap-x-8 gap-y-2 text-left bg-gray-50 p-6 rounded-2xl border border-gray-100">
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">RÉFÉRENCE</span>
                                    <span className="text-xs font-black text-gray-900 tracking-widest">#{currentDoc.number}</span>
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">ÉMISSION</span>
                                    <span className="text-xs font-black text-gray-900">{new Date(currentDoc.issueDate).toLocaleDateString()}</span>
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">ÉCHÉANCE</span>
                                    <span className="text-xs font-black text-rose-600">{new Date(currentDoc.dueDate).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Client Address Box */}
                        <div className="flex justify-end mb-20">
                            <div className="w-full max-w-sm bg-gray-900 text-white p-10 rounded-[2.5rem] shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                                <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] mb-4 block">DESTINATAIRE</span>
                                <h3 className="text-2xl font-black tracking-tight mb-2 uppercase">{currentDoc.client.name}</h3>
                                <div className="text-xs font-medium text-gray-400 space-y-1 opacity-80">
                                    <p>{currentDoc.client.address}</p>
                                    <p>{currentDoc.client.email}</p>
                                    <p className="font-mono pt-4 text-white/30 uppercase tracking-widest">MF: {currentDoc.client.fiscalNumber || '---'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Table Lines */}
                        <div className="flex-1">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b-4 border-gray-900 text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">
                                        <th className="py-6 text-left pl-4">Description Services / Produits</th>
                                        <th className="py-6 text-center">QTÉ</th>
                                        <th className="py-6 text-right">PU HT</th>
                                        <th className="py-6 text-right">REM.</th>
                                        <th className="py-6 text-right pr-4">TOTAL HT</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm border-b-2 border-gray-100">
                                    {currentDoc.lines.map((line, i) => (
                                        <tr key={i} className="group">
                                            <td className="py-6 pl-4">
                                                <p className="font-black text-gray-900 uppercase tracking-tight text-base mb-1">{line.description}</p>
                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Composant ID-{i + 1}</span>
                                            </td>
                                            <td className="py-6 text-center font-black text-gray-900 border-l border-r border-gray-50 bg-gray-50/30">{line.quantity}</td>
                                            <td className="py-6 text-right font-bold text-gray-600 px-4">{line.unitPrice.toFixed(3)}</td>
                                            <td className="py-6 text-right font-bold text-rose-400 px-4">{line.discount > 0 ? `${line.discount}%` : '---'}</td>
                                            <td className="py-6 text-right font-black text-gray-900 pr-4 text-lg">{line.subtotal.toFixed(3)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Summary & Totals */}
                        <div className="mt-16 flex flex-col md:flex-row justify-between items-start gap-12">
                            <div className="flex-1 space-y-6">
                                {currentDoc.notes && (
                                    <div className="bg-gray-50 p-8 rounded-[2rem] border border-gray-100 italic">
                                        <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">Clauses & Annotations</h4>
                                        <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{currentDoc.notes}</p>
                                    </div>
                                )}
                            </div>

                            <div className="w-full max-w-sm">
                                <div className="space-y-4 py-8 px-10 bg-gray-900 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                                    <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600"></div>

                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-500">
                                        <span>Somme HT</span>
                                        <span className="text-white text-sm">{currentDoc.subtotal.toFixed(3)} {currentDoc.currency}</span>
                                    </div>
                                    {currentDoc.fodecTotal ? (
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-500">
                                            <span>FODEC (1%)</span>
                                            <span className="text-white text-sm">{currentDoc.fodecTotal.toFixed(3)} {currentDoc.currency}</span>
                                        </div>
                                    ) : null}
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-500">
                                        <span>Total TVA</span>
                                        <span className="text-white text-sm">{currentDoc.taxTotal.toFixed(3)} {currentDoc.currency}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-500 pb-4 border-b border-white/5">
                                        <span>Timbre Fiscal</span>
                                        <span className="text-white text-sm">{(currentDoc.timbreFiscal || 0).toFixed(3)} {currentDoc.currency}</span>
                                    </div>

                                    <div className="pt-4 flex flex-col items-end">
                                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] mb-2">Net à Payer</span>
                                        <div className="text-4xl font-black text-white tracking-tighter shadow-sm">{currentDoc.total.toFixed(3)} <span className="text-lg text-white/30 ml-1">{currentDoc.currency}</span></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Print Only Simple Footer */}
                        <div className="mt-auto pt-16 text-center hidden print:block border-t border-gray-100">
                            <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Généré via Système de Gestion Centralisé • {currentDoc.company.name}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
