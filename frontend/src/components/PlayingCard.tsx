import React from 'react';
import { Spades, Hearts, Diamonds, Clubs } from './icons/SuitIcons';

export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

interface PlayingCardProps {
  suit: Suit;
  rank: Rank;
  isFaceUp?: boolean;
  isSelected?: boolean;
  isValid?: boolean;
  isShaking?: boolean;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

const SuitIcon = ({ suit, className }: { suit: Suit; className?: string }) => {
  switch (suit) {
    case 'spades': return <Spades className={className} />;
    case 'hearts': return <Hearts className={className} />;
    case 'diamonds': return <Diamonds className={className} />;
    case 'clubs': return <Clubs className={className} />;
  }
};

export const PlayingCard: React.FC<PlayingCardProps> = ({
  suit,
  rank,
  isFaceUp = false,
  isSelected = false,
  isValid = true,
  isShaking = false,
  onClick,
  className = '',
  style
}) => {
  const isRed = suit === 'hearts' || suit === 'diamonds';
  const colorClass = isRed ? 'text-red-600' : 'text-gray-900';

  return (
    <div
      className={`
        relative w-16 h-24 sm:w-20 sm:h-28 lg:w-28 lg:h-40 xl:w-32 xl:h-48 perspective-1000 cursor-pointer select-none
        transition-all duration-300 cubic-bezier(0.25, 0.8, 0.25, 1)
        ${isSelected ? '-translate-y-4 md:-translate-y-6 z-10' : 'hover:-translate-y-2 md:hover:-translate-y-3 hover:scale-105 hover:z-10'}
        ${!isValid ? 'opacity-50 grayscale cursor-not-allowed' : ''}
        ${isShaking ? 'animate-shake' : ''}
        ${className}
      `}
      onClick={onClick}
      style={style}
    >
      <div
        className={`
          relative w-full h-full transition-transform duration-500 transform-style-3d rounded-md sm:rounded-lg md:rounded-xl
          ${isFaceUp ? 'rotate-y-180' : ''}
          ${isSelected ? 'card-shadow-hover' : 'card-shadow'}
        `}
      >
        {/* Card Back */}
        <div className="absolute inset-0 w-full h-full backface-hidden rounded-md sm:rounded-lg md:rounded-xl overflow-hidden bg-casino-green-800 border-2 border-gold-600 shadow-inner">
          <div className="w-full h-full opacity-40 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDIwIDIwIiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmQiIHN0cm9rZS13aWR0aD0iMSI+PHBhdGggZD0iTTAgMGwyMCAyME0yMCAwbC0yMCAyMCIvPjwvc3ZnPg==')]"></div>
          <div className="absolute inset-1 md:inset-2 border border-gold-500/50 rounded-sm md:rounded-lg"></div>
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-full border-2 border-gold-400 flex items-center justify-center bg-casino-green-900 shadow-lg">
                <span className="text-sm sm:text-lg md:text-xl lg:text-2xl font-playfair text-gold-300">CP</span>
             </div>
          </div>
        </div>

        {/* Card Front */}
        <div className={`
          absolute inset-0 w-full h-full backface-hidden rotate-y-180 
          bg-[#fdfbf7] rounded-md sm:rounded-lg md:rounded-xl overflow-hidden border border-gray-300
          ${isSelected ? 'ring-2 ring-gold-400 ring-offset-1 ring-offset-transparent' : ''}
        `}>
           {/* Inner Shadow for Thickness */}
           <div className="absolute inset-0 shadow-[inset_0_0_4px_rgba(0,0,0,0.1)] pointer-events-none rounded-md sm:rounded-lg md:rounded-xl z-10" />

           {/* Corner Top-Left */}
           <div className={`absolute top-0.5 left-0.5 sm:top-1 sm:left-1 md:top-2 md:left-2 flex flex-col items-center ${colorClass}`}>
             <span className="text-base sm:text-lg md:text-xl lg:text-2xl font-playfair font-bold leading-none tracking-tighter">{rank}</span>
             <SuitIcon suit={suit} className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 lg:w-5 lg:h-5 mt-0.5 md:mt-1" />
           </div>

           {/* Center Suit */}
           <div className={`absolute inset-0 flex items-center justify-center ${colorClass}`}>
             <SuitIcon suit={suit} className="w-8 h-8 sm:w-10 sm:h-10 md:w-16 md:h-16 lg:w-20 lg:h-20 opacity-100 drop-shadow-sm" />
           </div>

           {/* Corner Bottom-Right (Rotated) */}
           <div className={`absolute bottom-0.5 right-0.5 sm:bottom-1 sm:right-1 md:bottom-2 md:right-2 flex flex-col items-center ${colorClass} rotate-180`}>
             <span className="text-base sm:text-lg md:text-xl lg:text-2xl font-playfair font-bold leading-none tracking-tighter">{rank}</span>
             <SuitIcon suit={suit} className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 lg:w-5 lg:h-5 mt-0.5 md:mt-1" />
           </div>
           
           {/* Shine Effect */}
           <div className="absolute inset-0 bg-linear-to-tr from-transparent via-white/40 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20" />
        </div>
      </div>
    </div>
  );
};
