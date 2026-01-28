import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { ArrowLeft, Printer, Download, Edit, Image as ImageIcon, Truck, Hash, Mail, MapPin, Phone, CheckCircle2, ShieldCheck, ExternalLink } from 'lucide-react'

interface DocumentLine {
    description: string
    quantity: number
    unitPrice: number
    discount: number
    subtotal: number
    total: number
}

interface PurchaseDetail {
    id: string
    number: string
    issueDate: string
    dueDate: string
    status: string
    notes: string
    currency: string
    subtotal: number
    taxTotal: number
    fodecTotal: number
    timbreFiscal: number
    total: number
    supplier: {
        id: string
        name: string
        email: string
        address: string
        fiscalNumber: string
        phone: string
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
    scannedImage?: string
}

export default function PurchaseDetailsPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [currentDoc, setCurrentDoc] = useState<PurchaseDetail | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (id) loadDocument(id)
    }, [id])

    const loadDocument = async (docId: string) => {
        try {
            setLoading(true)
            const res = await api.get(`/purchase-orders/${docId}`)
            setCurrentDoc(res.data)
        } catch (error) { navigate('/dashboard/purchase') }
        finally { setLoading(false) }
    }

    const handlePrint = () => window.print()

    const handleDownloadPdf = async () => {
        if (currentDoc?.scannedImage) {
            const link = document.createElement('a');
            link.href = currentDoc.scannedImage;
            link.setAttribute('download', `${currentDoc.number || 'document'}_scan`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            return;
        }

        try {
            const response = await api.get(`/purchase-orders/export/${id}/pdf`, { responseType: 'blob' })
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${currentDoc?.number || 'commande'}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) { alert('Erreur PDF') }
    }

    if (loading) return <div className="py-40 flex flex-col items-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" /></div>
    if (!currentDoc) return <div className="py-40 text-center text-rose-500 font-black uppercase tracking-widest">Document Introuvable</div>

    const typeLabel = currentDoc.notes?.includes('[Type:')
        ? currentDoc.notes.split(']')[0].replace('[Type: ', '')
        : 'PURCHASE_ORDER';

    const getTypeName = (type: string) => {
        const types: any = {
            'PURCHASE_ORDER': 'Commande Fournisseur',
            'GOODS_RECEIPT': 'Bon de Réception',
            'PURCHASE_INVOICE': 'Facture d\'Achat',
        }
        return types[type] || type
    }

    return (
        <div className="space-y-10 animate-fade-in relative pb-20">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none -z-10"></div>

            {/* Premium Header/Toolbar */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/50">
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate('/dashboard/purchase')} className="p-4 bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-900 rounded-2xl border border-gray-100 transition-all group active:scale-95">
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    </button>
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
                            <Truck className="w-7 h-7" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-gray-900 tracking-tight">{getTypeName(typeLabel)}</h1>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Séquence: <span className="text-emerald-600">#{currentDoc.number}</span></p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-3 w-full lg:w-auto">
                    <button onClick={() => navigate(`/dashboard/purchase/${id}/edit`)} className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-gray-50 border border-gray-100 text-gray-600 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-all">
                        <Edit className="w-4 h-4" /> Configurer
                    </button>
                    <button onClick={handlePrint} className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-gray-50 border border-gray-100 text-gray-600 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-all">
                        <Printer className="w-4 h-4" /> Impression
                    </button>
                    <button onClick={handleDownloadPdf} className="flex-1 lg:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-gray-900 text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-xl shadow-gray-900/20 hover:scale-105 active:scale-95 transition-all">
                        <Download className="w-5 h-5" /> {currentDoc.scannedImage ? 'Scan Original' : 'Exporter PDF'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-10">
                {/* Meta Sidebar */}
                <div className="xl:col-span-1 space-y-8">
                    {/* Status Card */}
                    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-lg shadow-gray-200/50 relative group overflow-hidden">
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full"></div>
                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6 block">Certification Appro.</h3>
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100 shadow-inner">
                                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-xl font-black text-gray-900 tracking-tight uppercase leading-none mb-1">{currentDoc.status}</p>
                                <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Flux Stock Validé</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-gray-400 uppercase tracking-tighter">Date Achat</span>
                                <span className="font-black text-gray-900">{new Date(currentDoc.issueDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-gray-400 uppercase tracking-tighter">Limite Paiement</span>
                                <span className="font-black text-orange-500 font-mono">{new Date(currentDoc.dueDate).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Scan Module */}
                    {currentDoc.scannedImage && (
                        <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-lg shadow-gray-200/50 overflow-hidden group">
                            <h3 className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-4 flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Pièce Jointe d'Origine</h3>
                            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 shadow-inner group-hover:scale-[1.02] transition-transform duration-500">
                                <img src={currentDoc.scannedImage} alt="Scan" className="w-full h-full object-contain" />
                                <div className="absolute inset-0 bg-gray-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm cursor-pointer" onClick={() => window.open(currentDoc.scannedImage, '_blank')}>
                                    <ExternalLink className="w-8 h-8 text-white mb-2" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Supplier Context Card */}
                    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-lg shadow-gray-200/50 relative group cursor-pointer" onClick={() => navigate(`/dashboard/suppliers/${currentDoc.supplier?.id}`)}>
                        <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6 block">Entité Fournisseur</h3>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center font-black text-xl text-emerald-600 shadow-inner group-hover:scale-110 transition-transform">
                                {currentDoc.supplier?.name?.charAt(0) || 'F'}
                            </div>
                            <div>
                                <h4 className="text-lg font-black text-gray-900 tracking-tight leading-none mb-1 group-hover:text-emerald-400 transition-colors uppercase leading-none">{currentDoc.supplier?.name}</h4>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter leading-none mt-1">ID: {currentDoc.supplier?.id?.slice(0, 8)}</p>
                            </div>
                        </div>
                        <div className="space-y-3 pt-4 border-t border-gray-50">
                            <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                                <Mail className="w-3.5 h-3.5 text-emerald-600" /> {currentDoc.supplier?.email || 'N/A'}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-500 font-medium">
                                <MapPin className="w-3.5 h-3.5 text-emerald-600" /> {currentDoc.supplier?.address || 'Adresse Inconnue'}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-emerald-600 font-bold font-mono">
                                <Hash className="w-3.5 h-3.5 text-emerald-600" /> {currentDoc.supplier?.fiscalNumber || 'Pas de MF renseigné'}
                            </div>
                        </div>
                    </div>

                    {/* Quick Analytics */}
                    <div className="bg-emerald-600 p-8 rounded-[2.5rem] border border-emerald-700 shadow-xl shadow-emerald-500/20">
                        <h3 className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-4">Valeur Entrante HT</h3>
                        <p className="text-4xl font-black text-white tracking-tighter leading-none">{currentDoc.subtotal.toFixed(3)} <span className="text-sm font-bold text-white/30 ml-1">TND</span></p>
                    </div>
                </div>

                {/* Main Purchase Document Content */}
                <div className="xl:col-span-3">
                    <div className="bg-white rounded-[4rem] p-12 lg:p-20 shadow-2xl shadow-gray-200/50 text-gray-900 min-h-[1000px] flex flex-col relative overflow-hidden print:shadow-none print:p-0" id="document-preview">
                        {/* Luxury Visual Accent */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>

                        <div className="flex flex-col md:flex-row justify-between items-start gap-12 border-b-2 border-gray-100 pb-12 mb-16">
                            <div className="space-y-6 max-w-sm">
                                {currentDoc.company?.logo ? <img src={currentDoc.company.logo} alt="Logo" className="h-20 object-contain" /> : <div className="w-20 h-20 bg-gray-900 rounded-3xl flex items-center justify-center font-black text-2xl text-white">LOGO</div>}
                                <div>
                                    <h2 className="text-2xl font-black tracking-tighter text-gray-900 uppercase leading-none mb-4">{currentDoc.company?.name || 'Ma Société'}</h2>
                                    <div className="text-[10px] font-bold text-gray-400 space-y-1 uppercase tracking-widest">
                                        <p className="flex items-center gap-2"><MapPin className="w-3 h-3" /> {currentDoc.company?.address}</p>
                                        <p className="flex items-center gap-2"><Mail className="w-3 h-3" /> {currentDoc.company?.email}</p>
                                        <p className="flex items-center gap-2"><Phone className="w-3 h-3" /> {currentDoc.company?.phone}</p>
                                        <p className="flex items-center gap-2"><Hash className="w-3 h-3" /> {currentDoc.company?.fiscalNumber}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="text-right">
                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.4em] mb-4 block">Cycle d'Approvisionnement</span>
                                <h1 className="text-5xl font-black text-gray-900 tracking-tighter uppercase mb-2 leading-none">{getTypeName(typeLabel).split(' ')[0]}</h1>
                                <p className="text-xl font-bold text-gray-300 uppercase tracking-[0.2em] mb-10">{getTypeName(typeLabel).split(' ').slice(1).join(' ')}</p>

                                <div className="inline-flex flex-col gap-2 text-right">
                                    <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Référence Interne</div>
                                    <div className="text-xl font-black text-gray-900 tracking-widest">#{currentDoc.number}</div>
                                </div>
                            </div>
                        </div>

                        {/* Middle Info Stripe */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
                            <div className="bg-gray-50 border border-gray-100 p-10 rounded-[3rem]">
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4 block">Entité Expéditrice</span>
                                <h3 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight leading-none">{currentDoc.supplier?.name}</h3>
                                <div className="text-xs font-bold text-gray-500 space-y-1 uppercase tracking-tight opacity-70">
                                    <p>{currentDoc.supplier?.address || 'Adresse Siège'}</p>
                                    <p>{currentDoc.supplier?.email}</p>
                                    <p className="pt-2 font-black text-gray-300 text-[10px] tracking-widest">MF: {currentDoc.supplier?.fiscalNumber || '---'}</p>
                                </div>
                            </div>

                            <div className="flex flex-col justify-center items-end text-right px-6">
                                <div className="space-y-6">
                                    <div>
                                        <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">Date Signature</p>
                                        <p className="text-lg font-black text-gray-900">{new Date(currentDoc.issueDate).toLocaleDateString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">Échéance de Règlement</p>
                                        <p className="text-lg font-black text-emerald-600">{currentDoc.dueDate ? new Date(currentDoc.dueDate).toLocaleDateString() : 'Immédiat'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Table Lines */}
                        <div className="flex-1">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b-4 border-gray-900 text-[9px] font-black text-gray-400 uppercase tracking-[0.4em]">
                                        <th className="py-6 text-left pl-6">Désignation Articles / Prestations</th>
                                        <th className="py-6 text-center">QTÉ</th>
                                        <th className="py-6 text-right">PU HT</th>
                                        <th className="py-6 text-right">REM.</th>
                                        <th className="py-6 text-right pr-6">SOUS-TOTAL</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm border-b-2 border-gray-100 divide-y divide-gray-50">
                                    {currentDoc.lines.map((line, i) => (
                                        <tr key={i} className="group">
                                            <td className="py-8 pl-6">
                                                <p className="font-black text-gray-900 uppercase tracking-tight text-lg mb-1">{line.description}</p>
                                                <span className="text-[9px] font-black text-gray-300 uppercase tracking-[0.2em]">Flux Entrant - SKU-{i + 100}</span>
                                            </td>
                                            <td className="py-8 text-center font-black text-gray-900 text-lg bg-gray-50/50 px-6">{line.quantity}</td>
                                            <td className="py-8 text-right font-bold text-gray-500 px-6">{line.unitPrice.toFixed(3)}</td>
                                            <td className="py-8 text-right font-black text-emerald-500/50 px-6">{line.discount > 0 ? line.discount.toFixed(3) : '---'}</td>
                                            <td className="py-8 text-right font-black text-gray-900 pr-6 text-xl">{line.subtotal.toFixed(3)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Summaries & Global Totals */}
                        <div className="mt-20 grid grid-cols-1 lg:grid-cols-2 gap-16">
                            <div className="space-y-8">
                                {currentDoc.notes && (
                                    <div className="bg-emerald-50/30 p-10 rounded-[2.5rem] border border-emerald-100">
                                        <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-4 flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Observations & Logistique</h4>
                                        <p className="text-xs font-bold text-gray-600 leading-relaxed whitespace-pre-wrap">{currentDoc.notes}</p>
                                    </div>
                                )}
                            </div>

                            <div className="bg-gray-900 text-white rounded-[3.5rem] p-12 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-[60px]"></div>
                                <div className="space-y-5 relative z-10">
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-500">
                                        <span>Base HT</span>
                                        <span className="text-white text-base">{currentDoc.subtotal?.toFixed(3)} {currentDoc.currency || 'TND'}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-500">
                                        <span>Valeur TVA</span>
                                        <span className="text-white text-base">{currentDoc.taxTotal?.toFixed(3)} {currentDoc.currency || 'TND'}</span>
                                    </div>
                                    {currentDoc.fodecTotal > 0 && (
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-500">
                                            <span>Taxe FODEC (1%)</span>
                                            <span className="text-white text-base">{currentDoc.fodecTotal?.toFixed(3)} {currentDoc.currency || 'TND'}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-500 pb-6 border-b border-white/5">
                                        <span>Timbre Fiscal</span>
                                        <span className="text-white text-base">{currentDoc.timbreFiscal?.toFixed(3)} {currentDoc.currency || 'TND'}</span>
                                    </div>

                                    <div className="pt-6 flex flex-col items-end">
                                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em] mb-2">Net à Payer Fournisseur</span>
                                        <div className="text-5xl font-black text-white tracking-tighter">{currentDoc.total?.toFixed(3)} <span className="text-xl text-white/20 ml-1">{currentDoc.currency || 'TND'}</span></div>
                                    </div>
                                </div>
                                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-400"></div>
                            </div>
                        </div>

                        {/* Print Footer */}
                        <div className="mt-auto pt-20 text-center opacity-30 hidden print:block border-t border-gray-100">
                            <p className="text-[8px] font-black uppercase tracking-[0.5em]">Généré via Système Centralisé • {currentDoc.company?.name || 'ENTREPRISE'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
