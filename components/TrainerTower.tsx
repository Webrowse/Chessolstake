
import React, { useState, useEffect, useRef } from 'react';
import { Chess, Square } from 'chess.js';
import ChessBoard from './ChessBoard';
import { PUZZLES } from '../constants';
import { toast } from 'react-hot-toast';
import { playWinSound, playCheckSound, playStartSound } from '../utils/sound';

interface TrainerTowerProps {
  onExit: () => void;
  onScore: (score: number) => void;
}

const TrainerTower: React.FC<TrainerTowerProps> = ({ onExit, onScore }) => {
  const chessRef = useRef(new Chess());
  const [board, setBoard] = useState(chessRef.current.board());
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameOver, setGameOver] = useState(false);
  
  useEffect(() => {
      playStartSound();
      loadPuzzle(0);
      const timer = setInterval(() => {
          setTimeLeft(prev => {
              if (prev <= 1) {
                  clearInterval(timer);
                  setGameOver(true);
                  onScore(score); // Report score
                  return 0;
              }
              return prev - 1;
          });
      }, 1000);
      return () => clearInterval(timer);
  }, []);

  const loadPuzzle = (index: number) => {
      if (index >= PUZZLES.length) {
          setGameOver(true);
          onScore(score);
          toast.success("Tower Cleared! Amazing!");
          return;
      }
      const p = PUZZLES[index];
      chessRef.current = new Chess(p.fen);
      setBoard(chessRef.current.board());
      setPuzzleIndex(index);
  };

  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [validDestinations, setValidDestinations] = useState<string[]>([]);

  const onBoardClick = (square: Square) => {
      if (gameOver) return;
      const game = chessRef.current;

      // Select
      if (selectedSquare === null) {
          const piece = game.get(square);
          if (piece && piece.color === game.turn()) {
              setSelectedSquare(square);
              setValidDestinations(game.moves({ square, verbose: true }).map(m => m.to));
          }
          return;
      }

      // Move
      try {
          const move = game.move({ from: selectedSquare, to: square, promotion: 'q' });
          if (move) {
              // Check correctness
              const puzzle = PUZZLES[puzzleIndex];
              if (move.san === puzzle.solution[0]) {
                  playWinSound();
                  setScore(s => s + 10);
                  toast.success("Correct!", { duration: 500 });
                  setTimeout(() => {
                      loadPuzzle(puzzleIndex + 1);
                      setSelectedSquare(null);
                      setValidDestinations([]);
                  }, 500);
              } else {
                  playCheckSound();
                  toast.error("Wrong move! Try again.");
                  game.undo(); // Retry
                  setBoard(game.board());
                  setSelectedSquare(null);
                  setValidDestinations([]);
              }
          } else {
              // Deselect
              setSelectedSquare(null);
              setValidDestinations([]);
              onBoardClick(square); // Retry selection
          }
      } catch {
          setSelectedSquare(null);
          setValidDestinations([]);
      }
      setBoard(game.board());
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
        <div className="w-full max-w-lg mb-4 flex justify-between items-center bg-gray-800 p-4 rounded-xl border-2 border-purple-500 shadow-lg">
            <div>
                <h2 className="text-xl font-pixel text-purple-400">Trainer Tower</h2>
                <p className="text-xs text-gray-400">Solve the tactics!</p>
            </div>
            <div className="flex gap-6">
                 <div className="text-center">
                     <div className="text-xs uppercase text-gray-500 font-bold">Score</div>
                     <div className="text-2xl font-mono text-yellow-400">{score}</div>
                 </div>
                 <div className="text-center">
                     <div className="text-xs uppercase text-gray-500 font-bold">Time</div>
                     <div className={`text-2xl font-mono ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>{timeLeft}s</div>
                 </div>
            </div>
        </div>

        <div className="mb-4">
             <ChessBoard 
                game={chessRef.current}
                board={board}
                selectedSquare={selectedSquare}
                possibleMoves={validDestinations}
                lastMove={null}
                onSquareClick={onBoardClick}
                orientation="white"
                boardEffect={null}
                whiteTheme="classic_hero"
                blackTheme="classic_villain"
                gameVariant="standard"
                emotes={[]}
             />
        </div>

        {gameOver && (
            <div className="absolute inset-0 bg-black/80 z-50 flex flex-col items-center justify-center animate-fadeIn">
                <h1 className="text-4xl font-pixel text-yellow-400 mb-4">Time's Up!</h1>
                <p className="text-2xl text-white mb-8">Final Score: {score}</p>
                <button onClick={onExit} className="bg-blue-600 px-8 py-3 rounded font-bold hover:bg-blue-500">Return to Menu</button>
            </div>
        )}
        
        <button onClick={onExit} className="text-gray-500 underline mt-4 hover:text-white">Exit Tower</button>
    </div>
  );
};

export default TrainerTower;
