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
          ${isActive ? 'bg-black/80 border border-gold-500/80 shadow-[0_0_15px_rgba(212,175,55,0.4)]' : 'bg-black/40 border border-transparent opacity-80'}
        `}>
          {/* Name */}
          <span className={`
            font-playfair font-bold text-xs tracking-wider truncate max-w-20 text-center drop-shadow-md
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
        <div className="absolute -top-2 -right-2 md:-top-3 md:-right-3 z-20 bg-red-600 text-white text-[10px] md:text-xs font-bold w-5 h-5 md:w-8 md:h-8 rounded-full flex items-center justify-center border md:border-2 border-gold-400 shadow-lg animate-pulse">
          {timeLeft}
        </div>
      )}

      <div className={`
        relative flex items-center gap-1.5 md:gap-3 px-2 py-1 md:px-4 md:py-3 rounded-lg transition-all duration-500 z-10
        wood-panel min-w-20 md:min-w-45
        ${isActive ? 'scale-105 ring-2 ring-gold-400 ring-offset-2 ring-offset-transparent shadow-[0_0_20px_rgba(212,175,55,0.3)]' : 'opacity-90 grayscale-[0.3]'}
      `}>
        {/* Avatar Circle */}
        <div className="relative">
        <div className={`
          w-6 h-6 md:w-14 md:h-14 rounded-full border-2 overflow-hidden bg-casino-green-900 shadow-inner
          ${isActive ? 'border-gold-300' : 'border-gold-700'}
        `}>
          {avatarUrl ? (
            <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gold-200 font-playfair text-xs md:text-2xl bg-linear-to-br from-casino-green-800 to-black">
              {name.charAt(0)}
            </div>
          )}
        </div>
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <span className={`
            font-playfair font-bold tracking-wider truncate max-w-16 md:max-w-32
            ${isActive ? 'text-gold-100 text-[10px] md:text-lg drop-shadow-md' : 'text-gold-400 text-[8px] md:text-base'}
          `}>
            {name}
          </span>
          {team && (
            <span className="font-inter text-[6px] md:text-[10px] uppercase tracking-widest text-gold-600/80">
              {team}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};