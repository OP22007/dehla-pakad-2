import React, { useState } from 'react';
import { CasinoButton } from './CasinoButton';
import { CopyIcon, CheckIcon, UserIcon, ArrowLeftIcon } from './icons/GeneralIcons';

interface Player {
  id: string;
  name: string;
  isReady: boolean;
  isHost?: boolean;
}

interface WaitingRoomProps {
  roomCode: string;
  players: Player[];
  currentPlayerId: string;
  onReadyToggle: () => void;
  onLeave: () => void;
  onStartGame: () => void;
}

export const WaitingRoom: React.FC<WaitingRoomProps> = ({
  roomCode,
  players,
  currentPlayerId,
  onReadyToggle,
  onLeave,
  onStartGame
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentPlayer = players.find(p => p.id === currentPlayerId);
  const isHost = currentPlayer?.isHost;
  const allReady = players.length === 4 && players.every(p => p.isReady);

  // Fill empty slots to always show 4
  const displaySlots = [...players, ...Array(4 - players.length).fill(null)];

  return (
    <div className="min-h-screen flex flex-col items-center p-8 bg-casino-green-950 relative overflow-hidden animate-fade-in">
      {/* Background Pattern */}
      <div className="absolute inset-0 felt-texture opacity-30 pointer-events-none" />

      {/* Header */}
      <div className="w-full max-w-4xl flex items-center justify-between mb-12 z-10">
        <button 
          onClick={onLeave}
          className="flex items-center gap-2 text-gold-300 hover:text-gold-100 transition-colors font-playfair"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Back to Lobby
        </button>
        
        <div className="flex flex-col items-center">
          <h2 className="text-gold-200 font-playfair text-xl">Room Code</h2>
          <button 
            onClick={handleCopyCode}
            className="flex items-center gap-3 bg-casino-green-900 border border-gold-500/30 px-6 py-2 rounded-full hover:bg-casino-green-800 transition-all group"
          >
            <span className="text-3xl font-mono font-bold text-gold-100 tracking-widest">{roomCode}</span>
            <div className="relative">
              <CopyIcon className="w-5 h-5 text-gold-400 group-hover:text-gold-200" />
              {copied && (
                <span className="absolute -top-8 -left-4 bg-gold-500 text-casino-green-950 text-xs font-bold px-2 py-1 rounded animate-fade-in-up">
                  Copied!
                </span>
              )}
            </div>
          </button>
        </div>
        
        <div className="w-24" /> {/* Spacer for centering */}
      </div>

      {/* Players Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl z-10 mb-12">
        {displaySlots.map((player, index) => (
          <div 
            key={player ? player.id : `empty-${index}`}
            className={`
              relative h-32 rounded-xl border-2 transition-all duration-300 flex items-center px-6 gap-4
              ${player 
                ? 'bg-leather-texture border-gold-500 shadow-[0_4px_20px_rgba(0,0,0,0.4)]' 
                : 'bg-casino-green-900/50 border-gold-500/20 border-dashed'}
              ${player?.id === currentPlayerId ? 'ring-2 ring-gold-300 ring-offset-2 ring-offset-casino-green-950' : ''}
            `}
          >
            {player ? (
              <>
                {/* Avatar */}
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-casino-green-800 border-2 border-gold-400 flex items-center justify-center text-gold-200">
                    <UserIcon className="w-8 h-8" />
                  </div>
                  {player.isHost && (
                    <div className="absolute -bottom-1 -right-1 bg-gold-500 text-casino-green-950 text-[10px] font-bold px-2 py-0.5 rounded-full border border-casino-green-900">
                      HOST
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <h3 className="font-playfair text-xl text-gold-100 font-bold">{player.name}</h3>
                  <p className="text-gold-400/80 text-sm font-inter">
                    {player.id === currentPlayerId ? 'You' : 'Waiting...'}
                  </p>
                </div>

                {/* Status */}
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300
                  ${player.isReady 
                    ? 'bg-gold-500 border-gold-300 text-casino-green-900 shadow-[0_0_15px_rgba(212,175,55,0.5)]' 
                    : 'bg-casino-green-900/50 border-gold-500/30 text-transparent'}
                `}>
                  <CheckIcon className={`w-6 h-6 ${player.isReady ? 'animate-bounce-short' : ''}`} />
                </div>
              </>
            ) : (
              <div className="w-full flex items-center justify-center text-gold-500/30 font-playfair italic">
                Waiting for player...
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-col items-center gap-4 z-10">
        {isHost && players.length === 4 ? (
          <CasinoButton 
            variant="primary" 
            onClick={onStartGame}
            disabled={!allReady}
            className="w-64 text-lg"
          >
            {allReady ? 'Start Game' : 'Waiting for Players...'}
          </CasinoButton>
        ) : (
          <CasinoButton 
            variant={currentPlayer?.isReady ? 'secondary' : 'primary'}
            onClick={onReadyToggle}
            className="w-64 text-lg"
          >
            {currentPlayer?.isReady ? 'Not Ready' : 'Ready to Play'}
          </CasinoButton>
        )}
        
        <div className="h-8 flex items-center justify-center">
          {!allReady && (
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-gold-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
              <div className="w-2 h-2 bg-gold-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              <div className="w-2 h-2 bg-gold-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
