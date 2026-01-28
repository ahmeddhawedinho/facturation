import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import {
    Plus, Clock, FileText, ShieldCheck, Download, Upload, CheckCircle,
    CreditCard, DollarSign, TrendingUp, ArrowLeft, RefreshCw,
    Edit2, Mail, Phone, Award, Building2, Star, Minus, Printer, Users2
} from 'lucide-react'
import Modal from '../components/Modal'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

interface Employee {
    id: string
    firstName: string
    lastName: string
    email?: string
    phone?: string
    address?: string
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
    employmentStatus: string
    terminationDate?: string
    terminationReason?: string
    isActive: boolean
    hireDate?: string
    monthlyRecords?: any[]
    advances?: any[]
    salaryAdjustments?: any[]
    performanceRatings?: any[]
}

const MONTHS = [
    'JANVIER', 'FÉVRIER', 'MARS', 'AVRIL', 'MAI', 'JUIN',
    'JUILLET', 'AOÛT', 'SEPTEMBRE', 'OCTOBRE', 'NOVEMBRE', 'DÉCEMBRE'
]

const EMPLOYMENT_STATUS = {
    ACTIVE: { label: 'EN POSTE', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
    RESIGNED: { label: 'DÉMISSION', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: Clock },
    TERMINATED: { label: 'RÉVOQUÉ', color: 'bg-red-100 text-red-700 border-red-200', icon: ShieldCheck },
    QUIT: { label: 'SORTIE', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: ArrowLeft },
    SUSPENDED: { label: 'SUSPENDU', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock }
}

export default function EmployeeProfilePage() {
    const navigate = useNavigate()
    const { id } = useParams()
    const { user } = useAuthStore()
    const [employee, setEmployee] = useState<Employee | null>(null)
    const [loading, setLoading] = useState(true)

    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
    const [selectedYear] = useState(new Date().getFullYear())
    const [currentRecord, setCurrentRecord] = useState<any>(null)

    const [showAdvanceModal, setShowAdvanceModal] = useState(false)
    const [showAdjustmentModal, setShowAdjustmentModal] = useState(false)
    const [showRatingModal, setShowRatingModal] = useState(false)
    const [showStatusModal, setShowStatusModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showDocumentModal, setShowDocumentModal] = useState(false)

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

    const [ratingForm, setRatingForm] = useState({
        rating: 10,
        notes: ''
    })

    const [statusForm, setStatusForm] = useState({
        employmentStatus: 'ACTIVE',
        terminationDate: '',
        terminationReason: ''
    })

    const [editForm, setEditForm] = useState<any>({})

    useEffect(() => {
        if (!user) {
            navigate('/login')
            return
        }
        loadEmployee()
    }, [user, navigate, id])

    useEffect(() => {
        if (employee) {
            loadMonthlyRecord()
        }
    }, [selectedMonth, selectedYear, employee])

    const loadEmployee = async () => {
        try {
            setLoading(true)
            const res = await api.get(`/employees/${id}`)
            setEmployee(res.data)
            setEditForm(res.data)
            setStatusForm({
                employmentStatus: res.data.employmentStatus || 'ACTIVE',
                terminationDate: res.data.terminationDate || '',
                terminationReason: res.data.terminationReason || ''
            })
        } catch (error) {
            console.error('Erreur chargement employé:', error)
            alert('Employé non trouvé')
            navigate('/dashboard/salary')
        } finally {
            setLoading(false)
        }
    }

    const loadMonthlyRecord = async () => {
        if (!employee) return
        try {
            const res = await api.get(`/salary-management/monthly-record/${employee.id}/${selectedMonth}/${selectedYear}`)
            setCurrentRecord(res.data)
        } catch (error) {
            console.error('Erreur chargement enregistrement:', error)
        }
    }

    const handleAddAdvance = async () => {
        if (!employee) return
        try {
            await api.post(`/salary-management/advance/${employee.id}/${selectedMonth}/${selectedYear}`, advanceForm)
            setShowAdvanceModal(false)
            setAdvanceForm({ amount: 0, paymentMethod: 'ESPECE', reason: '', notes: '' })
            loadEmployee()
            loadMonthlyRecord()
        } catch (error) {
            console.error('Erreur ajout avance:', error)
            alert('Erreur lors de l\'ajout de l\'avance')
        }
    }

    const handleAddAdjustment = async () => {
        if (!employee) return
        try {
            await api.post(`/salary-management/adjustment/${employee.id}/${selectedMonth}/${selectedYear}`, adjustmentForm)
            setShowAdjustmentModal(false)
            setAdjustmentForm({ type: 'BONUS', amount: 0, reason: '', isPermanent: false })
            loadEmployee()
            loadMonthlyRecord()
        } catch (error) {
            console.error('Erreur ajout ajustement:', error)
            alert('Erreur lors de l\'ajout de l\'ajustement')
        }
    }

    const handleAddRating = async () => {
        if (!employee) return
        try {
            await api.post(`/performance/${employee.id}/${selectedMonth}/${selectedYear}`, ratingForm)
            setShowRatingModal(false)
            setRatingForm({ rating: 10, notes: '' })
            loadEmployee()
        } catch (error) {
            console.error('Erreur ajout notation:', error)
            alert('Erreur lors de l\'ajout de la notation')
        }
    }

    const handleUpdateStatus = async () => {
        if (!employee) return
        try {
            await api.put(`/performance/employee/${employee.id}/status`, statusForm)
            setShowStatusModal(false)
            loadEmployee()
        } catch (error) {
            console.error('Erreur mise à jour statut:', error)
            alert('Erreur lors de la mise à jour du statut')
        }
    }

    const handleUpdate = async () => {
        try {
            await api.put(`/employees/${id}`, editForm)
            setShowEditModal(false)
            loadEmployee()
        } catch (error) {
            console.error('Erreur mise à jour:', error)
            alert('Erreur lors de la mise à jour')
        }
    }

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                const base64 = reader.result as string
                setEditForm({ ...editForm, [field]: base64 })
            }
            reader.readAsDataURL(file)
        }
    }

    const downloadDocument = (doc: string, filename: string) => {
        const link = document.createElement('a')
        link.href = doc
        link.download = filename
        link.click()
    }

    const exportToPDF = () => {
        if (!employee || !currentRecord) return
        const doc = new jsPDF() as any
        doc.setFillColor(30, 41, 59); doc.rect(0, 0, 210, 50, 'F')
        doc.setTextColor(255, 255, 255); doc.setFontSize(28); doc.setFont("helvetica", "bold"); doc.text('FICHE DE RÉMUNÉRATION', 105, 25, { align: 'center' })
        doc.setFontSize(16); doc.setFont("helvetica", "normal"); doc.text(`${MONTHS[selectedMonth - 1]} ${selectedYear}`, 105, 38, { align: 'center' })
        doc.setTextColor(0, 0, 0); doc.setFontSize(12); doc.text(`Collaborateur: ${employee.firstName} ${employee.lastName}`, 14, 65)
        doc.text(`Identifiant: ${employee.id.slice(0, 8)}`, 14, 72); doc.text(`CNSS: ${employee.cnssNumber || 'N/A'}`, 14, 79)
        const summaryData = [['Salaire Contractuel', `${currentRecord.baseSalary.toFixed(3)} TND`], ['Plus-values (Primes)', `+${currentRecord.bonuses.toFixed(3)} TND`], ['Moins-values (Déductions)', `-${currentRecord.deductions.toFixed(3)} TND`], ['Flux Brut Séquençé', `${currentRecord.totalSalary.toFixed(3)} TND`], ['Versé (Anticipé)', `${currentRecord.totalPaid.toFixed(3)} TND`], ['Flux Résiduel', `${currentRecord.remainingBalance.toFixed(3)} TND`]]
        doc.autoTable({ startY: 90, head: [['Indicateur', 'Valeur Algorithmique']], body: summaryData, theme: 'striped', headStyles: { fillColor: [79, 70, 229] } })
        doc.save(`Fiche_${employee.lastName}_${MONTHS[selectedMonth - 1]}_${selectedYear}.pdf`)
    }

    if (loading || !employee) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="w-12 h-12 rounded-full border-4 border-app border-t-blue-600 animate-spin"></div>
                <p className="text-[10px] font-black text-muted uppercase tracking-widest">Chargement du profil...</p>
            </div>
        )
    }

    const currentStatus = EMPLOYMENT_STATUS[employee.employmentStatus as keyof typeof EMPLOYMENT_STATUS] || EMPLOYMENT_STATUS.ACTIVE

    return (
        <div className="min-h-screen bg-app space-y-8 animate-fade-in pb-20">
            {/* Premium Header Profile */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 bg-card p-8 rounded-[2.5rem] border border-app shadow-xl">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => navigate('/dashboard/salary')}
                        className="w-12 h-12 bg-app rounded-2xl flex items-center justify-center border border-app hover:bg-card hover:shadow-md transition-all group scale-90"
                    >
                        <ArrowLeft className="w-5 h-5 text-muted group-hover:text-blue-600 transition-colors" />
                    </button>
                    <div className="w-16 h-16 bg-blue-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-blue-600/20 overflow-hidden relative group">
                        {employee.image ? (
                            <img src={employee.image} alt={employee.firstName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        ) : (
                            <Building2 className="w-8 h-8 text-white" />
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${currentStatus.color.replace('bg-green-100', 'bg-green-500/10').replace('bg-orange-100', 'bg-orange-500/10').replace('bg-red-100', 'bg-red-500/10').replace('bg-gray-100', 'bg-app').replace('bg-yellow-100', 'bg-yellow-500/10')} shadow-sm border border-app`}>
                                {currentStatus.label}
                            </span>
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Fiche Collaborateur</span>
                        </div>
                        <h1 className="text-3xl font-black text-app tracking-tight leading-none uppercase">
                            {employee.firstName} <span className="text-blue-600">{employee.lastName}</span>
                        </h1>
                    </div>
                </div>

                <div className="flex gap-4 w-full lg:w-auto">
                    <button onClick={() => setShowEditModal(true)} className="flex-1 lg:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-card border border-app text-app rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-xl hover:bg-app active:scale-95 transition-all">
                        <Edit2 className="w-4 h-4 text-blue-600" /> Modifier le Profil
                    </button>
                    <button onClick={exportToPDF} className="flex-1 lg:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-2xl font-bold text-[10px] uppercase tracking-widest shadow-xl shadow-blue-600/20 hover:scale-105 active:scale-95 transition-all">
                        <Printer className="w-4 h-4" /> Exporter Fiche
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Sidebar: ID & Documents */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="bg-card rounded-[2.5rem] border border-app p-8 shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full blur-3xl -mr-16 -mt-16 opacity-50 group-hover:scale-150 transition-transform"></div>

                        <div className="relative z-10">
                            <div className="relative mb-6 mx-auto w-32 h-32 rounded-3xl bg-app p-1.5 shadow-inner border border-app overflow-hidden group-hover:scale-105 transition-transform duration-500">
                                <div className="w-full h-full rounded-2xl bg-card overflow-hidden flex items-center justify-center">
                                    {employee.image ? (
                                        <img src={employee.image} alt={employee.firstName} className="w-full h-full object-cover" />
                                    ) : (
                                        <Users2 className="w-12 h-12 text-blue-600/20" />
                                    )}
                                </div>
                            </div>
                            <h2 className="text-xl font-black text-app mb-1 text-center tracking-tight leading-tight uppercase font-outfit">{employee.firstName} <span className="text-blue-600">{employee.lastName}</span></h2>
                            <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-8 text-center">{employee.position || 'Poste Non Défini'}</p>

                            <div className="space-y-3">
                                {[
                                    { icon: Mail, label: 'Email', value: employee.email, color: 'text-blue-500', bg: 'bg-blue-600/5' },
                                    { icon: Phone, label: 'Téléphone', value: employee.phone, color: 'text-emerald-500', bg: 'bg-emerald-600/5' }
                                ].map((item, i) => (
                                    <div key={i} className="p-4 bg-app rounded-2xl border border-app group/item hover:bg-card hover:shadow-md transition-all">
                                        <p className="text-[9px] font-black text-muted uppercase tracking-widest mb-1.5 flex items-center gap-2">
                                            <item.icon className={`w-3 h-3 ${item.color}`} /> {item.label}
                                        </p>
                                        <p className="text-xs font-bold text-app truncate">{item.value || 'Non renseigné'}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-card rounded-[2.5rem] border border-app p-8 shadow-xl relative overflow-hidden group">
                        <h3 className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mb-6 flex items-center gap-2 relative z-10">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" /> Administration
                        </h3>
                        <div className="space-y-4 relative z-10">
                            <div className="flex items-center gap-4 p-4 bg-app rounded-2xl border border-app hover:bg-card hover:shadow-md transition-all">
                                <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center text-blue-600 shadow-inner">
                                    <Building2 className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[8px] font-black text-muted uppercase tracking-widest mb-0.5">CNSS</p>
                                    <p className="text-xs font-black text-app font-mono tracking-widest truncate">{employee.cnssNumber || '---'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-4 bg-app rounded-2xl border border-app hover:bg-card hover:shadow-md transition-all">
                                <div className="w-10 h-10 rounded-xl bg-purple-600/10 flex items-center justify-center text-purple-600 shadow-inner">
                                    <CreditCard className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[8px] font-black text-muted uppercase tracking-widest mb-0.5">CIN</p>
                                    <p className="text-xs font-black text-app font-mono tracking-widest truncate">{employee.cin || '---'}</p>
                                </div>
                            </div>
                            <button onClick={() => setShowDocumentModal(true)} className="w-full mt-2 py-4 bg-blue-600 text-white rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/10 active:scale-95">
                                <FileText className="w-4 h-4" /> Documents RH
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content: Payroll & Activity */}
                <div className="lg:col-span-9 space-y-8">
                    <div className="bg-card rounded-[2.5rem] border border-app p-8 md:p-10 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-[80px] -mr-32 -mt-32 opacity-30"></div>
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                            <div>
                                <p className="text-[10px] font-black text-muted uppercase tracking-widest mb-2">Synthèse Financière</p>
                                <div className="flex items-center gap-3">
                                    <h3 className="text-2xl font-black text-app tracking-tight uppercase">
                                        {MONTHS[selectedMonth - 1]} <span className="text-muted/40">{selectedYear}</span>
                                    </h3>
                                    <div className="flex gap-1">
                                        <button onClick={() => setSelectedMonth(m => m > 1 ? m - 1 : 12)} className="p-1.5 bg-app rounded-lg border border-app text-muted hover:text-blue-600 hover:bg-blue-600/10 transition-colors"><ArrowLeft className="w-4 h-4" /></button>
                                        <button onClick={() => setSelectedMonth(m => m < 12 ? m + 1 : 1)} className="p-1.5 bg-app rounded-lg border border-app text-muted hover:text-blue-600 hover:bg-blue-600/10 transition-colors rotate-180"><ArrowLeft className="w-4 h-4" /></button>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setShowStatusModal(true)} className={`px-4 py-2 rounded-lg border ${currentStatus.color.replace('bg-green-100', 'bg-green-500/10').replace('bg-orange-100', 'bg-orange-500/10').replace('bg-red-100', 'bg-red-500/10').replace('bg-gray-100', 'bg-app').replace('bg-yellow-100', 'bg-yellow-500/10')} font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-2 hover:opacity-80 transition-opacity shadow-sm`}>
                                <RefreshCw className="w-3.5 h-3.5" /> Changer Statut
                            </button>
                        </div>

                        {currentRecord ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                {[
                                    { label: 'Salaire Base', value: currentRecord.baseSalary, color: 'text-app', icon: DollarSign, bg: 'bg-app' },
                                    { label: 'Primes / Bonus', value: currentRecord.bonuses, color: 'text-emerald-500', icon: Plus, bg: 'bg-emerald-500/5', prefix: '+' },
                                    { label: 'Déductions', value: currentRecord.deductions, color: 'text-rose-500', icon: Minus, bg: 'bg-rose-500/5', prefix: '-' }
                                ].map((stat, i) => (
                                    <div key={i} className={`${stat.bg} border border-app rounded-xl p-5 shadow-sm`}>
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-7 h-7 rounded-lg bg-card border border-app flex items-center justify-center text-muted/40">
                                                <stat.icon className="w-3.5 h-3.5" />
                                            </div>
                                            <span className="text-[9px] font-black text-muted uppercase tracking-wider">{stat.label}</span>
                                        </div>
                                        <p className={`text-xl font-black ${stat.color} tracking-tight`}>{stat.prefix}{stat.value.toLocaleString()} <span className="text-[10px] font-medium ml-0.5 uppercase">TND</span></p>
                                    </div>
                                ))}
                                <div className="bg-blue-600 rounded-xl p-5 shadow-xl shadow-blue-600/20">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center text-white">
                                            <Award className="w-3.5 h-3.5" />
                                        </div>
                                        <span className="text-[9px] font-black text-white/90 uppercase tracking-wider">Salaire Net</span>
                                    </div>
                                    <p className="text-2xl font-black text-white tracking-tight leading-none mb-1">{currentRecord.totalSalary.toLocaleString()} <span className="text-[10px] opacity-60">TND</span></p>
                                    <p className="text-[9px] text-white/60 font-bold uppercase tracking-widest italic">Montant Final</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 bg-app rounded-xl border border-app border-dashed mb-8">
                                <RefreshCw className="w-6 h-6 text-muted/20 animate-spin mb-3" />
                                <p className="text-muted/40 font-black uppercase tracking-widest text-[9px]">Calcul des données en cours...</p>
                            </div>
                        )}

                        {currentRecord && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                                <div className="p-6 bg-app rounded-xl border border-app shadow-sm">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="text-[9px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                                            <TrendingUp className="w-3.5 h-3.5" /> État des Versements
                                        </h4>
                                        <span className="text-lg font-black text-app tracking-tight">{currentRecord.totalPaid.toLocaleString()} <span className="text-[10px] text-muted">TND</span></span>
                                    </div>
                                    <div className="h-2 w-full bg-card border border-app rounded-full overflow-hidden mb-3">
                                        <div
                                            className="h-full bg-blue-600 rounded-full transition-all duration-700 shadow-sm"
                                            style={{ width: `${Math.min((currentRecord.totalPaid / currentRecord.totalSalary) * 100, 100)}%` }}
                                        />
                                    </div>
                                    <p className="text-[9px] font-black text-muted flex items-center justify-between uppercase tracking-widest">
                                        Avancement <span>{Math.round((currentRecord.totalPaid / currentRecord.totalSalary) * 100)}%</span>
                                    </p>
                                </div>

                                <div className={`p-6 rounded-xl border shadow-sm ${currentRecord.remainingBalance > 0 ? 'bg-orange-500/5 border-orange-500/20' : 'bg-emerald-500/5 border-emerald-500/20'}`}>
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className={`text-[9px] font-black uppercase tracking-widest ${currentRecord.remainingBalance > 0 ? 'text-orange-500' : 'text-emerald-500'}`}>
                                            {currentRecord.remainingBalance > 0 ? 'Reste à Payer' : 'Solde Régularisé'}
                                        </h4>
                                        <Clock className={`w-4 h-4 ${currentRecord.remainingBalance > 0 ? 'text-orange-500/40' : 'text-emerald-500/40'}`} />
                                    </div>
                                    <div className="flex items-baseline gap-1.5">
                                        <span className={`text-3xl font-black tracking-tight ${currentRecord.remainingBalance > 0 ? 'text-app' : 'text-emerald-500'}`}>
                                            {currentRecord.remainingBalance.toLocaleString()}
                                        </span>
                                        <span className="text-xs font-black text-muted uppercase">TND</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-wrap gap-3">
                            {[
                                { label: 'Ajouter Avance', icon: DollarSign, color: 'bg-emerald-600 hover:bg-emerald-700', action: () => setShowAdvanceModal(true) },
                                { label: 'Ajuster Salaire', icon: TrendingUp, color: 'bg-blue-600 hover:bg-blue-700', action: () => setShowAdjustmentModal(true) },
                                { label: 'Évaluation', icon: Star, color: 'bg-indigo-600 hover:bg-indigo-700', action: () => setShowRatingModal(true) }
                            ].map((btn, i) => (
                                <button key={i} onClick={btn.action} className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 px-5 py-3.5 ${btn.color} text-white rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all shadow-xl active:scale-95`}>
                                    <btn.icon className="w-3.5 h-3.5" /> <span>{btn.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-card rounded-[2.5rem] border border-app p-8 md:p-10 shadow-xl space-y-6">
                        <div className="flex justify-between items-center pb-6 border-b border-app">
                            <div>
                                <h3 className="text-xl font-black text-app tracking-tight uppercase font-outfit">Historique des <span className="text-blue-600">Activités</span></h3>
                                <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1">Transactions et modifications du mois</p>
                            </div>
                            <div className="w-10 h-10 bg-app rounded-xl border border-app flex items-center justify-center text-muted/40">
                                <Clock className="w-5 h-5" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="p-5 bg-blue-600/5 rounded-[2rem] border border-blue-600/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all hover:bg-blue-600/10">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-card border border-blue-600/20 flex items-center justify-center text-xl shadow-sm">💰</div>
                                    <div>
                                        <p className="text-sm font-black text-app tracking-tight uppercase">Salaire de Base</p>
                                        <p className="text-[9px] font-bold text-muted tracking-wider uppercase">{MONTHS[selectedMonth - 1]} {selectedYear}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-black text-blue-600 tracking-tight">{currentRecord?.baseSalary.toFixed(3)} <span className="text-[10px] opacity-60">TND</span></p>
                                </div>
                            </div>

                            {currentRecord && (
                                <>
                                    {currentRecord.advances?.map((adv: any) => (
                                        <div key={adv.id} className="p-5 bg-rose-500/5 rounded-[2rem] border border-rose-500/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all hover:bg-rose-500/10">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-card border border-rose-500/20 flex items-center justify-center text-xl shadow-sm">💸</div>
                                                <div>
                                                    <p className="text-sm font-black text-app tracking-tight uppercase">{adv.reason || 'Avance sur Salaire'}</p>
                                                    <p className="text-[9px] font-bold text-muted tracking-wider uppercase">{new Date(adv.date).toLocaleDateString()} • {adv.paymentMethod}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-black text-rose-500 tracking-tight">-{adv.amount.toFixed(3)} <span className="text-[10px] opacity-60">TND</span></p>
                                            </div>
                                        </div>
                                    ))}

                                    {currentRecord.adjustments?.map((adj: any) => {
                                        const isPlus = adj.type === 'BONUS' || adj.type === 'INCREASE'
                                        const colorClass = isPlus ? 'text-emerald-500' : 'text-orange-500'
                                        const bgClass = isPlus ? 'bg-emerald-500/5' : 'bg-orange-500/5'
                                        const borderColorClass = isPlus ? 'border-emerald-500/10' : 'border-orange-500/10'

                                        return (
                                            <div key={adj.id} className={`p-5 ${bgClass} rounded-[2rem] border ${borderColorClass} flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all hover:opacity-80`}>
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-card border border-app flex items-center justify-center text-xl shadow-sm">
                                                        {adj.type === 'BONUS' ? '🎁' : adj.type === 'INCREASE' ? '📈' : adj.type === 'DECREASE' ? '📉' : '⚠️'}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-app tracking-tight uppercase">{adj.reason}</p>
                                                        <p className="text-[9px] font-bold text-muted tracking-wider uppercase">{new Date(adj.date).toLocaleDateString()} • {adj.type}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`text-lg font-black ${colorClass} tracking-tight`}>{isPlus ? '+' : '-'}{adj.amount.toFixed(3)} <span className="text-[10px] opacity-60">TND</span></p>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </>
                            )}

                            {(!currentRecord?.advances?.length && !currentRecord?.adjustments?.length) && (
                                <div className="text-center py-16 bg-app rounded-[2rem] border border-app border-dashed">
                                    <Clock className="w-8 h-8 text-muted/10 mx-auto mb-4" />
                                    <p className="text-muted/30 font-black uppercase tracking-[0.2em] text-[10px]">Aucun mouvement ce mois-ci</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Simple Modals */}
            <Modal isOpen={showAdvanceModal} onClose={() => setShowAdvanceModal(false)} title="Ajouter une Avance">
                <div className="space-y-6 pt-2">
                    <div className="p-4 bg-blue-600/5 border border-blue-600/10 rounded-xl">
                        <p className="text-[10px] text-blue-600 font-black uppercase tracking-wider flex items-center gap-2 mb-1"><TrendingUp className="w-3 h-3" /> Information</p>
                        <p className="text-muted text-[11px] font-medium leading-relaxed">Le montant sera déduit du prochain versement de salaire net.</p>
                    </div>
                    <div className="space-y-2">
                        <label className="label-app">Montant (TND)</label>
                        <div className="relative group">
                            <input type="number" step="0.001" className="w-full bg-app border border-app text-app text-2xl font-black rounded-xl p-5 outline-none focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all text-center" value={advanceForm.amount} onChange={e => setAdvanceForm({ ...advanceForm, amount: parseFloat(e.target.value) || 0 })} />
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 text-muted font-bold text-[10px] uppercase tracking-widest pointer-events-none">TND</div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="label-app">Mode de Paiement</label>
                            <select className="input-app" value={advanceForm.paymentMethod} onChange={e => setAdvanceForm({ ...advanceForm, paymentMethod: e.target.value })}>
                                <option value="ESPECE">Espèces</option>
                                <option value="VIREMENT">Virement</option>
                                <option value="CHEQUE">Chèque</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="label-app">Motif</label>
                            <input type="text" className="input-app" placeholder="Raison..." value={advanceForm.reason} onChange={e => setAdvanceForm({ ...advanceForm, reason: e.target.value })} />
                        </div>
                    </div>
                    <button onClick={handleAddAdvance} className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-xs shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95 uppercase tracking-widest">Confirmer le Versement</button>
                </div>
            </Modal>

            <Modal isOpen={showAdjustmentModal} onClose={() => setShowAdjustmentModal(false)} title="Ajustement de Salaire">
                <div className="space-y-6 pt-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="label-app">Type</label>
                            <select className="input-app" value={adjustmentForm.type} onChange={e => setAdjustmentForm({ ...adjustmentForm, type: e.target.value as any })}>
                                <option value="BONUS">🎁 Prime / Bonus</option>
                                <option value="INCREASE">📈 Augmentation</option>
                                <option value="DECREASE">📉 Diminution</option>
                                <option value="DEDUCTION">⚠️ Sanction / Déduction</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="label-app">Montant (TND)</label>
                            <input type="number" className="input-app" value={adjustmentForm.amount} onChange={e => setAdjustmentForm({ ...adjustmentForm, amount: parseFloat(e.target.value) || 0 })} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="label-app">Raison de l'ajustement</label>
                        <input type="text" className="input-app" placeholder="Précisez le motif..." value={adjustmentForm.reason} onChange={e => setAdjustmentForm({ ...adjustmentForm, reason: e.target.value })} />
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-app rounded-xl border border-app cursor-pointer group transition-all hover:bg-card" onClick={() => setAdjustmentForm({ ...adjustmentForm, isPermanent: !adjustmentForm.isPermanent })}>
                        <div className={`w-6 h-6 rounded-lg border-2 transition-all flex items-center justify-center ${adjustmentForm.isPermanent ? 'bg-blue-600 border-blue-600 shadow-lg' : 'bg-card border-app group-hover:border-blue-600'}`}>
                            {adjustmentForm.isPermanent && <CheckCircle className="w-4 h-4 text-white" />}
                        </div>
                        <span className="text-[11px] font-black text-muted uppercase tracking-tight group-hover:text-app transition-colors">Appliquer de manière permanente</span>
                    </div>
                    <button onClick={handleAddAdjustment} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 uppercase tracking-widest">Valider l'Ajustement</button>
                </div>
            </Modal>

            {/* Status Modal */}
            {/* Status Modal */}
            <Modal isOpen={showStatusModal} onClose={() => setShowStatusModal(false)} title="Statut de l'Employé">
                <div className="space-y-6 pt-3">
                    <div className="space-y-2">
                        <label className="label-app">Statut Actuel</label>
                        <select className="input-app" value={statusForm.employmentStatus} onChange={e => setStatusForm({ ...statusForm, employmentStatus: e.target.value })}>
                            <option value="ACTIVE">ACTIF (En poste)</option>
                            <option value="SUSPENDED">SUSPENDU (Congé / Pause)</option>
                            <option value="RESIGNED">DÉMISSION (Départ volontaire)</option>
                            <option value="TERMINATED">LICENCIÉ (Fin de contrat)</option>
                        </select>
                    </div>
                    {statusForm.employmentStatus !== 'ACTIVE' && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="space-y-2">
                                <label className="label-app">Date d'effet</label>
                                <input type="date" className="input-app" value={statusForm.terminationDate} onChange={e => setStatusForm({ ...statusForm, terminationDate: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <label className="label-app">Motif du changement</label>
                                <textarea className="input-app min-h-[120px] resize-none" placeholder="Précisez la raison..." value={statusForm.terminationReason} onChange={e => setStatusForm({ ...statusForm, terminationReason: e.target.value })} />
                            </div>
                        </div>
                    )}
                    <button onClick={handleUpdateStatus} className="w-full py-4 bg-app border border-app text-app rounded-xl font-bold text-xs shadow-xl hover:bg-card transition-all active:scale-95 uppercase tracking-widest">Enregistrer le Statut</button>
                </div>
            </Modal>

            {/* Document Modal */}
            <Modal isOpen={showDocumentModal} onClose={() => setShowDocumentModal(false)} title="Gestion des Documents">
                <div className="space-y-4 pt-3">
                    {[
                        { label: 'Contrat d\'Emploi', field: 'contractDocument', icon: FileText, color: 'text-blue-600', folder: 'bg-blue-600/10' },
                        { label: 'Attestation CNSS', field: 'cnssDocument', icon: ShieldCheck, color: 'text-emerald-500', folder: 'bg-emerald-600/10' }
                    ].map((doc, idx) => (
                        <div key={idx} className="p-4 bg-app rounded-2xl border border-app flex items-center justify-between group transition-all hover:bg-card">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 ${doc.folder} rounded-xl flex items-center justify-center ${doc.color} shadow-inner`}>
                                    <doc.icon className="w-6 h-6" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xs font-black text-app uppercase tracking-tight truncate">{doc.label}</p>
                                    <p className={`text-[9px] font-black uppercase tracking-wider ${(employee as any)[doc.field] ? 'text-emerald-500' : 'text-muted/40'}`}>
                                        {(employee as any)[doc.field] ? 'Document Validé' : 'Non fourni'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {(employee as any)[doc.field] && (
                                    <button onClick={() => downloadDocument((employee as any)[doc.field], `${doc.label}.pdf`)} className="p-3 bg-card text-blue-600 rounded-xl border border-app hover:shadow-lg transition-all active:scale-95">
                                        <Download className="w-4 h-4" />
                                    </button>
                                )}
                                <label className="p-3 bg-card text-muted rounded-xl border border-app hover:text-blue-600 hover:border-blue-600 transition-all cursor-pointer active:scale-95 shadow-sm">
                                    <Upload className="w-4 h-4" />
                                    <input type="file" className="hidden" onChange={e => handleImageUpload(e, doc.field)} />
                                </label>
                            </div>
                        </div>
                    ))}
                    {(editForm.contractDocument !== employee.contractDocument || editForm.cnssDocument !== employee.cnssDocument) && (
                        <button onClick={handleUpdate} className="w-full py-4 mt-2 bg-blue-600 text-white rounded-xl font-bold text-xs shadow-xl shadow-blue-600/20 hover:bg-blue-700 active:scale-95 transition-all uppercase tracking-widest">Enregistrer les documents</button>
                    )}
                </div>
            </Modal>

            {/* Rating Modal */}
            <Modal isOpen={showRatingModal} onClose={() => setShowRatingModal(false)} title="Évaluation Mensuelle">
                <div className="space-y-8 pt-4 text-center">
                    <div className="flex justify-center gap-3">
                        {[5, 10, 15, 20].map(val => (
                            <button
                                key={val}
                                onClick={() => setRatingForm({ ...ratingForm, rating: val })}
                                className={`w-16 h-16 rounded-2xl font-black text-xl transition-all border-2 flex items-center justify-center shadow-sm ${ratingForm.rating === val ? 'bg-blue-600 border-blue-600 text-white shadow-blue-600/20 scale-110' : 'bg-app border-app text-muted hover:border-blue-600/50'}`}
                            >
                                {val}
                            </button>
                        ))}
                    </div>
                    <div className="px-4">
                        <input type="range" min="0" max="20" step="0.5" className="w-full h-2 bg-app rounded-full appearance-none cursor-pointer accent-blue-600 border border-app" value={ratingForm.rating} onChange={e => setRatingForm({ ...ratingForm, rating: parseFloat(e.target.value) })} />
                        <div className="text-5xl font-black text-app mt-6 tracking-tighter">{ratingForm.rating}<span className="text-xl text-blue-600 font-bold ml-1">/20</span></div>
                        <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mt-2">Score de performance algorithmique</p>
                    </div>
                    <textarea className="input-app min-h-[120px] resize-none" placeholder="Observations et recommandations..." value={ratingForm.notes} onChange={e => setRatingForm({ ...ratingForm, notes: e.target.value })} />
                    <button onClick={handleAddRating} className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-xs shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition-all active:scale-95 uppercase tracking-widest">Enregistrer l'évaluation</button>
                </div>
            </Modal>

            {/* Profile Edit Modal */}
            <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Mise à jour du Profil">
                <div className="space-y-6 pt-3 h-[60vh] overflow-y-auto pr-4 custom-scrollbar">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="label-app">Prénom</label>
                            <input type="text" className="input-app" value={editForm.firstName} onChange={e => setEditForm({ ...editForm, firstName: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <label className="label-app">Nom</label>
                            <input type="text" className="input-app" value={editForm.lastName} onChange={e => setEditForm({ ...editForm, lastName: e.target.value })} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="label-app">Poste occupé</label>
                        <input type="text" className="input-app" value={editForm.position} onChange={e => setEditForm({ ...editForm, position: e.target.value })} />
                    </div>
                    <div className="pt-4 sticky bottom-0 bg-card">
                        <button onClick={handleUpdate} className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-xs shadow-xl shadow-blue-600/20 uppercase tracking-widest hover:bg-blue-700 transition-all active:scale-95">
                            Enregistrer les Modifications
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}
