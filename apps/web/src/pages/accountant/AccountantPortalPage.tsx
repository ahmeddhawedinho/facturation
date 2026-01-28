import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import {
    Briefcase,
    FolderOpen,
    Search,
    Plus,
    Building2,
    TrendingUp,
    FileText,
    Users
} from 'lucide-react'
import api from '../../lib/api'

interface ClientCompany {
    id: string
    name: string
    legalName: string
    fiscalNumber: string
    address: string
    city: string
    email: string
    phone: string
    logo?: string
    isActive: boolean
}

export default function AccountantPortalPage() {
    const navigate = useNavigate()
    const { user, logout } = useAuthStore()
    const [clients, setClients] = useState<ClientCompany[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // Vérifier que c'est bien un comptable
        if (user?.role !== 'ACCOUNTANT') {
            navigate('/dashboard')
            return
        }

        fetchClients()
    }, [user, navigate])

    const fetchClients = async () => {
        try {
            const response = await api.get('/accountant-portal/clients')
            setClients(response.data)
        } catch (error) {
            console.error('Erreur lors du chargement des clients:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.fiscalNumber.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const stats = {
        totalClients: clients.length,
        activeClients: clients.filter(c => c.isActive).length,
        totalDocuments: 0, // À calculer depuis le backend
        totalRevenue: 0, // À calculer
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Chargement...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 shadow-sm">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center">
                                <Briefcase className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Portail Expert Comptable</h1>
                                <p className="text-sm text-gray-600">Bienvenue, {user?.firstName} {user?.lastName}</p>
                            </div>
                        </div>
                        <button
                            onClick={logout}
                            className="text-sm text-gray-600 hover:text-gray-900 font-medium"
                        >
                            Déconnexion
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-6 py-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                                <Building2 className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 font-medium">Dossiers Clients</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.totalClients}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                                <Users className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 font-medium">Clients Actifs</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.activeClients}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                                <FileText className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 font-medium">Documents</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.totalDocuments}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 font-medium">CA Total</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.totalRevenue.toFixed(2)} TND</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search and Actions */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1 max-w-md">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Rechercher un client..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                                />
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/portal/accountant/new-client')}
                            className="btn bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 px-6 py-3 rounded-xl font-semibold"
                        >
                            <Plus className="w-5 h-5" />
                            Nouveau Client
                        </button>
                    </div>
                </div>

                {/* Clients Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredClients.length === 0 ? (
                        <div className="col-span-full text-center py-12">
                            <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                {searchTerm ? 'Aucun client trouvé' : 'Aucun dossier client'}
                            </h3>
                            <p className="text-gray-600 mb-6">
                                {searchTerm
                                    ? 'Essayez une autre recherche'
                                    : 'Commencez par créer votre premier dossier client'}
                            </p>
                            {!searchTerm && (
                                <button
                                    onClick={() => navigate('/portal/accountant/new-client')}
                                    className="btn bg-indigo-600 hover:bg-indigo-700 text-white inline-flex items-center gap-2"
                                >
                                    <Plus className="w-5 h-5" />
                                    Créer un dossier
                                </button>
                            )}
                        </div>
                    ) : (
                        filteredClients.map((client) => (
                            <div
                                key={client.id}
                                onClick={() => navigate(`/portal/accountant/clients/${client.id}`)}
                                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    {client.logo ? (
                                        <img
                                            src={client.logo}
                                            alt={client.name}
                                            className="w-12 h-12 rounded-xl object-cover"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                                            <Building2 className="w-6 h-6 text-indigo-600" />
                                        </div>
                                    )}
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${client.isActive
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-gray-100 text-gray-700'
                                        }`}>
                                        {client.isActive ? 'Actif' : 'Inactif'}
                                    </span>
                                </div>

                                <h3 className="font-bold text-lg text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">
                                    {client.name}
                                </h3>
                                <p className="text-sm text-gray-600 mb-4">{client.legalName}</p>

                                <div className="space-y-2 text-sm text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-gray-400">MF:</span>
                                        <span className="font-mono">{client.fiscalNumber}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-gray-400">📍</span>
                                        <span>{client.city}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
