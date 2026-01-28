import { useEffect, useState } from 'react'
import api from '../lib/api'
import { useDebounce } from '../hooks/useDebounce'
import { Plus, Edit, Trash2, Search, Image as ImageIcon, ArrowUpDown, ShoppingCart, Check, X, Upload, Package, Filter, ChevronRight, LayoutGrid, List, UserPlus, Layers, Briefcase, Info, RefreshCcw, Download } from 'lucide-react'
import Modal from '../components/Modal'
import CatalogRegistries from '../components/CatalogRegistries'

interface Category {
    id: string
    name: string
    subcategories: SubCategory[]
}

interface SubCategory {
    id: string
    name: string
}

interface Attribute {
    id: string
    name: string
    values: string[]
}

interface Supplier {
    id: string
    name: string
}

interface TaxRate {
    id: string
    name: string
    rate: number
    isDefault?: boolean
}

interface ProductVariant {
    id?: string
    title: string
    sku?: string
    priceHT: number
    priceTTC: number
    quantity: number
}

interface Product {
    id: string
    title: string
    description?: string
    image?: string
    categoryId?: string
    categoryRef?: Category
    subcategoryId?: string
    subcategoryRef?: SubCategory
    supplierId?: string
    supplierRef?: Supplier
    purchasePrice?: number
    sellingPrice: number // Main price (usually TTC in this app context, or base price)
    priceTaxFree?: number // HT
    taxRateId?: string
    taxRateRef?: TaxRate
    sku?: string
    quantity: number
    trackStock: boolean
    isVariable: boolean
    variants: ProductVariant[]
}

interface Client {
    id: string
    name: string
}

interface CartItem {
    product: Product
    variant?: ProductVariant
    quantity: number
    unitPrice: number // P.Vente HT
    discount: number
    discountType: 'PERCENT' | 'AMOUNT'
    taxRateId: string
    fodec: boolean
    subtotal: number
    total: number
}

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [attributes, setAttributes] = useState<Attribute[]>([])
    const [clients, setClients] = useState<Client[]>([])
    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const [taxes, setTaxes] = useState<TaxRate[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [showOrderModal, setShowOrderModal] = useState(false)
    const [showRegistries, setShowRegistries] = useState(false)
    const [registriesTab, setRegistriesTab] = useState<'CATEGORIES' | 'ATTRIBUTES'>('CATEGORIES')
    const [showSupplierForm, setShowSupplierForm] = useState(false)

    // Bulk Selection
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [newSupplierData, setNewSupplierData] = useState({
        name: '', email: '', phone: '', address: '', fiscalNumber: ''
    })

    const [editingId, setEditingId] = useState<string | null>(null)

    // Filters & Sorting
    // Filters & Sorting
    const [searchTerm, setSearchTerm] = useState('')
    const debouncedSearchTerm = useDebounce(searchTerm, 500)
    const [categoryFilter, setCategoryFilter] = useState('')
    const [supplierFilter, setSupplierFilter] = useState('')
    const [sortBy, setSortBy] = useState('createdAt')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

    // Sort Options Map
    const sortOptions = [
        { label: 'Date d\'ajout (Récent)', value: 'createdAt_desc' },
        { label: 'Date d\'ajout (Ancien)', value: 'createdAt_asc' },
        { label: 'Alphabétique (A-Z)', value: 'title_asc' },
        { label: 'Alphabétique (Z-A)', value: 'title_desc' },
        { label: 'Prix (Croissant)', value: 'sellingPrice_asc' },
        { label: 'Prix (Décroissant)', value: 'sellingPrice_desc' },
    ]

    const handleSortChange = (val: string) => {
        const [field, order] = val.split('_')
        setSortBy(field)
        setSortOrder(order as 'asc' | 'desc')
    }

    // Cart & Order State
    const [cart, setCart] = useState<CartItem[]>([])
    const [timbreFiscale, setTimbreFiscale] = useState(1.000)
    const [selectedClientId, setSelectedClientId] = useState('')
    const [orderLoading, setOrderLoading] = useState(false)
    const [lastOrder, setLastOrder] = useState<any>(null)
    const [imagePreview, setImagePreview] = useState<string>('')
    const [paymentMethod, setPaymentMethod] = useState('')
    const [notes, setNotes] = useState('')

    // Quick Order - New Client State
    const [isNewClientMode, setIsNewClientMode] = useState(false)
    const [newClientData, setNewClientData] = useState({
        firstName: '', lastName: '', email: '', phone: '', type: 'PROFESSIONAL', companyName: '', legalName: '', fiscalNumber: '', address: '', city: ''
    })

    // Variant Selection State
    const [showVariantModal, setShowVariantModal] = useState(false)
    const [selectedProductForVariant, setSelectedProductForVariant] = useState<Product | null>(null)

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        categoryId: '',
        subcategoryId: '',
        supplierId: '',
        purchasePrice: 0,
        sellingPriceHT: 0,
        sellingPriceTTC: 0,
        taxRateId: '',
        sku: '',
        quantity: 0,
        trackStock: true,
        isVariable: false,
        variants: [] as ProductVariant[]
    })

    useEffect(() => {
        loadData()
    }, [debouncedSearchTerm, categoryFilter, supplierFilter, sortBy, sortOrder])

    const loadData = async () => {
        try {
            setLoading(true)
            const [prodRes, catRes, clientRes, taxRes, suppRes, attrRes] = await Promise.all([
                api.get('/products', {
                    params: {
                        search: debouncedSearchTerm,
                        categoryId: categoryFilter,
                        supplierId: supplierFilter,
                        sortBy,
                        sortOrder
                    }
                }),
                api.get('/products/categories'),
                api.get('/clients'),
                api.get('/tax-rates'),
                api.get('/suppliers'),
                api.get('/products/attributes').catch(() => ({ data: [] })) // Graceful fallback
            ])
            setProducts(prodRes.data || [])
            setCategories(catRes.data || [])
            setClients(clientRes.data || [])
            setTaxes(taxRes.data || [])
            setSuppliers(suppRes.data || [])
            setAttributes(attrRes.data || [])
        } catch (error) {
            console.error('Erreur chargement données:', error)
        } finally {
            setLoading(false)
        }
    }

    // Auto-calculate TTC/HT
    const calculateTTC = (ht: number, taxId: string) => {
        const tax = taxes.find((t: TaxRate) => t.id === taxId)
        if (!tax) return ht
        return ht * (1 + tax.rate / 100)
    }

    const calculateHT = (ttc: number, taxId: string) => {
        const tax = taxes.find((t: TaxRate) => t.id === taxId)
        if (!tax) return ttc
        return ttc / (1 + tax.rate / 100)
    }

    const handlePriceChange = (field: 'HT' | 'TTC', value: number, taxId: string = formData.taxRateId) => {
        if (field === 'HT') {
            const ttc = calculateTTC(value, taxId)
            setFormData(prev => ({ ...prev, sellingPriceHT: value, sellingPriceTTC: ttc, taxRateId: taxId }))
        } else {
            const ht = calculateHT(value, taxId)
            setFormData(prev => ({ ...prev, sellingPriceTTC: value, sellingPriceHT: ht, taxRateId: taxId }))
        }
    }

    const handleTaxChange = (taxId: string) => {
        const ttc = calculateTTC(formData.sellingPriceHT, taxId)
        setFormData(prev => ({ ...prev, taxRateId: taxId, sellingPriceTTC: ttc }))
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = (e) => setImagePreview(e.target?.result as string)
            reader.readAsDataURL(file)
        }
    }

    const handleAddSupplier = async () => {
        if (!newSupplierData.name.trim()) return
        try {
            const res = await api.post('/suppliers', newSupplierData)
            setSuppliers(prev => [...prev, res.data])
            setFormData(prev => ({ ...prev, supplierId: res.data.id }))
            setNewSupplierData({ name: '', email: '', phone: '', address: '', fiscalNumber: '' })
            setShowSupplierForm(false)
        } catch (error) {
            alert('Erreur creation fournisseur')
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.title) return alert('Titre requis')

        try {
            const data = {
                ...formData,
                image: imagePreview || undefined,
                // Map frontend HT/TTC to backend expected fields
                // Backend: sellingPrice (TTC usually), priceTaxFree (HT)
                sellingPrice: formData.sellingPriceTTC,
                priceTaxFree: formData.sellingPriceHT
            }
            if (editingId) await api.put(`/products/${editingId}`, data)
            else await api.post('/products', data)

            loadData()
            setShowModal(false)
            setEditingId(null)
            setImagePreview('')
            setFormData({
                title: '', description: '', categoryId: '', subcategoryId: '',
                supplierId: '', purchasePrice: 0, sellingPriceHT: 0, sellingPriceTTC: 0,
                taxRateId: '', sku: '', quantity: 0, trackStock: true,
                isVariable: false, variants: []
            })
        } catch (error) {
            alert('Erreur lors de la sauvegarde')
        }
    }

    const handleEdit = (product: Product) => {
        setFormData({
            title: product.title || '',
            description: product.description || '',
            categoryId: product.categoryId || '',
            subcategoryId: product.subcategoryId || '',
            supplierId: product.supplierId || '',
            purchasePrice: product.purchasePrice || 0,
            // Map backend fields to frontend state
            sellingPriceHT: product.priceTaxFree || 0,
            sellingPriceTTC: product.sellingPrice || 0,
            taxRateId: product.taxRateId || '',
            sku: product.sku || '',
            quantity: product.quantity || 0,
            trackStock: product.trackStock ?? true,
            isVariable: product.isVariable ?? false,
            variants: product.variants || []
        })
        setImagePreview(product.image || '')
        setEditingId(product.id)
        setShowModal(true)
    }

    const handleAddVariant = () => {
        setFormData(prev => ({
            ...prev,
            variants: [
                ...prev.variants,
                { title: '', sku: '', priceHT: prev.sellingPriceHT, priceTTC: prev.sellingPriceTTC, quantity: 0 }
            ]
        }))
    }

    const updateVariant = (index: number, field: keyof ProductVariant, value: any) => {
        const newVariants = [...formData.variants]
        newVariants[index] = { ...newVariants[index], [field]: value }

        // Handle price sync in variants too
        if (field === 'priceHT') {
            newVariants[index].priceTTC = calculateTTC(value, formData.taxRateId)
        } else if (field === 'priceTTC') {
            newVariants[index].priceHT = calculateHT(value, formData.taxRateId)
        }

        setFormData(prev => ({ ...prev, variants: newVariants }))
    }

    // Bulk Actions
    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds)
        if (newSet.has(id)) newSet.delete(id)
        else newSet.add(id)
        setSelectedIds(newSet)
    }

    const toggleAll = () => {
        if (selectedIds.size === products.length) setSelectedIds(new Set())
        else setSelectedIds(new Set(products.map((p: Product) => p.id)))
    }

    const handleBulkDelete = async () => {
        if (!window.confirm(`Supprimer ${selectedIds.size} articles ?`)) return
        try {
            await Promise.all(Array.from(selectedIds).map(id => api.delete(`/products/${id}`)))
            loadData()
            setSelectedIds(new Set())
        } catch (e) { alert('Erreur suppression massive') }
    }

    const handleBulkExport = () => {
        alert('Export non implémenté (Démo)')
    }

    // Generator State
    const [genAttrId, setGenAttrId] = useState('')
    const [genValues, setGenValues] = useState<string[]>([])

    const handleGenerateVariants = () => {
        if (!genAttrId || genValues.length === 0) return
        const attr = attributes.find(a => a.id === genAttrId)
        if (!attr) return

        const newVariants = genValues.map(val => ({
            title: `${attr.name}: ${val}`,
            sku: `${formData.sku || 'REF'}-${val.toUpperCase().substring(0, 3)}`,
            priceHT: formData.sellingPriceHT,
            priceTTC: formData.sellingPriceTTC,
            quantity: 0
        }))

        setFormData(prev => ({ ...prev, variants: [...prev.variants, ...newVariants] }))
        setGenValues([])
    }



    // Quick order logic stays similar...
    // Quick Order & Cart Logic - SYNCED WITH SALES MODULE
    const calculateLineTotals = (line: CartItem): CartItem => {
        const basePrice = line.quantity * line.unitPrice

        // Discount Calculation (Percent or Fixed Amount per Unit)
        let discountAmount = 0
        if (line.discountType === 'AMOUNT') {
            discountAmount = line.discount * line.quantity
        } else {
            discountAmount = basePrice * (line.discount / 100)
        }

        const subtotal = Math.max(0, basePrice - discountAmount)
        const fodecAmount = line.fodec ? subtotal * 0.01 : 0
        const taxBase = subtotal + fodecAmount

        let taxAmount = 0
        const tax = taxes.find((t: TaxRate) => t.id === line.taxRateId)
        if (tax) taxAmount = taxBase * (tax.rate / 100)

        return { ...line, subtotal, total: taxBase + taxAmount }
    }

    const addToCart = (product: Product, variant?: ProductVariant) => {
        // Validation Stock
        const stockAvailable = variant ? variant.quantity : product.quantity
        if (product.trackStock && stockAvailable <= 0) {
            return alert('Stock épuisé pour cet article')
        }

        if (product.isVariable && !variant) {
            setSelectedProductForVariant(product)
            setShowVariantModal(true)
            return
        }

        // Price Logic: default to Selling Price HT (priceTaxFree) or fallback
        const price = variant ? variant.priceHT : (product.priceTaxFree || product.sellingPrice || 0)

        // Tax Logic
        const taxId = product.taxRateId || taxes.find((t: TaxRate) => t.isDefault)?.id || taxes[0]?.id || ''

        const existingIdx = cart.findIndex((c: CartItem) => c.product.id === product.id && c.variant?.title === variant?.title)

        if (existingIdx > -1) {
            const newCart = [...cart]
            if (product.trackStock && newCart[existingIdx].quantity + 1 > stockAvailable) {
                return alert('Stock insuffisant')
            }
            newCart[existingIdx].quantity += 1
            newCart[existingIdx] = calculateLineTotals(newCart[existingIdx])
            setCart(newCart)
        } else {
            const newItem: CartItem = {
                product,
                variant,
                quantity: 1,
                unitPrice: price,
                discount: 0,
                discountType: 'PERCENT',
                taxRateId: taxId,
                fodec: false,
                subtotal: 0,
                total: 0
            }
            setCart([...cart, calculateLineTotals(newItem)])
        }
        setShowOrderModal(true) // Direct Access to Cart
        setShowVariantModal(false)
    }

    const updateCartItem = (index: number, field: keyof CartItem, value: any) => {
        const newCart = [...cart]

        // Stock Check
        if (field === 'quantity') {
            const item = newCart[index]
            const stock = item.variant ? item.variant.quantity : item.product.quantity
            if (item.product.trackStock && value > stock) {
                return alert(`Stock insuffisant (Max: ${stock})`)
            }
        }

        newCart[index] = { ...newCart[index], [field]: value }
        newCart[index] = calculateLineTotals(newCart[index])
        setCart(newCart)
    }

    const handleCreateClient = async () => {
        let fullName = newClientData.type === 'PROFESSIONAL' ? (newClientData.companyName || `${newClientData.firstName} ${newClientData.lastName}`.trim()) : `${newClientData.firstName} ${newClientData.lastName}`.trim()
        if (!fullName) { alert('Nom requis'); return }
        try {
            const res = await api.post('/clients', { ...newClientData, name: fullName, legalName: newClientData.legalName || fullName })
            setClients([...clients, res.data])
            setSelectedClientId(res.data.id)
            setIsNewClientMode(false)
        } catch (err: any) { alert(err.response?.data?.message || 'Erreur création client') }
    }

    const cartTotals = {
        totalHT: cart.reduce((acc: number, item: CartItem) => acc + item.subtotal, 0),
        totalFodec: cart.reduce((acc: number, item: CartItem) => acc + (item.fodec ? item.subtotal * 0.01 : 0), 0),
        totalTVA: cart.reduce((acc: number, item: CartItem) => acc + (item.total - (item.subtotal + (item.fodec ? item.subtotal * 0.01 : 0))), 0),
        totalTTC: cart.reduce((acc: number, item: CartItem) => acc + item.total, 0) + timbreFiscale
    }

    const createOrder = async () => {
        if (!selectedClientId) return alert('Sélectionnez un client')
        if (cart.length === 0) return
        setOrderLoading(true)
        try {
            // Using correct document structure
            const orderData = {
                type: 'SALES_ORDER',
                clientId: selectedClientId,
                status: 'VALIDATED',
                issueDate: new Date(),
                dueDate: new Date(),
                currency: 'TND',
                timbreFiscal: timbreFiscale,
                paymentMethodId: paymentMethod, // Add payment method
                notes: notes, // Add notes
                lines: cart.map(item => ({
                    productId: item.product.id,
                    productVariantId: item.variant?.id,
                    description: item.product.title + (item.variant ? ` (${item.variant.title})` : ''),
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    discount: item.discountType === 'AMOUNT' ? (item.unitPrice > 0 ? (item.discount / item.unitPrice) * 100 : 0) : item.discount, // Convert Fixed to % for backend
                    taxRateId: item.taxRateId,
                    fodec: item.fodec,
                    subtotal: item.subtotal,
                    total: item.total
                })),
                subtotal: cartTotals.totalHT,
                taxTotal: cartTotals.totalTVA,
                total: cartTotals.totalTTC
            }

            const orderRes = await api.post('/documents', orderData)
            // Auto convert to invoice as per "Quick Sale" logic usually implies immediate sale? 
            // Or just create order? User said "pass direct to cart to pass order". 
            // If it creates an Invoice directly:
            const invoiceRes = await api.post(`/documents/${orderRes.data.id}/convert`)

            setLastOrder({ order: orderRes.data, invoice: invoiceRes.data })
            setCart([])
            setNotes('')
            alert('Commande et Facture générées avec succès !')
        } catch (error) {
            console.error(error)
            alert('Erreur lors de la création de la commande')
        } finally {
            setOrderLoading(false)
        }
    }

    const exportInvoice = async (invoiceId: string) => {
        try {
            const response = await api.get(`/documents/${invoiceId}/pdf`, { responseType: 'blob' })
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Facture_${invoiceId}.pdf`);
            document.body.appendChild(link);
            link.click();
        } catch (e) { alert('Erreur export PDF') }
    }

    const handleExportWoocommerce = async () => {
        try {
            const response = await api.get('/products/export/woocommerce', { responseType: 'blob' })
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `products_woocommerce.csv`);
            document.body.appendChild(link);
            link.click();
        } catch (e) { alert('Erreur export CSV') }
    }

    return (
        <div className="min-h-screen space-y-8 animate-fade-in pb-20" style={{ background: 'transparent' }}>
            {/* Premium Header */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 bg-card p-10 rounded-[2.5rem] border border-app shadow-xl shadow-gray-200/20 relative overflow-hidden transition-colors duration-300">
                <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500 rounded-full blur-[100px] -mr-40 -mt-40 opacity-10"></div>

                <div className="flex items-center gap-6 relative z-10">
                    <div className="w-16 h-16 bg-blue-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-blue-600/20">
                        <Package className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-4xl lg:text-6xl font-black text-app tracking-tighter leading-none uppercase">
                            Catalogue <span className="text-blue-600">Articles</span>
                        </h1>
                        <p className="text-[10px] font-black text-muted uppercase tracking-[0.2em] mt-2 leading-relaxed">
                            Gestion dynamique de <span className="text-blue-600">l'inventaire stratégique</span>.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-6 bg-app p-6 rounded-[2rem] border border-app shadow-inner relative z-10 shrink-0">
                    <div className="w-14 h-14 rounded-2xl bg-card border border-app flex items-center justify-center text-emerald-600 shadow-sm">
                        <Layers className="w-7 h-7" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-muted uppercase tracking-widest leading-none mb-1.5 pl-1">Valeur Stock</p>
                        <p className="text-2xl font-black text-app tracking-tighter">
                            {products.reduce((acc: number, p: Product) => acc + ((p.sellingPrice || 0) * p.quantity), 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-xs text-blue-600 ml-1">TND</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Strategic Actions Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <button
                    onClick={() => { setEditingId(null); setImagePreview(''); setFormData({ title: '', description: '', categoryId: '', subcategoryId: '', supplierId: '', purchasePrice: 0, sellingPriceHT: 0, sellingPriceTTC: 0, taxRateId: taxes.find(t => t.isDefault)?.id || '', sku: '', quantity: 0, trackStock: true, isVariable: false, variants: [] }); setShowModal(true); }}
                    className="group bg-card border border-app p-8 rounded-[2.5rem] shadow-xl hover:shadow-2xl hover:scale-105 hover:border-blue-600 transition-all duration-500 text-left relative overflow-hidden"
                >
                    <div className="w-14 h-14 rounded-2xl bg-blue-600/10 text-blue-600 flex items-center justify-center mb-6 shadow-inner group-hover:rotate-12 transition-transform">
                        <Plus className="w-7 h-7" />
                    </div>
                    <h3 className="text-sm font-black text-app uppercase tracking-tight mb-1 leading-none">Nouveau Article</h3>
                    <p className="text-[8px] font-bold text-muted uppercase tracking-widest leading-tight mb-4 group-hover:text-amber-500 transition-colors">Ajouter une référence</p>
                    <div className="flex items-center gap-2 text-[9px] font-black text-blue-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all">
                        Créer <Plus className="w-3.5 h-3.5" />
                    </div>
                </button>

                <button
                    onClick={() => setShowOrderModal(true)}
                    className="group bg-card border border-app p-8 rounded-[2.5rem] shadow-xl hover:shadow-2xl hover:scale-105 hover:border-emerald-600 transition-all duration-500 text-left relative overflow-hidden"
                >
                    <div className="w-14 h-14 rounded-2xl bg-emerald-600/10 text-emerald-600 flex items-center justify-center mb-6 shadow-inner group-hover:rotate-12 transition-transform">
                        <ShoppingCart className="w-7 h-7" />
                    </div>
                    <h3 className="text-sm font-black text-app uppercase tracking-tight mb-1 leading-none">Vente Directe</h3>
                    <p className="text-[8px] font-bold text-muted uppercase tracking-widest leading-tight mb-4 group-hover:text-emerald-500 transition-colors">Panier & Commande rapide</p>
                    <div className="flex items-center gap-2 text-[9px] font-black text-emerald-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all">
                        Ouvrir <Plus className="w-3.5 h-3.5" />
                    </div>
                </button>

                <button
                    onClick={() => setShowRegistries(true)}
                    className="group bg-card border border-app p-8 rounded-[2.5rem] shadow-xl hover:shadow-2xl hover:scale-105 hover:border-purple-600 transition-all duration-500 text-left relative overflow-hidden"
                >
                    <div className="w-14 h-14 rounded-2xl bg-purple-600/10 text-purple-600 flex items-center justify-center mb-6 shadow-inner group-hover:rotate-12 transition-transform">
                        <Layers className="w-7 h-7" />
                    </div>
                    <h3 className="text-sm font-black text-app uppercase tracking-tight mb-1 leading-none">Registres</h3>
                    <p className="text-[8px] font-bold text-muted uppercase tracking-widest leading-tight mb-4 group-hover:text-purple-500 transition-colors">Catégories & Attributs</p>
                    <div className="flex items-center gap-2 text-[9px] font-black text-purple-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all">
                        Gérer <Plus className="w-3.5 h-3.5" />
                    </div>
                </button>

                <button
                    onClick={handleExportWoocommerce}
                    className="group bg-card border border-app p-8 rounded-[2.5rem] shadow-xl hover:shadow-2xl hover:scale-105 hover:border-orange-600 transition-all duration-500 text-left relative overflow-hidden"
                >
                    <div className="w-14 h-14 rounded-2xl bg-orange-600/10 text-orange-600 flex items-center justify-center mb-6 shadow-inner group-hover:rotate-12 transition-transform">
                        <Download className="w-7 h-7" />
                    </div>
                    <h3 className="text-sm font-black text-app uppercase tracking-tight mb-1 leading-none">Exportation</h3>
                    <p className="text-[8px] font-bold text-muted uppercase tracking-widest leading-tight mb-4 group-hover:text-orange-500 transition-colors">CSV & WooCommerce</p>
                    <div className="flex items-center gap-2 text-[9px] font-black text-orange-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all">
                        Exporter <Plus className="w-3.5 h-3.5" />
                    </div>
                </button>
            </div>

            {/* Modular Filtering System */}
            <div className="bg-card rounded-[2.5rem] border border-app p-8 shadow-xl flex flex-col xl:flex-row gap-6 transition-colors">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="relative group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-blue-600 transition-colors" />
                        <input
                            type="text"
                            placeholder="Recherche rapide..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-app border border-app rounded-2xl py-5 pl-14 pr-10 text-[10px] font-black uppercase tracking-widest text-app outline-none focus:ring-4 focus:ring-blue-600/5 transition-all"
                        />
                    </div>

                    <div className="relative group">
                        <Filter className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-blue-600 transition-colors" />
                        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-full bg-app border border-app rounded-2xl py-5 pl-14 pr-10 text-[10px] font-black uppercase tracking-widest text-app appearance-none outline-none focus:ring-4 focus:ring-blue-600/5 transition-all cursor-pointer">
                            <option value="">Toutes Catégories</option>
                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/30 rotate-90" />
                    </div>

                    <div className="relative group">
                        <Briefcase className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-blue-600 transition-colors" />
                        <select value={supplierFilter} onChange={(e) => setSupplierFilter(e.target.value)} className="w-full bg-app border border-app rounded-2xl py-5 pl-14 pr-10 text-[10px] font-black uppercase tracking-widest text-app appearance-none outline-none focus:ring-4 focus:ring-blue-600/5 transition-all cursor-pointer">
                            <option value="">Tous Fournisseurs</option>
                            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/30 rotate-90" />
                    </div>

                    <div className="relative group">
                        <ArrowUpDown className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-blue-600 transition-colors" />
                        <select value={`${sortBy}_${sortOrder}`} onChange={(e) => handleSortChange(e.target.value)} className="w-full bg-app border border-app rounded-2xl py-5 pl-14 pr-10 text-[10px] font-black uppercase tracking-widest text-app appearance-none outline-none focus:ring-4 focus:ring-blue-600/5 transition-all cursor-pointer">
                            {sortOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                        <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted/30 rotate-90" />
                    </div>
                </div>

                <button onClick={loadData} className="px-10 py-5 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-gray-900/10 active:scale-95 flex items-center justify-center gap-3">
                    <RefreshCcw className="w-4 h-4" /> Actualiser
                </button>
            </div>

            {/* Main Table */}
            <div className="bg-card rounded-[3rem] border border-app shadow-xl overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                <div className="p-8 border-b border-app flex justify-between items-center bg-app/20">
                    <div className="flex items-center gap-4">
                        <h3 className="text-xl font-black text-app uppercase tracking-tight flex items-center gap-4">
                            <List className="w-6 h-6 text-blue-600" /> Registre d'Inventaire
                        </h3>
                        {selectedIds.size > 0 && (
                            <div className="flex items-center gap-2 animate-fade-in-up">
                                <span className="text-[10px] font-black text-muted uppercase tracking-widest bg-app px-3 py-1 rounded-lg">{selectedIds.size} Sélectionnés</span>
                                <button onClick={handleBulkDelete} className="p-2 bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500/20 transition-all"><Trash2 className="w-4 h-4" /></button>
                                <button onClick={handleBulkExport} className="p-2 bg-blue-500/10 text-blue-600 rounded-xl hover:bg-blue-500/20 transition-all"><Download className="w-4 h-4" /></button>
                            </div>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="py-32 flex flex-col items-center gap-4">
                        <div className="w-12 h-12 rounded-full border-4 border-app border-t-blue-600 animate-spin"></div>
                        <p className="text-[10px] font-bold text-muted uppercase tracking-widest animate-pulse">Séquençage du catalogue...</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-[10px] font-black text-muted uppercase tracking-[0.2em] border-b border-app">
                                    <th className="px-6 py-6 w-16">
                                        <div className={`w-5 h-5 rounded-lg border-2 cursor-pointer flex items-center justify-center transition-all ${selectedIds.size === products.length && products.length > 0 ? 'bg-blue-600 border-blue-600' : 'border-app hover:border-blue-600/50'}`} onClick={toggleAll}>
                                            {selectedIds.size === products.length && products.length > 0 && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                    </th>
                                    <th className="px-6 py-6">Désignation</th>
                                    <th className="px-6 py-6 text-center">SKU / Facturation</th>
                                    <th className="px-6 py-6 text-center">Disponibilité</th>
                                    <th className="px-6 py-6 text-right">Valorisation TTC</th>
                                    <th className="px-6 py-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y border-app" style={{ borderColor: 'var(--app-border)' }}>
                                {products.map(p => (
                                    <tr key={p.id} className="hover:bg-app/50 transition-all group border-b border-app" style={{ borderColor: 'var(--app-border)' }}>
                                        <td className="px-6 py-6">
                                            <div className={`w-5 h-5 rounded-lg border-2 cursor-pointer flex items-center justify-center transition-all ${selectedIds.has(p.id) ? 'bg-blue-600 border-blue-600' : 'border-app group-hover:border-blue-600/50'}`} onClick={() => toggleSelection(p.id)}>
                                                {selectedIds.has(p.id) && <Check className="w-3 h-3 text-white" />}
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex items-center gap-5">
                                                <div className="w-14 h-14 rounded-2xl bg-app border border-app shadow-inner overflow-hidden flex items-center justify-center p-1 group-hover:scale-110 transition-transform duration-500">
                                                    {p.image ? <img src={p.image} className="w-full h-full object-cover rounded-xl" /> : <ImageIcon className="w-6 h-6 text-muted opacity-30" />}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-black text-app text-sm tracking-tight group-hover:text-blue-600 transition-colors uppercase">{p.title}</span>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[8px] font-black text-muted uppercase tracking-widest bg-app px-2 py-0.5 rounded-md border border-app">{p.categoryRef?.name || 'NC'}</span>
                                                        {p.supplierRef && <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest">{p.supplierRef.name}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="text-[10px] font-black text-app tracking-widest uppercase">{p.sku || 'N/A'}</span>
                                                <span className="text-[8px] font-black text-muted uppercase tracking-widest mt-0.5">{p.taxRateRef?.rate || 0}% TVA</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            <div className={`px-4 py-2 rounded-2xl inline-flex flex-col items-center justify-center min-w-[80px] border ${p.quantity > 5 ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'}`}>
                                                <span className="text-xl font-black leading-none">{p.quantity}</span>
                                                <span className="text-[8px] font-black uppercase tracking-widest mt-1">Unités</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="font-black text-gray-900 text-lg tracking-tighter">
                                                    {p.isVariable && p.variants?.length ? (
                                                        <span className="text-[10px] text-blue-500 mr-2 uppercase">Dès</span>
                                                    ) : null}
                                                    {(p.sellingPrice || 0).toFixed(3)}
                                                </span>
                                                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">HT: {(p.priceTaxFree || 0).toFixed(3)}</span>
                                            </div>
                                        </td>
                                        <td className="px-10 py-6">
                                            <div className="flex justify-end gap-2 opacity-100 transition-all">
                                                <button onClick={() => addToCart(p)} className="p-3 bg-white text-gray-400 hover:text-emerald-600 rounded-xl border border-gray-100 hover:shadow-md transition-all"><ShoppingCart className="w-4 h-4" /></button>
                                                <button onClick={() => handleEdit(p)} className="p-3 bg-white text-gray-400 hover:text-indigo-600 rounded-xl border border-gray-100 hover:shadow-md transition-all"><Edit className="w-4 h-4" /></button>
                                                <button onClick={async () => { if (window.confirm('Supprimer cet article ?')) { await api.delete(`/products/${p.id}`); loadData(); } }} className="p-3 bg-white text-gray-400 hover:text-rose-600 rounded-xl border border-gray-100 hover:shadow-md transition-all"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ADD PRODUCT MODAL */}
            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? 'Mise à jour Article' : 'Provisionnement Article'} size="xl">
                <form onSubmit={handleSubmit} className="space-y-8 py-4">
                    {/* Identification Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        {/* Photo Column */}
                        <div className="lg:col-span-3">
                            <div className="w-full aspect-square rounded-[2.5rem] bg-gray-50 p-2 border border-gray-200 shadow-inner relative group/photo cursor-pointer overflow-hidden">
                                <div className="w-full h-full rounded-[2.2rem] bg-white border border-dashed border-gray-200 flex flex-col items-center justify-center gap-3 group-hover/photo:border-blue-300 transition-all overflow-hidden relative">
                                    {imagePreview ? (
                                        <img src={imagePreview} className="w-full h-full object-cover group-hover/photo:scale-110 transition-transform duration-700" />
                                    ) : (
                                        <>
                                            <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300">
                                                <ImageIcon className="w-8 h-8" />
                                            </div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Importer Visuel</p>
                                        </>
                                    )}
                                </div>
                                <label className="absolute inset-0 cursor-pointer opacity-0"><input type="file" accept="image/*" onChange={handleImageChange} className="hidden" /></label>
                                <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-xl border-4 border-white">
                                    <Upload className="w-5 h-5" />
                                </div>
                            </div>
                        </div>

                        {/* Main Data Column */}
                        <div className="lg:col-span-9 space-y-6">
                            <div className="p-8 bg-gray-50/50 rounded-[2.5rem] border border-gray-100 shadow-inner space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-700 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                        <Info className="w-3.5 h-3.5 text-blue-600" /> Désignation Commerciale *
                                    </label>
                                    <input type="text" required value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full bg-white border border-gray-200 text-gray-900 rounded-2xl py-4 px-6 font-black text-xl focus:ring-8 focus:ring-blue-600/5 focus:border-blue-600 outline-none transition-all shadow-sm" placeholder="Ex: Macbook Pro M3 Max" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-700 uppercase tracking-[0.2em] ml-1">SKU / Code Référence</label>
                                        <input type="text" value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} className="w-full bg-white border border-gray-200 text-gray-600 rounded-2xl py-4 px-6 font-mono font-bold text-sm focus:ring-8 focus:ring-blue-600/5 outline-none shadow-sm" placeholder="REF-000000" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-700 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                                            <Briefcase className="w-3.5 h-3.5 text-orange-500" /> Partenaire Fournisseur
                                        </label>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1 group">
                                                <select value={formData.supplierId} onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })} className="w-full bg-white border border-gray-200 rounded-2xl py-4 px-6 pr-10 text-[10px] font-black uppercase tracking-widest text-gray-900 appearance-none outline-none focus:ring-8 focus:ring-blue-600/5 transition-all cursor-pointer shadow-sm">
                                                    <option value="">Sélectionner</option>
                                                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                                </select>
                                                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 rotate-90" />
                                            </div>
                                            <button type="button" onClick={() => setShowSupplierForm(!showSupplierForm)} className="p-4 bg-gray-900 text-white rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-gray-900/10">
                                                <UserPlus className="w-5 h-5" />
                                            </button>
                                        </div>
                                        {showSupplierForm && (
                                            <div className="bg-white border-2 border-dashed border-blue-100 rounded-[2rem] p-6 mt-4 space-y-4 animate-fade-in-up">
                                                <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-2">Détails du Nouveau Partenaire</p>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <input type="text" value={newSupplierData.name} onChange={e => setNewSupplierData({ ...newSupplierData, name: e.target.value })} placeholder="Dénomination *" className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold outline-none" />
                                                    <input type="text" value={newSupplierData.fiscalNumber} onChange={e => setNewSupplierData({ ...newSupplierData, fiscalNumber: e.target.value })} placeholder="Matricule Fiscal" className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold outline-none" />
                                                    <input type="email" value={newSupplierData.email} onChange={e => setNewSupplierData({ ...newSupplierData, email: e.target.value })} placeholder="Email Contact" className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold outline-none" />
                                                    <input type="tel" value={newSupplierData.phone} onChange={e => setNewSupplierData({ ...newSupplierData, phone: e.target.value })} placeholder="Téléphone" className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold outline-none" />
                                                    <input type="text" value={newSupplierData.address} onChange={e => setNewSupplierData({ ...newSupplierData, address: e.target.value })} placeholder="Adresse Complète" className="col-span-2 w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs font-bold outline-none" />
                                                </div>
                                                <div className="flex gap-2">
                                                    <button type="button" onClick={handleAddSupplier} className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-100">Enregistrer</button>
                                                    <button type="button" onClick={() => setShowSupplierForm(false)} className="px-6 py-3 bg-gray-100 text-gray-500 rounded-xl text-[10px] font-black uppercase tracking-widest">Annuler</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Structure Section (Moved Up) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="p-8 bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/30 space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.3em] flex items-center gap-3"><LayoutGrid className="w-4 h-4 text-indigo-500" /> Structure de l'Offre</h3>
                                <button type="button" onClick={() => { setRegistriesTab('CATEGORIES'); setShowRegistries(true); }} className="text-[9px] font-black text-blue-600 uppercase tracking-widest hover:underline">Gérer Catégories</button>
                            </div>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-700 uppercase tracking-widest ml-1">Catégorie</label>
                                        <div className="relative"><select value={formData.categoryId} onChange={e => setFormData({ ...formData, categoryId: e.target.value, subcategoryId: '' })} className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 px-6 font-bold text-[10px] uppercase appearance-none outline-none focus:ring-8 focus:ring-blue-600/5 transition-all">{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select><ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 rotate-90" /></div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-gray-700 uppercase tracking-widest ml-1">Sous-Catégorie</label>
                                        <div className="relative"><select value={formData.subcategoryId} onChange={e => setFormData({ ...formData, subcategoryId: e.target.value })} className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 px-6 font-bold text-[10px] uppercase appearance-none outline-none focus:ring-8 focus:ring-blue-600/5 transition-all"><option value="">Standard</option>{categories.find(c => c.id === formData.categoryId)?.subcategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select><ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 rotate-90" /></div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-blue-50/50 rounded-2xl border border-blue-100 cursor-pointer" onClick={() => setFormData(f => ({ ...f, isVariable: !f.isVariable }))}>
                                    <div className="flex items-center gap-3">
                                        <Layers className={`w-5 h-5 transition-colors ${formData.isVariable ? 'text-blue-600' : 'text-gray-300'}`} />
                                        <div><p className="text-[10px] font-black text-gray-900 uppercase">Activer Variations</p><p className="text-[8px] font-bold text-blue-600 uppercase tracking-widest">Gérer tailles, couleurs, options</p></div>
                                    </div>
                                    <div className={`w-12 h-6 rounded-full relative transition-colors ${formData.isVariable ? 'bg-blue-600' : 'bg-gray-200'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.isVariable ? 'left-7' : 'left-1'}`}></div></div>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/30 space-y-6">
                            <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.3em] flex items-center gap-3"><Package className="w-4 h-4 text-blue-600" /> Gestion Logistique</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 cursor-pointer" onClick={() => setFormData(f => ({ ...f, trackStock: !f.trackStock }))}>
                                    <div><p className="text-[10px] font-black text-gray-900 uppercase">SuiviDynamique</p><p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Contrôles des entrées/sorties</p></div>
                                    <div className={`w-12 h-6 rounded-full relative transition-colors ${formData.trackStock ? 'bg-blue-600' : 'bg-gray-200'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${formData.trackStock ? 'left-7' : 'left-1'}`}></div></div>
                                </div>
                                {!formData.isVariable && formData.trackStock && (
                                    <div className="grid grid-cols-1 gap-1 pt-2 animate-fade-in-up">
                                        <label className="text-[9px] font-black text-gray-700 uppercase tracking-widest text-center block mb-1">Stock de Départ</label>
                                        <input type="number" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })} className="w-full bg-gray-50 border border-gray-100 text-gray-900 rounded-2xl py-6 text-center text-4xl font-black focus:bg-white transition-all shadow-inner" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Financial Section (Conditional) */}
                    {!formData.isVariable ? (
                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/50 space-y-8 animate-fade-in">
                            <div className="flex items-center gap-4">
                                <div className="h-8 w-1.5 bg-blue-600 rounded-full"></div>
                                <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.3em]">Protocole de Tarification</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-gray-700 uppercase tracking-widest ml-1">Taxe Appliquée (%)</label>
                                    <div className="relative group">
                                        <select value={formData.taxRateId} onChange={(e) => handleTaxChange(e.target.value)} className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-5 px-6 font-black text-xs appearance-none outline-none focus:bg-white focus:ring-8 focus:ring-blue-600/5 transition-all cursor-pointer shadow-inner">
                                            <option value="">Aucune</option>
                                            {taxes.map(t => <option key={t.id} value={t.id}>{t.name} ({t.rate}%)</option>)}
                                        </select>
                                        <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 rotate-90" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-gray-700 uppercase tracking-widest ml-1">Prix Vente HTVA</label>
                                    <div className="relative">
                                        <input type="number" step="0.001" value={formData.sellingPriceHT} onChange={e => handlePriceChange('HT', parseFloat(e.target.value) || 0)} className="w-full bg-gray-50 border border-gray-100 text-gray-900 rounded-2xl py-5 px-6 font-black text-xl text-center outline-none focus:bg-white transition-all shadow-inner" />
                                        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[9px] font-black text-gray-300">TND</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-blue-600 uppercase tracking-widest ml-1">Prix Vente TTC</label>
                                    <div className="relative">
                                        <input type="number" step="0.001" value={formData.sellingPriceTTC} onChange={e => handlePriceChange('TTC', parseFloat(e.target.value) || 0)} className="w-full bg-blue-50/50 border border-blue-100 text-blue-600 rounded-2xl py-5 px-6 font-black text-xl text-center outline-none focus:bg-white transition-all shadow-inner" />
                                        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[9px] font-black text-blue-300">TND</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-gray-700 uppercase tracking-widest ml-1">Coût d'Achat HT</label>
                                    <div className="relative">
                                        <input type="number" step="0.001" value={formData.purchasePrice} onChange={e => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) || 0 })} className="w-full bg-gray-50 border border-gray-100 text-gray-400 rounded-2xl py-5 px-6 font-black text-xl text-center outline-none focus:bg-white transition-all shadow-inner" />
                                        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[9px] font-black text-gray-300">TND</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white p-8 rounded-[2.5rem] border-2 border-dashed border-blue-100 space-y-8 animate-fade-in-up">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="h-8 w-1.5 bg-blue-600 rounded-full"></div>
                                    <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.3em]">Matrice des Variations</h3>
                                </div>
                                <div className="flex items-center gap-4">
                                    {/* Global Tax for Variants */}
                                    <div className="relative group min-w-[150px]">
                                        <select value={formData.taxRateId} onChange={(e) => handleTaxChange(e.target.value)} className="w-full bg-blue-50/50 border border-blue-100 rounded-xl py-3 px-4 font-black text-[10px] uppercase text-blue-700 appearance-none outline-none">
                                            <option value="">Taxe Globale...</option>
                                            {taxes.map(t => <option key={t.id} value={t.id}>{t.name} ({t.rate}%)</option>)}
                                        </select>
                                        <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-blue-400 rotate-90" />
                                    </div>
                                    <button type="button" onClick={handleAddVariant} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-[9px] uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2 pr-4">
                                        <Plus className="w-4 h-4" /> Ajouter Variante
                                    </button>
                                </div>
                            </div>

                            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 flex flex-col md:flex-row gap-4 items-end">
                                <div className="flex-1 space-y-2 w-full">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Attribut Source</label>
                                        <button type="button" onClick={() => { setRegistriesTab('ATTRIBUTES'); setShowRegistries(true); }} className="text-[8px] font-bold text-blue-600 uppercase tracking-widest hover:underline">Gérer Attributs</button>
                                    </div>
                                    <select value={genAttrId} onChange={(e) => { setGenAttrId(e.target.value); setGenValues([]); }} className="w-full bg-white border border-gray-200 rounded-xl py-3 px-4 font-bold text-xs outline-none">
                                        <option value="">Choisir un attribut...</option>
                                        {attributes.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                    </select>
                                </div>
                                <div className="flex-[2] space-y-2 w-full">
                                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Valeurs à Générer</label>
                                    <div className="flex flex-wrap gap-2 min-h-[46px] p-2 bg-white border border-gray-200 rounded-xl">
                                        {attributes.find((a: Attribute) => a.id === genAttrId)?.values.map((val: string) => (
                                            <div key={val} onClick={() => setGenValues((prev: string[]) => prev.includes(val) ? prev.filter((v: string) => v !== val) : [...prev, val])}
                                                className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase cursor-pointer border select-none transition-all ${genValues.includes(val) ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-50 text-gray-500 border-gray-100 hover:border-blue-200'}`}>
                                                {val}
                                            </div>
                                        ))}
                                        {!genAttrId && <span className="text-[9px] text-gray-300 p-1">Sélectionnez un attribut d'abord</span>}
                                    </div>
                                </div>
                                <button type="button" onClick={handleGenerateVariants} disabled={genValues.length === 0} className="px-6 py-4 bg-gray-900 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 transition-all flex items-center gap-2">
                                    <RefreshCcw className="w-4 h-4" /> Générer
                                </button>
                            </div>

                            <div className="space-y-3">
                                {formData.variants.length === 0 ? (
                                    <div className="py-12 text-center bg-gray-50 rounded-2xl border border-gray-100 transition-all hover:bg-gray-100 cursor-pointer" onClick={handleAddVariant}>
                                        <Layers className="w-10 h-10 text-gray-300 mx-auto mb-4" />
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Aucune variante configurée</p>
                                        <p className="text-[8px] font-bold text-blue-500 uppercase tracking-widest">Cliquez pour ajouter la première variante</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-3">
                                        {formData.variants.map((v, idx) => (
                                            <div key={idx} className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm flex flex-col xl:flex-row items-center gap-4 hover:border-blue-200 transition-all hover:shadow-md">
                                                <div className="flex-[1.5] w-full">
                                                    <label className="text-[8px] font-black text-gray-300 uppercase tracking-widest pl-1 mb-1 block">Désignation Variété</label>
                                                    <input type="text" placeholder="Ex: XL, Rouge" value={v.title} onChange={e => updateVariant(idx, 'title', e.target.value)} className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3 text-xs font-black uppercase tracking-tight focus:ring-2 focus:ring-blue-600/10 transition-all font-mono" />
                                                </div>
                                                <div className="grid grid-cols-3 gap-3 flex-[3] w-full">
                                                    <div className="relative group">
                                                        <label className="text-[8px] font-black text-gray-300 uppercase tracking-widest pl-1 mb-1 block">Prix HT</label>
                                                        <input type="number" placeholder="0.000" value={v.priceHT} onChange={e => updateVariant(idx, 'priceHT', parseFloat(e.target.value) || 0)} className="w-full bg-gray-50 border-0 rounded-xl pl-4 pr-8 py-3 text-xs font-black text-center focus:bg-white focus:ring-2 focus:ring-blue-600/5 transition-all" />
                                                    </div>
                                                    <div className="relative group">
                                                        <label className="text-[8px] font-black text-blue-200 uppercase tracking-widest pl-1 mb-1 block">Prix TTC</label>
                                                        <input type="number" placeholder="0.000" value={v.priceTTC} onChange={e => updateVariant(idx, 'priceTTC', parseFloat(e.target.value) || 0)} className="w-full bg-blue-50/50 border-0 rounded-xl pl-4 pr-8 py-3 text-xs font-black text-blue-600 text-center focus:bg-white focus:ring-2 focus:ring-blue-600/10 transition-all" />
                                                    </div>
                                                    <div className="relative group">
                                                        <label className="text-[8px] font-black text-gray-300 uppercase tracking-widest pl-1 mb-1 block">Stock</label>
                                                        <input type="number" placeholder="0" value={v.quantity} onChange={e => updateVariant(idx, 'quantity', parseFloat(e.target.value) || 0)} className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3 text-xs font-black text-gray-700 text-center focus:bg-white focus:ring-2 focus:ring-blue-600/5 transition-all" />
                                                    </div>
                                                </div>
                                                <button type="button" onClick={() => setFormData(f => ({ ...f, variants: f.variants.filter((_, i) => i !== idx) }))} className="p-3 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><X className="w-4 h-4" /></button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Action Bar */}
                    <div className="flex gap-4 pt-6">
                        <button type="button" onClick={() => setShowModal(false)} className="px-10 py-5 bg-white border border-gray-100 text-gray-400 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-gray-50 transition-all">Abandonner</button>
                        <button type="submit" className="flex-1 py-5 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-gray-900/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-4">
                            <Check className="w-5 h-5 text-blue-500" /> Finaliser l'Indexation
                        </button>
                    </div>
                </form>
            </Modal>

            {/* QUICK ORDER MODAL (SIMILAR REFINEMENT) */}
            <Modal isOpen={showOrderModal} onClose={() => setShowOrderModal(false)} title="Vente Directe / Panier" size="lg">
                <div className="space-y-8 py-4">
                    {lastOrder ? (
                        <div className="py-12 text-center bg-emerald-50 rounded-[2.5rem] border border-emerald-100 animate-fade-in">
                            <div className="w-20 h-20 bg-white rounded-full shadow-xl flex items-center justify-center mx-auto mb-6 border border-emerald-200">
                                <Check className="w-10 h-10 text-emerald-600" />
                            </div>
                            <h3 className="text-3xl font-black text-gray-900 mb-2 uppercase tracking-tighter">Transaction Réussie</h3>
                            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-10">La commande #{lastOrder.order.number} a été synchronisée.</p>
                            <div className="flex flex-col sm:flex-row justify-center gap-4 px-10">
                                <button onClick={() => exportInvoice(lastOrder.invoice.id)} className="flex-1 py-5 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 transition-all">Télécharger Facture PDF</button>
                                <button onClick={() => { setLastOrder(null); setShowOrderModal(false); }} className="flex-1 py-5 bg-white text-gray-700 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-gray-200 hover:bg-gray-50 transition-all">Retour au Catalogue</button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Client Setup */}
                            {!isNewClientMode ? (
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[10px] font-black text-gray-700 uppercase tracking-widest ml-1">Entité Bénéficiaire (Client)</label>
                                        <button onClick={() => setIsNewClientMode(true)} className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:bg-blue-50 px-3 py-1 rounded-lg transition-colors">+ Nouveau Client</button>
                                    </div>
                                    <div className="relative group">
                                        <select value={selectedClientId} onChange={(e) => setSelectedClientId(e.target.value)} className="w-full bg-gray-50 border border-gray-100 text-gray-900 rounded-2xl py-5 px-6 pr-10 font-black text-xs uppercase tracking-widest appearance-none outline-none focus:bg-white focus:ring-8 focus:ring-blue-600/5 transition-all cursor-pointer shadow-inner">
                                            <option value="">Sélectionner un partenaire commercial...</option>
                                            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                        <ChevronRight className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 rotate-90" />
                                    </div>
                                </div>
                            ) : (
                                <div className="p-6 bg-blue-50 rounded-[2rem] border border-blue-100 space-y-4 animate-fade-in-up">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-[10px] font-black text-blue-800 uppercase tracking-widest">Nouveau Partenaire</h4>
                                        <button onClick={() => setIsNewClientMode(false)} className="p-2 text-blue-400 hover:text-blue-800"><X className="w-4 h-4" /></button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <input className="col-span-2 w-full p-4 rounded-xl text-xs font-bold border border-blue-200 outline-none focus:border-blue-500" placeholder="Raison Sociale" value={newClientData.companyName} onChange={e => setNewClientData({ ...newClientData, companyName: e.target.value })} />
                                        <input className="w-full p-4 rounded-xl text-xs font-bold border border-blue-200 outline-none focus:border-blue-500" placeholder="Matricule Fiscal" value={newClientData.fiscalNumber} onChange={e => setNewClientData({ ...newClientData, fiscalNumber: e.target.value })} />
                                        <input className="w-full p-4 rounded-xl text-xs font-bold border border-blue-200 outline-none focus:border-blue-500" placeholder="Téléphone" value={newClientData.phone} onChange={e => setNewClientData({ ...newClientData, phone: e.target.value })} />
                                    </div>
                                    <button onClick={handleCreateClient} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-blue-700 transition-all">Enregistrer le Partenaire</button>
                                </div>
                            )}

                            {/* Payment Method & Notes */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-700 uppercase tracking-widest ml-1">Moyen de Paiement</label>
                                    <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full bg-gray-50 border border-gray-100 text-gray-900 rounded-xl py-4 px-4 font-bold text-xs uppercase outline-none focus:border-blue-500">
                                        <option value="">Non Défini</option>
                                        <option value="CASH">Espèces</option>
                                        <option value="CHECK">Chèque</option>
                                        <option value="TRANSFER">Virement</option>
                                        <option value="OTHER">Autre / Mixte (Voir Notes)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-700 uppercase tracking-widest ml-1">Notes / Réglement</label>
                                    <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Détails du paiement..." className="w-full bg-gray-50 border border-gray-100 text-gray-900 rounded-xl py-4 px-4 font-bold text-xs outline-none focus:border-blue-500" />
                                </div>
                            </div>


                            <div className="bg-gray-50 rounded-[2rem] border border-gray-100 p-6 max-h-[50vh] overflow-y-auto custom-scrollbar shadow-inner">
                                {cart.length === 0 ? (
                                    <div className="py-20 text-center opacity-40">
                                        <ShoppingCart className="w-14 h-14 text-gray-200 mx-auto mb-4" />
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Panier Opérationnel Vide</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {cart.map((item, idx) => (
                                            <div key={idx} className="flex flex-col gap-4 p-6 bg-white rounded-[2rem] border border-gray-100 shadow-md group relative overflow-hidden">
                                                <div className="absolute top-0 left-0 w-1 h-full bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                <div className="flex justify-between items-start">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center font-black text-blue-600 border border-gray-100">{idx + 1}</div>
                                                        <div className="min-w-0 flex flex-col">
                                                            <p className="text-sm font-black text-gray-900 uppercase tracking-tight truncate max-w-[200px]">
                                                                {item.product.title}
                                                                {item.variant && <span className="text-blue-600 ml-1">({item.variant.title})</span>}
                                                            </p>
                                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">REF: {item.variant ? item.variant.sku : item.product.sku || 'N/A'}</p>
                                                            <div className="flex gap-4 mt-2">
                                                                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                                                                    P.Achat TTC: {(item.product.purchasePrice || 0).toFixed(3)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => setCart(cart.filter((_, i) => i !== idx))} className="p-2 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><X className="w-5 h-5" /></button>
                                                </div>

                                                <div className="grid grid-cols-6 gap-3 items-end">
                                                    <div className="col-span-1 space-y-1">
                                                        <label className="text-[8px] font-black text-gray-400 uppercase block tracking-widest pl-1">Qté</label>
                                                        <input type="number" value={item.quantity} onChange={(e) => updateCartItem(idx, 'quantity', parseFloat(e.target.value) || 0)} className="w-full bg-gray-50 text-center text-gray-900 text-xs font-black py-2.5 rounded-xl border border-gray-100 outline-none focus:bg-white focus:border-blue-200" />
                                                    </div>
                                                    <div className="col-span-1 space-y-1">
                                                        <label className="text-[8px] font-black text-gray-400 uppercase block tracking-widest pl-1">P.Vente HT</label>
                                                        <input type="number" step="0.001" value={item.unitPrice} onChange={(e) => updateCartItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)} className="w-full bg-gray-50 text-center text-gray-900 text-xs font-black py-2.5 rounded-xl border border-gray-100 outline-none focus:bg-white focus:border-blue-200" />
                                                    </div>
                                                    <div className="col-span-2 space-y-1">
                                                        <label className="text-[8px] font-black text-gray-400 uppercase block tracking-widest pl-1">Remise</label>
                                                        <div className="flex gap-1">
                                                            <input type="number" value={item.discount} onChange={(e) => updateCartItem(idx, 'discount', parseFloat(e.target.value) || 0)} className="w-full bg-rose-50 text-center text-rose-600 text-xs font-black py-2.5 rounded-xl border border-rose-100 outline-none focus:bg-white" />
                                                            <button onClick={() => updateCartItem(idx, 'discountType', item.discountType === 'PERCENT' ? 'AMOUNT' : 'PERCENT')} className="px-2 bg-rose-100 text-[8px] font-black text-rose-600 rounded-lg uppercase w-10 border border-rose-200 hover:bg-rose-200 transition-colors">
                                                                {item.discountType === 'PERCENT' ? '%' : 'TND'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="col-span-1 space-y-1">
                                                        <label className="text-[8px] font-black text-gray-400 uppercase block tracking-widest pl-1">TVA</label>
                                                        <select value={item.taxRateId} onChange={(e) => updateCartItem(idx, 'taxRateId', e.target.value)} className="w-full bg-gray-50 text-center text-gray-600 text-[10px] font-black py-2.5 rounded-xl border border-gray-100 outline-none focus:bg-white focus:border-blue-200 appearance-none">
                                                            {taxes.map(t => <option key={t.id} value={t.id}>{t.rate}%</option>)}
                                                        </select>
                                                    </div>
                                                    <div className="col-span-1 flex items-center justify-center pb-3">
                                                        <label className={`cursor-pointer px-3 py-1.5 rounded-lg border text-[9px] font-black uppercase transition-all select-none ${item.fodec ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
                                                            <input type="checkbox" className="hidden" checked={item.fodec} onChange={(e) => updateCartItem(idx, 'fodec', e.target.checked)} />
                                                            Fodec
                                                        </label>
                                                    </div>
                                                </div>
                                                <div className="text-right border-t border-gray-50 pt-2 flex justify-between items-center">
                                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Total Ligne TTC</span>
                                                    <p className="text-sm font-black text-gray-900">{item.total.toFixed(3)}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="bg-gray-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden space-y-6">
                                <div className="absolute top-0 right-0 w-60 h-60 bg-blue-600 rounded-full blur-[100px] -mr-30 -mt-30 opacity-30"></div>

                                <div className="relative z-10 grid grid-cols-2 gap-8 text-sm">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total HT</p>
                                        <p className="font-bold">{cartTotals.totalHT.toFixed(3)}</p>
                                    </div>
                                    <div className="space-y-1 text-right">
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total TVA</p>
                                        <p className="font-bold">{cartTotals.totalTVA.toFixed(3)}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Fodec (1%)</p>
                                        <p className="font-bold">{cartTotals.totalFodec.toFixed(3)}</p>
                                    </div>
                                    <div className="space-y-1 text-right">
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Timbre Fiscal</p>
                                        <select className="bg-gray-800 border-none text-[10px] font-bold text-blue-400 uppercase tracking-widest rounded-lg px-2 py-1 outline-none inline-block w-auto" value={timbreFiscale} onChange={e => setTimbreFiscale(parseFloat(e.target.value))}>
                                            <option value={1.0}>1.000</option>
                                            <option value={0.6}>0.600</option>
                                            <option value={0}>0.000</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="relative z-10 border-t border-gray-800 pt-6 flex flex-col md:flex-row justify-between items-center gap-8">
                                    <div>
                                        <p className="text-[10px] font-black uppercase opacity-50 tracking-[0.3em] mb-2">Net à Payer (TTC)</p>
                                        <p className="text-4xl lg:text-5xl font-black tracking-tighter leading-none">{cartTotals.totalTTC.toFixed(3)} <span className="text-sm font-bold opacity-30 ml-2 uppercase">TND</span></p>
                                    </div>
                                    <button
                                        onClick={createOrder}
                                        disabled={orderLoading || cart.length === 0 || !selectedClientId}
                                        className="w-full md:w-auto px-12 py-5 bg-blue-600 text-white rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] hover:scale-105 active:scale-95 disabled:opacity-30 disabled:hover:scale-100 transition-all shadow-xl shadow-blue-600/30 flex items-center justify-center gap-4"
                                    >
                                        {orderLoading ? (
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin rounded-full"></div>
                                        ) : (
                                            <>Finaliser Commande <ArrowUpDown className="w-4 h-4 rotate-90" /></>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </Modal>

            <CatalogRegistries isOpen={showRegistries} onClose={() => setShowRegistries(false)} onUpdate={loadData} initialTab={registriesTab} />

            {/* VARIANT SELECTION MODAL */}
            <Modal isOpen={showVariantModal} onClose={() => setShowVariantModal(false)} title="Sélection Variété" size="md">
                <div className="p-6 space-y-6">
                    <div className="p-6 bg-blue-50/50 rounded-2xl border border-blue-100 text-center">
                        <h3 className="text-sm font-black text-blue-900 uppercase tracking-widest">{selectedProductForVariant?.title}</h3>
                        <p className="text-xs text-blue-500 font-medium mt-1">Veuillez choisir une déclinaison pour continuer</p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                        {selectedProductForVariant?.variants?.map((v, i) => (
                            <button key={i} onClick={() => addToCart(selectedProductForVariant!, v)} className="group w-full p-4 bg-white border border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10 transition-all flex justify-between items-center text-left">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{v.sku}</p>
                                    <p className="text-sm font-black text-gray-900 uppercase">{v.title}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-blue-600">{v.priceTTC.toFixed(3)} <span className="text-[9px]">TND</span></p>
                                    <p className={`text-[9px] font-bold uppercase tracking-widest mt-1 ${v.quantity > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>Stock: {v.quantity}</p>
                                </div>
                            </button>
                        ))}
                        {(!selectedProductForVariant?.variants || selectedProductForVariant.variants.length === 0) && (
                            <div className="text-center py-10 text-gray-400">
                                <p>Aucune variante disponible.</p>
                            </div>
                        )}
                    </div>
                    <button onClick={() => setShowVariantModal(false)} className="w-full py-4 bg-gray-100 text-gray-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-all">Annuler</button>
                </div>
            </Modal>
        </div>
    )
}
