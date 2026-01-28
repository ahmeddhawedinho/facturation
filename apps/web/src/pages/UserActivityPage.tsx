import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { ArrowLeft, Clock, FileText, Activity, ShieldAlert, User as UserIcon } from 'lucide-react'

interface AuditLog {
    id: string
    action: string
    entity: string
    entityId: string
    changes: any
    createdAt: string
    user: {
        firstName: string
        lastName: string
    }
}

interface User {
    id: string
    firstName: string
    lastName: string
    role: string
    customRole?: { name: string }
}

export default function UserActivityPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [logs, setLogs] = useState<AuditLog[]>([])
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [id])

    const loadData = async () => {
        try {
            setLoading(true)
            const [userRes, logsRes] = await Promise.all([
                api.get(`/users/${id}`),
                api.get(`/audit-logs?userId=${id}`)
            ])
            setUser(userRes.data)
            setLogs(logsRes.data)
        } catch (error) {
            console.error('Erreur chargement activité:', error)
        } finally {
            setLoading(false)
        }
    }

    const getActionColor = (action: string) => {
        switch (action) {
            case 'CREATE': return 'text-emerald-600 bg-emerald-50 border-emerald-100'
            case 'UPDATE': return 'text-blue-600 bg-blue-50 border-blue-100'
            case 'DELETE': return 'text-rose-600 bg-rose-50 border-rose-100'
            case 'TRASH': return 'text-amber-600 bg-amber-50 border-amber-100'
            default: return 'text-gray-600 bg-gray-50 border-gray-100'
        }
    }

    const getActionLabel = (action: string) => {
        switch (action) {
            case 'CREATE': return 'Création'
            case 'UPDATE': return 'Modification'
            case 'DELETE': return 'Suppression'
            case 'TRASH': return 'Mise en Corbeille'
            default: return action
        }
    }

    const formatLogContent = (log: AuditLog) => {
        let title = `${log.entity} #${log.entityId.slice(0, 8)}`
        let details = JSON.stringify(log.changes || {})

        const actionLabel = getActionLabel(log.action)
        const changes = log.changes || {}

        if (log.entity === 'Employee') {
            const name = changes.name || `${changes.firstName || ''} ${changes.lastName || ''}`.trim() || 'Employé'
            title = `${actionLabel} de ${name}`
            if (log.action === 'CREATE') details = `Ajout au département ${changes.department || 'N/A'}`
            else if (log.action === 'UPDATE') {
                const keys = Object.keys(changes).filter(k => !['id', 'updatedAt', 'userId', 'companyId', 'name', 'firstName', 'lastName'].includes(k))
                details = keys.length ? `Champs modifiés : ${keys.join(', ')}` : 'Mise à jour fiche'
            }
        }
        else if (log.entity === 'Client') {
            // Pour log.changes contenant { name: ... }
            const name = changes.name || 'Client'
            title = `${actionLabel} Client ${name}`
            if (changes.email) details = `Email: ${changes.email}`
            else if (log.action === 'DELETE') details = 'Compte client supprimé'
        }
        else if (log.entity === 'Supplier') {
            const name = changes.name || 'Fournisseur'
            title = `${actionLabel} Fournisseur ${name}`
            if (log.action === 'DELETE') details = 'Compte fournisseur supprimé'
        }
        else if (log.entity === 'Product') {
            const name = changes.name || changes.title || 'Produit'
            title = `${actionLabel} Produit ${name}`
            if (changes.quantity) details = `Ajustement stock: ${changes.quantity}`
        }
        else if (log.entity === 'PurchaseOrder') {
            title = `${actionLabel} Achat`
            if (changes.total) details = `Total: ${changes.total} TND`
            else if (log.action === 'UPDATE' && changes.amount) {
                title = 'Paiement Achat'
                details = `Montant réglé: ${changes.amount} TND`
            }
        }
        else if (log.entity === 'SalaryAdvance' || log.entity === 'SalaryAdjustment') {
            title = log.entity === 'SalaryAdvance' ? 'Avance sur Salaire' : 'Ajustement Salaire'
            const empName = changes.employeeName || ''
            if (empName) title += ` (${empName})`
            details = `Montant: ${changes.amount} TND`
        }

        // Fallback cleanup for JSON
        if (typeof details === 'string' && details.startsWith('{')) {
            try {
                const parsed = JSON.parse(details)
                const simple = Object.entries(parsed)
                    .filter(([k]) => !['id', 'updatedAt', 'companyId', 'userId'].includes(k))
                    .map(([k, v]) => `${k}: ${v}`).join(', ')
                if (simple) details = simple
            } catch (e) { }
        }

        return (
            <>
                <h3 className="font-black text-gray-900 text-sm uppercase mb-1">{title}</h3>
                <p className="text-xs text-gray-600 font-medium leading-relaxed line-clamp-2" title={typeof details === 'string' ? details : ''}>{details}</p>
            </>
        )
    }

    if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>

    return (
        <div className="min-h-screen space-y-8 animate-fade-in pb-20">
            {/* Header */}
            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-200/50 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <button onClick={() => navigate('/dashboard/team')} className="p-3 hover:bg-gray-50 rounded-xl transition-colors border border-gray-100 shadow-sm text-gray-500">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight flex items-center gap-3">
                            <Activity className="w-6 h-6 text-blue-600" /> Journal d'Activité
                        </h1>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1 ml-1 flex items-center gap-2">
                            <UserIcon className="w-3 h-3" /> Agent: <span className="text-blue-600">{user?.firstName} {user?.lastName}</span>
                        </p>
                    </div>
                </div>
                <div className="px-6 py-2 bg-gray-50 rounded-xl border border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-widest">
                    {logs.length} Événements
                </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden p-8">
                <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                    {logs.map((log) => (
                        <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">

                            {/* Icon Center */}
                            <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                                <div className={`w-3 h-3 rounded-full ${getActionColor(log.action).split(' ')[1].replace('bg-', 'bg-').replace('-50', '-500')}`}></div>
                            </div>

                            {/* Content Card */}
                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-gray-50 p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all">
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${getActionColor(log.action)}`}>
                                        {getActionLabel(log.action)}
                                    </span>
                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> {new Date(log.createdAt).toLocaleString()}
                                    </span>
                                </div>
                                {formatLogContent(log)}
                                {log.entity === 'Document' && (
                                    <button onClick={() => navigate(`/dashboard/documents/${log.entityId}`)} className="mt-4 text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest flex items-center gap-1">
                                        Voir Document <FileText className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    {logs.length === 0 && (
                        <div className="text-center py-20">
                            <ShieldAlert className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Aucune activité enregistrée</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
