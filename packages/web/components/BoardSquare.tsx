import React from 'react';
import { PieceColor, PieceType, PokemonDef, BoardTheme } from '../types';
import PokemonPiece from './PokemonPiece';

interface BoardSquareProps {
  rank: number; 
  file: number; 
  piece: { type: PieceType; color: PieceColor } | null;
  pokemonDef?: PokemonDef; 
  isValidMove: boolean;
  isLastMove: boolean;
  isSelected: boolean;
  isCheck: boolean;
  isKothSquare?: boolean;
  themeColors?: BoardTheme; 
  onClick: () => void;
}

const BoardSquare: React.FC<BoardSquareProps> = React.memo(({ 
  rank, 
  file, 
  piece, 
  pokemonDef,
  isValidMove, 
  isSelected,
  isLastMove,
  isCheck,
  isKothSquare,
  themeColors,
  onClick 
}) => {
  const isDark = (rank + file) % 2 === 1;
  const fileChar = String.fromCharCode(97 + file);
  const rankNum = 8 - rank;
  const squareId = `${fileChar}${rankNum}`;
  
  // Dynamic Biome Colors
  const lightColor = themeColors?.light || '#e2f1cd';
  const darkColor = themeColors?.dark || '#76a05e';
  
  // Highlight colors
  let overlayClass = '';
  if (isSelected) {
    overlayClass = 'bg-yellow-400/60 shadow-[inset_0_0_10px_rgba(255,200,0,0.5)]';
  } else if (isLastMove) {
    overlayClass = 'bg-blue-400/40';
  } else if (isCheck) {
    overlayClass = 'bg-red-600/70 animate-pulse';
  } else if (isKothSquare) {
      overlayClass = 'bg-purple-500/20 border-2 border-purple-500/30';
  }

  // Accessibility Label
  const pieceLabel = piece ? `${piece.color === 'w' ? 'White' : 'Black'} ${pokemonDef?.name || piece.type}` : 'Empty';
  const label = `${squareId}, ${pieceLabel}${isValidMove ? ', Valid Move' : ''}`;

  return (
    <div 
      onClick={onClick}
      role="gridcell"
      aria-label={label}
      tabIndex={piece || isValidMove ? 0 : -1} // Only focusable if interaction is possible
      onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onClick();
          }
      }}
      style={{ backgroundColor: isDark ? darkColor : lightColor }}
      className={`relative w-full h-full flex items-center justify-center cursor-pointer select-none transition-all duration-300 group overflow-hidden focus:z-10`}
    >
        {/* Rank/File notation on edges - Visual only, hidden from screen readers */}
        {file === 0 && (
            <span aria-hidden="true" className={`absolute top-0.5 left-1 text-[9px] font-bold opacity-70 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                {rankNum}
            </span>
        )}
        {rank === 7 && (
            <span aria-hidden="true" className={`absolute bottom-0 right-1 text-[9px] font-bold opacity-70 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                {fileChar}
            </span>
        )}

        {/* Highlight Overlay */}
        {overlayClass && (
            <div className={`absolute inset-0 ${overlayClass} transition-all duration-300 pointer-events-none`} />
        )}

        {/* Valid Move Indicator (Pokeball or Ring) */}
        {isValidMove && !piece && (
            <div className="absolute z-20 w-3 h-3 md:w-4 md:h-4 opacity-50 animate-bounce pointer-events-none">
                <div className="w-full h-full rounded-full border-2 border-gray-600 bg-gradient-to-b from-red-500 from-50% to-white to-50% shadow-sm"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-white border border-gray-600 rounded-full"></div>
            </div>
        )}
        
        {isValidMove && piece && (
             <div className="absolute inset-0 z-20 border-[4px] border-red-500/50 rounded-full animate-pulse pointer-events-none"></div>
        )}

        {/* Piece */}
        {piece && pokemonDef && (
            <div className={`w-[85%] h-[85%] z-10 transition-transform duration-200 ${isSelected ? 'scale-110 -translate-y-1' : 'group-hover:scale-105 group-hover:-translate-y-0.5'}`}>
                <PokemonPiece 
                    pokemonDef={pokemonDef}
                    type={piece.type} 
                    color={piece.color} 
                    isCheck={isCheck} 
                />
            </div>
        )}
    </div>
  );
});

export default BoardSquare;