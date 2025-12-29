
import React, { useState, useEffect } from 'react';
import { GameMode, XPState, TrainerStats, Mission, ShopItem } from '../types';
import ProfileView from './ProfileView';
import ShopList from './ShopList';
import { LEAGUES } from '../constants';
import Loader from './ui/Loader';
import { Play, Users, Globe, ChevronRight, Coins } from 'lucide-react';

interface LandingPageProps {
  onStartGame: (mode: GameMode) => void;
  xpState: XPState;
  trainerStats: TrainerStats;
  missions: Mission[];
  coins: number;
  inventory: string[];
  onBuyItem: (item: ShopItem) => void;
  onOpenTower: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ 
    onStartGame, xpState, trainerStats, missions, coins, inventory, onBuyItem, onOpenTower 
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'shop'>('profile');
  const [isLoading, setIsLoading] = useState(true);
  
  const league = LEAGUES.slice().reverse().find(l => trainerStats.rating >= l.minRating) || LEAGUES[0];

  useEffect(() => {
      const timer = setTimeout(() => setIsLoading(false), 800);
      return () => clearTimeout(timer);
  }, []);

  const MenuCard = ({ 
      title, subtitle, icon: Icon, color, onClick 
  }: { title: string, subtitle: string, icon: any, color: string, onClick: () => void }) => (
    <button
        onClick={onClick}
        className="group relative w-full text-left overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
    >
        <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-10 group-hover:opacity-20 transition-opacity`}></div>
        <div className="absolute inset-0 glass-panel border border-white/5 group-hover:border-white/20 transition-colors"></div>
        
        <div className="relative p-6 flex items-center justify-between z-10">
            <div className="flex items-center gap-5">
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="text-white w-7 h-7" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white font-pixel uppercase tracking-wide mb-1 group-hover:text-yellow-400 transition-colors">{title}</h3>
                    <p className="text-slate-400 text-xs font-medium tracking-wider">{subtitle}</p>
                </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <ChevronRight className="text-slate-400 group-hover:text-white w-5 h-5" />
            </div>
        </div>
    </button>
  );

  return (
    <div className="relative z-20 w-full h-screen flex flex-col lg:grid lg:grid-cols-[1fr_420px] gap-4 lg:gap-8 items-center justify-center max-w-7xl mx-auto p-4 pt-8 lg:pt-4">
      
      {/* LEFT COLUMN: HERO & MENU */}
        <div className="flex flex-col justify-center w-full space-y-6 lg:space-y-8">        {/* Title Block */}
        <div className="text-center lg:text-left space-y-4">
            <h1 className="text-4xl md:text-6xl font-pixel text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400 drop-shadow-sm tracking-tighter">
                <span className="lg:hidden">P<span className="text-blue-500">.CHESS</span></span>
                <span className="hidden lg:inline">POKE<span className="text-blue-500 text-glow">CHESS</span></span>
            </h1>
            <p className="text-slate-400 text-lg font-light tracking-wide leading-relaxed max-w-lg mx-auto lg:mx-0">
                Master the board. Catch the Kassng. <br/> 
                <span className="text-blue-400 font-bold border-b border-blue-400/30">Strategy</span> meets <span className="text-red-500 font-bold border-b border-red-500/30">Adventure</span>.
            </p>
        </div>

        {/* Menu Grid */}
        <div className="flex flex-col gap-3 w-full max-w-lg mx-auto lg:mx-0">
            <MenuCard 
                title="Vs Computer" 
                subtitle="Challenge the Gemini AI Rival" 
                icon={Play} 
                color="from-blue-600 to-blue-800"
                onClick={() => onStartGame('ai')}
            />
            <MenuCard 
                title="Local PvP" 
                subtitle="Pass & Play Mode" 
                icon={Users} 
                color="from-emerald-600 to-emerald-800"
                onClick={() => onStartGame('p2p')}
            />
            <MenuCard
                title="Online"
                subtitle="Play Remote Multiplayer"
                icon={Globe}
                color="from-purple-600 to-purple-800"
                onClick={() => onStartGame('online')}
            />
            <MenuCard
                title="Staked Battle"
                subtitle="Bet SOL & Win Rewards"
                icon={Coins}
                color="from-yellow-500 to-orange-600"
                onClick={() => onStartGame('staked_online')}
            />
        </div>
      </div>

      {/* RIGHT COLUMN: TRAINER DASHBOARD */}
      <div className="w-full h-[500px] lg:h-[600px] flex flex-col relative group">
          <div className="absolute inset-0 bg-blue-500/5 blur-3xl rounded-full opacity-50 -z-10 group-hover:opacity-75 transition-opacity duration-1000"></div>
          
          {/* Device Container */}
          <div className="relative w-full h-full glass-panel rounded-3xl shadow-2xl flex flex-col overflow-hidden ring-1 ring-white/10 backdrop-blur-xl">
               
               {/* Header / Status Bar */}
               <div className="bg-slate-900/50 p-4 border-b border-white/5 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-2xl border border-white/10 flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900 shadow-inner relative overflow-hidden group/league">
                             <div className="absolute inset-0 bg-white/5 opacity-0 group-hover/league:opacity-100 transition-opacity"></div>
                             <span className="text-2xl relative z-10 filter drop-shadow-md">
                                 {league.id === 'bronze' && '🥉'}
                                 {league.id === 'silver' && '🥈'}
                                 {league.id === 'gold' && '🥇'}
                                 {league.id === 'platinum' && '💠'}
                                 {league.id === 'diamond' && '💎'}
                                 {league.id === 'master' && '🟣'}
                             </span>
                         </div>
                         <div className="flex flex-col gap-1">
                             <span className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] leading-none" style={{ color: league.color }}>{league.name}</span>
                             <span className="text-xl text-white font-mono font-bold leading-none tracking-tight">{trainerStats.rating} <span className="text-xs text-slate-500">PTS</span></span>
                         </div>
                    </div>
                    <div className="bg-slate-950/50 px-4 py-2 rounded-xl border border-white/5 flex items-center gap-2 shadow-inner">
                          <span className="text-base">🪙</span>
                          <span className="text-base text-yellow-400 font-mono font-bold text-glow">{coins}</span>
                     </div>
               </div>

               {/* Tab Navigation */}
               <div className="flex p-2 gap-3 bg-slate-900/30 border-b border-white/5 shrink-0">
                    <button 
                        onClick={() => setActiveTab('profile')} 
                        className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 outline-none
                        ${activeTab === 'profile' 
                            ? 'bg-blue-600/90 text-white shadow-neon-blue border border-blue-400/30' 
                            : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-transparent'}`}
                    >
                        Profile
                    </button>
                    <button 
                        onClick={() => setActiveTab('shop')} 
                        className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 outline-none
                        ${activeTab === 'shop' 
                            ? 'bg-yellow-500/90 text-slate-900 shadow-neon-yellow border border-yellow-400/30' 
                            : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-transparent'}`}
                    >
                        PokeMart
                    </button>
               </div>

               {/* Scrollable Content Area */}
               <div className="flex-grow overflow-hidden relative bg-gradient-to-b from-slate-900/50 to-slate-950/80">
                    {isLoading ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                            <Loader />
                            <p className="text-[10px] text-slate-500 animate-pulse uppercase tracking-widest font-bold">Syncing Data...</p>
                        </div>
                    ) : (
                        <div className="h-full animate-fade-in relative z-10">
                            {activeTab === 'profile' && (
                                <ProfileView 
                                    trainerStats={trainerStats} 
                                    xpState={xpState} 
                                    missions={missions} 
                                    onOpenTower={onOpenTower} 
                                    inventory={inventory}
                                />
                            )}
                            {activeTab === 'shop' && (
                                <ShopList coins={coins} inventory={inventory} onBuyItem={onBuyItem} />
                            )}
                        </div>
                    )}
               </div>
          </div>
      </div>
    </div>
  );
};

export default LandingPage;
