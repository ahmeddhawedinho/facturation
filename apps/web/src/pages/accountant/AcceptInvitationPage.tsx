import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { CheckCircle, AlertCircle, Loader2, Briefcase } from 'lucide-react'
import api from '../../lib/api'

export default function AcceptInvitationPage() {
    const { token } = useParams<{ token: string }>()
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
    const [message, setMessage] = useState('')
    const [companyName, setCompanyName] = useState('')

    useEffect(() => {
        // Vérifier que l'utilisateur est bien un comptable
        if (!user) {
            navigate('/login')
            return
        }

        if (user.role !== 'ACCOUNTANT') {
            setStatus('error')
            setMessage('Seuls les experts comptables peuvent accepter des invitations')
            return
        }

        acceptInvitation()
    }, [user, token])

    const acceptInvitation = async () => {
        if (!token) {
            setStatus('error')
            setMessage('Token d\'invitation invalide')
            return
        }

        try {
            const response = await api.post(`/accountant-portal/accept-invitation/${token}`)
            setCompanyName(response.data.company.name)
            setStatus('success')
            setMessage(`Vous avez maintenant accès au dossier de ${response.data.company.name}`)

            // Redirect après 2 secondes
            setTimeout(() => {
                navigate('/portal/accountant')
            }, 2000)
        } catch (error: any) {
            setStatus('error')
            setMessage(
                error.response?.data?.message ||
                'Impossible d\'accepter l\'invitation. Le lien est peut-être expiré ou invalide.'
            )
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
                    {/* Icon */}
                    <div className="mb-6">
                        {status === 'loading' && (
                            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto">
                                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                            </div>
                        )}
                        {status === 'success' && (
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle className="w-8 h-8 text-green-600" />
                            </div>
                        )}
                        {status === 'error' && (
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                                <AlertCircle className="w-8 h-8 text-red-600" />
                            </div>
                        )}
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl font-bold text-gray-900 mb-3">
                        {status === 'loading' && 'Acceptation de l\'invitation...'}
                        {status === 'success' && 'Invitation acceptée !'}
                        {status === 'error' && 'Erreur'}
                    </h1>

                    {/* Message */}
                    <p className={`text-sm mb-6 ${status === 'error' ? 'text-red-600' : 'text-gray-600'
                        }`}>
                        {message}
                    </p>

                    {/* Company Badge (success only) */}
                    {status === 'success' && companyName && (
                        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
                            <div className="flex items-center justify-center gap-2">
                                <Briefcase className="w-5 h-5 text-indigo-600" />
                                <span className="font-semibold text-indigo-900">{companyName}</span>
                            </div>
                            <p className="text-xs text-indigo-600 mt-1">
                                Nouveau dossier client disponible
                            </p>
                        </div>
                    )}

                    {/* Loading state */}
                    {status === 'loading' && (
                        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                            <div className="animate-pulse">Vérification de l'invitation...</div>
                        </div>
                    )}

                    {/* Success state */}
                    {status === 'success' && (
                        <div className="space-y-3">
                            <p className="text-sm text-gray-600">
                                Redirection vers votre portail...
                            </p>
                            <button
                                onClick={() => navigate('/portal/accountant')}
                                className="btn bg-indigo-600 hover:bg-indigo-700 text-white w-full"
                            >
                                Accéder au portail maintenant
                            </button>
                        </div>
                    )}

                    {/* Error state */}
                    {status === 'error' && (
                        <div className="space-y-3">
                            <button
                                onClick={() => navigate('/portal/accountant')}
                                className="btn bg-gray-600 hover:bg-gray-700 text-white w-full"
                            >
                                Retour au portail
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="text-center mt-6">
                    <p className="text-sm text-gray-600">
                        Vous avez des questions ?{' '}
                        <a href="mailto:support@facturation-tn.com" className="text-indigo-600 hover:text-indigo-700 font-medium">
                            Contactez le support
                        </a>
                    </p>
                </div>
            </div>
        </div>
    )
}
