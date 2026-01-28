import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDebounce } from '../hooks/useDebounce'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import {
    Users,
    Plus,
    Eye,
    DollarSign,
    Award,
    Clock,
    TrendingUp,
    TrendingDown,
    Minus,
    Search,
    ChevronLeft,
    ChevronRight,
    AlertCircle,
    CheckCircle,
    Download,
    FileText,
    Calendar
} from 'lucide-react'
import Modal from '../components/Modal'

interface Employee {
    id: string
    firstName: string
    lastName: string
    email?: string
    phone?: string
    position?: string
    department?: string
    baseSalary: number
    paymentDay: number
    image?: string
    cnssNumber?: string
    cin?: string
    bankAccount?: string
    contractDocument?: string
    cnssDocument?: string
    otherDocuments?: string
    isActive: boolean
    hireDate?: string
}

interface MonthlyRecord {
    id: string
    employeeId: string
    month: number
    year: number
    baseSalary: number
    bonuses: number
    deductions: number
    totalSalary: number
    totalPaid: number
    remainingBalance: number
    debtFromPrevious: number
    debtToNext: number
    debtSettled: boolean
    debtSettlementNote?: string
    status: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERPAID'
    isPaid: boolean
    employee?: Employee
    advances?: Advance[]
    adjustments?: Adjustment[]
}

interface Advance {
    id: string
    amount: number
    date: string
    paymentMethod: string
    reason?: string
    notes?: string
}

interface Adjustment {
    id: string
    type: 'BONUS' | 'INCREASE' | 'DECREASE' | 'DEDUCTION'
    amount: number
    reason: string
    date: string
    isPermanent: boolean
}

const MONTHS = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
]

export default function SalariesPage() {
    const navigate = useNavigate()
    const { user } = useAuthStore()
    const [employees, setEmployees] = useState<Employee[]>([])
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
    const [currentRecord, setCurrentRecord] = useState<MonthlyRecord | null>(null)
    const [history, setHistory] = useState<MonthlyRecord[]>([])
    const [loading, setLoading] = useState(true)

    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

    const [showAdvanceModal, setShowAdvanceModal] = useState(false)
    const [showAdjustmentModal, setShowAdjustmentModal] = useState(false)
    const [showDebtModal, setShowDebtModal] = useState(false)
    const [showEmployeeModal, setShowEmployeeModal] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const debouncedSearchQuery = useDebounce(searchQuery, 300)

    const [employeeForm, setEmployeeForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        position: '',
        department: '',
        baseSalary: 0,
        paymentDay: 1,
        hireDate: new Date().toISOString().split('T')[0],
        cnssNumber: '',
        cin: '',
        bankAccount: '',
        image: '',
        contractDocument: '',
        cnssDocument: '',
        otherDocuments: ''
    })

    const [advanceForm, setAdvanceForm] = useState({
        amount: 0,
        paymentMethod: 'ESPECE',
        reason: '',
        notes: ''
    })

    const [adjustmentForm, setAdjustmentForm] = useState({
        type: 'BONUS' as 'BONUS' | 'INCREASE' | 'DECREASE' | 'DEDUCTION',
        amount: 0,
        reason: '',
        isPermanent: false
    })

    const [debtSettlementNote, setDebtSettlementNote] = useState('')

    useEffect(() => {
        if (!user) {
            navigate('/login')
            return
        }
        loadEmployees()
    }, [user, navigate])

    const loadEmployees = async () => {
        try {
            setLoading(true)
            const res = await api.get('/employees')
            setEmployees(res.data || [])
        } catch (error) {
            console.error('Erreur chargement employés:', error)
        } finally {
            setLoading(false)
        }
    }

    const loadEmployeeData = async (employeeId: string) => {
        try {
            // Charger l'enregistrement du mois sélectionné
            const recordRes = await api.get(`/salary-management/monthly-record/${employeeId}/${selectedMonth}/${selectedYear}`)
            setCurrentRecord(recordRes.data)

            // Charger l'historique
            const historyRes = await api.get(`/salary-management/history/${employeeId}`)
            setHistory(historyRes.data || [])
        } catch (error) {
            console.error('Erreur chargement données employé:', error)
        }
    }

    const handleSelectEmployee = (employee: Employee) => {
        setSelectedEmployee(employee)
        loadEmployeeData(employee.id)
    }

    const handleCreateEmployee = async () => {
        try {
            await api.post('/employees', employeeForm)
            setShowEmployeeModal(false)
            resetEmployeeForm()
            loadEmployees()
        } catch (error) {
            console.error('Erreur création employé:', error)
            alert('Erreur lors de la création de l\'employé')
        }
    }

    const resetEmployeeForm = () => {
        setEmployeeForm({
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            position: '',
            department: '',
            baseSalary: 0,
            paymentDay: 1,
            hireDate: new Date().toISOString().split('T')[0],
            cnssNumber: '',
            cin: '',
            bankAccount: '',
            image: '',
            contractDocument: '',
            cnssDocument: '',
            otherDocuments: ''
        })
    }

    const filteredEmployees = employees.filter(emp =>
        emp.isActive && (
            `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
            emp.position?.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
            emp.department?.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
        )
    )

    const handleAddAdvance = async () => {
        if (!selectedEmployee) return
        try {
            await api.post(`/salary-management/advance/${selectedEmployee.id}/${selectedMonth}/${selectedYear}`, advanceForm)
            setShowAdvanceModal(false)
            setAdvanceForm({ amount: 0, paymentMethod: 'ESPECE', reason: '', notes: '' })
            loadEmployeeData(selectedEmployee.id)
        } catch (error) {
            console.error('Erreur ajout avance:', error)
            alert('Erreur lors de l\'ajout de l\'avance')
        }
    }

    const handleAddAdjustment = async () => {
        if (!selectedEmployee) return
        try {
            await api.post(`/salary-management/adjustment/${selectedEmployee.id}/${selectedMonth}/${selectedYear}`, adjustmentForm)
            setShowAdjustmentModal(false)
            setAdjustmentForm({ type: 'BONUS', amount: 0, reason: '', isPermanent: false })
            loadEmployeeData(selectedEmployee.id)
            if (adjustmentForm.isPermanent) {
                loadEmployees()
            }
        } catch (error) {
            console.error('Erreur ajout ajustement:', error)
            alert('Erreur lors de l\'ajout de l\'ajustement')
        }
    }

    const handleSettleDebt = async () => {
        if (!currentRecord) return
        try {
            await api.put(`/salary-management/settle-debt/${currentRecord.id}`, { settlementNote: debtSettlementNote })
            setShowDebtModal(false)
            setDebtSettlementNote('')
            loadEmployeeData(selectedEmployee!.id)
        } catch (error) {
            console.error('Erreur règlement dette:', error)
            alert('Erreur lors du règlement de la dette')
        }
    }

    const getStatusBadge = (status: string) => {
        const badges: Record<string, { color: string; icon: any; label: string }> = {
            PENDING: { color: 'bg-muted/10 text-muted', icon: Clock, label: 'En attente' },
            PARTIAL: { color: 'bg-amber-500/10 text-amber-500', icon: AlertCircle, label: 'Partiel' },
            PAID: { color: 'bg-emerald-500/10 text-emerald-500', icon: CheckCircle, label: 'Payé' },
            OVERPAID: { color: 'bg-rose-500/10 text-rose-500', icon: AlertCircle, label: 'Trop-perçu' }
        }
        const badge = badges[status] || badges.PENDING
        const Icon = badge.icon
        return (
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${badge.color}`}>
                <Icon className="w-3 h-3" />
                {badge.label}
            </span>
        )
    }

    const getAdjustmentIcon = (type: string) => {
        switch (type) {
            case 'BONUS': return <Award className="w-4 h-4 text-green-600" />
            case 'INCREASE': return <TrendingUp className="w-4 h-4 text-blue-600" />
            case 'DECREASE': return <TrendingDown className="w-4 h-4 text-orange-600" />
            case 'DEDUCTION': return <Minus className="w-4 h-4 text-red-600" />
            default: return null
        }
    }

    return (
        <div className="min-h-screen bg-app p-4 transition-colors duration-300">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-4xl font-black text-app mb-2 font-outfit uppercase tracking-tight">
                            💰 Gestion <span className="text-blue-600">des Salaires</span>
                        </h1>
                        <p className="text-muted text-[10px] font-black uppercase tracking-[0.2em]">
                            Système complet de suivi des salaires, avances, primes et dettes
                        </p>
                    </div>
                    <button
                        onClick={() => setShowEmployeeModal(true)}
                        className="px-8 py-4 bg-blue-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-xl shadow-blue-600/20 hover:scale-105 active:scale-95 transition-all"
                    >
                        <Plus className="w-5 h-5 inline mr-2" />
                        Nouvel Employé
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Liste des employés */}
                    <div className="lg:col-span-1">
                        <div className="bg-card rounded-[2.5rem] border border-app shadow-xl overflow-hidden flex flex-col max-h-[800px]">
                            <div className="p-6 bg-blue-600 text-white">
                                <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                                    <Users className="w-5 h-5" />
                                    Collaborateurs ({employees.filter(e => e.isActive).length})
                                </h2>
                            </div>

                            <div className="p-4 border-b border-app">
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                                    <input
                                        type="text"
                                        placeholder="RECHERCHER UN COLLABORATEUR..."
                                        className="w-full bg-app border-none rounded-xl py-3 pl-11 pr-4 text-[10px] font-black uppercase tracking-widest focus:ring-2 focus:ring-blue-600/20 transition-all"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                                        <div className="w-8 h-8 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                                        <p className="text-[10px] font-black text-muted uppercase tracking-widest">Chargement...</p>
                                    </div>
                                ) : filteredEmployees.length === 0 ? (
                                    <div className="text-center py-20">
                                        <Search className="w-12 h-12 mx-auto text-muted/20 mb-4" />
                                        <p className="text-[10px] font-black text-muted uppercase tracking-widest">Aucun résultat</p>
                                    </div>
                                ) : (
                                    filteredEmployees.map(emp => (
                                        <button
                                            key={emp.id}
                                            onClick={() => handleSelectEmployee(emp)}
                                            className={`w-full text-left p-5 rounded-2xl transition-all border-2 group ${selectedEmployee?.id === emp.id
                                                ? 'bg-blue-600/5 border-blue-600/30'
                                                : 'bg-app border-transparent hover:border-blue-600/10 hover:bg-card'
                                                }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-2xl bg-card border border-app flex items-center justify-center text-blue-600 font-black overflow-hidden shadow-sm group-hover:scale-105 transition-transform">
                                                    {emp.image ? (
                                                        <img src={emp.image} alt={emp.firstName} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-lg">{emp.firstName[0]}{emp.lastName[0]}</span>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-black text-app truncate uppercase text-xs tracking-tight">
                                                        {emp.firstName} {emp.lastName}
                                                    </div>
                                                    <div className="text-[10px] text-muted font-bold uppercase tracking-widest truncate mt-0.5">
                                                        {emp.position || 'Collaborateur'}
                                                    </div>
                                                    <div className="text-[11px] font-black text-blue-600 mt-2 flex items-center gap-1">
                                                        {emp.baseSalary.toFixed(3)} <span className="text-[8px] opacity-60">TND/MOIS</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Détails de l'employé sélectionné */}
                    <div className="lg:col-span-2">
                        {!selectedEmployee ? (
                            <div className="bg-card rounded-[2.5rem] border border-app border-dashed p-16 text-center shadow-xl">
                                <Users className="w-20 h-20 mx-auto text-muted/10 mb-6" />
                                <p className="text-muted text-[11px] font-black uppercase tracking-[0.2em]">
                                    Sélectionnez un collaborateur pour piloter ses émoluments
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-6 animate-fade-in">
                                {/* En-tête collaborateur */}
                                <div className="bg-card rounded-[2.5rem] border border-app p-8 shadow-xl relative overflow-hidden group">
                                    <div className="absolute right-0 top-0 w-32 h-32 bg-blue-600/5 rounded-full blur-3xl group-hover:bg-blue-600/10 transition-colors"></div>
                                    <div className="flex justify-between items-start mb-8 relative z-10">
                                        <div>
                                            <h2 className="text-2xl font-black text-app uppercase tracking-tight">
                                                {selectedEmployee?.firstName} <span className="text-blue-600">{selectedEmployee?.lastName}</span>
                                            </h2>
                                            <p className="text-[10px] font-black text-muted uppercase tracking-widest mt-1">
                                                {selectedEmployee?.position || 'Collaborateur'} {selectedEmployee?.department && `• ${selectedEmployee?.department}`}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => navigate(`/dashboard/employees/${selectedEmployee?.id}`)}
                                            className="px-5 py-3 bg-app border border-app text-blue-600 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                        >
                                            <Eye className="w-4 h-4 inline mr-2" />
                                            Profil Complet
                                        </button>
                                    </div>

                                    {/* Sélecteur de période */}
                                    <div className="flex items-center gap-4 relative z-10">
                                        <div className="flex-1 flex items-center bg-app rounded-2xl border border-app p-1">
                                            <button
                                                onClick={() => {
                                                    let newMonth = selectedMonth - 1;
                                                    let newYear = selectedYear;
                                                    if (newMonth < 1) { newMonth = 12; newYear--; }
                                                    setSelectedMonth(newMonth);
                                                    setSelectedYear(newYear);
                                                    setTimeout(() => loadEmployeeData(selectedEmployee!.id), 10);
                                                }}
                                                className="p-3 hover:bg-card rounded-xl transition-all text-muted"
                                            >
                                                <ChevronLeft className="w-5 h-5" />
                                            </button>
                                            <div className="flex-1 text-center font-black text-[10px] uppercase tracking-widest text-app">
                                                {MONTHS[selectedMonth - 1]} {selectedYear}
                                            </div>
                                            <button
                                                onClick={() => {
                                                    let newMonth = selectedMonth + 1;
                                                    let newYear = selectedYear;
                                                    if (newMonth > 12) { newMonth = 1; newYear++; }
                                                    setSelectedMonth(newMonth);
                                                    setSelectedYear(newYear);
                                                    setTimeout(() => loadEmployeeData(selectedEmployee!.id), 10);
                                                }}
                                                className="p-3 hover:bg-card rounded-xl transition-all text-muted"
                                            >
                                                <ChevronRight className="w-5 h-5" />
                                            </button>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button className="px-5 py-4 bg-app border border-app text-app rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-card transition-all flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-blue-600" />
                                                Historique Complet
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Résumé du mois */}
                                {currentRecord && (
                                    <>
                                        <div className="bg-card rounded-[2.5rem] border border-app p-10 shadow-xl relative overflow-hidden">
                                            <div className="absolute inset-0 bg-blue-600/[0.02] pointer-events-none"></div>
                                            <div className="flex justify-between items-start mb-8 relative z-10">
                                                <div>
                                                    <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-1">Résumé Financier</p>
                                                    <h3 className="text-2xl font-black text-app uppercase tracking-tight">
                                                        {MONTHS[selectedMonth - 1]} <span className="text-blue-600">{selectedYear}</span>
                                                    </h3>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <button className="p-3 bg-app border border-app text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm group">
                                                        <FileText className="w-5 h-5" />
                                                    </button>
                                                    <button className="p-3 bg-app border border-app text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm group">
                                                        <Download className="w-5 h-5" />
                                                    </button>
                                                    {getStatusBadge(currentRecord.status)}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10 mb-8">
                                                {[
                                                    { label: 'Salaire Base', value: currentRecord.baseSalary, color: 'text-app', bg: 'bg-app' },
                                                    { label: 'Primes', value: currentRecord.bonuses, color: 'text-emerald-500', bg: 'bg-emerald-500/5', prefix: '+' },
                                                    { label: 'Déductions', value: currentRecord.deductions, color: 'text-rose-500', bg: 'bg-rose-500/5', prefix: '-' },
                                                    { label: 'Total Brut', value: currentRecord.totalSalary, color: 'text-blue-600', bg: 'bg-blue-600/5' }
                                                ].map((item, idx) => (
                                                    <div key={idx} className={`${item.bg} p-5 rounded-2xl border border-app transition-transform hover:scale-105`}>
                                                        <p className="text-[9px] font-black text-muted uppercase tracking-widest mb-2">{item.label}</p>
                                                        <p className={`text-xl font-black ${item.color}`}>
                                                            {item.prefix}{item.value.toFixed(3)}
                                                            <span className="text-[8px] opacity-40 ml-1 font-bold">TND</span>
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="p-8 bg-blue-600 rounded-[2rem] shadow-2xl shadow-blue-600/20 text-white relative group overflow-hidden">
                                                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform"></div>
                                                <div className="flex justify-between items-center mb-6 relative z-10">
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Total Déjà Versé</span>
                                                    <span className="text-2xl font-black">
                                                        {currentRecord.totalPaid.toFixed(3)} <span className="text-xs opacity-60">TND</span>
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center relative z-10 pt-6 border-t border-white/10">
                                                    <span className="text-sm font-black uppercase tracking-widest">Solde Restant</span>
                                                    <div className="text-right">
                                                        <span className="text-4xl font-black tracking-tighter">
                                                            {currentRecord.remainingBalance.toFixed(3)}
                                                        </span>
                                                        <span className="text-xs font-black ml-2 opacity-80">TND</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Dette / Trop-perçu */}
                                            {(currentRecord.debtFromPrevious > 0 || currentRecord.debtToNext > 0) && (
                                                <div className="mt-6 p-6 bg-app rounded-2xl border border-app border-dashed flex flex-col gap-4">
                                                    {currentRecord.debtFromPrevious > 0 && (
                                                        <div className="flex justify-between items-center">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
                                                                <span className="text-[10px] font-black text-muted uppercase tracking-widest">Arriéré mois précédent</span>
                                                            </div>
                                                            <span className="font-black text-rose-500">
                                                                {currentRecord.debtFromPrevious.toFixed(3)} TND
                                                            </span>
                                                        </div>
                                                    )}
                                                    {currentRecord.debtToNext > 0 && (
                                                        <div className="space-y-4">
                                                            <div className="flex justify-between items-center">
                                                                <div className="flex items-center gap-2">
                                                                    <AlertCircle className="w-4 h-4 text-rose-500" />
                                                                    <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Excédent (Reporté au mois suivant)</span>
                                                                </div>
                                                                <span className="text-xl font-black text-rose-500 italic">
                                                                    {currentRecord.debtToNext.toFixed(3)} TND
                                                                </span>
                                                            </div>
                                                            {!currentRecord.debtSettled ? (
                                                                <button
                                                                    onClick={() => setShowDebtModal(true)}
                                                                    className="w-full py-4 bg-rose-500 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-rose-500/20 hover:scale-[1.02] active:scale-95 transition-all"
                                                                >
                                                                    Régulariser cet excédent
                                                                </button>
                                                            ) : (
                                                                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                                                                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center justify-center gap-2">
                                                                        <CheckCircle className="w-4 h-4" /> Dette soldée : {currentRecord.debtSettlementNote}
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions rapides */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <button onClick={() => setShowAdvanceModal(true)} className="group bg-card p-6 rounded-[2rem] border border-app shadow-xl hover:border-emerald-500/30 transition-all hover:-translate-y-1 relative overflow-hidden">
                                                <div className="absolute -right-6 -top-6 w-20 h-20 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10"></div>
                                                <DollarSign className="w-10 h-10 text-emerald-500 mb-4 group-hover:scale-110 transition-transform" />
                                                <div className="font-black text-app uppercase text-xs tracking-tight mb-1">Verser une Avance</div>
                                                <div className="text-[9px] text-muted font-bold uppercase tracking-widest italic">Acompte sur salaire</div>
                                            </button>
                                            <button onClick={() => setShowAdjustmentModal(true)} className="group bg-card p-6 rounded-[2rem] border border-app shadow-xl hover:border-indigo-500/30 transition-all hover:-translate-y-1 relative overflow-hidden">
                                                <div className="absolute -right-6 -top-6 w-20 h-20 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10"></div>
                                                <Award className="w-10 h-10 text-indigo-500 mb-4 group-hover:scale-110 transition-transform" />
                                                <div className="font-black text-app uppercase text-xs tracking-tight mb-1">Ajustement Salaire</div>
                                                <div className="text-[9px] text-muted font-bold uppercase tracking-widest italic">Prime / Sanction / Augm.</div>
                                            </button>
                                        </div>

                                        {/* Listes details */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Avances du mois */}
                                            {currentRecord.advances && currentRecord.advances.length > 0 && (
                                                <div className="bg-card rounded-[2.5rem] border border-app p-8 shadow-xl">
                                                    <h3 className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                                        <DollarSign className="w-4 h-4 text-emerald-500" /> Acomptes Versés ({currentRecord.advances.length})
                                                    </h3>
                                                    <div className="space-y-4">
                                                        {currentRecord.advances.map(adv => (
                                                            <div key={adv.id} className="p-5 bg-app rounded-2xl border border-app flex justify-between items-center group hover:bg-card transition-all">
                                                                <div>
                                                                    <div className="font-black text-app text-sm">
                                                                        {adv.amount.toFixed(3)} <span className="text-[9px] opacity-40 uppercase">tnd</span>
                                                                    </div>
                                                                    <div className="text-[8px] text-muted font-bold uppercase tracking-widest mt-1">
                                                                        {new Date(adv.date).toLocaleDateString()} • {adv.paymentMethod}
                                                                    </div>
                                                                    {adv.reason && (
                                                                        <div className="text-[9px] text-blue-600 font-bold mt-2 uppercase italic">
                                                                            "{adv.reason}"
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                                                    <CheckCircle className="w-4 h-4" />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Ajustements du mois */}
                                            {currentRecord.adjustments && currentRecord.adjustments.length > 0 && (
                                                <div className="bg-card rounded-[2.5rem] border border-app p-8 shadow-xl">
                                                    <h3 className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                                        <TrendingUp className="w-4 h-4 text-indigo-500" /> Ajustements ({currentRecord.adjustments.length})
                                                    </h3>
                                                    <div className="space-y-4">
                                                        {currentRecord.adjustments.map(adj => (
                                                            <div key={adj.id} className="p-5 bg-app rounded-2xl border border-app group hover:bg-card transition-all relative overflow-hidden">
                                                                <div className="flex justify-between items-start mb-3">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-10 h-10 rounded-xl bg-card border border-app flex items-center justify-center">
                                                                            {getAdjustmentIcon(adj.type)}
                                                                        </div>
                                                                        <div>
                                                                            <div className="font-black text-app text-[11px] uppercase tracking-tight">
                                                                                {adj.reason}
                                                                            </div>
                                                                            <div className="text-[8px] text-muted font-black uppercase tracking-tighter">
                                                                                {new Date(adj.date).toLocaleDateString()}
                                                                                {adj.isPermanent && ' • Permanent'}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className={`text-sm font-black ${adj.type === 'BONUS' || adj.type === 'INCREASE'
                                                                        ? 'text-emerald-500'
                                                                        : 'text-rose-500'
                                                                        }`}>
                                                                        {adj.type === 'BONUS' || adj.type === 'INCREASE' ? '+' : '-'}
                                                                        {adj.amount.toFixed(3)}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}

                                {/* Historique */}
                                {history.length > 0 && (
                                    <div className="bg-card rounded-[2.5rem] border border-app p-8 shadow-xl">
                                        <div className="flex justify-between items-center mb-8">
                                            <h3 className="text-[10px] font-black text-app uppercase tracking-[0.3em] flex items-center gap-3">
                                                <Clock className="w-5 h-5 text-blue-600" /> Registre d'Historique
                                            </h3>
                                        </div>
                                        <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar pr-2">
                                            {history.map(record => (
                                                <div key={record.id} className="p-5 bg-app rounded-[1.5rem] border border-app flex items-center justify-between group hover:bg-card transition-all">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-xl bg-card border border-app flex flex-col items-center justify-center shadow-sm">
                                                            <span className="text-[8px] font-black text-muted uppercase">{MONTHS[record.month - 1]?.substring(0, 3)}</span>
                                                            <span className="text-xs font-black text-app">{record.year}</span>
                                                        </div>
                                                        <div>
                                                            <div className="font-black text-app text-xs uppercase tracking-tight">
                                                                {MONTHS[record.month - 1]} {record.year}
                                                            </div>
                                                            <div className="text-[9px] text-muted font-bold mt-1 uppercase tracking-widest leading-none">
                                                                Payé: <span className="text-app">{record.totalPaid.toFixed(3)}</span> / {record.totalSalary.toFixed(3)} TND
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right flex flex-col items-end gap-2">
                                                        {getStatusBadge(record.status)}
                                                        <div className="text-[10px] font-black text-app uppercase tracking-tighter">
                                                            SOLDE: <span className={record.remainingBalance > 0 ? 'text-rose-500' : 'text-emerald-500'}>{record.remainingBalance.toFixed(3)}</span> TND
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal Nouvel Employé */}
            <Modal
                isOpen={showEmployeeModal}
                onClose={() => {
                    setShowEmployeeModal(false)
                    resetEmployeeForm()
                }}
                title="Ajouter un Collaborateur"
                size="lg"
            >
                <div className="space-y-8 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="label-app">Prénom *</label>
                            <input
                                type="text"
                                className="input-app font-bold"
                                value={employeeForm.firstName}
                                onChange={e => setEmployeeForm({ ...employeeForm, firstName: e.target.value })}
                                placeholder="Jean"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="label-app">Nom *</label>
                            <input
                                type="text"
                                className="input-app font-bold"
                                value={employeeForm.lastName}
                                onChange={e => setEmployeeForm({ ...employeeForm, lastName: e.target.value })}
                                placeholder="Dupont"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="label-app">Email</label>
                            <input
                                type="email"
                                className="input-app"
                                value={employeeForm.email}
                                onChange={e => setEmployeeForm({ ...employeeForm, email: e.target.value })}
                                placeholder="jean.dupont@entreprise.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="label-app">Téléphone</label>
                            <input
                                type="text"
                                className="input-app"
                                value={employeeForm.phone}
                                onChange={e => setEmployeeForm({ ...employeeForm, phone: e.target.value })}
                                placeholder="+216 -- --- ---"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="label-app">Poste / Fonction</label>
                            <input
                                type="text"
                                className="input-app font-black uppercase text-xs"
                                value={employeeForm.position}
                                onChange={e => setEmployeeForm({ ...employeeForm, position: e.target.value })}
                                placeholder="EX: DIRECTEUR TECHNIQUE"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="label-app">Département</label>
                            <input
                                type="text"
                                className="input-app"
                                value={employeeForm.department}
                                onChange={e => setEmployeeForm({ ...employeeForm, department: e.target.value })}
                                placeholder="Administration, Ventes, Prod..."
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="label-app">Salaire de Base (TND) *</label>
                            <input
                                type="number"
                                step="0.001"
                                className="input-app font-black text-blue-600"
                                value={employeeForm.baseSalary}
                                onChange={e => setEmployeeForm({ ...employeeForm, baseSalary: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="label-app">Jour de Paiement</label>
                            <input
                                type="number"
                                min="1"
                                max="31"
                                className="input-app"
                                value={employeeForm.paymentDay}
                                onChange={e => setEmployeeForm({ ...employeeForm, paymentDay: parseInt(e.target.value) || 1 })}
                            />
                        </div>
                    </div>

                    <div className="pt-4 flex gap-4">
                        <button
                            onClick={() => setShowEmployeeModal(false)}
                            className="flex-1 py-4 bg-app border border-app text-muted rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-card transition-all"
                        >
                            Annuler
                        </button>
                        <button
                            onClick={handleCreateEmployee}
                            className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-600/20 hover:scale-[1.02] active:scale-95 transition-all"
                        >
                            Enregistrer le Collaborateur
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Modal Avance */}
            <Modal
                isOpen={showAdvanceModal}
                onClose={() => setShowAdvanceModal(false)}
                title="Verser une Avance"
                size="md"
            >
                <div className="space-y-6 animate-fade-in">
                    <div className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-3xl">
                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Employé bénéficiaire</p>
                        <p className="text-xl font-black text-app uppercase">{selectedEmployee?.firstName} {selectedEmployee?.lastName}</p>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="label-app">Montant de l'Acompte (TND) *</label>
                            <div className="relative">
                                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
                                <input
                                    type="number"
                                    step="0.001"
                                    className="input-app pl-12 font-black text-emerald-600 text-2xl"
                                    value={advanceForm.amount}
                                    onChange={e => setAdvanceForm({ ...advanceForm, amount: parseFloat(e.target.value) || 0 })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="label-app">Mode de Règlement</label>
                            <select
                                className="input-app"
                                value={advanceForm.paymentMethod}
                                onChange={e => setAdvanceForm({ ...advanceForm, paymentMethod: e.target.value })}
                            >
                                <option value="ESPECE">Espèces</option>
                                <option value="VIREMENT">Virement Bancaire</option>
                                <option value="CHEQUE">Chèque</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="label-app">Motif / Justification</label>
                            <input
                                type="text"
                                className="input-app"
                                value={advanceForm.reason}
                                onChange={e => setAdvanceForm({ ...advanceForm, reason: e.target.value })}
                                placeholder="Ex: Avance exceptionnelle"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleAddAdvance}
                        className="w-full py-5 bg-emerald-500 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                        Confirmer le Versement
                    </button>
                </div>
            </Modal>

            {/* Modal Ajustement */}
            <Modal
                isOpen={showAdjustmentModal}
                onClose={() => setShowAdjustmentModal(false)}
                title="Ajustement de Salaire"
                size="md"
            >
                <div className="space-y-6 animate-fade-in">
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => setAdjustmentForm({ ...adjustmentForm, type: 'BONUS' })}
                            className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${adjustmentForm.type === 'BONUS' ? 'bg-emerald-500/10 border-emerald-500' : 'bg-app border-app opacity-60'}`}
                        >
                            <Award className={`w-8 h-8 ${adjustmentForm.type === 'BONUS' ? 'text-emerald-500' : 'text-muted'}`} />
                            <span className="text-[10px] font-black uppercase">Prime / Bonus</span>
                        </button>
                        <button
                            onClick={() => setAdjustmentForm({ ...adjustmentForm, type: 'DEDUCTION' })}
                            className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${adjustmentForm.type === 'DEDUCTION' ? 'bg-rose-500/10 border-rose-500' : 'bg-app border-app opacity-60'}`}
                        >
                            <Minus className={`w-8 h-8 ${adjustmentForm.type === 'DEDUCTION' ? 'text-rose-500' : 'text-muted'}`} />
                            <span className="text-[10px] font-black uppercase">Déduction / Prêt</span>
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="label-app">Valeur (TND) *</label>
                            <input
                                type="number"
                                step="0.001"
                                className={`input-app font-black text-2xl ${adjustmentForm.type === 'BONUS' || adjustmentForm.type === 'INCREASE' ? 'text-emerald-500' : 'text-rose-500'}`}
                                value={adjustmentForm.amount}
                                onChange={e => setAdjustmentForm({ ...adjustmentForm, amount: parseFloat(e.target.value) || 0 })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="label-app">Raison de l'Ajustement *</label>
                            <input
                                type="text"
                                className="input-app"
                                value={adjustmentForm.reason}
                                onChange={e => setAdjustmentForm({ ...adjustmentForm, reason: e.target.value })}
                                placeholder="Performance, Retard, Heures Sup..."
                            />
                        </div>

                        <label className="flex items-center gap-3 p-4 bg-app rounded-2xl border border-app cursor-pointer group hover:bg-card transition-all">
                            <div className="relative">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={adjustmentForm.isPermanent}
                                    onChange={e => setAdjustmentForm({ ...adjustmentForm, isPermanent: e.target.checked })}
                                />
                                <div className="w-10 h-6 bg-muted/20 rounded-full peer peer-checked:bg-blue-600 transition-all"></div>
                                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-4"></div>
                            </div>
                            <div>
                                <p className="text-xs font-black text-app uppercase">Ajustement Structurel</p>
                                <p className="text-[9px] text-muted font-bold uppercase">Impacte le salaire de base définitivement</p>
                            </div>
                        </label>
                    </div>

                    <button
                        onClick={handleAddAdjustment}
                        className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/20 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                        Appliquer l'Ajustement
                    </button>
                </div>
            </Modal>

            {/* Modal Dette */}
            <Modal
                isOpen={showDebtModal}
                onClose={() => setShowDebtModal(false)}
                title="Régularisation Excédent"
                size="md"
            >
                <div className="space-y-6 animate-fade-in">
                    <div className="p-8 bg-rose-500 rounded-[2.5rem] text-white shadow-xl shadow-rose-500/20 relative overflow-hidden">
                        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2 leading-none">Montant à régulariser</p>
                        <p className="text-4xl font-black tracking-tighter">
                            {currentRecord?.debtToNext.toFixed(3)} <span className="text-sm opacity-60">TND</span>
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="label-app">Protocole de Règlement *</label>
                        <textarea
                            className="input-app min-h-[120px] pt-4"
                            value={debtSettlementNote}
                            onChange={e => setDebtSettlementNote(e.target.value)}
                            placeholder="Détaillez comment cet excédent a été soldé (Remboursement, Déduction mois suivant...)"
                        />
                    </div>

                    <button
                        onClick={handleSettleDebt}
                        className="w-full py-5 bg-rose-500 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-rose-500/20 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                        Valider le Règlement
                    </button>
                </div>
            </Modal>
        </div>
    )
}
