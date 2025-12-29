
import React from 'react';
import { TEAM_PRESETS } from '../constants';
import PokemonPiece from './PokemonPiece';
import { TeamTheme, PieceType } from '../types';

interface PokedexProps {
  onClose: () => void;
}

const Pokedex: React.FC<PokedexProps> = ({ onClose }) => {
  const themes = Object.keys(TEAM_PRESETS) as TeamTheme[];
  const pieces: PieceType[] = ['p', 'n', 'b', 'r', 'q', 'k'];
  const labels = { p: 'Pawn', n: 'Knight', b: 'Bishop', r: 'Rook', q: 'Queen', k: 'King' };

  return (
    <div className="absolute inset-0 z-[60] bg-gray-900 overflow-y-auto animate-fadeIn flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-red-600 p-4 shadow-lg border-b-4 border-red-800 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-400 rounded-full border-4 border-white shadow-inner animate-pulse"></div>
                <h2 className="text-2xl font-pixel text-white drop-shadow-md">POKEDEX</h2>
            </div>
            <button onClick={onClose} className="bg-gray-800 text-white px-4 py-2 rounded border-2 border-gray-600 hover:bg-gray-700 font-bold uppercase text-xs">
                Close
            </button>
        </div>

        {/* Content */}
        <div className="p-6 grid gap-8">
            {themes.map(theme => (
                <div key={theme} className="bg-gray-800 rounded-xl border-2 border-gray-700 p-4 shadow-xl">
                    <h3 className="text-lg font-bold text-gray-200 uppercase tracking-widest mb-4 border-b border-gray-600 pb-2">
                        {theme.replace('_', ' ')} Deck
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                        {pieces.map(type => {
                            const def = TEAM_PRESETS[theme][type];
                            return (
                                <div key={type} className="flex flex-col items-center bg-gray-900/50 p-3 rounded-lg border border-gray-700 hover:border-blue-500 transition-colors group">
                                    <div className="w-16 h-16 mb-2 flex items-center justify-center transform group-hover:scale-110 transition-transform">
                                        <PokemonPiece pokemonDef={def} type={type} color='w' />
                                    </div>
                                    <span className="text-[10px] text-gray-500 uppercase font-bold">{labels[type]}</span>
                                    <span className="text-xs font-bold text-blue-300">{def.name}</span>
                                    <div className="flex gap-1 mt-1">
                                        {def.types.map(t => (
                                            <span key={t} className="text-[8px] px-1 bg-gray-700 rounded text-gray-300 uppercase">{t}</span>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};

export default Pokedex;
