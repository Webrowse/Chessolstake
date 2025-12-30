import React, { useMemo } from 'react';
import { PieceType, PieceColor, PokemonDef } from '../types';
import { SPRITE_BASE_URL } from '../constants';

interface PokemonPieceProps {
  pokemonDef?: PokemonDef; 
  type: PieceType; 
  color: PieceColor;
  className?: string;
  isCheck?: boolean; 
  hasShinyCharm?: boolean; 
}

// React.memo optimization to prevent re-renders when board state doesn't change this square
const PokemonPiece: React.FC<PokemonPieceProps> = React.memo(({ pokemonDef, type, color, className = '', isCheck = false, hasShinyCharm = false }) => {
  const id = pokemonDef?.id || 0;
  const primaryType = pokemonDef?.types[0] || 'normal';
  const spriteUrl = `${SPRITE_BASE_URL}${id}.png`;

  // Gen Z Feature: Shiny Logic
  // Base chance 5% (0.05). With Shiny Charm -> 25% (0.25)
  const isShiny = useMemo(() => {
      const chance = hasShinyCharm ? 0.25 : 0.05;
      return Math.random() < chance;
  }, [hasShinyCharm]);

  // Determine Aura Style based on Pokemon Type
  let auraClass = '';
  switch (primaryType) {
    case 'electric': auraClass = 'drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]'; break;
    case 'fire': auraClass = 'drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]'; break;
    case 'psychic': auraClass = 'drop-shadow-[0_0_10px_rgba(192,38,211,0.5)]'; break;
    case 'ghost': auraClass = 'drop-shadow-[0_0_10px_rgba(75,0,130,0.6)]'; break;
    case 'water': auraClass = 'drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]'; break;
    case 'grass': auraClass = 'drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]'; break;
    case 'rock': auraClass = 'drop-shadow-[0_0_5px_rgba(120,53,15,0.4)]'; break;
    case 'ice': auraClass = 'drop-shadow-[0_0_8px_rgba(56,189,248,0.6)]'; break;
    default: auraClass = 'drop-shadow-[0_0_2px_rgba(255,255,255,0.3)]';
  }

  if (isCheck) {
      auraClass = 'drop-shadow-[0_0_15px_rgba(220,38,38,0.9)]'; 
  }

  // Shiny Effect Logic
  const imageFilter = isShiny 
      ? 'hue-rotate(45deg) saturate(150%) brightness(110%)' 
      : (color === 'b' ? 'brightness-90 grayscale-[10%]' : 'brightness-110');

  return (
    <div className={`relative flex items-center justify-center w-full h-full animate-scale-in ${className}`}>
        
        {/* Pulsating Red Circle for Check */}
        {isCheck && (
            <div className="absolute inset-0 bg-red-500/40 rounded-full animate-ping blur-sm"></div>
        )}

        {/* Shiny Sparkles Overlay */}
        {isShiny && (
            <div className="absolute inset-0 z-20 pointer-events-none">
                <div className="absolute top-0 right-0 text-[10px] animate-pulse">✨</div>
                <div className="absolute bottom-1 left-0 text-[8px] animate-bounce">✨</div>
                {hasShinyCharm && <div className="absolute top-1/2 left-1/2 text-[12px] animate-ping opacity-50">🌟</div>}
            </div>
        )}

        {/* Shadow/Base */}
        <div className={`absolute bottom-1 w-3/4 h-2 rounded-full opacity-60 blur-[2px] transition-all duration-300
            ${color === 'w' ? 'bg-blue-400 group-hover:bg-blue-300' : 'bg-red-600 group-hover:bg-red-400'}`}>
        </div>
        
        {id > 0 && (
            <img 
                src={spriteUrl} 
                alt={`${color === 'w' ? 'White' : 'Black'} ${type} - ${pokemonDef?.name}`}
                loading="lazy"
                style={{ filter: imageFilter }}
                className={`w-full h-full object-contain z-10 transition-all duration-200 animate-float ${auraClass}`}
            />
        )}
        
        {/* Type Icon Badge */}
        <span className={`absolute -bottom-1 -right-1 text-[8px] font-bold px-1.5 py-0.5 rounded shadow-sm scale-90 z-20 pointer-events-none
            ${color === 'w' ? 'bg-white text-blue-900 border border-blue-900' : 'bg-gray-800 text-red-500 border border-red-500'}`}>
            {primaryType.substring(0,3).toUpperCase()}
        </span>
    </div>
  );
});

export default PokemonPiece;