
import React, { useState, useEffect } from 'react';
import { peerService, PeerStatus } from '../utils/peerService';
import { toast } from 'react-hot-toast';
import { Copy, Loader2, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

interface OnlineModalProps {
  onJoin: (isHost: boolean) => void;
  onCancel: () => void;
}

const OnlineModal: React.FC<OnlineModalProps> = ({ onJoin, onCancel }) => {
  const [step, setStep] = useState<'menu' | 'host' | 'join'>('menu');
  const [myId, setMyId] = useState<string>('');
  const [targetId, setTargetId] = useState<string>('');
  const [peerStatus, setPeerStatus] = useState<PeerStatus>('idle');

  useEffect(() => {
    let isMounted = true;

    peerService.getMyId().then(id => {
      if (isMounted) setMyId(id);
    });
    
    const unsubscribeStatus = peerService.onStatusChange((status) => {
      if (isMounted) setPeerStatus(status);
    });
    
    setPeerStatus(peerService.getStatus());

    return () => {
      isMounted = false;
      unsubscribeStatus();
    };
  }, []);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const unsubscribe = peerService.onConnect(() => {
        toast.success("Opponent Connected!");
        timeoutId = setTimeout(() => onJoin(step === 'host'), 1000);
    });

    return () => {
      unsubscribe();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [onJoin, step]);

  const handleCopy = () => {
      navigator.clipboard.writeText(myId);
      toast.success("ID Copied!");
  };

  const handleConnect = () => {
      if(!targetId) return;
      peerService.connect(targetId);
  };

  const handleRetry = () => {
      if (step === 'join' && targetId) {
        peerService.connect(targetId);
      } else {
        peerService.reconnect();
      }
  };

  const getStatusBadge = () => {
    switch(peerStatus) {
      case 'idle':
        return (
          <div className="flex items-center gap-2 text-gray-400">
            <div className="w-2 h-2 rounded-full bg-gray-400"></div>
            <span className="text-xs">Idle</span>
          </div>
        );
      case 'waiting':
        return (
          <div className="flex items-center gap-2 text-blue-400">
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
            <span className="text-xs">Waiting...</span>
          </div>
        );
      case 'connecting':
        return (
          <div className="flex items-center gap-2 text-yellow-400">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-xs">Connecting...</span>
          </div>
        );
      case 'open':
        return (
          <div className="flex items-center gap-2 text-green-400">
            <CheckCircle size={16} />
            <span className="text-xs">Connected!</span>
          </div>
        );
      case 'reconnecting':
        return (
          <div className="flex items-center gap-2 text-orange-400">
            <RefreshCw size={16} className="animate-spin" />
            <span className="text-xs">Reconnecting...</span>
          </div>
        );
      case 'closed':
        return (
          <div className="flex items-center gap-2 text-red-400">
            <XCircle size={16} />
            <span className="text-xs">Disconnected</span>
          </div>
        );
      default:
        return null;
    }
  };

  const canConnect = ['idle', 'waiting', 'closed'].includes(peerStatus);
  const showRetry = step === 'join' && (peerStatus === 'closed' || peerStatus === 'reconnecting');

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fadeIn p-4">
      <div className="bg-gray-900 border-2 border-purple-500 rounded-xl shadow-2xl w-full max-w-md p-6 text-center">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-pixel text-purple-400 tracking-wide">Online Lobby</h2>
          {getStatusBadge()}
        </div>

        {step === 'menu' && (
            <div className="grid gap-4">
                <button 
                    onClick={() => setStep('host')}
                    className="p-4 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg flex flex-col items-center transition-colors"
                >
                    <span className="text-2xl mb-2">📡</span>
                    <span className="font-bold text-white">Host Game</span>
                    <span className="text-xs text-gray-400">Create a room and invite a friend</span>
                </button>
                <button 
                    onClick={() => setStep('join')}
                    className="p-4 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg flex flex-col items-center transition-colors"
                >
                    <span className="text-2xl mb-2">🔗</span>
                    <span className="font-bold text-white">Join Game</span>
                    <span className="text-xs text-gray-400">Enter a friend's room code</span>
                </button>
            </div>
        )}

        {step === 'host' && (
            <div className="space-y-4">
                <p className="text-sm text-gray-300">Share this Code with your friend:</p>
                <div className="flex items-center gap-2 bg-gray-800 p-3 rounded border border-gray-600">
                    <code className="flex-grow text-yellow-400 font-mono text-lg">{myId || "Generating..."}</code>
                    <button 
                      onClick={handleCopy} 
                      disabled={!myId}
                      className="text-gray-400 hover:text-white disabled:opacity-50"
                    >
                      <Copy size={20}/>
                    </button>
                </div>
                <div className="flex flex-col items-center justify-center gap-2 mt-4 min-h-[60px]">
                    {peerStatus === 'waiting' && (
                      <>
                        <Loader2 size={24} className="text-purple-400 animate-spin" />
                        <p className="text-xs text-gray-400">Waiting for opponent...</p>
                      </>
                    )}
                    {peerStatus === 'connecting' && (
                      <>
                        <Loader2 size={24} className="text-yellow-400 animate-spin" />
                        <p className="text-xs text-gray-400">Connecting...</p>
                      </>
                    )}
                    {peerStatus === 'open' && (
                      <>
                        <CheckCircle size={24} className="text-green-400" />
                        <p className="text-xs text-green-400">Connected! Starting game...</p>
                      </>
                    )}
                    {(peerStatus === 'closed' || peerStatus === 'reconnecting') && (
                      <>
                        <XCircle size={24} className="text-red-400" />
                        <p className="text-xs text-red-400">Connection lost. Retry?</p>
                        <button
                          onClick={handleRetry}
                          className="mt-2 inline-flex items-center gap-2 rounded px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-transform active:scale-95"
                        >
                          <RefreshCw size={16} /> Retry
                        </button>
                      </>
                    )}
                </div>
            </div>
        )}

        {step === 'join' && (
             <div className="space-y-4">
                <p className="text-sm text-gray-300">Enter Room Code:</p>
                <input 
                    value={targetId}
                    onChange={(e) => setTargetId(e.target.value)}
                    placeholder="paste code here..."
                    disabled={!canConnect}
                    className="w-full bg-gray-800 border border-gray-600 p-3 rounded text-white font-mono text-center focus:border-purple-500 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button 
                    onClick={handleConnect}
                    disabled={!targetId || !canConnect}
                    className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold py-3 rounded shadow transition-transform active:scale-95 disabled:active:scale-100"
                >
                    {peerStatus === 'connecting' ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 size={18} className="animate-spin" />
                        Connecting...
                      </span>
                    ) : 'Connect'}
                </button>
                
                {showRetry && (
                  <button 
                      onClick={handleRetry}
                      className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded shadow transition-transform active:scale-95 flex items-center justify-center gap-2"
                  >
                      <RefreshCw size={18} />
                      Retry Connection
                  </button>
                )}
                
                <div className="min-h-[40px] flex items-center justify-center">
                  {peerStatus === 'reconnecting' && (
                    <div className="flex items-center gap-2 text-orange-400">
                      <RefreshCw size={16} className="animate-spin" />
                      <span className="text-xs">Attempting to reconnect...</span>
                    </div>
                  )}
                  {peerStatus === 'open' && (
                    <div className="flex items-center gap-2 text-green-400">
                      <CheckCircle size={16} />
                      <span className="text-xs">Connected! Starting game...</span>
                    </div>
                  )}
                </div>
             </div>
        )}

        <button 
          onClick={onCancel} 
          disabled={peerStatus === 'connecting'}
          className="mt-8 text-sm text-gray-500 hover:text-white underline disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default OnlineModal;
