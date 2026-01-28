import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import {
    ArrowLeft,
    Calendar,
    Download,
    FileText,
    Building2,
    ShoppingCart,
    TrendingUp,
    CheckSquare,
    Square,
    Image as ImageIcon,
    MessageSquare,
    Send
} from 'lucide-react'
import api from '../../lib/api'

type TabType = 'sales' | 'purchases' | 'messages'

interface ChatMessage {
    id: string
    content: string
    senderId: string
    createdAt: string
    sender: {
        firstName: string
        lastName: string
        role: string
    }
}

interface Document {
    id: string
    number: string
    type: string
    issueDate: string
    client?: { name: string; fiscalNumber: string }
    supplier?: { name: string; fiscalNumber: string }
    subtotal: number
    taxTotal: number
    timbreFiscal: number
    fodecTotal: number
    total: number
    status: string
    paidAmount: number
    attachments: Array<{
        id: string
        fileName: string
        fileType: string
    }>
    payments?: Array<{
        id: string
        amount: number
        paymentDate: string
        paymentMode: string
        attachmentUrl?: string
        attachmentType?: string
    }>
}

export default function ClientDetailPage() {
    const { clientId } = useParams<{ clientId: string }>()
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const [activeTab, setActiveTab] = useState<TabType>('sales')
    const [documents, setDocuments] = useState<Document[]>([])
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isChatLoading, setIsChatLoading] = useState(false)
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [newMessage, setNewMessage] = useState('')
    const [isSending, setIsSending] = useState(false)

    // Nouveaux états pour la sélection
    const [selectedDocs, setSelectedDocs] = useState<Set<string>>(new Set())
    const [includeProofs, setIncludeProofs] = useState(true)
    const [isExporting, setIsExporting] = useState(false)

    useEffect(() => {
        if (user?.role !== 'ACCOUNTANT') {
            navigate('/dashboard')
            return
        }

        let interval: any

        if (activeTab === 'messages') {
            fetchMessages()
            // Polling simple pour les messages toutes les 10s
            interval = setInterval(fetchMessages, 10000)
        } else {
            fetchDocuments()
        }

        return () => {
            if (interval) clearInterval(interval)
        }
    }, [activeTab, clientId, startDate, endDate])

    const fetchDocuments = async () => {
        if (!clientId || activeTab === 'messages') return

        setIsLoading(true)
        try {
            const endpoint = activeTab === 'sales'
                ? `/accountant-portal/clients/${clientId}/sales`
                : `/accountant-portal/clients/${clientId}/purchases`

            const params: any = {}
            if (startDate) params.startDate = startDate
            if (endDate) params.endDate = endDate

            const response = await api.get(endpoint, { params })
            setDocuments(response.data)
        } catch (error) {
            console.error('Erreur lors du chargement des documents:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const fetchMessages = async () => {
        if (!clientId) return
        setIsChatLoading(true)
        try {
            const response = await api.get(`/accountant-portal/clients/${clientId}/chat`)
            setMessages(response.data)
        } catch (error) {
            console.error('Erreur chargement messages:', error)
        } finally {
            setIsChatLoading(false)
        }
    }

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim() || !clientId) return

        setIsSending(true)
        try {
            const response = await api.post(`/accountant-portal/clients/${clientId}/chat`, {
                content: newMessage
            })
            setMessages([...messages, response.data])
            setNewMessage('')
        } catch (error) {
            console.error('Erreur envoi message:', error)
            alert('Erreur lors de l\'envoi du message')
        } finally {
            setIsSending(false)
        }
    }

    const handleDownloadAttachment = async (attachmentId: string) => {
        try {
            const response = await api.get(`/accountant-portal/attachments/${attachmentId}`, {
                responseType: 'blob'
            })

            const url = window.URL.createObjectURL(response.data)
            const link = document.createElement('a')
            link.href = url
            link.download = `attachment_${attachmentId}`
            link.click()
            window.URL.revokeObjectURL(url)
        } catch (error) {
            console.error('Erreur lors du téléchargement:', error)
        }
    }

    // Télécharger facture + justificatifs (zip)
    const handleDownloadWithProofs = async (documentId: string, docNumber: string) => {
        try {
            const response = await api.post(
                `/accountant-portal/documents/${documentId}/download-with-proofs`,
                {},
                { responseType: 'blob' }
            )

            const url = window.URL.createObjectURL(response.data)
            const link = document.createElement('a')
            link.href = url
            // Remplacer les caractères spéciaux dans le nom de fichier
            const safeNumber = docNumber.replace(/[/\\?%*:|"<>]/g, '_')
            link.download = `document_${safeNumber}_avec_justificatifs.zip`
            link.click()
            window.URL.revokeObjectURL(url)
        } catch (error) {
            console.error('Erreur téléchargement avec justificatifs:', error)
            alert('Erreur lors du téléchargement')
        }
    }

    const handleSelectAll = () => {
        if (selectedDocs.size === documents.length) {
            setSelectedDocs(new Set())
        } else {
            setSelectedDocs(new Set(documents.map(d => d.id)))
        }
    }

    const toggleSelection = (id: string) => {
        const newSelection = new Set(selectedDocs)
        if (newSelection.has(id)) {
            newSelection.delete(id)
        } else {
            newSelection.add(id)
        }
        setSelectedDocs(newSelection)
    }

    const handleExportSelected = async () => {
        if (selectedDocs.size === 0) return

        setIsExporting(true)
        try {
            const response = await api.post(
                `/accountant-portal/clients/${clientId}/export-selected`,
                {
                    documentIds: Array.from(selectedDocs),
                    includeProofs
                },
                { responseType: 'blob' }
            )

            const url = window.URL.createObjectURL(response.data)
            const link = document.createElement('a')
            link.href = url
            link.download = `export_selection_${new Date().toISOString().split('T')[0]}.zip`
            link.click()
            window.URL.revokeObjectURL(url)

            // Réinitialiser la sélection après export réussi
            setSelectedDocs(new Set())
        } catch (error) {
            console.error('Erreur export sélection:', error)
            alert('Erreur lors de l\'export de la sélection')
        } finally {
            setIsExporting(false)
        }
    }

    const handleExport = async (format: 'excel' | 'csv' | 'pdf') => {
        if (!clientId) return

        try {
            const params = new URLSearchParams({
                type: activeTab,
                ...(startDate && { startDate }),
                ...(endDate && { endDate }),
            })

            const response = await api.post(
                `/accountant-portal/clients/${clientId}/export/${format}?${params.toString()}`,
                {},
                { responseType: 'blob' }
            )

            const url = window.URL.createObjectURL(response.data)
            const link = document.createElement('a')
            link.href = url

            let extension = format as string
            if (format === 'excel') extension = 'xlsx'
            if (format === 'pdf') extension = 'zip'

            link.download = `export_${activeTab}_${new Date().toISOString().split('T')[0]}.${extension}`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.URL.revokeObjectURL(url)
        } catch (error) {
            console.error('Erreur lors de l\'export:', error)
            alert('Erreur lors de l\'export. Veuillez réessayer.')
        }
    }

    const calculateTotals = () => {
        return documents.reduce((acc, doc) => ({
            subtotal: acc.subtotal + doc.subtotal,
            tax: acc.tax + doc.taxTotal,
            total: acc.total + doc.total,
        }), { subtotal: 0, tax: 0, total: 0 })
    }

    const totals = calculateTotals()

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 shadow-sm">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/portal/accountant')}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 text-gray-600" />
                            </button>
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                                    <Building2 className="w-6 h-6 text-indigo-600" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-gray-900">Dossier Client</h1>
                                    <p className="text-sm text-gray-600">Consultation des journaux</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-6 py-8">
                {/* Tabs */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6">
                    <div className="border-b border-gray-200">
                        <div className="flex">
                            <button
                                onClick={() => setActiveTab('sales')}
                                className={`flex-1 px-6 py-4 font-semibold transition-all ${activeTab === 'sales'
                                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                                    : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <TrendingUp className="w-5 h-5" />
                                    Journal des Ventes
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('purchases')}
                                className={`flex-1 px-6 py-4 font-semibold transition-all ${activeTab === 'purchases'
                                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                                    : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <ShoppingCart className="w-5 h-5" />
                                    Journal des Achats/Charges
                                </div>
                            </button>
                            <button
                                onClick={() => setActiveTab('messages')}
                                className={`flex-1 px-6 py-4 font-semibold transition-all ${activeTab === 'messages'
                                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                                    : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    <MessageSquare className="w-5 h-5" />
                                    Messagerie
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Content Area */}
                    {activeTab === 'messages' ? (
                        <div className="h-[600px] flex flex-col bg-white">
                            {isChatLoading ? (
                                <div className="flex-1 flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                                </div>
                            ) : (
                                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 flex flex-col-reverse">
                                    {messages.length === 0 ? (
                                        <div className="text-center text-gray-500 py-10">
                                            Aucun message. Commencez la discussion !
                                        </div>
                                    ) : (
                                        [...messages].reverse().map((msg) => {
                                            const isMe = msg.senderId === user?.id
                                            return (
                                                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${isMe
                                                        ? 'bg-indigo-600 text-white rounded-br-none'
                                                        : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                                                        }`}>
                                                        <p className="text-sm">{msg.content}</p>
                                                        <div className={`text-xs mt-1 ${isMe ? 'text-indigo-200' : 'text-gray-400'}`}>
                                                            {new Date(msg.createdAt).toLocaleString()}
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })
                                    )}
                                </div>
                            )}

                            {/* Input */}
                            <div className="p-4 bg-white border-t border-gray-100">
                                <form onSubmit={handleSendMessage} className="flex gap-4">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Écrivez votre message à l'expert comptable..."
                                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                        disabled={isSending}
                                    />
                                    <button
                                        type="submit"
                                        disabled={isSending || !newMessage.trim()}
                                        className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        <Send className="w-5 h-5" />
                                    </button>
                                </form>
                            </div>
                        </div>
                    ) : (
                        <div className="p-6 bg-gray-50 border-t border-gray-100">
                            <div className="flex flex-col gap-6">
                                {/* Actions de groupe */}
                                {selectedDocs.size > 0 && (
                                    <div className="flex items-center justify-between bg-indigo-50 p-4 rounded-xl border border-indigo-100 animate-in fade-in slide-in-from-top-2">
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2 text-indigo-900 font-medium">
                                                <span className="bg-indigo-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">
                                                    {selectedDocs.size}
                                                </span>
                                                documents sélectionnés
                                            </div>
                                            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer hover:text-indigo-600 transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={includeProofs}
                                                    onChange={(e) => setIncludeProofs(e.target.checked)}
                                                    className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                                />
                                                Inclure les justificatifs
                                            </label>
                                        </div>
                                        <button
                                            onClick={handleExportSelected}
                                            disabled={isExporting}
                                            className="btn bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 shadow-sm"
                                        >
                                            {isExporting ? (
                                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-b-transparent"></div>
                                            ) : (
                                                <Download className="w-4 h-4" />
                                            )}
                                            Exporter la sélection (.zip)
                                        </button>
                                    </div>
                                )}

                                <div className="flex flex-col md:flex-row gap-4 items-end justify-between">
                                    <div className="flex gap-4 flex-1">
                                        <div className="flex-1 max-w-xs">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                <Calendar className="w-4 h-4 inline mr-1" />
                                                Date de début
                                            </label>
                                            <input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            />
                                        </div>
                                        <div className="flex-1 max-w-xs">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                <Calendar className="w-4 h-4 inline mr-1" />
                                                Date de fin
                                            </label>
                                            <input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleExport('excel')}
                                            className="btn bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                            title="Exporter tout en Excel"
                                        >
                                            <FileText className="w-4 h-4 text-green-600" />
                                            Excel
                                        </button>
                                        <button
                                            onClick={() => handleExport('csv')}
                                            className="btn bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                            title="Exporter tout en CSV"
                                        >
                                            <FileText className="w-4 h-4 text-blue-600" />
                                            CSV
                                        </button>
                                        <button
                                            onClick={() => handleExport('pdf')}
                                            className="btn bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                            title="Exporter tout en PDF (Archive)"
                                        >
                                            <FileText className="w-4 h-4 text-red-600" />
                                            PDF
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Documents Table */}
                {activeTab !== 'messages' && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        {isLoading ? (
                            <div className="text-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                                <p className="text-gray-600">Chargement...</p>
                            </div>
                        ) : documents.length === 0 ? (
                            <div className="text-center py-12">
                                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-600">Aucun document trouvé pour cette période</p>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="px-4 py-3 w-10">
                                                    <button
                                                        onClick={handleSelectAll}
                                                        className="text-gray-400 hover:text-indigo-600 transition-colors"
                                                    >
                                                        {selectedDocs.size === documents.length ? (
                                                            <CheckSquare className="w-5 h-5 text-indigo-600" />
                                                        ) : (
                                                            <Square className="w-5 h-5" />
                                                        )}
                                                    </button>
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Réf</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tiers</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">MF</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">HT</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">TVA</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Timbre</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">FODEC</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">TTC</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">État</th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Justif.</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {documents.map((doc) => {
                                                const tiers = activeTab === 'sales' ? doc.client : doc.supplier
                                                const isPaid = doc.paidAmount >= doc.total
                                                const isSelected = selectedDocs.has(doc.id)

                                                // Vérifier s'il y a des justificatifs de paiement
                                                const hasPaymentProofs = doc.payments?.some(p => p.attachmentUrl)

                                                return (
                                                    <tr
                                                        key={doc.id}
                                                        className={`hover:bg-gray-50 ${isSelected ? 'bg-indigo-50/50' : ''}`}
                                                        onClick={(e) => {
                                                            // Ne pas déclencher si on clique sur un bouton ou lien
                                                            if ((e.target as HTMLElement).closest('button')) return
                                                            toggleSelection(doc.id)
                                                        }}
                                                    >
                                                        <td className="px-4 py-3">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    toggleSelection(doc.id)
                                                                }}
                                                                className="text-gray-400 hover:text-indigo-600 transition-colors"
                                                            >
                                                                {isSelected ? (
                                                                    <CheckSquare className="w-5 h-5 text-indigo-600" />
                                                                ) : (
                                                                    <Square className="w-5 h-5" />
                                                                )}
                                                            </button>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm font-mono text-gray-900">{doc.number}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-600">
                                                            {new Date(doc.issueDate).toLocaleDateString('fr-FR')}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-900">{tiers?.name || '-'}</td>
                                                        <td className="px-4 py-3 text-sm font-mono text-gray-600">{tiers?.fiscalNumber || '-'}</td>
                                                        <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                                                            {doc.subtotal.toFixed(3)}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-right text-gray-600">
                                                            {doc.taxTotal.toFixed(3)}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-right text-gray-600">
                                                            {doc.timbreFiscal.toFixed(3)}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-right text-gray-600">
                                                            {doc.fodecTotal.toFixed(3)}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-right font-bold text-gray-900">
                                                            {doc.total.toFixed(3)}
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${isPaid
                                                                ? 'bg-green-100 text-green-700'
                                                                : 'bg-yellow-100 text-yellow-700'
                                                                }`}>
                                                                {isPaid ? 'Payé' : 'Impayé'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-center flex items-center justify-center gap-2">
                                                            {/* Facture PDF */}
                                                            {doc.attachments && doc.attachments.length > 0 && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        handleDownloadAttachment(doc.attachments[0].id)
                                                                    }}
                                                                    title="Télécharger la facture"
                                                                    className="text-gray-400 hover:text-indigo-600 transition-colors"
                                                                >
                                                                    <FileText className="w-5 h-5" />
                                                                </button>
                                                            )}

                                                            {/* Justificatifs de paiement */}
                                                            {hasPaymentProofs ? (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        handleDownloadWithProofs(doc.id, doc.number)
                                                                    }}
                                                                    title="Télécharger avec justificatifs de paiement"
                                                                    className="text-gray-400 hover:text-green-600 transition-colors relative group"
                                                                >
                                                                    <ImageIcon className="w-5 h-5" />
                                                                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-white"></span>
                                                                </button>
                                                            ) : (
                                                                <span className="w-5"></span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                        <tfoot className="bg-gray-50 border-t-2 border-gray-300">
                                            <tr>
                                                <td colSpan={5} className="px-4 py-3 text-sm font-bold text-gray-900">TOTAUX</td>
                                                <td className="px-4 py-3 text-sm text-right font-bold text-gray-900">
                                                    {totals.subtotal.toFixed(3)}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-right font-bold text-gray-900">
                                                    {totals.tax.toFixed(3)}
                                                </td>
                                                <td colSpan={2}></td>
                                                <td className="px-4 py-3 text-sm text-right font-bold text-gray-900">
                                                    {totals.total.toFixed(3)}
                                                </td>
                                                <td colSpan={2}></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
