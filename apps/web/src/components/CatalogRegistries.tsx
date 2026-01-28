import { useState, useEffect } from 'react'
import { Plus, Trash2, ChevronRight, FolderTree, Loader2, Tag, Layers } from 'lucide-react'
import api from '../lib/api'
import Modal from './Modal'

// --- INTERFACES ---
interface SubCategory {
    id: string
    name: string
}

interface Category {
    id: string
    name: string
    subcategories: SubCategory[]
}

interface Attribute {
    id: string
    name: string
    values: string[]
}

interface CatalogRegistriesProps {
    isOpen: boolean
    onClose: () => void
    onUpdate: () => void
    initialTab?: 'CATEGORIES' | 'ATTRIBUTES'
}

export default function CatalogRegistries({ isOpen, onClose, onUpdate, initialTab = 'CATEGORIES' }: CatalogRegistriesProps) {
    const [activeTab, setActiveTab] = useState<'CATEGORIES' | 'ATTRIBUTES'>(initialTab)
    const [categories, setCategories] = useState<Category[]>([])
    const [attributes, setAttributes] = useState<Attribute[]>([])
    const [loading, setLoading] = useState(false)

    // --- CATEGORY STATE ---
    const [selectedCatId, setSelectedCatId] = useState<string | null>(null)
    const [newCatName, setNewCatName] = useState('')
    const [newSubName, setNewSubName] = useState('')

    // --- ATTRIBUTE STATE ---
    const [selectedAttrId, setSelectedAttrId] = useState<string | null>(null)
    const [newAttrName, setNewAttrName] = useState('')
    const [newAttrValue, setNewAttrValue] = useState('')

    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        if (isOpen) {
            loadData()
            setActiveTab(initialTab)
        }
    }, [isOpen, initialTab])

    const loadData = async () => {
        setLoading(true)
        try {
            // Load Categories
            const catRes = await api.get('/products/categories')
            setCategories(catRes.data || [])

            // Load Attributes (Try/Catch to support missing endpoint gracefully)
            try {
                const attrRes = await api.get('/products/attributes')
                setAttributes(attrRes.data || [])
            } catch (e) {
                console.warn('Attributes endpoint might not exist yet, using local state or empty.', e)
                // Mock data if empty for demo purposes or handle as empty
                // setAttributes([{ id: '1', name: 'Taille', values: ['S', 'M', 'L'] }]) 
            }
        } catch (error) {
            console.error('Erreur chargement données:', error)
        } finally {
            setLoading(false)
        }
    }

    // --- CATEGORY HANDLERS ---
    const handleAddCategory = async () => {
        if (!newCatName.trim()) return
        setIsSubmitting(true)
        try {
            await api.post('/products/categories', { name: newCatName })
            await loadData()
            setNewCatName('')
            onUpdate()
        } catch (error) { alert('Erreur création catégorie') } finally { setIsSubmitting(false) }
    }

    const handleDeleteCategory = async (id: string) => {
        if (!window.confirm('Supprimer cette catégorie ?')) return
        try {
            await api.delete(`/products/categories/${id}`)
            await loadData()
            if (selectedCatId === id) setSelectedCatId(null)
            onUpdate()
        } catch (error) { alert('Impossible de supprimer') }
    }

    const handleAddSubCategory = async () => {
        if (!selectedCatId || !newSubName.trim()) return
        setIsSubmitting(true)
        try {
            await api.post(`/products/categories/${selectedCatId}/subcategories`, { name: newSubName })
            await loadData()
            setNewSubName('')
            onUpdate()
        } catch (error) { alert('Erreur création sous-catégorie') } finally { setIsSubmitting(false) }
    }

    const handleDeleteSubCategory = async (catId: string, subId: string) => {
        try {
            await api.delete(`/products/categories/${catId}/subcategories/${subId}`)
            await loadData()
            onUpdate()
        } catch (error) { alert('Impossible de supprimer') }
    }

    // --- ATTRIBUTE HANDLERS ---
    const handleAddAttribute = async () => {
        if (!newAttrName.trim()) return
        setIsSubmitting(true)
        try {
            await api.post('/products/attributes', { name: newAttrName, values: [] })
            await loadData()
            setNewAttrName('')
            onUpdate()
        } catch (error) {
            alert('Erreur: Endpoint attributs non disponible')
        } finally { setIsSubmitting(false) }
    }

    const handleDeleteAttribute = async (id: string) => {
        if (!window.confirm('Supprimer cet attribut ?')) return
        try {
            await api.delete(`/products/attributes/${id}`)
            await loadData()
            if (selectedAttrId === id) setSelectedAttrId(null)
            onUpdate()
        } catch (error) { alert('Erreur suppression attribut') }
    }

    const handleAddValue = async () => {
        if (!selectedAttrId || !newAttrValue.trim()) return
        setIsSubmitting(true)
        try {
            const attr = attributes.find(a => a.id === selectedAttrId)
            const newValues = [...(attr?.values || []), newAttrValue]
            await api.put(`/products/attributes/${selectedAttrId}`, { ...attr, values: newValues })
            await loadData()
            setNewAttrValue('')
            onUpdate()
        } catch (error) { alert('Erreur ajout valeur') } finally { setIsSubmitting(false) }
    }

    const handleDeleteValue = async (valToRemove: string) => {
        if (!selectedAttrId) return
        try {
            const attr = attributes.find(a => a.id === selectedAttrId)
            const newValues = (attr?.values || []).filter(v => v !== valToRemove)
            await api.put(`/products/attributes/${selectedAttrId}`, { ...attr, values: newValues })
            await loadData()
            onUpdate()
        } catch (error) { alert('Erreur suppression valeur') }
    }

    const selectedCategory = categories.find(c => c.id === selectedCatId)
    const selectedAttribute = attributes.find(a => a.id === selectedAttrId)

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Ressources Catalogue" size="xl">
            <div className="bg-white rounded-[2.5rem] overflow-hidden flex flex-col h-[700px]">
                {/* Navigation Tabs */}
                <div className="flex border-b border-gray-100 px-8 pt-4 gap-8">
                    <button
                        onClick={() => setActiveTab('CATEGORIES')}
                        className={`pb-4 text-xs font-black uppercase tracking-widest transition-all border-b-4 ${activeTab === 'CATEGORIES' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                    >
                        <FolderTree className="w-4 h-4 inline-block mr-2 mb-0.5" /> Catégories
                    </button>
                    <button
                        onClick={() => setActiveTab('ATTRIBUTES')}
                        className={`pb-4 text-xs font-black uppercase tracking-widest transition-all border-b-4 ${activeTab === 'ATTRIBUTES' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                    >
                        <Tag className="w-4 h-4 inline-block mr-2 mb-0.5" /> Attributs & Variantes
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 flex bg-gray-50/50 overflow-hidden">
                    {/* Sidebar List */}
                    <div className="w-1/3 bg-white border-r border-gray-100 flex flex-col">
                        <div className="p-6 border-b border-gray-100 bg-gray-50/30">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
                                {activeTab === 'CATEGORIES' ? 'Structure Principale' : 'Définitions Attributs'}
                            </h3>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={activeTab === 'CATEGORIES' ? newCatName : newAttrName}
                                    onChange={(e) => activeTab === 'CATEGORIES' ? setNewCatName(e.target.value) : setNewAttrName(e.target.value)}
                                    placeholder={activeTab === 'CATEGORIES' ? "Nouvelle catégorie..." : "Nouvel attribut (Ex: Couleur)..."}
                                    className="flex-1 bg-white border border-gray-100 rounded-2xl px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-600 outline-none focus:ring-4 focus:ring-blue-600/5 shadow-sm placeholder:normal-case placeholder:font-bold placeholder:text-gray-300"
                                />
                                <button
                                    onClick={activeTab === 'CATEGORIES' ? handleAddCategory : handleAddAttribute}
                                    disabled={isSubmitting || (activeTab === 'CATEGORIES' ? !newCatName.trim() : !newAttrName.trim())}
                                    className="p-4 bg-gray-900 text-white rounded-2xl shadow-lg shadow-gray-900/10 hover:scale-105 active:scale-95 transition-all text-center flex items-center justify-center disabled:opacity-50"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
                            {loading ? (
                                <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 text-blue-600 animate-spin" /></div>
                            ) : (
                                (activeTab === 'CATEGORIES' ? categories : attributes).map(item => (
                                    <div
                                        key={item.id}
                                        onClick={() => activeTab === 'CATEGORIES' ? setSelectedCatId(item.id) : setSelectedAttrId(item.id)}
                                        className={`group flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all border ${(activeTab === 'CATEGORIES' ? selectedCatId : selectedAttrId) === item.id
                                            ? 'bg-blue-50 border-blue-200 shadow-sm'
                                            : 'bg-white border-transparent hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className={`w-2 h-2 rounded-full ${(activeTab === 'CATEGORIES' ? selectedCatId : selectedAttrId) === item.id
                                                ? 'bg-blue-600'
                                                : 'bg-gray-300'
                                                }`}></div>
                                            <span className={`text-xs font-black uppercase tracking-tight truncate ${(activeTab === 'CATEGORIES' ? selectedCatId : selectedAttrId) === item.id
                                                ? 'text-blue-900'
                                                : 'text-gray-600'
                                                }`}>{item.name}</span>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                activeTab === 'CATEGORIES' ? handleDeleteCategory(item.id) : handleDeleteAttribute(item.id);
                                            }}
                                            className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))
                            )}
                            {/* Empty States */}
                            {!loading && (activeTab === 'CATEGORIES' ? categories : attributes).length === 0 && (
                                <p className="text-[9px] text-gray-400 text-center py-10 uppercase tracking-widest border-2 border-dashed border-gray-100 rounded-xl">Aucune donnée</p>
                            )}
                        </div>
                    </div>

                    {/* Main Content - SubItems */}
                    <div className="flex-1 bg-gray-50/30 flex flex-col relative overflow-hidden">
                        {(activeTab === 'CATEGORIES' ? selectedCategory : selectedAttribute) ? (
                            <>
                                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-[80px] -mr-32 -mt-32 opacity-50 pointer-events-none"></div>
                                <div className="p-8 border-b border-gray-100 bg-white relative z-10">
                                    <div className="flex items-center gap-3 mb-8">
                                        <span className="text-xl font-black text-gray-300 uppercase">
                                            {activeTab === 'CATEGORIES' ? selectedCategory?.name : selectedAttribute?.name}
                                        </span>
                                        <ChevronRight className="w-5 h-5 text-gray-300" />
                                        <h3 className="text-xl font-black text-gray-900 uppercase text-blue-600">
                                            {activeTab === 'CATEGORIES' ? 'Sous-Catégories' : 'Valeurs Possibles'}
                                        </h3>
                                    </div>

                                    <div className="flex gap-3 max-w-md">
                                        <div className="relative flex-1">
                                            <input
                                                type="text"
                                                value={activeTab === 'CATEGORIES' ? newSubName : newAttrValue}
                                                onChange={(e) => activeTab === 'CATEGORIES' ? setNewSubName(e.target.value) : setNewAttrValue(e.target.value)}
                                                placeholder={activeTab === 'CATEGORIES' ? "Ex: Standard, Pro..." : "Ex: Rouge, XL..."}
                                                className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 px-6 font-bold text-xs uppercase tracking-widest outline-none focus:bg-white focus:ring-4 focus:ring-blue-600/5 transition-all shadow-inner"
                                            />
                                        </div>
                                        <button
                                            onClick={activeTab === 'CATEGORIES' ? handleAddSubCategory : handleAddValue}
                                            disabled={isSubmitting || (activeTab === 'CATEGORIES' ? !newSubName.trim() : !newAttrValue.trim())}
                                            className="px-6 bg-blue-600 text-white rounded-2xl shadow-xl shadow-blue-600/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 font-black text-[10px] uppercase tracking-widest disabled:opacity-50 disabled:hover:scale-100"
                                        >
                                            <Plus className="w-4 h-4" /> Ajouter
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-8 relative z-10">
                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                        {activeTab === 'CATEGORIES' ? (
                                            selectedCategory?.subcategories.map(sub => (
                                                <div key={sub.id} className="group bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all flex items-center justify-between">
                                                    <span className="text-xs font-black text-gray-700 uppercase tracking-tight pl-2">{sub.name}</span>
                                                    <button
                                                        onClick={() => handleDeleteSubCategory(selectedCategory!.id, sub.id)}
                                                        className="opacity-0 group-hover:opacity-100 p-2 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ))
                                        ) : (
                                            selectedAttribute?.values.map((val, idx) => (
                                                <div key={idx} className="group bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all flex items-center justify-between">
                                                    <span className="text-xs font-black text-gray-700 uppercase tracking-tight pl-2">{val}</span>
                                                    <button
                                                        onClick={() => handleDeleteValue(val)}
                                                        className="opacity-0 group-hover:opacity-100 p-2 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            ))
                                        )}

                                        {/* Empty State for SubItems */}
                                        {((activeTab === 'CATEGORIES' ? selectedCategory?.subcategories : selectedAttribute?.values) || []).length === 0 && (
                                            <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-100 rounded-[2rem] opacity-60">
                                                <Layers className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Liste vide</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-10 opacity-50 relative z-10">
                                <div className="absolute inset-0 bg-repeat opacity-5" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
                                <div className="w-20 h-20 bg-white rounded-[2.5rem] flex items-center justify-center mb-6 shadow-xl shadow-gray-200">
                                    {activeTab === 'CATEGORIES' ? <FolderTree className="w-8 h-8 text-blue-300" /> : <Tag className="w-8 h-8 text-blue-300" />}
                                </div>
                                <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight mb-2">Sélectionnez un élément</h3>
                                <p className="text-xs text-gray-400 font-medium">Choisissez une {activeTab === 'CATEGORIES' ? 'catégorie' : 'propriété'} dans la liste<br />pour gérer son contenu.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    )
}
