import { useState } from 'react'
import { useAuthStore } from '../store/authStore'
import api from '../lib/api'
import { User, Lock, Key } from 'lucide-react'

export default function ProfilePage() {
    const { user } = useAuthStore()
    const [passwordForm, setPasswordForm] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
    })
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setMessage(null)

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setMessage({ type: 'error', text: 'Les nouveaux mots de passe ne correspondent pas' })
            return
        }

        if (passwordForm.newPassword.length < 6) {
            setMessage({ type: 'error', text: 'Le mot de passe doit contenir au moins 6 caractères' })
            return
        }

        setLoading(true)
        try {
            await api.put('/users/profile/change-password', {
                oldPassword: passwordForm.oldPassword,
                newPassword: passwordForm.newPassword
            })
            setMessage({ type: 'success', text: 'Mot de passe modifié avec succès' })
            setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' })
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Erreur lors du changement de mot de passe'
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <User className="w-8 h-8 text-blue-600" />
                Mon Profil
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Carte d'informations */}
                <div className="md:col-span-1">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="text-center mb-6">
                            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl font-bold text-blue-600">
                                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                                </span>
                            </div>
                            <h2 className="text-xl font-bold">{user?.firstName} {user?.lastName}</h2>
                            <p className="text-gray-500 text-sm">{user?.email}</p>
                        </div>

                        <div className="border-t pt-4">
                            <div className="flex justify-between items-center py-2">
                                <span className="text-gray-600 text-sm">Rôle</span>
                                <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">
                                    {user?.role === 'ADMIN' ? 'Administrateur' : user?.customRole?.name || 'Utilisateur'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-gray-600 text-sm">Statut</span>
                                <span className="text-green-600 text-sm font-medium">Actif</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Changement de mot de passe */}
                <div className="md:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Lock className="w-5 h-5 text-gray-400" />
                            Sécurité
                        </h3>

                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Ancien mot de passe
                                </label>
                                <div className="relative">
                                    <Key className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                                    <input
                                        type="password"
                                        required
                                        className="input w-full pl-10"
                                        value={passwordForm.oldPassword}
                                        onChange={e => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nouveau mot de passe
                                    </label>
                                    <input
                                        type="password"
                                        required
                                        className="input w-full"
                                        value={passwordForm.newPassword}
                                        onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Confirmer le mot de passe
                                    </label>
                                    <input
                                        type="password"
                                        required
                                        className="input w-full"
                                        value={passwordForm.confirmPassword}
                                        onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                    />
                                </div>
                            </div>

                            {message && (
                                <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                    }`}>
                                    {message.text}
                                </div>
                            )}

                            <div className="flex justify-end pt-2">
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={loading}
                                >
                                    {loading ? 'Modification...' : 'Changer le mot de passe'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}
