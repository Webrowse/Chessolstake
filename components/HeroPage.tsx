
import React from 'react';
import { SPRITE_BASE_URL } from '../constants';

interface HeroPageProps {
  onEnter: () => void;
}

const HeroPage: React.FC<HeroPageProps> = ({ onEnter }) => {
  return (
    <div className="relative z-50 h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-slate-950 cursor-pointer" onClick={onEnter}>
      
      {/* Premium Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-black z-0"></div>
      <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] z-0 mix-blend-overlay"></div>

      {/* Floating Particles/Stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(30)].map((_, i) => (
              <div 
                key={i}
                className="absolute bg-white rounded-full opacity-10 animate-float-slow"
                style={{
                    width: Math.random() * 3 + 'px',
                    height: Math.random() * 3 + 'px',
                    top: Math.random() * 100 + '%',
                    left: Math.random() * 100 + '%',
                    animationDuration: Math.random() * 10 + 5 + 's',
                    animationDelay: Math.random() * 5 + 's'
                }}
              />
          ))}
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 w-full max-w-7xl px-4 flex flex-col items-center gap-4 md:gap-6 animate-fade-in">
        
        {/* Title Section */}
        <div className="text-center relative group">
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-pixel text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 drop-shadow-neon-yellow tracking-widest relative z-10 transform group-hover:scale-105 transition-transform duration-700 ease-out whitespace-nowrap">
                <span className="md:hidden">P<span className="text-blue-500 drop-shadow-neon-blue">-CHESS</span></span>
                <span className="hidden md:inline">POKE<span className="text-transparent bg-clip-text bg-gradient-to-b from-blue-400 to-blue-700 drop-shadow-neon-blue">CHESS</span></span>
            </h1>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[50%] bg-blue-500/10 blur-[100px] rounded-full animate-pulse-slow"></div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-center w-full max-w-5xl mx-auto">
            
            {/* LEFT: The Battle Art */}
            <div className="flex flex-col items-center justify-center gap-4 order-2 md:order-1">
                <div className="flex items-center justify-center gap-4 md:gap-8 relative">
                    {/* Connecting Energy Beam */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-1 bg-gradient-to-r from-yellow-500 via-white to-purple-500 opacity-50 blur-sm"></div>

                    {/* Pikachu */}
                    <div className="relative group/pika z-10">
                        <div className="absolute inset-0 bg-yellow-500/20 blur-2xl rounded-full group-hover/pika:bg-yellow-500/40 transition-all duration-500"></div>
                        <img 
                            src={`${SPRITE_BASE_URL}25.png`} 
                            alt="Pikachu" 
                            className="w-16 h-16 md:w-32 md:h-32 object-contain pixelated transform scale-x-[-1] animate-float-slow drop-shadow-lg relative z-10"
                        />
                    </div>

                    <div className="text-3xl md:text-5xl font-black italic text-slate-700 font-pixel z-10 mix-blend-overlay">VS</div>

                    {/* Mewtwo */}
                    <div className="relative group/mew z-10">
                        <div className="absolute inset-0 bg-purple-600/20 blur-2xl rounded-full group-hover/mew:bg-purple-600/40 transition-all duration-500"></div>
                        <img 
                            src={`${SPRITE_BASE_URL}150.png`} 
                            alt="Mewtwo" 
                            className="w-16 h-16 md:w-32 md:h-32 object-contain pixelated animate-float-slow drop-shadow-lg relative z-10"
                            style={{ animationDelay: '1s' }}
                        />
                    </div>
                </div>
                
                <div className="text-center space-y-2 glass-panel px-6 py-3 rounded-full">
                    <p className="text-blue-200 font-bold tracking-[0.2em] text-xs">CHOOSE YOUR SIDE</p>
                </div>
            </div>

            {/* RIGHT: Game Details */}
            <div className="flex flex-col items-center order-1 md:order-2 w-full space-y-4">
                <div className="relative w-full max-w-md aspect-video bg-slate-900 rounded-xl border border-slate-700 shadow-2xl overflow-hidden transform md:rotate-2 hover:rotate-0 transition-all duration-700 group ring-1 ring-white/10">
                    <img 
                        src="https://images.unsplash.com/photo-1611195974226-a6a9be9dd763?w=800&auto=format&fit=crop&q=60" 
                        alt="Gameplay Preview" 
                        className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-700 scale-105 group-hover:scale-100"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent flex items-end p-6">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="font-pixel text-white text-xs tracking-widest drop-shadow-md">LIVE PREVIEW</span>
                        </div>
                    </div>
                    {/* Scanline */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_4px,6px_100%] pointer-events-none opacity-50"></div>
                </div>

                <div className="grid grid-cols-2 gap-3 w-full max-w-md">
                    {[
                        { title: "Smart AI", desc: "Powered by Gemini", color: "text-yellow-400" },
                        { title: "Battle FX", desc: "Dynamic Attacks", color: "text-red-400" },
                        { title: "PvP Mode", desc: "Local Multiplayer", color: "text-blue-400" },
                        { title: "Pixel Art", desc: "Retro Visuals", color: "text-green-400" }
                    ].map((feature, idx) => (
                        <div key={idx} className="glass-card p-3 rounded-lg flex flex-col justify-center hover:bg-white/5 transition-colors">
                            <h3 className={`${feature.color} font-bold text-xs uppercase mb-1 tracking-wider`}>{feature.title}</h3>
                            <p className="text-slate-400 text-[10px] font-mono">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </div>

        </div>

        {/* Call to Action */}
        <div className="mt-4 flex flex-col items-center gap-4 pb-4">
            <button 
                onClick={(e) => { e.stopPropagation(); onEnter(); }}
                className="group relative px-12 py-4 bg-transparent overflow-hidden rounded-full transition-all"
            >
                <div className="absolute inset-0 w-full h-full bg-slate-800/80 border border-slate-600 group-hover:border-yellow-500/50 transition-colors"></div>
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shine"></div>
                <span className="relative font-pixel text-white text-xl md:text-2xl group-hover:text-yellow-400 transition-colors drop-shadow-md tracking-wider">
                    PRESS START
                </span>
            </button>
            <p className="text-slate-600 text-[9px] font-mono tracking-[0.2em] uppercase opacity-70">
                Fan Game Project • React 19 • Gemini AI
            </p>
        </div>

      </div>
      
      <style>{`
        .pixelated { image-rendering: pixelated; }
      `}</style>
    </div>
  );
};

export default HeroPage;
