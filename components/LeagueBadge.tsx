
import React from 'react';
import { LEAGUES } from '../constants';

interface LeagueBadgeProps {
  rating: number;
}

const LeagueBadge: React.FC<LeagueBadgeProps> = ({ rating }) => {
  const league = LEAGUES.slice().reverse().find(l => rating >= l.minRating) || LEAGUES[0];

  return (
    <div className="flex flex-col items-center">
      <div 
        className="w-12 h-12 flex items-center justify-center rounded-full border-4 shadow-lg mb-1 relative overflow-hidden group"
        style={{ borderColor: league.color, backgroundColor: `${league.color}33` }}
      >
        <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
        <span className="text-2xl z-10 drop-shadow-md">
            {league.id === 'bronze' && '🥉'}
            {league.id === 'silver' && '🥈'}
            {league.id === 'gold' && '🥇'}
            {league.id === 'platinum' && '💠'}
            {league.id === 'diamond' && '💎'}
            {league.id === 'master' && '🟣'}
        </span>
      </div>
      <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: league.color }}>
        {league.name}
      </div>
      <div className="text-[9px] text-gray-400 font-mono">
          {rating} pts
      </div>
    </div>
  );
};

export default LeagueBadge;
