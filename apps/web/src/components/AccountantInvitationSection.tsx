import { useState, useEffect } from 'react'
import { UserPlus, Copy, Check, Key, Trash2, AlertCircle } from 'lucide-react'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'

export default function AccountantInvitationSection() {
    const { user } = useAuthStore()
    const [codeData, setCodeData] = useState<{
        code: string
        companyName: string
    } | null>(null)
    const [isGenerating, setIsGenerating] = useState(false)
    const [copied, setCopied] = useState(false)
    const [connectedAccountant, setConnectedAccountant] = useState<any>(null)
    const [isRevoking, setIsRevoking] = useState(false)

    useEffect(() => {
        fetchConnectedAccountant()
    }, [])

    const fetchConnectedAccountant = async () => {
        if (!user?.companyId) return

        try {
            const response = await api.get(`/accountant-portal/company/${user.companyId}/connected-accountant`)
            setConnectedAccountant(response.data)
        } catch (error) {
            // Pas de comptable connecté
            setConnectedAccountant(null)
        }
    }

    const generateCode = async () => {
        if (!user?.companyId) return

        setIsGenerating(true)
        try {
            const response = await api.post(`/accountant-portal/company/${user.companyId}/generate-code`)
            setCodeData(response.data)
        } catch (error: any) {
            alert(error.response?.data?.message || 'Erreur lors de la génération du code')
        } finally {
            setIsGenerating(false)
        }
    }

    const revokeAccess = async () => {
        if (!confirm('Voulez-vous vraiment révoquer l\'accès de votre comptable ? Il ne pourra plus consulter vos documents.')) {
            return
        }

        setIsRevoking(true)
        try {
            await api.delete(`/accountant-portal/company/${user?.companyId}/revoke-access`)
            alert('Accès révoqué avec succès')
            setConnectedAccountant(null)
            setCodeData(null)
        } catch (error: any) {
            alert(error.response?.data?.message || 'Erreur')
        } finally {
            setIsRevoking(false)
        }
    }

    const copyToClipboard = () => {
        if (codeData) {
            navigator.clipboard.writeText(codeData.code)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    return (
        <div className="bg-white rounded-[2.5rem] border border-gray-100 p-12 shadow-xl shadow-gray-200/50">
            <div className="max-w-3xl mx-auto">
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-indigo-600/20">
                        <UserPlus className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase mb-3">
                        Connecter Votre <span className="text-indigo-600">Expert Comptable</span>
                    </h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Donnez accès sécurisé à vos journaux et documents comptables
                    </p>
                </div>

                {/* Comptable déjà connecté */}
                {connectedAccountant && (
                    <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-8 mb-6">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-3">
                                    <Check className="w-6 h-6 text-green-600" />
                                    <h4 className="text-lg font-black text-green-900 uppercase">Comptable Connecté</h4>
                                </div>
                                <p className="text-green-800 font-semibold text-lg mb-1">
                                    {connectedAccountant.accountant.firstName} {connectedAccountant.accountant.lastName}
                                </p>
                                <p className="text-sm text-green-700">{connectedAccountant.accountant.email}</p>
                                <p className="text-xs text-green-600 mt-2">
                                    ✅ Accès actif à vos journaux comptables
                                </p>
                            </div>
                            <button
                                onClick={revokeAccess}
                                disabled={isRevoking}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-sm transition-all disabled:opacity-50 flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                {isRevoking ? 'Révocation...' : 'Révoquer'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Affichage du code */}
                {!codeData && !connectedAccountant ? (
                    <div className="text-center space-y-8">
                        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-8">
                            <p className="text-sm text-indigo-900 leading-relaxed mb-4">
                                <strong className="font-black">Comment ça marche ?</strong>
                            </p>
                            <ul className="text-xs text-indigo-700 space-y-2 text-left max-w-md mx-auto">
                                <li className="flex items-start gap-2">
                                    <Key className="w-4 h-4 flex-shrink-0 mt-0.5 text-indigo-600" />
                                    <span>Générez un <strong>code d'accès unique</strong></span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check className="w-4 h-4 flex-shrink-0 mt-0.5 text-indigo-600" />
                                    <span>Communiquez-le à votre expert comptable (téléphone, email...)</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check className="w-4 h-4 flex-shrink-0 mt-0.5 text-indigo-600" />
                                    <span>Il entre le code dans son portail → <strong>Accès immédiat</strong></span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Check className="w-4 h-4 flex-shrink-0 mt-0.5 text-indigo-600" />
                                    <span>Vous pouvez révoquer l'accès à tout moment</span>
                                </li>
                            </ul>
                        </div>

                        <button
                            onClick={generateCode}
                            disabled={isGenerating}
                            className="px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-indigo-600/20 disabled:opacity-50 flex items-center gap-3 mx-auto"
                        >
                            {isGenerating ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Génération...
                                </>
                            ) : (
                                <>
                                    <Key className="w-5 h-5" />
                                    Générer le Code d'Accès
                                </>
                            )}
                        </button>
                    </div>
                ) : codeData && !connectedAccountant ? (
                    <div className="space-y-6">
                        {/* Success Message */}
                        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
                            <Check className="w-10 h-10 text-green-600 mx-auto mb-3" />
                            <p className="text-sm font-black text-green-900 uppercase tracking-wide mb-2">
                                Code d'Accès Généré !
                            </p>
                            <p className="text-xs text-green-700">
                                Communiquez ce code à votre expert comptable
                            </p>
                        </div>

                        {/* Code Display - GRAND ET VISIBLE */}
                        <div className="bg-white border-4 border-indigo-600 rounded-2xl p-10 text-center">
                            <p className="text-xs font-bold text-gray-600 uppercase tracking-widest mb-3">
                                VOTRE CODE D'ACCÈS
                            </p>
                            <div className="bg-indigo-50 rounded-xl p-6 mb-4">
                                <p className="text-5xl md:text-6xl font-black text-indigo-600 tracking-[0.3em] font-mono">
                                    {codeData.code}
                                </p>
                            </div>
                            <button
                                onClick={copyToClipboard}
                                className={`w-full px-6 py-4 rounded-xl font-black text-sm uppercase tracking-widest transition-all ${copied
                                        ? 'bg-green-600 text-white'
                                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                    }`}
                            >
                                {copied ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <Check className="w-5 h-5" />
                                        Code Copié !
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center gap-2">
                                        <Copy className="w-5 h-5" />
                                        Copier le Code
                                    </div>
                                )}
                            </button>
                        </div>

                        {/* Instructions */}
                        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                            <h4 className="text-xs font-black text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-indigo-600" />
                                Prochaines Étapes
                            </h4>
                            <ol className="space-y-3 text-xs text-gray-700">
                                <li className="flex gap-3">
                                    <span className="font-black text-indigo-600 flex-shrink-0">1.</span>
                                    <span><strong>Copiez</strong> le code ci-dessus (bouton "Copier le Code")</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="font-black text-indigo-600 flex-shrink-0">2.</span>
                                    <span><strong>Envoyez-le</strong> à votre comptable par téléphone, SMS ou email</span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="font-black text-indigo-600 flex-shrink-0">3.</span>
                                    <span>Votre comptable entre le code dans <strong>"Ajouter un client par code"</strong></span>
                                </li>
                                <li className="flex gap-3">
                                    <span className="font-black text-indigo-600 flex-shrink-0">4.</span>
                                    <span>Vous verrez son nom apparaître ici dès qu'il se connecte</span>
                                </li>
                            </ol>
                        </div>

                        {/* Sécurité */}
                        <div className="text-center">
                            <p className="text-xs text-gray-500">
                                <strong>🔒 Sécurité :</strong> Ce code reste actif jusqu'à révocation ou régénération
                            </p>
                        </div>

                        {/* Generate New */}
                        <div className="text-center pt-6 border-t border-gray-200">
                            <button
                                onClick={generateCode}
                                className="text-xs text-gray-600 hover:text-gray-900 font-medium underline"
                            >
                                Générer un nouveau code (l'ancien sera révoqué)
                            </button>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    )
}
