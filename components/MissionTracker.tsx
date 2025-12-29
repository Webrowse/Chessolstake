
import React from 'react';
import { Mission } from '../types';

interface MissionTrackerProps {
  missions: Mission[];
}

const MissionTracker: React.FC<MissionTrackerProps> = ({ missions }) => {
  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 shadow-lg w-full">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span>📅</span> Daily Research
        </h3>
        <div className="space-y-3">
            {missions.map(mission => (
                <div key={mission.id} className="relative group">
                    <div className="flex justify-between items-center mb-1">
                        <span className={`text-xs ${mission.completed ? 'text-green-400 line-through' : 'text-gray-200'}`}>
                            {mission.description}
                        </span>
                        {mission.completed ? (
                             <span className="text-[10px] font-bold text-green-400 bg-green-900/30 px-2 py-0.5 rounded">DONE</span>
                        ) : (
                             <span className="text-[10px] font-bold text-yellow-500">{mission.rewardXp} XP</span>
                        )}
                    </div>
                    <div className="h-1.5 w-full bg-gray-700 rounded-full overflow-hidden">
                        <div 
                            className={`h-full transition-all duration-500 ${mission.completed ? 'bg-green-500' : 'bg-blue-500'}`}
                            style={{ width: `${Math.min(100, (mission.current / mission.target) * 100)}%` }}
                        ></div>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};

export default MissionTracker;
