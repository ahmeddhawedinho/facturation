import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import api from '../../lib/api'
import { useAuthStore } from '../../store/authStore'
import { useThemeStore } from '../../store/themeStore'
import ThemeToggle from '../ThemeToggle'
import {
    LayoutDashboard,
    Users,
    Truck,
    Box,
    Settings,
    LogOut,
    Menu,
    Shield,
    TrendingUp,
    ShoppingCart,
    Download,
    Banknote,
    Search,
    Bell,
    Layers,
    CheckCheck,
    MessageSquare
} from 'lucide-react'
import { useState, useEffect } from 'react'

export default function DashboardLayout() {
    const location = useLocation()
    const { user, logout } = useAuthStore()
    const { theme } = useThemeStore()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [scrolled, setScrolled] = useState(false)
    const [notifications, setNotifications] = useState<any[]>([])
    const [showNotifDropdown, setShowNotifDropdown] = useState(false)
    const navigate = useNavigate()

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications/unread')
            setNotifications(res.data)
        } catch (e) { console.error(e) }
    }

    useEffect(() => {
        fetchNotifications()
        const interval = setInterval(fetchNotifications, 30000)
        return () => clearInterval(interval)
    }, [])

    const handleNotifClick = async (notif: any) => {
        try {
            await api.put(`/notifications/${notif.id}/read`)
            setNotifications(prev => prev.filter(n => n.id !== notif.id))
            setShowNotifDropdown(false)
            if (notif.link) navigate(notif.link)
        } catch (e) { console.error(e) }
    }

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20)
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    useEffect(() => {
        const root = document.documentElement
        root.classList.remove('theme-dark', 'theme-blue')
        if (theme === 'dark') root.classList.add('theme-dark')
        if (theme === 'blue') root.classList.add('theme-blue')
    }, [theme])

    const navigation = [
        { name: 'Tableau de Bord', href: '/dashboard', icon: LayoutDashboard }, // Tout le monde a accès, mais le contenu changera
        { name: 'Ventes', href: '/dashboard/sales', icon: TrendingUp, permission: 'sales:read' },
        { name: 'Achats', href: '/dashboard/purchase', icon: ShoppingCart, permission: 'purchase:read' },
        { name: 'Paie & Salaires', href: '/dashboard/salary', icon: Banknote, permission: 'hr:read' }, // Correction permission
        { name: 'Messagerie', href: '/chat', icon: MessageSquare }, // Ajout ICI
        { name: 'Clients', href: '/dashboard/clients', icon: Users, permission: 'clients:read' },
        { name: 'Fournisseurs', href: '/dashboard/suppliers', icon: Truck, permission: 'suppliers:read' },
        { name: 'Catalogue', href: '/dashboard/products', icon: Box, permission: 'catalog:read' }, // Correction permission
        { name: 'Import / Export', href: '/dashboard/import-export', icon: Download, permission: 'settings:manage' }, // Restreindre
        { name: 'Paramètres', href: '/dashboard/settings', icon: Settings, permission: 'settings:manage' }, // Restreindre
    ]

    const filteredNavigation = navigation.filter(item => {
        if (!item.permission) return true;
        if (user?.role === 'ADMIN') return true;
        const allPerms = [...((user as any)?.permissions || []), ...((user as any)?.customRole?.permissions || [])];
        return allPerms.includes(item.permission);
    });

    const handleLogout = () => { logout(); window.location.href = '/login' }

    return (
        <div className="min-h-screen transition-colors duration-300 overflow-x-hidden font-outfit" style={{ background: 'var(--app-bg)', color: 'var(--app-text)' }}>
            {/* Mobile Backdrop */}
            {sidebarOpen && <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-[100] lg:hidden" onClick={() => setSidebarOpen(false)} />}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 h-full w-64 z-[110] transform transition-transform duration-300 ease-in-out border-r ${sidebarOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full lg:translate-x-0'}`}
                style={{ background: 'var(--app-sidebar)', borderColor: 'var(--app-border)' }}
            >
                <div className="flex flex-col h-full">
                    {/* Brand Identity */}
                    <div className="h-20 flex items-center px-6 border-b" style={{ borderColor: 'var(--app-border)' }}>
                        <Link to="/dashboard" className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-600/20">
                                <Layers className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-black text-lg tracking-tight" style={{ color: 'var(--app-text)' }}>AGENTIC<span className="text-blue-600">ERP</span></span>
                        </Link>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-3 py-6 space-y-0.5 overflow-y-auto custom-scrollbar">
                        <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">Principal</p>

                        {filteredNavigation.map((item) => {
                            const isActive = location.pathname === item.href || (item.href !== '/dashboard' && location.pathname.startsWith(item.href))
                            return (
                                <Link key={item.name} to={item.href} onClick={() => setSidebarOpen(false)}
                                    className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${isActive ? 'bg-blue-600/10 text-blue-600 font-black' : 'text-muted hover:text-app hover:bg-app'}`}>
                                    <item.icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-muted group-hover:text-app'}`} />
                                    <span className="text-sm"> {item.name} </span>
                                </Link>
                            )
                        })}

                        {user?.role === 'ADMIN' && (
                            <div className="mt-8 pt-6 border-t" style={{ borderColor: 'var(--app-border)' }}>
                                <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">Administration</p>
                                <Link to="/dashboard/team" onClick={() => setSidebarOpen(false)}
                                    className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${location.pathname === '/dashboard/team' ? 'bg-purple-600/10 text-purple-600 font-black' : 'text-muted hover:text-app hover:bg-app'}`}>
                                    <Shield className={`w-5 h-5 ${location.pathname === '/dashboard/team' ? 'text-purple-600' : 'text-muted group-hover:text-purple-600'}`} />
                                    <span className="text-sm">Gestion Équipe</span>
                                </Link>
                            </div>
                        )}
                    </nav>

                    {/* User Profile */}
                    <div className="p-4 border-t" style={{ background: 'var(--app-bg)', opacity: 0.9, borderColor: 'var(--app-border)' }}>
                        <div className="flex items-center gap-3 p-2 rounded-xl mb-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-xs shadow-sm">
                                {user?.firstName?.[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold truncate" style={{ color: 'var(--app-text)' }}>{user?.firstName} {user?.lastName}</p>
                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{user?.role}</span>
                            </div>
                        </div>
                        <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border text-gray-500 hover:text-rose-600 hover:border-rose-100 hover:bg-rose-50 transition-all font-bold text-[10px] uppercase tracking-widest" style={{ borderColor: 'var(--app-border)' }}>
                            <LogOut className="w-3.5 h-3.5" /> Déconnexion
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="lg:pl-64 flex flex-col min-h-screen">
                {/* Header */}
                <header
                    className={`h-16 flex items-center justify-between px-6 lg:px-8 sticky top-0 z-[90] transition-all border-b ${scrolled ? 'backdrop-blur-md shadow-sm' : ''}`}
                    style={{ background: 'var(--app-header)', borderColor: 'var(--app-border)' }}
                >
                    <div className="flex items-center gap-4">
                        <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg bg-app text-muted transition-colors"><Menu className="w-5 h-5" /></button>
                        <h1 className="text-sm font-black uppercase tracking-widest hidden sm:block opacity-40" style={{ color: 'var(--app-text)' }}>
                            {navigation.find(i => (location.pathname === i.href || (i.href !== '/dashboard' && location.pathname.startsWith(i.href))))?.name || 'Tableau de Bord'}
                        </h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-2 bg-app rounded-xl px-3 py-1.5 border border-app focus-within:border-blue-600/30 focus-within:bg-card transition-all">
                            <Search className="w-4 h-4 text-muted" />
                            <input type="text" placeholder="Recherche rapide..." className="bg-transparent border-none focus:ring-0 text-sm text-app placeholder:text-muted w-40 font-black uppercase tracking-widest" style={{ color: 'var(--app-text)' }} />
                        </div>

                        <div className="flex items-center gap-1 relative">
                            <button
                                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                                className="p-2 rounded-xl text-muted hover:text-app hover:bg-app transition-all relative"
                            >
                                <Bell className="w-5 h-5" />
                                {notifications.length > 0 && (
                                    <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border border-card shadow-sm animate-pulse"></span>
                                )}
                            </button>

                            {/* Notification Dropdown */}
                            {showNotifDropdown && (
                                <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden z-[200]">
                                    <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-900">Notifications</h4>
                                        {notifications.length > 0 && (
                                            <button onClick={() => {
                                                api.post('/notifications/mark-all-read').then(() => {
                                                    setNotifications([])
                                                    setShowNotifDropdown(false)
                                                })
                                            }} className="text-[9px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                                                Tout marquer lu <CheckCheck className="w-3 h-3" />
                                            </button>
                                        )}
                                    </div>
                                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                                        {notifications.length === 0 ? (
                                            <div className="p-8 text-center">
                                                <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Rien à signaler</p>
                                            </div>
                                        ) : (
                                            notifications.map(notif => (
                                                <div key={notif.id} onClick={() => handleNotifClick(notif)} className="p-4 border-b border-gray-50 hover:bg-blue-50/50 cursor-pointer transition-colors group">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{notif.title}</span>
                                                        <span className="text-[8px] font-bold text-gray-400">{new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                    <p className="text-xs text-gray-600 font-medium line-clamp-2 group-hover:text-gray-900">{notif.message}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}

                            <ThemeToggle />
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 p-6 lg:p-8">
                    <div className="max-w-[1600px] mx-auto">
                        <Outlet />
                    </div>
                </main>

                <footer className="px-8 py-6 border-t flex flex-col sm:flex-row justify-between items-center gap-4 transition-colors" style={{ background: 'var(--app-sidebar)', borderColor: 'var(--app-border)' }}>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Copyright &copy; 2026 AGENTIC ERP</p>
                    <div className="flex gap-6">
                        {['Support', 'Confidentialité', 'Status'].map(item => (
                            <span key={item} className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-blue-600 cursor-pointer transition-colors">{item}</span>
                        ))}
                    </div>
                </footer>
            </div>
        </div>
    )
}
