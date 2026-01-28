import { useState, useEffect, useMemo } from 'react';
import { X, Download, FileText, FileSpreadsheet, Calendar, User, CheckSquare, Square } from 'lucide-react';
import api from '../lib/api';

interface ExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    section: 'sales' | 'purchase';
    documents: any[];
    clients?: any[];
    suppliers?: any[];
}

export default function ExportModal({ isOpen, onClose, section, documents, clients = [], suppliers = [] }: ExportModalProps) {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedPartner, setSelectedPartner] = useState('');
    const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
    const [selectAll, setSelectAll] = useState(false);
    const [format, setFormat] = useState<'pdf' | 'csv' | 'excel'>('pdf');
    const [pdfMode, setPdfMode] = useState<'individual' | 'consolidated'>('individual');
    const [isExporting, setIsExporting] = useState(false);

    const partners = section === 'sales' ? clients : suppliers;
    const partnerLabel = section === 'sales' ? 'Client' : 'Fournisseur';

    // Use useMemo to prevent recalculation on every render
    const filteredDocuments = useMemo(() => {
        return documents.filter(doc => {
            let matches = true;

            if (startDate) {
                const docDate = new Date(doc.issueDate);
                matches = matches && docDate >= new Date(startDate);
            }

            if (endDate) {
                const docDate = new Date(doc.issueDate);
                matches = matches && docDate <= new Date(endDate);
            }

            if (selectedPartner) {
                const partnerId = section === 'sales' ? doc.clientId : doc.supplierId;
                matches = matches && partnerId === selectedPartner;
            }

            return matches;
        });
    }, [documents, startDate, endDate, selectedPartner, section]);

    // Handle select all toggle
    const handleSelectAllToggle = () => {
        if (selectAll) {
            setSelectedDocuments([]);
            setSelectAll(false);
        } else {
            setSelectedDocuments(filteredDocuments.map(doc => doc.id));
            setSelectAll(true);
        }
    };

    // Reset selection when filters change
    useEffect(() => {
        setSelectAll(false);
        setSelectedDocuments([]);
    }, [startDate, endDate, selectedPartner]);

    const toggleDocument = (id: string) => {
        setSelectedDocuments(prev => {
            const newSelection = prev.includes(id)
                ? prev.filter(docId => docId !== id)
                : [...prev, id];

            // Update selectAll state based on selection
            setSelectAll(newSelection.length === filteredDocuments.length && filteredDocuments.length > 0);
            return newSelection;
        });
    };

    const handleExport = async () => {
        if (selectedDocuments.length === 0) {
            alert('Veuillez sélectionner au moins un document');
            return;
        }

        setIsExporting(true);

        try {
            const payload = {
                section,
                format,
                pdfMode: format === 'pdf' ? pdfMode : undefined,
                documentIds: selectedDocuments,
                startDate: startDate || undefined,
                endDate: endDate || undefined,
                [section === 'sales' ? 'clientId' : 'supplierId']: selectedPartner || undefined,
            };

            const response = await api.post('/import-export/advanced-export', payload, {
                responseType: 'blob',
            });

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;

            const extension = format === 'excel' ? 'xlsx' : format;
            link.setAttribute('download', `export_${section}_${new Date().getTime()}.${extension}`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            onClose();
        } catch (error) {
            console.error('Export error:', error);
            alert('Erreur lors de l\'export');
        } finally {
            setIsExporting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Download className="w-6 h-6 text-white" />
                        <h2 className="text-xl font-bold text-white">Exporter les documents</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/80 hover:text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    {/* Filters */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-4 text-gray-800">Filtres</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Date Range */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Calendar className="w-4 h-4 inline mr-1" />
                                    Date de début
                                </label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <Calendar className="w-4 h-4 inline mr-1" />
                                    Date de fin
                                </label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Partner Filter */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    <User className="w-4 h-4 inline mr-1" />
                                    {partnerLabel}
                                </label>
                                <select
                                    value={selectedPartner}
                                    onChange={(e) => setSelectedPartner(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">Tous</option>
                                    {partners.map((partner: any) => (
                                        <option key={partner.id} value={partner.id}>
                                            {partner.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Document Selection */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">
                                Documents ({filteredDocuments.length})
                            </h3>
                            <button
                                onClick={handleSelectAllToggle}
                                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                            >
                                {selectAll ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                                Tout sélectionner
                            </button>
                        </div>

                        <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                            {filteredDocuments.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    Aucun document trouvé avec ces filtres
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-200">
                                    {filteredDocuments.map((doc) => (
                                        <label
                                            key={doc.id}
                                            className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedDocuments.includes(doc.id)}
                                                onChange={() => toggleDocument(doc.id)}
                                                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-gray-900">{doc.number}</span>
                                                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                                                        {doc.type}
                                                    </span>
                                                </div>
                                                <div className="text-sm text-gray-600 mt-1">
                                                    {new Date(doc.issueDate).toLocaleDateString('fr-FR')} •{' '}
                                                    {section === 'sales' ? doc.client?.name || doc.clientName : doc.supplier?.name || doc.supplierName} •{' '}
                                                    {doc.total.toFixed(3)} TND
                                                </div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Export Format */}
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-4 text-gray-800">Format d'export</h3>
                        <div className="grid grid-cols-3 gap-3">
                            <button
                                onClick={() => setFormat('pdf')}
                                className={`p-4 rounded-lg border-2 transition-all ${format === 'pdf'
                                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <FileText className="w-6 h-6 mx-auto mb-2" />
                                <div className="font-medium">PDF</div>
                            </button>

                            <button
                                onClick={() => setFormat('csv')}
                                className={`p-4 rounded-lg border-2 transition-all ${format === 'csv'
                                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <FileSpreadsheet className="w-6 h-6 mx-auto mb-2" />
                                <div className="font-medium">CSV</div>
                            </button>

                            <button
                                onClick={() => setFormat('excel')}
                                className={`p-4 rounded-lg border-2 transition-all ${format === 'excel'
                                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <FileSpreadsheet className="w-6 h-6 mx-auto mb-2" />
                                <div className="font-medium">Excel</div>
                            </button>
                        </div>

                        {/* PDF Mode */}
                        {format === 'pdf' && (
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Mode PDF
                                </label>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setPdfMode('individual')}
                                        className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${pdfMode === 'individual'
                                                ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium'
                                                : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        Documents séparés
                                    </button>
                                    <button
                                        onClick={() => setPdfMode('consolidated')}
                                        className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${pdfMode === 'consolidated'
                                                ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium'
                                                : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        Document consolidé
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                        {selectedDocuments.length} document(s) sélectionné(s)
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleExport}
                            disabled={isExporting || selectedDocuments.length === 0}
                            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isExporting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Export en cours...
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4" />
                                    Exporter
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
