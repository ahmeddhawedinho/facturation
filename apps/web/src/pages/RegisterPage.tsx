import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { FileText, Building, AlertCircle, CheckCircle, Briefcase, UserCircle } from 'lucide-react'

type AccountType = 'COMPANY' | 'ACCOUNTANT'

export default function RegisterPage() {
    const navigate = useNavigate()
    const { register, isLoading } = useAuthStore()
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)
    const [accountType, setAccountType] = useState<AccountType>('COMPANY')
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        companyName: '',
        companyLegalName: '',
        companyAddress: '',
        companyCity: '',
        companyFiscalNumber: '',
        companyPhone: '',
        companyEmail: '',
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (formData.password !== formData.confirmPassword) {
            setError('Les mots de passe ne correspondent pas')
            return
        }

        if (formData.password.length < 6) {
            setError('Le mot de passe doit contenir au moins 6 caractères')
            return
        }

        try {
            if (accountType === 'COMPANY') {
                // Créer l'entreprise et l'utilisateur admin
                await register({
                    email: formData.email,
                    password: formData.password,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    role: 'ADMIN',
                    company: {
                        name: formData.companyName,
                        legalName: formData.companyLegalName,
                        address: formData.companyAddress,
                        city: formData.companyCity,
                        fiscalNumber: formData.companyFiscalNumber,
                        phone: formData.companyPhone,
                        email: formData.companyEmail,
                    },
                })
            } else {
                // Créer un compte Expert Comptable
                await register({
                    email: formData.email,
                    password: formData.password,
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    role: 'ACCOUNTANT',
                    // Pas de company pour les comptables
                })
            }

            setSuccess(true)
            setTimeout(() => navigate('/login'), 2000)
        } catch (err: any) {
            setError(err.response?.data?.message || 'Une erreur est survenue lors de l\'inscription')
        }
    }

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 flex items-center justify-center p-4">
                <div className="card max-w-md text-center animate-slide-up">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Inscription réussie !</h2>
                    <p className="text-gray-600">Redirection vers la page de connexion...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 py-12 px-4">
            <div className="w-full max-w-3xl mx-auto">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center gap-2 text-2xl font-bold text-gray-900">
                        <FileText className="w-8 h-8 text-primary-600" />
                        Facturation TN
                    </Link>
                </div>

                {/* Card */}
                <div className="card animate-slide-up">
                    <h1 className="text-2xl font-bold text-center mb-2">Créer votre compte</h1>
                    <p className="text-center text-gray-600 mb-6">Choisissez le type de compte qui vous convient</p>

                    {/* Account Type Selector */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <button
                            type="button"
                            onClick={() => setAccountType('COMPANY')}
                            className={`relative p-6 rounded-xl border-2 transition-all ${accountType === 'COMPANY'
                                ? 'border-primary-600 bg-primary-50 shadow-lg'
                                : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <Building className={`w-8 h-8 mx-auto mb-3 ${accountType === 'COMPANY' ? 'text-primary-600' : 'text-gray-400'
                                }`} />
                            <h3 className="font-semibold text-center mb-1">Je suis une Entreprise</h3>
                            <p className="text-xs text-gray-600 text-center">
                                Gérer ma facturation et ma comptabilité
                            </p>
                            {accountType === 'COMPANY' && (
                                <div className="absolute top-2 right-2">
                                    <CheckCircle className="w-5 h-5 text-primary-600" />
                                </div>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => setAccountType('ACCOUNTANT')}
                            className={`relative p-6 rounded-xl border-2 transition-all ${accountType === 'ACCOUNTANT'
                                ? 'border-indigo-600 bg-indigo-50 shadow-lg'
                                : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <Briefcase className={`w-8 h-8 mx-auto mb-3 ${accountType === 'ACCOUNTANT' ? 'text-indigo-600' : 'text-gray-400'
                                }`} />
                            <h3 className="font-semibold text-center mb-1">Je suis un Expert Comptable</h3>
                            <p className="text-xs text-gray-600 text-center">
                                Gérer les dossiers de mes clients
                            </p>
                            {accountType === 'ACCOUNTANT' && (
                                <div className="absolute top-2 right-2">
                                    <CheckCircle className="w-5 h-5 text-indigo-600" />
                                </div>
                            )}
                        </button>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Informations personnelles */}
                        <div>
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <UserCircle className={`w-5 h-5 ${accountType === 'ACCOUNTANT' ? 'text-indigo-600' : 'text-primary-600'
                                    }`} />
                                Vos informations
                            </h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="label">Prénom</label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        className="input"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="label">Nom</label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        className="input"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="label">Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="input"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="label">Mot de passe</label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="input"
                                        required
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="label">Confirmer le mot de passe</label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className="input"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Informations entreprise - UNIQUEMENT pour les Entreprises */}
                        {accountType === 'COMPANY' && (
                            <div>
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <Building className="w-5 h-5 text-primary-600" />
                                    Votre entreprise
                                </h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="label">Nom commercial</label>
                                        <input
                                            type="text"
                                            name="companyName"
                                            value={formData.companyName}
                                            onChange={handleChange}
                                            className="input"
                                            required={accountType === 'COMPANY'}
                                        />
                                    </div>
                                    <div>
                                        <label className="label">Raison sociale</label>
                                        <input
                                            type="text"
                                            name="companyLegalName"
                                            value={formData.companyLegalName}
                                            onChange={handleChange}
                                            className="input"
                                            required={accountType === 'COMPANY'}
                                        />
                                    </div>
                                    <div>
                                        <label className="label">Matricule Fiscal</label>
                                        <input
                                            type="text"
                                            name="companyFiscalNumber"
                                            value={formData.companyFiscalNumber}
                                            onChange={handleChange}
                                            className="input"
                                            placeholder="1234567ABC"
                                            required={accountType === 'COMPANY'}
                                        />
                                    </div>
                                    <div>
                                        <label className="label">Téléphone</label>
                                        <input
                                            type="tel"
                                            name="companyPhone"
                                            value={formData.companyPhone}
                                            onChange={handleChange}
                                            className="input"
                                            placeholder="+216 71 123 456"
                                            required={accountType === 'COMPANY'}
                                        />
                                    </div>
                                    <div>
                                        <label className="label">Email entreprise</label>
                                        <input
                                            type="email"
                                            name="companyEmail"
                                            value={formData.companyEmail}
                                            onChange={handleChange}
                                            className="input"
                                            required={accountType === 'COMPANY'}
                                        />
                                    </div>
                                    <div>
                                        <label className="label">Ville</label>
                                        <input
                                            type="text"
                                            name="companyCity"
                                            value={formData.companyCity}
                                            onChange={handleChange}
                                            className="input"
                                            required={accountType === 'COMPANY'}
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="label">Adresse</label>
                                        <input
                                            type="text"
                                            name="companyAddress"
                                            value={formData.companyAddress}
                                            onChange={handleChange}
                                            className="input"
                                            required={accountType === 'COMPANY'}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full btn ${accountType === 'ACCOUNTANT'
                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                : 'btn-primary'
                                }`}
                        >
                            {isLoading ? 'Création du compte...' : 'Créer mon compte'}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-gray-600">
                        Vous avez déjà un compte ?{' '}
                        <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                            Se connecter
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
