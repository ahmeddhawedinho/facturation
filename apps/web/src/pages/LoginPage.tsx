import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { FileText, Mail, Lock, AlertCircle } from 'lucide-react'

export default function LoginPage() {
    const navigate = useNavigate()
    const { login, isLoading } = useAuthStore()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        try {
            await login(email, password)

            // Redirection conditionnelle selon le rôle
            const currentUser = useAuthStore.getState().user
            if (currentUser?.role === 'ACCOUNTANT') {
                navigate('/portal/accountant')
            } else {
                navigate('/dashboard')
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Email ou mot de passe incorrect')
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-6 relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"></div>
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-50"></div>
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-100 rounded-full blur-3xl opacity-50"></div>

            <div className="w-full max-w-md relative z-10">
                {/* Logo */}
                <div className="text-center mb-10">
                    <Link to="/" className="inline-flex items-center gap-3 text-3xl font-black text-gray-900 tracking-tight">
                        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-600/20">
                            <FileText className="w-7 h-7 text-white" />
                        </div>
                        FACTURATION <span className="text-blue-600">TN</span>
                    </Link>
                    <p className="text-gray-500 font-medium mt-3 uppercase tracking-widest text-[10px]">Système de Gestion Cloud</p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-3xl shadow-2xl shadow-gray-200/50 border border-gray-100 p-8 md:p-10 animate-fade-in">
                    <div className="mb-8">
                        <h1 className="text-2xl font-black text-gray-900">Bienvenue</h1>
                        <p className="text-gray-400 text-sm font-medium">Connectez-vous pour accéder à votre espace.</p>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-start gap-3 animate-shake">
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <span className="text-sm font-bold">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Adresse Email</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-blue-600 transition-colors" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl py-3.5 pl-12 pr-4 font-bold text-sm focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all placeholder-gray-300"
                                    placeholder="exemple@entreprise.tn"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mot de passe</label>
                                <Link to="/forgot-password" title="Réinitialiser" className="text-[9px] font-bold text-blue-600 hover:text-blue-700 uppercase">Oublié ?</Link>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300 group-focus-within:text-blue-600 transition-colors" />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl py-3.5 pl-12 pr-4 font-bold text-sm focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all placeholder-gray-300"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-blue-600/30 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                        >
                            {isLoading ? 'Identification...' : 'Se Connecter'}
                        </button>
                    </form>

                    <div className="mt-8 text-center text-xs text-gray-500 font-bold uppercase tracking-wider">
                        Pas de compte ?{' '}
                        <Link to="/register" className="text-blue-600 hover:text-blue-700 hover:underline">
                            Créer un accès gratuit
                        </Link>
                    </div>
                </div>

                {/* Demo accounts */}
                <div className="mt-8 rounded-2xl border border-gray-200 bg-white/50 backdrop-blur-md p-6 shadow-sm">
                    <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
                        Accès Démo Sécurisé
                    </p>
                    <div className="space-y-2">
                        {[
                            { role: 'Super Admin', email: 'admin@facturation-tn.com' },
                            { role: 'Admin', email: 'admin@techsolutions.tn' },
                            { role: 'User', email: 'user@techsolutions.tn' }
                        ].map((acc, i) => (
                            <div key={i} className="flex justify-between items-center text-[11px]">
                                <span className="font-bold text-gray-400 uppercase tracking-tighter">{acc.role}</span>
                                <span className="font-mono text-gray-900 font-bold">{acc.email}</span>
                            </div>
                        ))}
                    </div>
                    <p className="mt-3 text-[10px] text-center text-gray-400 font-medium">Mot de passe pour tous : <span className="text-gray-900 font-bold">admin123</span></p>
                </div>
            </div>
        </div>
    )
}

