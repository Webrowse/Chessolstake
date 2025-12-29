
import React from 'react';
import { TrainerStats, XPState } from '../types';

interface TrainerCardProps {
  stats: TrainerStats;
  xpState: XPState;
  username?: string;
  hasGoldCard?: boolean;
  hasAshHat?: boolean;
}

const TrainerCard: React.FC<TrainerCardProps> = ({ stats, xpState, username = "Trainer", hasGoldCard = false, hasAshHat = false }) => {
  const winRate = stats.gamesPlayed > 0 ? Math.round((stats.wins / stats.gamesPlayed) * 100) : 0;

  return (
    <div className={`rounded-2xl p-6 relative overflow-hidden font-sans transition-all duration-500 group shadow-2xl border border-white/5
        ${hasGoldCard 
            ? 'bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-700 text-black border-yellow-200/50' 
            : 'bg-gradient-to-br from-slate-800 to-slate-900 text-white'
        }
    `}>
        {/* Holographic / Texture Effects */}
        <div className="absolute inset-0 bg-noise opacity-30 mix-blend-overlay"></div>
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-[80px]"></div>
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px]"></div>
        
        {hasGoldCard ? (
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-30 mix-blend-soft-light"></div>
        ) : (
             <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none opacity-50 bg-[length:4px_4px] bg-[radial-gradient(white_1px,transparent_0)]"></div>
        )}

        {/* Shiny Holo Overlay on Hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shine opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
        
        {/* Header Section */}
        <div className="flex items-start justify-between mb-8 relative z-10">
             <div className="flex items-center gap-5">
                 <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border border-white/20 shadow-xl relative overflow-hidden ${hasGoldCard ? 'bg-black' : 'bg-gradient-to-br from-blue-600 to-blue-700'}`}>
                     <span className="text-4xl relative z-10 filter drop-shadow-md transform group-hover:scale-110 transition-transform duration-300">
                        {hasAshHat ? '🧢' : '👤'}
                     </span>
                     <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent"></div>
                 </div>
                 <div>
                     <h3 className={`font-bold text-2xl leading-none mb-1.5 font-pixel tracking-wide ${hasGoldCard ? 'text-black drop-shadow-sm' : 'text-white'}`}>{username}</h3>
                     <div className="flex items-center gap-2">
                        <span className={`text-[10px] uppercase tracking-[0.2em] font-bold px-2 py-1 rounded shadow-sm backdrop-blur-sm ${hasGoldCard ? 'bg-black text-yellow-400' : 'bg-white/10 text-blue-200 border border-white/10'}`}>Lvl {xpState.level}</span>
                     </div>
                 </div>
             </div>
             <div className="text-right opacity-80">
                 <div className="w-10 h-7 bg-white/10 border border-white/20 rounded-md flex items-center justify-center mb-1 ml-auto backdrop-blur-sm shadow-sm">
                    <div className="w-7 h-5 border-2 border-white/30 rounded-[2px] opacity-70"></div>
                 </div>
                 <div className={`text-[9px] font-mono tracking-widest ${hasGoldCard ? 'text-black' : 'text-slate-400'}`}>ID: 8934-2210</div>
             </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 text-center mb-6 relative z-10">
            {[
                { label: 'Wins', val: stats.wins, color: hasGoldCard ? 'text-green-900' : 'text-green-400' },
                { label: 'Losses', val: stats.losses, color: hasGoldCard ? 'text-red-900' : 'text-red-400' },
                { label: 'Win Rate', val: `${winRate}%`, color: hasGoldCard ? 'text-blue-900' : 'text-blue-400' },
            ].map((stat, i) => (
                <div key={i} className={`rounded-xl p-3 border backdrop-blur-sm shadow-sm transition-transform hover:-translate-y-1 ${hasGoldCard ? 'bg-white/30 border-black/5' : 'bg-slate-800/40 border-white/5'}`}>
                    <div className={`text-[9px] uppercase font-bold tracking-widest mb-1 opacity-70 ${hasGoldCard ? 'text-black' : 'text-slate-400'}`}>{stat.label}</div>
                    <div className={`text-xl font-bold font-mono ${stat.color}`}>{stat.val}</div>
                </div>
            ))}
        </div>

        {/* Footer / Streak */}
        <div className={`flex items-center justify-between rounded-xl px-4 py-3 relative z-10 border border-white/5 backdrop-blur-md ${hasGoldCard ? 'bg-black/10' : 'bg-black/20'}`}>
            <span className={`text-[10px] uppercase font-bold tracking-widest ${hasGoldCard ? 'text-black/70' : 'text-slate-400'}`}>Current Streak</span>
            <div className="flex items-center gap-1.5">
                {[...Array(Math.min(5, stats.currentStreak))].map((_, i) => (
                    <span key={i} className="text-base animate-pulse filter drop-shadow-md">🔥</span>
                ))}
                {stats.currentStreak > 5 && <span className="text-xs font-bold text-orange-400 bg-orange-900/30 px-1.5 py-0.5 rounded border border-orange-500/30 ml-1">+{stats.currentStreak - 5}</span>}
                {stats.currentStreak === 0 && <span className={`text-xs ${hasGoldCard ? 'text-black/40' : 'text-slate-600'}`}>-</span>}
            </div>
        </div>
    </div>
  );
};

export default TrainerCard;
