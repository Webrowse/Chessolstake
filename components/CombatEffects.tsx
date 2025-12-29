
import React from 'react';
import { AnimationType, BoardOrientation } from '../types';

interface CombatEffectsProps {
  type: AnimationType;
  targetSquare: string; // e.g., 'e4'
  orientation: BoardOrientation;
  variant: '1x1' | '3x3';
}

const CombatEffects: React.FC<CombatEffectsProps> = ({ type, targetSquare, orientation, variant }) => {
  // Convert algebraic notation (e.g., 'e4') to 0-7 indices
  const fileMap: Record<string, number> = { a: 0, b: 1, c: 2, d: 3, e: 4, f: 5, g: 6, h: 7 };
  const targetFileIndex = fileMap[targetSquare[0]];
  const targetRankIndex = 8 - parseInt(targetSquare[1]); // 0 is top (Rank 8)

  // Determine grid position based on orientation
  let row, col;
  if (orientation === 'white') {
    row = targetRankIndex;
    col = targetFileIndex;
  } else {
    row = 7 - targetRankIndex;
    col = 7 - targetFileIndex;
  }

  // Calculate Grid Area
  let gridRowStart, gridRowEnd, gridColStart, gridColEnd;

  if (variant === '3x3') {
      // 3x3 Area centered on target
      gridRowStart = Math.max(1, row);
      gridRowEnd = Math.min(9, row + 3);
      gridColStart = Math.max(1, col);
      gridColEnd = Math.min(9, col + 3);
  } else {
      // 1x1 Target Square only
      // CSS Grid is 1-indexed. Row index 0 in logic is grid line 1 to 2.
      gridRowStart = row + 1;
      gridRowEnd = row + 2;
      gridColStart = col + 1;
      gridColEnd = col + 2;
  }

  // Helper to render specific SVG effects
  const renderEffect = () => {
    switch (type) {
      // --- COMBAT ANIMATIONS (Usually 3x3) ---
      case 'thunderbolt':
        return (
          <div className="w-full h-full relative flex items-center justify-center animate-flash">
            <svg viewBox="0 0 100 100" className="absolute w-full h-full z-50 drop-shadow-[0_0_10px_rgba(255,255,0,0.8)]">
               <path d="M50 0 L30 40 L55 40 L25 100 L70 50 L45 50 L65 0 Z" fill="#FFFF00" stroke="white" strokeWidth="2" />
            </svg>
            <div className="absolute inset-0 bg-yellow-400 opacity-30 animate-pulse rounded-full blur-xl"></div>
            <div className="absolute top-0 left-0 w-4 h-4 bg-yellow-300 rounded-full animate-ping"></div>
          </div>
        );
      case 'fireblast':
        return (
          <div className="w-full h-full relative flex items-center justify-center">
             <div className="absolute inset-0 bg-red-500 opacity-40 animate-ping rounded-full blur-xl"></div>
             <svg viewBox="0 0 100 100" className="absolute w-full h-full z-50 animate-spin-slow">
               <path d="M50 10 Q60 40 90 50 Q60 60 50 90 Q40 60 10 50 Q40 40 50 10 Z" fill="#FF4500" className="drop-shadow-[0_0_15px_rgba(255,0,0,0.9)]" />
             </svg>
          </div>
        );
      case 'shadowball':
      case 'psychic':
         return (
            <div className="w-full h-full relative flex items-center justify-center">
               <div className="w-full h-full rounded-full bg-purple-700 opacity-60 animate-ping blur-md"></div>
               <div className="absolute w-3/4 h-3/4 rounded-full bg-fuchsia-500 animate-pulse shadow-[0_0_20px_purple]"></div>
            </div>
         );
      case 'hydropump':
      case 'water_splash':
         return (
             <div className="w-full h-full relative flex items-center justify-center">
               <div className="absolute inset-0 bg-blue-500 opacity-50 animate-ping rounded-full blur-xl"></div>
               <div className="w-full h-full bg-blue-600 rounded-full animate-scale-up-fade opacity-70"></div>
             </div>
         );
      case 'rockslide':
          return (
             <div className="w-full h-full relative flex items-center justify-center">
                <div className="absolute w-full h-full bg-amber-800 opacity-50 animate-bounce rounded-lg"></div>
                 <div className="absolute w-2/3 h-2/3 bg-stone-600 rotate-45 animate-ping"></div>
             </div>
          );

      // --- MOVE ANIMATIONS (Usually 1x1) ---
      case 'slam': // Snorlax/Golem landing
        return (
            <div className="w-full h-full relative flex items-center justify-center">
                <div className="absolute w-full h-full border-4 border-stone-600 rounded-full animate-ping opacity-50"></div>
                <div className="absolute w-[90%] h-[90%] bg-amber-900/40 rounded-full animate-pulse"></div>
            </div>
        );
      case 'teleport': // Mewtwo/Alakazam
         return (
            <div className="w-full h-full relative flex items-center justify-center">
                 <div className="absolute w-full h-full border-2 border-cyan-400 rounded-full animate-ping"></div>
                 <div className="absolute w-2 h-full bg-cyan-200 rotate-45 animate-spin"></div>
            </div>
         );
      case 'spark': // Pikachu move
         return (
             <div className="w-full h-full relative flex items-center justify-center">
                 <svg viewBox="0 0 24 24" className="w-full h-full animate-bounce text-yellow-400 drop-shadow-lg">
                    <path fill="currentColor" d="M11 15H6l7-14v8h5l-7 14v-8z" />
                 </svg>
             </div>
         );
      case 'flame': // Rapidash move
         return (
             <div className="w-full h-full relative flex items-center justify-center">
                 <div className="absolute bottom-0 w-3/4 h-3/4 bg-orange-500 rounded-t-full animate-pulse blur-sm"></div>
                 <div className="absolute bottom-1 w-1/2 h-1/2 bg-yellow-300 rounded-t-full animate-bounce"></div>
             </div>
         );
      case 'shadow': // Gengar move
          return (
              <div className="w-full h-full relative flex items-center justify-center bg-purple-900/50 rounded-full animate-pulse blur-sm">
                  <div className="absolute inset-0 bg-black/20 rounded-full"></div>
              </div>
          );
      default:
        return null;
    }
  };

  return (
    <div 
      className="pointer-events-none z-50 absolute inset-0 grid grid-rows-8 grid-cols-8"
    >
        <div 
            style={{
                gridRow: `${gridRowStart} / ${gridRowEnd}`,
                gridColumn: `${gridColStart} / ${gridColEnd}`,
            }}
            className="flex items-center justify-center relative p-1"
        >
            {renderEffect()}
        </div>
        
        <style>{`
            @keyframes flash {
                0%, 100% { opacity: 0; }
                10%, 90% { opacity: 1; }
                50% { opacity: 0.5; transform: scale(1.1); }
            }
            .animate-flash {
                animation: flash 0.5s ease-out forwards;
            }
            .animate-spin-slow {
                animation: spin 3s linear infinite;
            }
            @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }
        `}</style>
    </div>
  );
};

export default CombatEffects;
