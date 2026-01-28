import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { Users, Edit, Trash2, Shield, Check, ShieldCheck, Mail, UserPlus, Fingerprint, Lock, ChevronRight, Activity } from 'lucide-react'
import Modal from '../components/Modal'

interface CustomRole {
    id: string
    name: string
    permissions: string[]
    _count: {
        users: number
    }
    createdAt: string
}

interface User {
    id: string
    email: string
    firstName: string
    lastName: string
    role: string
    customRole?: {
        id: string
        name: string
    }
    isActive: boolean
}



export default function TeamManagementPage() {
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const [roles, setRoles] = useState<CustomRole[]>([])
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [showRoleModal, setShowRoleModal] = useState(false)
    const [showUserModal, setShowUserModal] = useState(false)
    const [editingRole, setEditingRole] = useState<CustomRole | null>(null)
    const [editingUser, setEditingUser] = useState<User | null>(null)
    const [roleName, setRoleName] = useState('')
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])

    const [availablePermissions, setAvailablePermissions] = useState<any[]>([])

    const [userForm, setUserForm] = useState({
        email: '',
        firstName: '',
        lastName: '',
        password: '',
        customRoleId: '',
        isActive: true
    })

    useEffect(() => {
        if (user?.role !== 'ADMIN') {
            navigate('/dashboard')
            return
        }
        loadData()
    }, [user, navigate])

    const loadData = async () => {
        try {
            setLoading(true)
            const [rolesRes, usersRes, permissionsRes] = await Promise.all([
                api.get('/custom-roles'),
                api.get('/users'),
                api.get('/custom-roles/permissions')
            ])
            setRoles(rolesRes.data || [])
            setUsers(usersRes.data || [])
            setAvailablePermissions(permissionsRes.data || [])
        } catch (error) {
            console.error('Erreur chargement données:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateRole = () => {
        setEditingRole(null)
        setRoleName('')
        setSelectedPermissions([])
        setShowRoleModal(true)
    }

    const handleEditRole = (role: CustomRole) => {
        setEditingRole(role)
        setRoleName(role.name)
        setSelectedPermissions(role.permissions)
        setShowRoleModal(true)
    }

    const handleSaveRole = async () => {
        try {
            const data = { name: roleName, permissions: selectedPermissions }
            if (editingRole) {
                await api.put(`/custom-roles/${editingRole.id}`, data)
            } else {
                await api.post('/custom-roles', data)
            }
            setShowRoleModal(false)
            loadData()
        } catch (error: any) {
            alert(error.response?.data?.message || 'Erreur lors de l\'enregistrement')
        }
    }

    const handleDeleteRole = async (id: string) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer ce rôle ?')) {
            try {
                await api.delete(`/custom-roles/${id}`)
                loadData()
            } catch (error: any) {
                alert(error.response?.data?.message || 'Erreur lors de la suppression')
            }
        }
    }

    const handleCreateUser = () => {
        setEditingUser(null)
        setUserForm({
            email: '', firstName: '', lastName: '',
            password: '', customRoleId: '', isActive: true
        })
        setShowUserModal(true)
    }

    const handleEditUser = (user: User) => {
        setEditingUser(user)
        setUserForm({
            email: user.email, firstName: user.firstName, lastName: user.lastName,
            password: '', customRoleId: user.customRole?.id || '', isActive: user.isActive
        })
        setShowUserModal(true)
    }

    const handleSaveUser = async () => {
        try {
            if (editingUser) {
                const updateData: any = {
                    firstName: userForm.firstName,
                    lastName: userForm.lastName,
                    isActive: userForm.isActive,
                }
                if (userForm.customRoleId) updateData.customRoleId = userForm.customRoleId
                if (userForm.password) updateData.password = userForm.password
                await api.put(`/users/${editingUser.id}`, updateData)
            } else {
                await api.post('/users', { ...userForm, role: 'SUB_ACCOUNT', companyId: user?.companyId })
            }
            setShowUserModal(false)
            loadData()
        } catch (error: any) {
            alert(error.response?.data?.message || 'Erreur lors de l\'enregistrement')
        }
    }

    const handleDeleteUser = async (id: string) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
            try {
                await api.delete(`/users/${id}`)
                loadData()
            } catch (error: any) {
                alert(error.response?.data?.message || 'Erreur lors de la suppression')
            }
        }
    }

    const togglePermission = (permissionId: string) => {
        setSelectedPermissions(prev =>
            prev.includes(permissionId)
                ? prev.filter(p => p !== permissionId)
                : [...prev, permissionId]
        )
    }

    const groupedPermissions = availablePermissions.reduce((acc: any, perm: any) => {
        if (!acc[perm.category]) acc[perm.category] = []
        acc[perm.category].push(perm)
        return acc
    }, {} as Record<string, any[]>)

    if (loading) {
        return (
            <div className="py-20 flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="w-12 h-12 rounded-full border-4 border-gray-100 border-t-blue-600 animate-spin"></div>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest animate-pulse">Initialisation du Centre de Gouvernance...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50/50 space-y-10 animate-fade-in pb-20">
            {/* Premium Header */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/50 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-blue-50 rounded-full blur-[100px] -mr-40 -mt-40 opacity-60"></div>

                <div className="flex items-center gap-6 relative z-10">
                    <div className="w-16 h-16 bg-gray-900 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-gray-900/20">
                        <Users className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-4xl lg:text-6xl font-black text-gray-900 tracking-tighter leading-none uppercase">
                            Gestion de <span className="text-blue-600">l'Équipe</span>
                        </h1>
                        <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mt-2 leading-relaxed">
                            Contrôle des habilitations et <span className="text-blue-600">gouvernance des accès</span>.
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-4 relative z-10 w-full xl:w-auto">
                    <button onClick={handleCreateRole} className="flex-1 xl:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-white text-gray-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-gray-200/50 border border-gray-100">
                        <Shield className="w-4 h-4 text-blue-600" /> Profil Métier
                    </button>
                    <button onClick={handleCreateUser} className="flex-1 xl:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-blue-600/20">
                        <UserPlus className="w-4 h-4" /> Nouvel Utilisateur
                    </button>
                </div>
            </div>

            {/* Roles Dynamic Section */}
            <div className="space-y-8">
                <div className="flex items-center gap-4 px-4">
                    <div className="h-8 w-1.5 bg-blue-600 rounded-full"></div>
                    <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Structures de Sécurité</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 px-2">
                    {roles.map(role => (
                        <div key={role.id} className="group bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-xl shadow-gray-200/50 hover:shadow-2xl hover:shadow-blue-600/5 transition-all duration-500 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-[60px] -mr-16 -mt-16 opacity-40 group-hover:scale-150 transition-transform duration-700"></div>
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-10">
                                    <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner border border-blue-100/50 group-hover:rotate-6 transition-transform">
                                        <ShieldCheck className="w-7 h-7" />
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                        <button onClick={() => handleEditRole(role)} className="p-3 bg-white text-gray-400 hover:text-blue-600 rounded-xl border border-gray-100 shadow-sm transition-all"><Edit className="w-4 h-4" /></button>
                                        <button onClick={() => handleDeleteRole(role.id)} className="p-3 bg-white text-gray-400 hover:text-rose-600 rounded-xl border border-gray-100 shadow-sm transition-all"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-4">{role.name}</h3>
                                <div className="space-y-4 pt-6 border-t border-gray-50">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Permissions Actives</span>
                                        <span className="px-3 py-1 bg-blue-50 rounded-lg text-[9px] font-black text-blue-600 border border-blue-100">{role.permissions.length}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Membres Assignés</span>
                                        <div className="flex items-center gap-2">
                                            <Users className="w-3.5 h-3.5 text-blue-400" />
                                            <span className="text-sm font-black text-gray-900">{role._count.users}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Users Directory Table */}
            <div className="bg-white rounded-[3rem] border border-gray-100 shadow-xl shadow-gray-200/50 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-gray-900 via-blue-600 to-gray-900"></div>
                <div className="p-10 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                    <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter flex items-center gap-4">
                        <Fingerprint className="w-8 h-8 text-blue-600" /> Annuaire des Accès
                    </h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-black text-gray-700 uppercase tracking-[0.2em]">
                                <th className="px-10 py-6">Identité</th>
                                <th className="px-10 py-6">Vecteur d'accès (Email)</th>
                                <th className="px-10 py-6">Protocole Actif</th>
                                <th className="px-10 py-6 text-center">Statut</th>
                                <th className="px-10 py-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {users.map(u => (
                                <tr key={u.id} className="hover:bg-gray-50/50 transition-all group">
                                    <td className="px-10 py-6">
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 rounded-[1.25rem] bg-blue-50 border border-blue-100 shadow-inner flex items-center justify-center font-black text-blue-600 text-xs">
                                                {u.firstName[0]}{u.lastName[0]}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-black text-gray-900 text-sm tracking-tight uppercase group-hover:text-blue-600 transition-colors">{u.firstName} {u.lastName}</span>
                                                <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mt-0.5">Membre Équipe</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-6 text-xs font-bold font-mono text-gray-500 uppercase">{u.email}</td>
                                    <td className="px-10 py-6">
                                        <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${u.role === 'ADMIN' ? 'bg-gray-900 text-white' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                                            {u.role === 'ADMIN' ? 'Root Admin' : u.customRole?.name || 'Standard'}
                                        </span>
                                    </td>
                                    <td className="px-10 py-6 text-center">
                                        <div className={`px-4 py-1.5 rounded-full inline-flex items-center gap-2 border shadow-sm ${u.isActive ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
                                            <span className="text-[9px] font-black uppercase tracking-widest">{u.isActive ? 'Actif' : 'Suspendu'}</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-6">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                            <button onClick={() => navigate(`/dashboard/team/${u.id}/activity`)} className="p-3 bg-white text-gray-400 hover:text-blue-600 rounded-xl border border-gray-100 hover:shadow-md transition-all" title="Journal d'Activité"><Activity className="w-4 h-4" /></button>
                                            <button onClick={() => handleEditUser(u)} className="p-3 bg-white text-gray-400 hover:text-blue-600 rounded-xl border border-gray-100 hover:shadow-md transition-all"><Edit className="w-4 h-4" /></button>
                                            {u.role !== 'ADMIN' && <button onClick={() => handleDeleteUser(u.id)} className="p-3 bg-white text-gray-400 hover:text-rose-600 rounded-xl border border-gray-100 hover:shadow-md transition-all"><Trash2 className="w-4 h-4" /></button>}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODALS REFACTORED TO GLOBAL COMPONENT */}
            <Modal isOpen={showUserModal} onClose={() => setShowUserModal(false)} title={editingUser ? 'Fiche Accès Collaborateur' : 'Nouveau Protocole Collaborateur'} size="md">
                <div className="space-y-8 py-4">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-700 uppercase tracking-widest ml-1">Prénom</label>
                            <input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 px-6 text-gray-900 font-black text-lg focus:bg-white focus:ring-8 focus:ring-blue-600/5 transition-all shadow-inner outline-none" value={userForm.firstName} onChange={e => setUserForm({ ...userForm, firstName: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-700 uppercase tracking-widest ml-1">Nom</label>
                            <input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 px-6 text-gray-900 font-black text-lg focus:bg-white focus:ring-8 focus:ring-blue-600/5 transition-all shadow-inner outline-none" value={userForm.lastName} onChange={e => setUserForm({ ...userForm, lastName: e.target.value })} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-700 uppercase tracking-widest ml-1">Email (Vecteur Identifiant)</label>
                        <div className="relative">
                            <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                            <input type="email" disabled={!!editingUser} className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-16 pr-6 text-gray-900 font-bold focus:bg-white focus:ring-8 focus:ring-blue-600/5 outline-none transition-all shadow-inner disabled:opacity-50" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-700 uppercase tracking-widest ml-1">Mot de Passe</label>
                        <div className="relative">
                            <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                            <input type="password" placeholder="••••••••" className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-16 pr-6 text-gray-900 font-black tracking-widest focus:bg-white focus:ring-8 focus:ring-blue-600/5 outline-none transition-all shadow-inner" value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-700 uppercase tracking-widest ml-1">Attribution Rôle</label>
                        <div className="relative group">
                            <ShieldCheck className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400" />
                            <select className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-16 pr-6 text-gray-900 font-black uppercase text-[10px] tracking-widest focus:bg-white focus:ring-8 focus:ring-blue-600/5 outline-none appearance-none cursor-pointer transition-all shadow-inner" value={userForm.customRoleId} onChange={e => setUserForm({ ...userForm, customRoleId: e.target.value })}>
                                <option value="">Standard Access</option>
                                {roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}
                            </select>
                            <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 rotate-90" />
                        </div>
                    </div>

                    <div className={`p-6 rounded-[2rem] border-2 transition-all cursor-pointer flex items-center justify-between ${userForm.isActive ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`} onClick={() => setUserForm({ ...userForm, isActive: !userForm.isActive })}>
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${userForm.isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}><Check className="w-6 h-6" /></div>
                            <div><p className="text-[10px] font-black text-gray-900 uppercase">Autoriser Accès</p><p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Compte Opérationnel</p></div>
                        </div>
                        <div className={`w-12 h-6 rounded-full relative transition-colors ${userForm.isActive ? 'bg-emerald-500' : 'bg-gray-200'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${userForm.isActive ? 'left-7' : 'left-1'}`}></div></div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button type="button" onClick={() => setShowUserModal(false)} className="flex-1 py-5 bg-white border border-gray-100 text-gray-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-all">Annuler</button>
                        <button type="button" onClick={handleSaveUser} className="flex-[2] py-5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-600/20 hover:scale-[1.02] active:scale-95 transition-all">Valider Habilitation</button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={showRoleModal} onClose={() => setShowRoleModal(false)} title={editingRole ? 'Update Matrice de Sécurité' : 'Maillage des Permissions System'} size="lg">
                <div className="space-y-10 py-4">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-700 uppercase tracking-widest ml-1">Libellé du Profil Métier</label>
                        <input type="text" className="w-full bg-gray-50 border border-gray-200 rounded-[2rem] py-8 text-center text-gray-900 font-black text-4xl focus:bg-white focus:ring-8 focus:ring-blue-600/5 outline-none transition-all shadow-inner" value={roleName} onChange={e => setRoleName(e.target.value)} placeholder="EX: ADMIN_FINANCE" />
                    </div>

                    <div className="space-y-8">
                        {(Object.entries(groupedPermissions) as [string, any[]][]).map(([category, perms]) => (
                            <div key={category} className="space-y-4">
                                <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-blue-600"></div> {category}</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {perms.map(perm => (
                                        <label key={perm.id} className={`flex items-center gap-4 p-5 border-2 rounded-2x transition-all cursor-pointer group ${selectedPermissions.includes(perm.id) ? 'bg-blue-50 border-blue-200 shadow-md' : 'bg-white border-gray-100 hover:border-blue-100'}`}>
                                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${selectedPermissions.includes(perm.id) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-200'}`}>
                                                <input type="checkbox" className="sr-only" checked={selectedPermissions.includes(perm.id)} onChange={() => togglePermission(perm.id)} />
                                                {selectedPermissions.includes(perm.id) && <Check className="w-4 h-4" />}
                                            </div>
                                            <span className={`text-[11px] font-black uppercase tracking-tight ${selectedPermissions.includes(perm.id) ? 'text-blue-900' : 'text-gray-600 group-hover:text-gray-900'}`}>{perm.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-4 pt-6">
                        <button type="button" onClick={() => setShowRoleModal(false)} className="flex-1 py-5 bg-white border border-gray-100 text-gray-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-all">Abandonner</button>
                        <button type="button" onClick={handleSaveRole} className="flex-[2] py-5 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-600/20 hover:scale-[1.02] active:scale-95 transition-all">Appliquer Configuration</button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
