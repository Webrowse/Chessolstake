
import React from 'react';
import { TrainerStats, XPState, Mission } from '../types';
import TrainerCard from './TrainerCard';
import MissionTracker from './MissionTracker';
import { Zap, ChevronDown } from 'lucide-react';

interface ProfileViewProps {
  trainerStats: TrainerStats;
  xpState: XPState;
  missions: Mission[];
  onOpenTower: () => void;
  inventory: string[];
}

const ProfileView: React.FC<ProfileViewProps> = ({ trainerStats, xpState, missions, onOpenTower, inventory }) => {
  return (
    <div className="p-3 space-y-4 h-full overflow-y-auto scrollbar-hide relative">
        
        <TrainerCard 
            stats={trainerStats} 
            xpState={xpState} 
            hasGoldCard={inventory.includes('card_gold')}
            hasAshHat={inventory.includes('avatar_ash')}
        />
        
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2">
             <div className="bg-slate-800/50 p-2 rounded-xl border border-slate-700 flex flex-col items-center justify-center gap-1 group hover:border-slate-600 transition-colors">
                <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">🔥</span>
                <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Top Streak</span>
                <span className="font-mono font-bold text-yellow-400 text-lg leading-none">{trainerStats.highestStreak}</span>
             </div>
             <div className="bg-slate-800/50 p-2 rounded-xl border border-slate-700 flex flex-col items-center justify-center gap-1 group hover:border-slate-600 transition-colors">
                <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">⚔️</span>
                <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">Matches</span>
                <span className="font-mono font-bold text-white text-lg leading-none">{trainerStats.gamesPlayed}</span>
             </div>
        </div>

        <button 
            onClick={onOpenTower} 
            className="w-full bg-gradient-to-r from-purple-900 to-purple-800 hover:from-purple-800 hover:to-purple-700 p-3 rounded-xl flex items-center justify-between border border-purple-500/30 shadow-lg group transition-all transform active:scale-[0.98] relative overflow-hidden"
        >
            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex items-center gap-3 z-10">
                <div className="bg-purple-950 p-2 rounded-lg text-yellow-400">
                    <Zap size={20} className="fill-current" />
                </div>
                <div className="text-left">
                    <div className="text-sm font-bold text-purple-100 font-pixel">TRAINER TOWER</div>
                    <div className="text-[10px] text-purple-300 uppercase tracking-wide">Tactics Puzzle Rush</div>
                </div>
            </div>
            <div className="z-10 bg-purple-950/50 px-2 py-1 rounded text-[10px] font-bold text-purple-300 border border-purple-500/20">
                ENTER
            </div>
        </button>

        <MissionTracker missions={missions} />

        {/* Scroll Indicator */}
        <div className="absolute bottom-3 right-3 w-8 h-8 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/20 animate-bounce">
            <ChevronDown className="w-4 h-4 text-white" />
        </div>
    </div>
  );
};

export default ProfileView;
