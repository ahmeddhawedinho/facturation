import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { ArrowLeft, Building2, Save, AlertCircle, Key, Plus } from 'lucide-react'
import api from '../../lib/api'

export default function NewClientPage() {
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [mode, setMode] = useState<'manual' | 'code'>('code') // Par défaut: code
    const [accessCode, setAccessCode] = useState('')
    const [formData, setFormData] = useState({
        name: '',
        legalName: '',
        address: '',
        postalCode: '',
        city: '',
        country: 'Tunisie',
        fiscalNumber: '',
        phone: '',
        email: '',
        contactFirstName: '',
        contactLastName: '',
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleConnectWithCode = async () => {
        setError('')

        if (!accessCode || accessCode.trim().length < 8) {
            setError('Veuillez entrer un code d\'accès valide (format: ABC-123-XY)')
            return
        }

        if (user?.role !== 'ACCOUNTANT') {
            setError('Seuls les experts comptables peuvent ajouter des clients')
            return
        }

        setIsLoading(true)
        try {
            const response = await api.post('/accountant-portal/connect-with-code', {
                code: accessCode.trim().toUpperCase()
            })

            alert(`✅ Client "${response.data.company.name}" ajouté avec succès à votre portail !`)
            navigate('/portal/accountant')
        } catch (err: any) {
            setError(err.response?.data?.message || 'Code d\'accès invalide ou expiré')
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (user?.role !== 'ACCOUNTANT') {
            setError('Seuls les experts comptables peuvent créer des dossiers clients')
            return
        }

        setIsLoading(true)
        try {
            await api.post('/accountant-portal/clients', formData);
            // Succès - rediriger vers le portail
            alert(`Dossier créé avec succès ! Un email d'activation a été envoyé à ${formData.email}`)
            navigate('/portal/accountant')
        } catch (err: any) {
            setError(err.response?.data?.message || 'Erreur lors de la création du dossier')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 shadow-sm">
                <div className="container mx-auto px-6 py-4">
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
                                <h1 className="text-xl font-bold text-gray-900">Nouveau Client</h1>
                                <p className="text-sm text-gray-600">Ajouter un client à votre portail</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-6 py-8">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        {/* Toggle Mode */}
                        <div className="flex gap-4 mb-8 p-2 bg-gray-100 rounded-xl">
                            <button
                                onClick={() => { setMode('code'); setError('') }}
                                className={`flex-1 py-4 px-6 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${mode === 'code'
                                    ? 'bg-indigo-600 text-white shadow-lg'
                                    : 'bg-transparent text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                <Key className="w-5 h-5" />
                                Ajouter par Code
                            </button>
                            <button
                                onClick={() => { setMode('manual'); setError('') }}
                                className={`flex-1 py-4 px-6 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${mode === 'manual'
                                    ? 'bg-indigo-600 text-white shadow-lg'
                                    : 'bg-transparent text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                <Plus className="w-5 h-5" />
                                Créer Manuellement
                            </button>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-start gap-2">
                                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                <span className="text-sm">{error}</span>
                            </div>
                        )}

                        {/* Mode: Par Code */}
                        {mode === 'code' ? (
                            <div className="space-y-6">
                                <div className="text-center mb-8">
                                    <div className="w-20 h-20 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <Key className="w-10 h-10 text-indigo-600" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">Ajouter un Client par Code d'Accès</h3>
                                    <p className="text-sm text-gray-600">
                                        Demandez le code d'accès unique à votre client
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                                        Code d'Accès
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="ABC-123-XY"
                                        value={accessCode}
                                        onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                                        className="w-full px-6 py-4 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-indigo-500 focus:border-indigo-500 text-center text-2xl font-mono font-bold tracking-widest uppercase"
                                        maxLength={11}
                                    />
                                    <p className="text-xs text-gray-500 text-center mt-2">
                                        Format : 3 lettres - 3 chiffres - 2 lettres (ex: ABC-123-XY)
                                    </p>
                                </div>

                                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                                    <p className="text-xs text-indigo-800">
                                        <strong>💡 Comment obtenir ce code ?</strong><br />
                                        Demandez à votre client de générer son code d'accès dans<br />
                                        <strong>Paramètres → Expert Comptable → Générer le Code</strong>
                                    </p>
                                </div>

                                <button
                                    onClick={handleConnectWithCode}
                                    disabled={isLoading || !accessCode}
                                    className="w-full px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Connexion en cours...
                                        </>
                                    ) : (
                                        <>
                                            <Key className="w-5 h-5" />
                                            Ajouter le Client
                                        </>
                                    )}
                                </button>
                            </div>
                        ) : (
                            // Mode: Manuel (formulaire existant)
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Informations Entreprise */}
                                <div>
                                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                        <Building2 className="w-5 h-5 text-indigo-600" />
                                        Informations Entreprise
                                    </h3>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Nom Commercial <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Raison Sociale <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="legalName"
                                                value={formData.legalName}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Matricule Fiscal <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="fiscalNumber"
                                                value={formData.fiscalNumber}
                                                onChange={handleChange}
                                                placeholder="1234567ABC"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Email <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Téléphone
                                            </label>
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={formData.phone}
                                                onChange={handleChange}
                                                placeholder="+216 71 123 456"
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Ville <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="city"
                                                value={formData.city}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                required
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Adresse <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                name="address"
                                                value={formData.address}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Code Postal
                                            </label>
                                            <input
                                                type="text"
                                                name="postalCode"
                                                value={formData.postalCode}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Pays
                                            </label>
                                            <input
                                                type="text"
                                                name="country"
                                                value={formData.country}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Contact Principal */}
                                <div>
                                    <h3 className="text-lg font-semibold mb-4">Contact Principal (Optionnel)</h3>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Prénom
                                            </label>
                                            <input
                                                type="text"
                                                name="contactFirstName"
                                                value={formData.contactFirstName}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Nom
                                            </label>
                                            <input
                                                type="text"
                                                name="contactLastName"
                                                value={formData.contactLastName}
                                                onChange={handleChange}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Info Box */}
                                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                                    <p className="text-sm text-indigo-800">
                                        <strong>Note :</strong> Un compte administrateur sera créé pour ce client avec l'email indiqué ci-dessus.
                                        Un email d'activation avec un mot de passe temporaire sera automatiquement envoyé.
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => navigate('/portal/accountant')}
                                        className="flex-1 px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold transition-colors"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                                    >
                                        <Save className="w-5 h-5" />
                                        {isLoading ? 'Création...' : 'Créer le Dossier'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
