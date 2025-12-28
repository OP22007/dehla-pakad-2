import React, { useState } from 'react';
import { CasinoButton } from './CasinoButton';
import { Spades, Hearts, Diamonds, Clubs } from './icons/SuitIcons';

interface LandingScreenProps {
  onCreateGame: (playerName: string) => void;
  onJoinGame: (code: string, playerName: string) => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({ onCreateGame, onJoinGame }) => {
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-casino-green-950 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="grid grid-cols-12 gap-8 p-8 rotate-12 scale-150">
          {Array.from({ length: 100 }).map((_, i) => (
            <div key={i} className="text-gold-500">
              {i % 4 === 0 ? <Spades className="w-12 h-12" /> :
               i % 4 === 1 ? <Hearts className="w-12 h-12" /> :
               i % 4 === 2 ? <Diamonds className="w-12 h-12" /> :
               <Clubs className="w-12 h-12" />}
            </div>
          ))}
        </div>
      </div>

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-md px-6 flex flex-col items-center gap-12 animate-fade-in-up">
        
        {/* Logo Section */}
        <div className="text-center space-y-4">
          <div className="relative inline-block">
            <h1 className="font-playfair text-7xl font-bold text-gold-gradient drop-shadow-2xl tracking-tight animate-shimmer bg-size-[200%_auto]">
              Court Piece
            </h1>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 h-1 bg-gold-500 rounded-full shadow-[0_0_10px_rgba(212,175,55,0.8)]" />
          </div>
          <p className="font-playfair text-2xl text-gold-200 italic tracking-wide">
            The Royal Game of Strategy
          </p>
        </div>

        {/* Actions Section */}
        <div className="w-full flex flex-col gap-6 bg-casino-green-900/80 p-8 rounded-2xl border border-gold-500/20 backdrop-blur-sm shadow-2xl">
          
          <div className="flex flex-col gap-4">
            {/* Player Name Input */}
            <div className="flex flex-col gap-2">
              <label className="text-gold-300 font-playfair text-sm ml-1">Your Name</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="ENTER NAME"
                className="w-full bg-casino-green-950 border-2 border-gold-700 rounded-lg px-4 py-3 text-gold-100 font-mono text-lg placeholder-gold-700/50 focus:outline-none focus:border-gold-400 focus:shadow-[0_0_15px_rgba(212,175,55,0.2)] transition-all text-center tracking-wide"
                maxLength={12}
              />
            </div>

            <div className="h-px bg-gold-500/20 my-2" />

            <CasinoButton 
              variant="primary" 
              className="w-full text-xl py-4 shadow-[0_0_25px_rgba(212,175,55,0.2)]"
              onClick={() => onCreateGame(playerName)}
              disabled={!playerName}
            >
              Create New Game
            </CasinoButton>
            
            <div className="relative flex items-center py-2">
              <div className="grow border-t border-gold-500/20"></div>
              <span className="shrink-0 mx-4 text-gold-400 font-playfair italic">or</span>
              <div className="grow border-t border-gold-500/20"></div>
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-gold-300 font-playfair text-sm ml-1">Join Existing Game</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="ENTER CODE"
                  className="flex-1 bg-casino-green-950 border-2 border-gold-700 rounded-lg px-4 py-3 text-gold-100 font-mono text-lg placeholder-gold-700/50 focus:outline-none focus:border-gold-400 focus:shadow-[0_0_15px_rgba(212,175,55,0.2)] transition-all text-center uppercase tracking-widest"
                  maxLength={6}
                />
                <CasinoButton 
                  variant="secondary" 
                  className="px-6"
                  onClick={() => onJoinGame(roomCode, playerName)}
                  disabled={!roomCode || !playerName}
                >
                  Join
                </CasinoButton>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="text-gold-600 font-inter text-sm">
          © 2025 Royal Casino Games
        </div>
      </div>
    </div>
  );
};
