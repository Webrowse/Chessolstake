
import React from 'react';
import { Chess, Square } from 'chess.js';
import BoardSquare from './BoardSquare';
import CombatEffects from './CombatEffects';
import { PieceType, PieceColor, BoardOrientation, BoardEffect, TeamTheme, GameVariant, Emote } from '../types';
import { TEAM_PRESETS, KOTH_SQUARES, BOARD_THEMES } from '../constants';

interface ChessBoardProps {
  game: Chess;
  board: ({ type: PieceType; color: PieceColor } | null)[][];
  selectedSquare: Square | null;
  possibleMoves: string[];
  lastMove: { from: string; to: string } | null;
  onSquareClick: (square: Square) => void;
  orientation: BoardOrientation;
  boardEffect: BoardEffect | null;
  whiteTheme: TeamTheme;
  blackTheme: TeamTheme;
  gameVariant: GameVariant;
  emotes: Emote[]; 
  isOnFire?: boolean; 
}

const ChessBoard: React.FC<ChessBoardProps> = ({ 
  game, 
  board, 
  selectedSquare, 
  possibleMoves, 
  lastMove,
  onSquareClick,
  orientation,
  boardEffect,
  whiteTheme,
  blackTheme,
  gameVariant,
  emotes,
  isOnFire = false
}) => {
  const isCheck = game.inCheck();
  const turn = game.turn();
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  const getKingSquare = (color: PieceColor): string | null => {
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const piece = board[r][f];
        if (piece && piece.type === 'k' && piece.color === color) {
          return `${files[f]}${ranks[r]}`;
        }
      }
    }
    return null;
  };

  const kingInCheckSquare = isCheck ? getKingSquare(turn) : null;

  const displayRows = orientation === 'white' ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];
  const displayCols = orientation === 'white' ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];

  const isBigAttack = boardEffect?.variant === '3x3';
  const isCrit = boardEffect?.type === 'crit';
  
  const themeColors = BOARD_THEMES[whiteTheme];

  return (
    <div className={`relative w-full aspect-square bg-[#3d2f23] p-1 sm:p-2 rounded-xl shadow-elevation-3 border border-white/5 ${isBigAttack || isCrit ? 'animate-shake' : ''} ${isOnFire ? 'shadow-neon-blue border-blue-500/50 ring-4 ring-blue-500/20' : ''} transition-all duration-500 mx-auto max-w-2xl group`}>
      
      {/* "On Fire" Flames Effect */}
      {isOnFire && (
          <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden rounded-lg">
               <div className="absolute bottom-0 w-full h-48 bg-gradient-to-t from-blue-600 to-transparent opacity-40 animate-pulse blur-2xl"></div>
               <div className="absolute -inset-10 bg-[url('https://www.transparenttextures.com/patterns/fire.png')] opacity-30 animate-pulse mix-blend-screen"></div>
          </div>
      )}

      {/* Board Bezel / Depth */}
      <div className="w-full h-full bg-[#2a2018] p-1 rounded-lg shadow-inner">
          <div className="w-full h-full grid grid-rows-8 grid-cols-8 border-2 border-[#5c4a3d] relative overflow-hidden z-10 rounded shadow-2xl">
            {displayRows.map((r) => (
              displayCols.map((f) => {
                const piece = board[r][f];
                const squareLabel = `${files[f]}${ranks[r]}` as Square;
                const isValid = possibleMoves.includes(squareLabel);
                const isSelected = selectedSquare === squareLabel;
                const isLast = lastMove ? (lastMove.from === squareLabel || lastMove.to === squareLabel) : false;
                const isKingInCheck = kingInCheckSquare === squareLabel;

                let pokemonDef;
                if (piece) {
                    const theme = piece.color === 'w' ? whiteTheme : blackTheme;
                    pokemonDef = TEAM_PRESETS[theme][piece.type];
                }

                const isKoth = gameVariant === 'koth' && KOTH_SQUARES.includes(squareLabel);
                const squareEmotes = emotes.filter(e => e.square === squareLabel);

                return (
                  <div key={squareLabel} className="relative w-full h-full">
                      <BoardSquare
                        rank={r} 
                        file={f}
                        piece={piece}
                        pokemonDef={pokemonDef}
                        isValidMove={isValid}
                        isSelected={isSelected}
                        isLastMove={isLast}
                        isCheck={isKingInCheck}
                        isKothSquare={isKoth}
                        themeColors={themeColors}
                        onClick={() => onSquareClick(squareLabel)}
                      />
                      {/* Floating Emotes Layer */}
                      {squareEmotes.map(e => (
                          <div key={e.id} className="absolute inset-0 flex items-center justify-center pointer-events-none z-50 animate-float-up text-2xl sm:text-4xl drop-shadow-md">
                              {e.emoji}
                          </div>
                      ))}
                  </div>
                );
              })
            ))}
            
            {/* Animation Overlay */}
            {boardEffect && boardEffect.type !== 'crit' && (
                <CombatEffects 
                    type={boardEffect.type as any} 
                    targetSquare={boardEffect.targetSquare} 
                    orientation={orientation}
                    variant={boardEffect.variant}
                />
            )}
            
            {/* Critical Hit Overlay */}
            {isCrit && (
                 <div className="absolute inset-0 bg-red-500/20 z-50 pointer-events-none animate-pulse flex items-center justify-center backdrop-blur-[2px]">
                     <h1 className="text-4xl sm:text-6xl font-pixel text-yellow-400 drop-shadow-[4px_4px_0_#000] rotate-[-15deg] animate-bounce filter brightness-125">CRITICAL!</h1>
                 </div>
            )}
          </div>
      </div>
      
      <style>{`
        @keyframes float-up {
            0% { transform: translateY(0) scale(0.5); opacity: 0; }
            20% { opacity: 1; transform: translateY(-10px) scale(1.2); }
            100% { transform: translateY(-50px) scale(1); opacity: 0; }
        }
        .animate-float-up {
            animation: float-up 2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default ChessBoard;
