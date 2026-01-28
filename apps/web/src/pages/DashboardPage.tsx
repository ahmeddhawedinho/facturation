import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { QuickActions } from '../components/dashboard/QuickActions'
import { AdSection } from '../components/dashboard/AdSection'
import { FileText, Users, Wallet, CreditCard, Activity, Settings, ShoppingBag, TrendingUp, UserPlus, Package, RotateCw } from 'lucide-react'
import { AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export default function DashboardPage() {
    const navigate = useNavigate()
    const { user } = useAuthStore()

    // --- 1. ETATS INDEPENDANTS ---
    const todayStr = new Date().toISOString().split('T')[0];
    const firstDayStr = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    // SALES
    const [salesDates, setSalesDates] = useState({ start: firstDayStr, end: todayStr });
    const [salesData, setSalesData] = useState<any>(null);
    const [selectedClient, setSelectedClient] = useState('');

    // HR
    const [hrDates, setHrDates] = useState({ start: firstDayStr, end: todayStr });
    const [hrData, setHrData] = useState<any>(null);

    // CLIENTS
    const [clientDates, setClientDates] = useState({ start: firstDayStr, end: todayStr });
    const [clientData, setClientData] = useState<any>(null);

    // PURCHASES
    const [purchaseDates, setPurchaseDates] = useState({ start: firstDayStr, end: todayStr });
    const [purchaseData, setPurchaseData] = useState<any>(null);
    const [selectedSupplier, setSelectedSupplier] = useState('');


    // LISTS
    const [clientsList, setClientsList] = useState<any[]>([])
    const [suppliersList, setSuppliersList] = useState<any[]>([])

    // WIDGETS Visibilité
    const [showCustomize, setShowCustomize] = useState(false)
    const [visibleWidgets, setVisibleWidgets] = useState(() => {
        const saved = localStorage.getItem('dashboard_prefs_v3')
        return saved ? JSON.parse(saved) : { hr: true, sales: true, clients: true, purchases: true }
    })

    // --- 2. FETCHERS INDEPENDANTS ---
    const fetchSales = async () => {
        try {
            const q = new URLSearchParams({ startDate: salesDates.start, endDate: salesDates.end, ...(selectedClient ? { clientId: selectedClient } : {}) });
            const res = await api.get(`/dashboard/sales?${q}`);
            setSalesData(res.data);
        } catch (e) { console.error(e) }
    }

    const fetchHR = async () => {
        try {
            const q = new URLSearchParams({ startDate: hrDates.start, endDate: hrDates.end });
            const res = await api.get(`/dashboard/hr?${q}`);
            setHrData(res.data);
        } catch (e) { console.error(e) }
    }

    const fetchClients = async () => {
        try {
            const q = new URLSearchParams({ startDate: clientDates.start, endDate: clientDates.end });
            const res = await api.get(`/dashboard/clients?${q}`);
            setClientData(res.data);
        } catch (e) { console.error(e) }
    }

    const fetchPurchases = async () => {
        try {
            const q = new URLSearchParams({ startDate: purchaseDates.start, endDate: purchaseDates.end, ...(selectedSupplier ? { supplierId: selectedSupplier } : {}) });
            const res = await api.get(`/dashboard/purchases?${q}`);
            setPurchaseData(res.data);
        } catch (e) { console.error(e) }
    }

    // Listes select
    const fetchLists = async () => {
        if (clientsList.length > 0) return;
        try {
            const [cRes, sRes] = await Promise.all([api.get('/clients?limit=100'), api.get('/suppliers?limit=100')]);
            setClientsList(cRes.data.data || cRes.data);
            setSuppliersList(sRes.data.data || sRes.data);
        } catch (e) { console.error(e) }
    }

    // --- 3. EFFECTS ---
    useEffect(() => { if (!user) navigate('/login'); else fetchLists(); }, [user])

    // On fetch quand la date ou le filtre de la section change
    useEffect(() => { if (user) fetchSales(); }, [salesDates, selectedClient, user])
    useEffect(() => { if (user) fetchHR(); }, [hrDates, user])
    useEffect(() => { if (user) fetchClients(); }, [clientDates, user])
    useEffect(() => { if (user) fetchPurchases(); }, [purchaseDates, selectedSupplier, user])

    // Auto-refresh ALL on focus
    useEffect(() => {
        const onFocus = () => { fetchSales(); fetchHR(); fetchClients(); fetchPurchases(); };
        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, [salesDates, selectedClient, hrDates, clientDates, purchaseDates, selectedSupplier])

    useEffect(() => { localStorage.setItem('dashboard_prefs_v3', JSON.stringify(visibleWidgets)) }, [visibleWidgets])

    // --- COMPOSANTS UI ---
    const DateFilter = ({ range, setRange }: any) => (
        <div className="flex items-center gap-1 bg-card border border-app px-2 py-1 rounded-lg shadow-sm">
            <input
                type="date"
                value={range.start}
                onChange={(e) => setRange({ ...range, start: e.target.value })}
                className="bg-transparent border-none text-[10px] font-bold text-app w-20 focus:ring-0 p-0 text-center dark:[color-scheme:dark]"
            />
            <span className="text-muted text-[10px]">→</span>
            <input
                type="date"
                value={range.end}
                onChange={(e) => setRange({ ...range, end: e.target.value })}
                className="bg-transparent border-none text-[10px] font-bold text-app w-20 focus:ring-0 p-0 text-center dark:[color-scheme:dark]"
            />
        </div>
    )

    const StatCard = ({ label, value, sub, icon: Icon, color, bg, unit = '', tooltip }: any) => (
        <div className="bg-card p-6 rounded-[2rem] border border-app shadow-lg shadow-gray-100/5 dark:shadow-none hover:shadow-xl transition-all group relative overflow-hidden" title={tooltip}>
            <div className={`absolute -right-4 -top-4 w-20 h-20 ${bg} rounded-full blur-[40px] opacity-20 dark:opacity-10`}></div>
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className={`w-10 h-10 rounded-xl ${bg} ${color} flex items-center justify-center dark:bg-opacity-20`}>
                    <Icon className="w-5 h-5" />
                </div>
                {sub && <span className="text-[10px] font-black bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 px-2 py-1 rounded-lg uppercase text-muted">{sub}</span>}
            </div>
            <div className="relative z-10">
                <h3 className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">{label}</h3>
                <p className={`text-2xl font-black ${color} dark:brightness-110`}>{typeof value === 'number' ? value.toLocaleString() : value} <span className="text-xs text-gray-400 dark:text-gray-500">{unit}</span></p>
            </div>
        </div>
    )

    const axisStyle = { url: '#9CA3AF', fontSize: 10, fontWeight: 700 };
    const tooltipStyle = { backgroundColor: 'rgba(30, 41, 59, 0.95)', borderColor: '#334155', color: '#F8FAFC', borderRadius: '16px', border: '1px solid', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)' };
    const PIE_COLORS = ['#3b82f6', '#f43f5e'];

    const toggleWidget = (key: string) => setVisibleWidgets((prev: any) => ({ ...prev, [key]: !prev[key] }))


    return (
        <div className="min-h-screen space-y-8 animate-fade-in pb-20 p-4 font-sans text-app bg-transparent">

            {/* Top Bar Config Only */}
            <div className="flex justify-end items-center gap-4 sticky top-4 z-40">
                <button onClick={() => { fetchSales(); fetchHR(); fetchClients(); fetchPurchases() }} className="p-2 rounded-xl border border-app bg-card text-muted hover:text-blue-600 hover:border-blue-600 transition-colors shadow-sm" title="Tout Actualiser">
                    <RotateCw className="w-4 h-4" />
                </button>
                <button onClick={() => setShowCustomize(!showCustomize)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase border transition-colors shadow-sm ${showCustomize ? 'bg-blue-600 text-white border-blue-600' : 'bg-card border-app text-app hover:bg-app'}`}>
                    <Settings className="w-4 h-4" /> Personnaliser
                </button>
            </div>

            {showCustomize && (
                <div className="bg-card p-6 rounded-[2rem] border border-app shadow-xl grid grid-cols-2 md:grid-cols-4 gap-4 animate-in slide-in-from-top-4 mb-8">
                    {Object.keys(visibleWidgets).map(key => (
                        <label key={key} className="flex items-center gap-3 p-2 rounded-lg hover:bg-app cursor-pointer border border-transparent hover:border-app transition-colors">
                            <input type="checkbox" checked={visibleWidgets[key]} onChange={() => toggleWidget(key)} className="rounded text-blue-600 focus:ring-blue-600 border-gray-300 w-4 h-4 bg-app" />
                            <span className="text-xs font-black text-app uppercase">{key === 'hr' ? 'Ressources Humaines' : key === 'sales' ? 'Ventes' : key}</span>
                        </label>
                    ))}
                </div>
            )}

            {/* 1. SALES */}
            {visibleWidgets.sales && salesData && (
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pl-2">
                        <h3 className="text-lg font-black text-app uppercase flex items-center gap-3"><span className="w-1.5 h-6 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/30"></span> Performance Commerciale</h3>
                        <div className="flex items-center gap-4">
                            <select value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)} className="bg-card border border-app rounded-lg text-xs font-bold text-app px-2 py-1 focus:ring-0 max-w-[150px]">
                                <option value="">Tous Clients</option>
                                {clientsList.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <DateFilter range={salesDates} setRange={setSalesDates} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1 grid grid-cols-1 gap-4">
                            <StatCard label="Volume d'Affaires" value={salesData.totalVolume} unit="TND" icon={TrendingUp} color="text-emerald-600" bg="bg-emerald-50" tooltip="Total Validé sur la période" />
                            <StatCard label="Encaissé (Réel)" value={salesData.collectedRevenue} unit="TND" icon={Wallet} color="text-emerald-700 dark:text-emerald-400" bg="bg-emerald-100 dark:bg-emerald-900/30" tooltip="Statut PAYÉ ou Montant reçu" />
                            <StatCard label="Reste à Recouvrer" value={salesData.outstandingRevenue} unit="TND" icon={CreditCard} color="text-rose-600" bg="bg-rose-50" tooltip="Total historique impayé" />
                            <div className="grid grid-cols-2 gap-4">
                                <StatCard label="Devis" value={salesData.quoteCount} icon={FileText} color="text-gray-600 dark:text-gray-300" bg="bg-gray-50 dark:bg-gray-800" />
                                <StatCard label="Factures" value={salesData.invoiceCount} icon={FileText} color="text-gray-600 dark:text-gray-300" bg="bg-gray-50 dark:bg-gray-800" />
                            </div>
                        </div>
                        <div className="lg:col-span-2 bg-card p-6 rounded-[2.5rem] border border-app shadow-lg">
                            <h4 className="text-xs font-black text-muted uppercase tracking-widest mb-6">Flux Financier (6 Mois)</h4>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={salesData.chartData} stackOffset="sign">
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} stroke="currentColor" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} {...axisStyle} stroke="currentColor" />
                                        <YAxis axisLine={false} tickLine={false} {...axisStyle} width={40} stroke="currentColor" />
                                        <Tooltip cursor={{ fill: 'rgba(255,255,255,0.05)' }} contentStyle={tooltipStyle} />
                                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                        <Bar dataKey="collected" name="Encaissé" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} barSize={32} />
                                        <Bar dataKey="outstanding" name="En Cours" stackId="a" fill="#fbbf24" radius={[4, 4, 0, 0]} barSize={32} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. HR */}
            {visibleWidgets.hr && hrData && (
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pl-2">
                        <h3 className="text-lg font-black text-app uppercase flex items-center gap-3"><span className="w-1.5 h-6 bg-indigo-500 rounded-full shadow-lg shadow-indigo-500/30"></span> Ressources Humaines</h3>
                        <DateFilter range={hrDates} setRange={setHrDates} />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-card p-6 rounded-[2.5rem] border border-app shadow-lg order-2 lg:order-1">
                            <h4 className="text-xs font-black text-muted uppercase tracking-widest mb-6">Salaires Nets vs Avances</h4>
                            <div className="h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={hrData.chartData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} stroke="currentColor" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} {...axisStyle} stroke="currentColor" />
                                        <YAxis axisLine={false} tickLine={false} {...axisStyle} width={40} stroke="currentColor" />
                                        <Tooltip contentStyle={tooltipStyle} />
                                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                        <Line type="monotone" dataKey="net" name="Salaire Net" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} />
                                        <Line type="monotone" dataKey="advances" name="Avances" stroke="#ec4899" strokeWidth={3} dot={{ r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        <div className="lg:col-span-1 grid grid-cols-1 gap-4 order-1 lg:order-2">
                            <StatCard label="Masse Salariale" value={hrData.netPayroll} unit="TND" icon={Users} color="text-indigo-600 dark:text-indigo-400" bg="bg-indigo-50 dark:bg-indigo-900/30" />
                            <StatCard label="Total Avances" value={hrData.totalAdvances} unit="TND" icon={Wallet} color="text-pink-600" bg="bg-pink-50" />
                            <StatCard label="Salaire Moyen" value={Math.round(hrData.averageSalary)} unit="TND" icon={Activity} color="text-purple-600" bg="bg-purple-50" />
                        </div>
                    </div>
                </div>
            )}

            {/* 3. CLIENTS */}
            {visibleWidgets.clients && clientData && (
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pl-2">
                        <h3 className="text-lg font-black text-app uppercase flex items-center gap-3"><span className="w-1.5 h-6 bg-blue-500 rounded-full shadow-lg shadow-blue-500/30"></span> Relation Client</h3>
                        <DateFilter range={clientDates} setRange={setClientDates} />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        <StatCard label="Total Clients" value={clientData.totalClients} icon={Users} color="text-blue-600 dark:text-blue-400" bg="bg-blue-50 dark:bg-blue-900/30" />
                        <StatCard label="Nouveaux" value={clientData.newClients} icon={UserPlus} color="text-cyan-600 dark:text-cyan-400" bg="bg-cyan-50 dark:bg-cyan-900/30" />
                        <StatCard label="Panier Moyen" value={Math.round(clientData.averageBasket)} unit="TND" icon={ShoppingBag} color="text-blue-600" bg="bg-blue-50" />
                        <StatCard label="Top Client" value={clientData.topClient.name} sub={`${clientData.topClient.amount.toLocaleString()} TND`} icon={Activity} color="text-amber-600" bg="bg-amber-50" />

                        <div className="lg:col-span-4 bg-card p-6 rounded-[2.5rem] border border-app shadow-lg">
                            <h4 className="text-xs font-black text-muted uppercase tracking-widest mb-6">Acquisition</h4>
                            <div className="h-[200px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={clientData.chartData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} stroke="currentColor" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} {...axisStyle} stroke="currentColor" />
                                        <Tooltip contentStyle={tooltipStyle} />
                                        <Line type="monotone" dataKey="newClients" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. PURCHASES */}
            {visibleWidgets.purchases && purchaseData && (
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pl-2">
                        <h3 className="text-lg font-black text-app uppercase flex items-center gap-3"><span className="w-1.5 h-6 bg-rose-500 rounded-full shadow-lg shadow-rose-500/30"></span> Achats & Fournisseurs</h3>
                        <div className="flex items-center gap-4">
                            <select value={selectedSupplier} onChange={(e) => setSelectedSupplier(e.target.value)} className="bg-card border border-app rounded-lg text-xs font-bold text-app px-2 py-1 focus:ring-0 max-w-[150px]">
                                <option value="">Tous Fournisseurs</option>
                                {suppliersList.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                            <DateFilter range={purchaseDates} setRange={setPurchaseDates} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1 space-y-4">
                            <StatCard label="Dépenses Totales" value={purchaseData.totalExpenses} unit="TND" icon={Package} color="text-rose-600 dark:text-rose-400" bg="bg-rose-50 dark:bg-rose-900/30" />
                            <div className="grid grid-cols-2 gap-4">
                                <StatCard label="Stock" value={purchaseData.stockExpenses} sub={`${Math.round(purchaseData.stockRatio)}%`} icon={Package} color="text-blue-600" bg="bg-blue-50" />
                                <StatCard label="Charges" value={purchaseData.fixedExpenses} sub={`${Math.round(purchaseData.fixedRatio)}%`} icon={FileText} color="text-rose-600" bg="bg-rose-50" />
                            </div>
                        </div>

                        <div className="lg:col-span-2 bg-card p-6 rounded-[2.5rem] border border-app shadow-lg flex flex-col md:flex-row gap-8">
                            <div className="flex-1 flex flex-col items-center justify-center">
                                <h4 className="text-xs font-black text-muted uppercase tracking-widest mb-4">Répartition</h4>
                                <div className="h-[200px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie data={[{ name: 'Stock', value: purchaseData.stockExpenses }, { name: 'Charges', value: purchaseData.fixedExpenses }]} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                                                {PIE_COLORS.map((_, index) => <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />)}
                                            </Pie>
                                            <Tooltip contentStyle={tooltipStyle} />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            <div className="flex-[2]">
                                <h4 className="text-xs font-black text-muted uppercase tracking-widest mb-4">Évolution</h4>
                                <div className="h-[200px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={purchaseData.chartData}>
                                            <defs>
                                                <linearGradient id="colorStock" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient>
                                                <linearGradient id="colorCharge" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1} /><stop offset="95%" stopColor="#f43f5e" stopOpacity={0} /></linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} stroke="currentColor" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} {...axisStyle} stroke="currentColor" />
                                            <Tooltip contentStyle={tooltipStyle} />
                                            <Area type="monotone" dataKey="stock" stroke="#3b82f6" fillOpacity={1} fill="url(#colorStock)" />
                                            <Area type="monotone" dataKey="charges" stroke="#f43f5e" fillOpacity={1} fill="url(#colorCharge)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <QuickActions />
            <AdSection />
        </div>
    )
}
