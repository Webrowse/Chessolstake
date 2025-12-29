
import React, { useState } from 'react';
import { ShopItem } from '../types';
import { SHOP_ITEMS } from '../constants';
import { ShoppingBag, Check } from 'lucide-react';

interface ShopListProps {
  coins: number;
  inventory: string[];
  onBuyItem: (item: ShopItem) => void;
}

const ShopList: React.FC<ShopListProps> = ({ coins, inventory, onBuyItem }) => {
  const [shopFilter, setShopFilter] = useState<'all' | 'theme' | 'item' | 'merch'>('all');
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  const handleBuy = async (item: ShopItem) => {
      setPurchasingId(item.id);
      await new Promise(resolve => setTimeout(resolve, 500));
      onBuyItem(item);
      setPurchasingId(null);
  };

  const filteredItems = SHOP_ITEMS.filter(item => shopFilter === 'all' || item.type === shopFilter);

  return (
    <div className="p-4 h-full overflow-y-auto scrollbar-hide relative">
        <div className="flex gap-2 mb-6 sticky top-0 bg-slate-900/95 backdrop-blur z-20 py-3 border-b border-white/5 -mx-4 px-4">
            {(['all', 'theme', 'item', 'merch'] as const).map(cat => (
                <button 
                    key={cat} 
                    onClick={() => setShopFilter(cat)}
                    className={`flex-1 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all
                        ${shopFilter === cat 
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                            : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-700/50'}`}
                >
                    {cat}
                </button>
            ))}
        </div>
        
        {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-500">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    <ShoppingBag size={24} className="opacity-50" />
                </div>
                <p className="text-xs uppercase tracking-widest font-bold">Empty Shelves</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4">
                {filteredItems.map(item => {
                    const isOwned = inventory.includes(item.id);
                    const canAfford = coins >= item.cost;
                    const isPurchasing = purchasingId === item.id;

                    return (
                        <div key={item.id} className="bg-slate-800/40 p-4 rounded-xl border border-white/5 flex flex-col justify-between group hover:border-blue-500/30 hover:bg-slate-800/80 transition-all shadow-sm hover:shadow-xl hover:-translate-y-1 relative overflow-hidden backdrop-blur-sm">
                            {/* Hover Gradient */}
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                            <div className="mb-4 relative z-10">
                                <div className="flex justify-between items-start mb-3">
                                    <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wide border backdrop-blur-md
                                        ${item.type === 'theme' ? 'bg-blue-950/50 text-blue-300 border-blue-500/30' : 
                                        item.type === 'item' ? 'bg-purple-950/50 text-purple-300 border-purple-500/30' : 
                                        'bg-green-950/50 text-green-300 border-green-500/30'}`}>
                                        {item.type}
                                    </span>
                                    {isOwned && <span className="text-green-400 bg-green-900/20 p-1 rounded-full"><Check size={12} strokeWidth={4}/></span>}
                                </div>
                                <h4 className="text-sm font-bold text-slate-100 group-hover:text-blue-300 transition-colors line-clamp-1 mb-1">{item.name}</h4>
                                <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-2">{item.description}</p>
                            </div>
                            
                            <button 
                                disabled={isOwned || !canAfford || isPurchasing}
                                onClick={() => handleBuy(item)}
                                className={`w-full py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm btn-press flex items-center justify-center gap-2 relative z-10
                                    ${isOwned ? 'bg-slate-700/30 text-slate-500 cursor-default border border-white/5' : 
                                    canAfford ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-black hover:from-yellow-400 hover:to-yellow-500 shadow-neon-yellow border border-yellow-400/50' : 
                                    'bg-slate-800 text-red-400 border border-red-900/30 opacity-60 cursor-not-allowed'}
                                `}
                            >
                                {isPurchasing ? (
                                    <span className="w-3 h-3 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></span>
                                ) : isOwned ? (
                                    'Owned'
                                ) : (
                                    <>{item.cost} 🪙</>
                                )}
                            </button>
                        </div>
                    );
                })}
            </div>
        )}
    </div>
  );
};

export default ShopList;
