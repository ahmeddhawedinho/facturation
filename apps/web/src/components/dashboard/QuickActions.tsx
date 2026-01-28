import { useNavigate } from 'react-router-dom';
import {
    ShoppingCart,
    Users,
    Truck,
    ArrowRight,
    FilePlus,
    Layers,
} from 'lucide-react';

export function QuickActions() {
    const navigate = useNavigate();

    const sections = [
        {
            title: "Ventes & Clients",
            color: "text-blue-600",
            bg: "bg-blue-50",
            icon: ShoppingCart,
            description: "Gérez vos factures et devis",
            actions: [
                { label: "Nouvelle Facture", icon: FilePlus, path: "/dashboard/documents/create?type=INVOICE" },
                { label: "Nouveau Devis", icon: FilePlus, path: "/dashboard/documents/create?type=QUOTE" }
            ]
        },
        {
            title: "Stock & Inventaire",
            color: "text-emerald-600",
            bg: "bg-emerald-50",
            icon: Layers,
            description: "Suivez vos articles et réceptions",
            actions: [
                { label: "Bon de Réception", icon: Truck, path: "/dashboard/purchase/create" },
                { label: "Gérer le Stock", icon: Layers, path: "/dashboard/products" }
            ]
        },
        {
            title: "Annuaire & Tiers",
            color: "text-amber-600",
            bg: "bg-amber-50",
            icon: Users,
            description: "Clients et Fournisseurs",
            actions: [
                { label: "Liste des Clients", icon: Users, path: "/dashboard/clients" },
                { label: "Fournisseurs", icon: Users, path: "/dashboard/suppliers" }
            ]
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-fade-in">
            {sections.map((section, idx) => (
                <div
                    key={idx}
                    className="group relative bg-card rounded-2xl p-6 border border-app shadow-sm hover:shadow-md hover:border-blue-600/30 transition-all duration-300"
                >
                    <div className="relative z-10">
                        <div className="flex items-center gap-4 mb-6">
                            <div className={`p-3 rounded-xl ${section.bg} ${section.color} shadow-inner opacity-80 group-hover:opacity-100 transition-opacity`}>
                                <section.icon className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-app tracking-tight">{section.title}</h2>
                                <p className="text-[10px] font-bold text-muted uppercase tracking-widest">{section.description}</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {section.actions.map((action, actionIdx) => (
                                <button
                                    key={actionIdx}
                                    onClick={() => navigate(action.path)}
                                    className="w-full flex items-center justify-between p-3.5 px-5 rounded-xl bg-app border border-app hover:bg-blue-600 hover:border-blue-600 transition-all duration-200 group/btn"
                                >
                                    <div className="flex items-center gap-3">
                                        <action.icon className="w-4 h-4 text-muted group-hover/btn:text-white transition-colors" />
                                        <span className="text-[10px] font-black text-app group-hover/btn:text-white transition-colors uppercase tracking-widest">{action.label}</span>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-muted opacity-40 group-hover/btn:text-white group-hover/btn:translate-x-1 transition-all" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
