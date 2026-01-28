import { Users, DollarSign, TrendingUp, ShoppingCart } from 'lucide-react';
interface StatsOverviewProps {
    stats: {
        clientsCount: number;
        totalRevenue: number;
        totalExpenses: number;
        netProfit: number;
    }
}

export function StatsOverview({ stats }: StatsOverviewProps) {
    if (!stats) return null;

    const cards = [
        {
            title: "Total Clients",
            value: stats.clientsCount,
            icon: Users,
            color: "bg-blue-500",
            textColor: "text-blue-500",
            bgLight: "bg-blue-50"
        },
        {
            title: "Chiffre d'Affaires",
            value: `${stats.totalRevenue.toFixed(2)} TND`,
            icon: TrendingUp,
            color: "bg-green-500",
            textColor: "text-green-500",
            bgLight: "bg-green-50"
        },
        {
            title: "Dépenses (Achats)",
            value: `${stats.totalExpenses.toFixed(2)} TND`,
            icon: ShoppingCart,
            color: "bg-red-500",
            textColor: "text-red-500",
            bgLight: "bg-red-50"
        },
        {
            title: "Bénéfice Net",
            value: `${stats.netProfit.toFixed(2)} TND`,
            icon: DollarSign,
            color: stats.netProfit >= 0 ? "bg-emerald-500" : "bg-orange-500",
            textColor: stats.netProfit >= 0 ? "text-emerald-500" : "text-orange-500",
            bgLight: stats.netProfit >= 0 ? "bg-emerald-50" : "bg-orange-50"
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {cards.map((card, index) => (
                <div
                    key={index}
                    className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-gray-100"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className={`p-3 rounded-lg ${card.bgLight}`}>
                            <card.icon className={`w-6 h-6 ${card.textColor}`} />
                        </div>
                    </div>
                    <h3 className="text-gray-500 text-sm font-medium">{card.title}</h3>
                    <p className="text-2xl font-bold mt-1 text-gray-800">{card.value}</p>
                </div>
            ))}
        </div>
    );
}
