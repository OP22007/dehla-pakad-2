import React from 'react';

interface PlayerNameplateProps {
  name: string;
  team?: string;
  isActive?: boolean;
  isDealer?: boolean;
  avatarUrl?: string;
  timeLeft?: number; // New prop for timer
  variant?: 'standard' | 'minimal'; // New prop for layout variant
}

export const PlayerNameplate: React.FC<PlayerNameplateProps> = ({
  name,
  team,
  isActive = false,
  isDealer = false,
  avatarUrl,
  timeLeft,
  variant = 'standard'
}) => {
  if (variant === 'minimal') {
    return (
      <div className="relative flex flex-col items-center">
        {/* Active Glow (Spotlight style) */}
        {isActive && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-gold-500/20 rounded-full blur-xl animate-pulse-slow pointer-events-none z-0" />
        )}

        {/* Timer Ring (Integrated) */}
        {isActive && timeLeft !== undefined && (
          <div className="absolute -top-2 -right-2 z-20 bg-red-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-pulse">
            {timeLeft}
          </div>
        )}

        <div className={`
          relative flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-300 z-10
          ${isActive ? 'bg-black/60 border border-gold-500/50 shadow-[0_0_15px_rgba(212,175,55,0.2)]' : 'bg-black/30 border border-transparent opacity-80'}
        `}>
          {/* Name */}
          <span className={`
            font-playfair font-bold text-xs tracking-wider truncate max-w-20 text-center
            ${isActive ? 'text-gold-100' : 'text-gold-400'}
          `}>
            {name}
          </span>
          
          {/* Team */}
          {team && (
            <span className="font-inter text-[8px] uppercase tracking-widest text-gold-600/80">
              {team}
            </span>
          )}
          
          {/* Dealer Badge */}
          {isDealer && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gold-gradient rounded-full flex items-center justify-center border border-black text-[8px] font-bold text-black shadow-sm">
              D
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Active Player Glow (Dominant Signal) */}
      {isActive && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[160px] h-[160px] bg-radial-gold rounded-full blur-xl animate-pulse-slow pointer-events-none z-0" 
             style={{ background: 'radial-gradient(circle, rgba(212,175,55,0.6) 0%, rgba(212,175,55,0) 70%)' }} 
        />
      )}

      {/* Timer Badge */}
      {isActive && timeLeft !== undefined && (
        <div className="absolute -top-3 -right-3 z-20 bg-red-600 text-white text-xs font-bold w-8 h-8 rounded-full flex items-center justify-center border-2 border-gold-400 shadow-lg animate-pulse">
          {timeLeft}
        </div>
      )}

      <div className={`
        relative flex items-center gap-3 px-3 py-2 md:px-4 md:py-3 rounded-lg transition-all duration-500 z-10
        wood-panel min-w-35 md:min-w-45
        ${isActive ? 'scale-105 ring-2 ring-gold-400 ring-offset-2 ring-offset-transparent shadow-[0_0_20px_rgba(212,175,55,0.3)]' : 'opacity-90 grayscale-[0.3]'}
      `}>
        {/* Avatar Circle */}
        <div className="relative">
        <div className={`
          w-10 h-10 md:w-14 md:h-14 rounded-full border-2 overflow-hidden bg-casino-green-900 shadow-inner
          ${isActive ? 'border-gold-300' : 'border-gold-700'}
        `}>
          {avatarUrl ? (
            <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gold-200 font-playfair text-lg md:text-2xl bg-linear-to-br from-casino-green-800 to-black">
              {name.charAt(0)}
            </div>
          )}
        </div>
        
        {isDealer && (
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gold-gradient rounded-full flex items-center justify-center border border-black text-[10px] font-bold text-black shadow-md z-10">
            D
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col grow">
        <span className={`
          font-playfair font-bold text-sm md:text-base tracking-wider truncate max-w-20 md:max-w-25
          ${isActive ? 'text-gold-100 drop-shadow-md' : 'text-gold-400'}
        `}>
          {name}
        </span>
        {team && (
          <span className="font-inter text-[10px] uppercase tracking-widest text-gold-600 mt-1">
            {team}
          </span>
        )}
      </div>

      {/* Active Glow Overlay */}
      {isActive && (
        <div className="absolute inset-0 rounded-lg bg-gold-400/5 pointer-events-none animate-pulse" />
      )}
      </div>
    </div>
  );
};