
import React from 'react';
import { SHOP_ITEMS } from '../constants';
import { ShopItem } from '../types';

interface ShopModalProps {
  coins: number;
  inventory: string[];
  onBuy: (item: ShopItem) => void;
  onClose: () => void;
}

const ShopModal: React.FC<ShopModalProps> = ({ coins, inventory, onBuy, onClose }) => {
  return (
    <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn p-4">
      <div className="bg-gray-900 border-4 border-yellow-500 rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center">
             <div className="flex items-center gap-3">
                 <span className="text-2xl">🏪</span>
                 <h2 className="text-xl font-pixel text-yellow-400">PokeMart</h2>
             </div>
             <div className="bg-gray-900 px-3 py-1 rounded-full border border-yellow-500 flex items-center gap-2">
                 <span className="text-yellow-400">🪙</span>
                 <span className="text-white font-mono font-bold">{coins}</span>
             </div>
             <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">✕</button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
            {SHOP_ITEMS.map(item => {
                const isOwned = inventory.includes(item.id);
                const canAfford = coins >= item.cost;

                return (
                    <div key={item.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700 flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start mb-2">
                                <h3 className={`font-bold uppercase ${item.type === 'theme' ? 'text-blue-400' : 'text-purple-400'}`}>
                                    {item.name}
                                </h3>
                                {isOwned ? (
                                    <span className="text-[10px] bg-green-900 text-green-300 px-2 py-1 rounded font-bold">OWNED</span>
                                ) : (
                                    <span className="text-yellow-400 font-mono font-bold">{item.cost} 🪙</span>
                                )}
                            </div>
                            <p className="text-gray-400 text-xs mb-4">{item.description}</p>
                        </div>
                        
                        <button
                            disabled={isOwned || !canAfford}
                            onClick={() => onBuy(item)}
                            className={`w-full py-2 rounded font-bold uppercase tracking-wider text-xs transition-colors
                                ${isOwned 
                                    ? 'bg-gray-700 text-gray-500 cursor-default' 
                                    : canAfford 
                                        ? 'bg-yellow-500 hover:bg-yellow-400 text-black' 
                                        : 'bg-red-900/50 text-red-300 cursor-not-allowed'}`}
                        >
                            {isOwned ? 'Purchased' : canAfford ? 'Buy Now' : 'Not Enough Coins'}
                        </button>
                    </div>
                );
            })}
        </div>
      </div>
    </div>
  );
};

export default ShopModal;
