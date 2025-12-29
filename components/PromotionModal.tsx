
import React from 'react';
import { PieceType, PieceColor } from '../types';
import PokemonPiece from './PokemonPiece';

interface PromotionModalProps {
  color: PieceColor;
  onSelect: (piece: PieceType) => void;
  onClose: () => void;
}

const PromotionModal: React.FC<PromotionModalProps> = ({ color, onSelect, onClose }) => {
  const options: { type: PieceType; label: string }[] = [
    { type: 'q', label: 'Queen' },
    { type: 'r', label: 'Rook' },
    { type: 'b', label: 'Bishop' },
    { type: 'n', label: 'Knight' },
  ];

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-gray-800 border-4 border-yellow-500 rounded-xl p-6 shadow-2xl max-w-sm w-full text-center">
        <h2 className="text-xl font-pixel text-yellow-400 mb-2 tracking-wide">Evolution!</h2>
        <p className="text-gray-300 mb-6 text-sm">Your Pokemon is evolving. Choose a form:</p>
        
        <div className="grid grid-cols-2 gap-4">
          {options.map((opt) => (
            <button
              key={opt.type}
              onClick={() => onSelect(opt.type)}
              className="group flex flex-col items-center p-4 bg-gray-700 rounded-lg hover:bg-gray-600 border-2 border-transparent hover:border-blue-400 transition-all"
            >
              <div className="w-16 h-16 mb-2 transform group-hover:scale-110 transition-transform">
                <PokemonPiece type={opt.type} color={color} />
              </div>
              <span className="font-bold text-gray-200 text-xs uppercase">{opt.label}</span>
            </button>
          ))}
        </div>
        
        <button 
            onClick={onClose} 
            className="mt-6 text-xs text-red-400 hover:text-red-300 underline"
        >
            Cancel Evolution
        </button>
      </div>
    </div>
  );
};

export default PromotionModal;
