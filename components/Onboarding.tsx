
import React, { useState } from 'react';
import PokemonPiece from './PokemonPiece';

interface OnboardingProps {
  onComplete: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);

  const slides = [
    {
      title: "Welcome to PokeChess",
      desc: "Experience Chess like never before. Strategy meets the Pokemon world in this fully animated battle of wits.",
      icon: (
        <div className="text-6xl animate-bounce">🏆</div>
      )
    },
    {
      title: "Choose Your Team",
      desc: "Command the Heroes (White) led by Mewtwo, or the Villains (Black) led by Tyranitar. Each piece is a unique Pokemon.",
      content: (
        <div className="flex justify-center gap-6 my-6 bg-gray-800/50 p-4 rounded-xl border border-gray-700">
            <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16"><PokemonPiece type="p" color="w" /></div>
                <span className="text-xs text-blue-300 font-mono">Pawn</span>
            </div>
            <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16"><PokemonPiece type="r" color="w" /></div>
                <span className="text-xs text-blue-300 font-mono">Rook</span>
            </div>
            <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16"><PokemonPiece type="k" color="w" /></div>
                <span className="text-xs text-blue-300 font-mono">King</span>
            </div>
        </div>
      )
    },
    {
      title: "Elemental Combat",
      desc: "Captures unleash powerful attacks! Thunderbolt, Fire Blast, and Psychic moves light up the board when you take a piece.",
      icon: (
        <div className="relative w-24 h-24 flex items-center justify-center">
            <div className="absolute inset-0 bg-yellow-400 rounded-full blur-xl opacity-50 animate-pulse"></div>
            <div className="text-6xl relative z-10 animate-shake">⚡</div>
        </div>
      )
    },
    {
      title: "Gemini AI Rival",
      desc: "Challenge our AI powered by Google Gemini. It adopts a persona, trash-talks, and plays at your level.",
      icon: (
        <div className="text-6xl animate-pulse">🤖</div>
      )
    }
  ];

  const handleNext = () => {
    if (step < slides.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="relative z-50 flex flex-col items-center justify-center min-h-screen w-full p-6 animate-fadeIn">
      <div className="w-full max-w-lg bg-gray-900/90 border-2 border-gray-700 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-sm relative">
        
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gray-800">
            <div 
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${((step + 1) / slides.length) * 100}%` }}
            ></div>
        </div>

        <div className="p-8 flex flex-col items-center text-center min-h-[400px]">
            {/* Slide Content */}
            <div className="flex-grow flex flex-col items-center justify-center w-full">
                <div className="mb-6 transform transition-all duration-500 hover:scale-110">
                    {slides[step].icon ? slides[step].icon : slides[step].content}
                </div>
                
                <h2 className="text-2xl md:text-3xl font-pixel text-yellow-400 mb-4 tracking-wide h-16 flex items-center justify-center">
                    {slides[step].title}
                </h2>
                
                <p className="text-gray-300 text-sm md:text-base leading-relaxed max-w-xs h-24">
                    {slides[step].desc}
                </p>
            </div>

            {/* Controls */}
            <div className="w-full mt-8 flex items-center justify-between">
                <button 
                    onClick={onComplete}
                    className="text-gray-500 hover:text-gray-300 text-xs font-bold uppercase tracking-wider px-4 py-2"
                >
                    Skip
                </button>

                <div className="flex gap-2">
                    {slides.map((_, i) => (
                        <div 
                            key={i} 
                            className={`w-2 h-2 rounded-full transition-colors ${i === step ? 'bg-blue-500' : 'bg-gray-700'}`}
                        />
                    ))}
                </div>

                <button 
                    onClick={handleNext}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-full font-bold text-sm shadow-lg transition-transform active:scale-95 flex items-center gap-2"
                >
                    {step === slides.length - 1 ? 'Start' : 'Next'}
                    <span>→</span>
                </button>
            </div>
        </div>
      </div>
      
      <style>{`
        .animate-shake {
            animation: shake 2s infinite;
        }
        @keyframes shake {
            0%, 100% { transform: rotate(0deg); }
            25% { transform: rotate(-10deg); }
            75% { transform: rotate(10deg); }
        }
      `}</style>
    </div>
  );
};

export default Onboarding;
