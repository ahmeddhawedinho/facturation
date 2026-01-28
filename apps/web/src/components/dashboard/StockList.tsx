import { Package } from 'lucide-react';

interface Product {
    id: string;
    title: string;
    quantity: number;
    image?: string;
}

interface StockListProps {
    products: Product[];
}

export function StockList({ products }: StockListProps) {
    if (!products || products.length === 0) return null;

    const maxStock = Math.max(...products.map(p => p.quantity));

    return (
        <div className="bg-card rounded-3xl shadow-sm p-8 border border-app h-full flex flex-col transition-colors duration-300">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Inventaire</p>
                    <h2 className="text-xl font-black text-app tracking-tight flex items-center gap-2 uppercase">
                        Disponibilité <span className="text-blue-600">Stock</span>
                    </h2>
                </div>
                <div className="w-10 h-10 bg-app rounded-xl border border-app flex items-center justify-center text-blue-600">
                    <Package className="w-5 h-5" />
                </div>
            </div>

            <div className="space-y-6 flex-1">
                {products.map((product) => {
                    const percentage = (product.quantity / maxStock) * 100;
                    return (
                        <div key={product.id} className="group/item">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-app border border-app flex items-center justify-center text-muted font-bold overflow-hidden shadow-inner">
                                        {product.image ? (
                                            <img src={product.image} alt={product.title} className="w-full h-full object-cover" />
                                        ) : (
                                            product.title.charAt(0)
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs font-black text-app truncate max-w-[120px] uppercase" title={product.title}>
                                            {product.title}
                                        </p>
                                        <p className="text-[9px] text-muted font-bold tracking-tight">Article #{product.id.slice(0, 4).toUpperCase()}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-app">{product.quantity}</p>
                                    <p className="text-[9px] text-muted font-bold uppercase">Unités</p>
                                </div>
                            </div>

                            <div className="h-1.5 w-full bg-app rounded-full overflow-hidden border border-app/50 shadow-inner">
                                <div
                                    className="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-out"
                                    style={{ width: `${percentage}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            <button className="mt-8 w-full py-3 bg-app hover:opacity-80 border border-app rounded-xl text-[10px] font-black text-muted hover:text-app uppercase tracking-widest transition-all">
                Gérer l'inventaire
            </button>
        </div>
    );
}
