import React from 'react';
import { PlayingCard, Suit, Rank } from './PlayingCard';

interface CardData {
  id: string;
  suit: Suit;
  rank: Rank;
}

interface CardHandProps {
  cards: CardData[];
  onCardClick?: (cardId: string) => void;
  selectedCardId?: string | null;
  validCardIds?: string[];
  shakingCardId?: string | null;
  isFaceUp?: boolean;
  className?: string;
  isActive?: boolean;
  layout?: 'fan' | 'scroll'; // New prop for layout mode
  hiddenTrumpCardId?: string | null;
  isTrumpRevealed?: boolean;
}

export const CardHand: React.FC<CardHandProps> = ({
  cards,
  onCardClick,
  selectedCardId,
  validCardIds,
  shakingCardId,
  isFaceUp = true,
  className = '',
  isActive = true,
  layout = 'fan',
  hiddenTrumpCardId,
  isTrumpRevealed = false
}) => {
  const totalCards = cards.length;

  if (layout === 'scroll') {
    return (
      <div className={`
        flex overflow-x-auto overflow-y-visible px-4 py-4 gap-[-20px] snap-x snap-mandatory w-full h-40 items-end
        scrollbar-hide mask-linear-fade
        ${className} 
        ${!isActive ? 'opacity-60' : ''}
      `}>
        {cards.map((card, index) => {
          const isSelected = card.id === selectedCardId;
          const isValid = isActive && validCardIds ? validCardIds.includes(card.id) : true;
          const isShaking = card.id === shakingCardId;
          const isHiddenTrump = card.id === hiddenTrumpCardId;
          const cardIsFaceUp = isHiddenTrump && !isTrumpRevealed ? false : isFaceUp;

          return (
            <div
              key={card.id}
              className={`
                flex-shrink-0 snap-center transition-all duration-300 relative
                ${isSelected ? '-translate-y-4 z-20' : 'z-10'}
              `}
              style={{ 
                marginLeft: index === 0 ? 0 : '-30px', // Overlap
                zIndex: isSelected ? 50 : index 
              }}
            >
              <PlayingCard
                suit={card.suit}
                rank={card.rank}
                isFaceUp={cardIsFaceUp}
                isSelected={isSelected}
                isValid={isValid}
                isShaking={isShaking}
                onClick={() => onCardClick && onCardClick(card.id)}
                className="shadow-md" // Compact size handled by PlayingCard responsive classes
              />
              {isHiddenTrump && (
                <div className="absolute -top-2 right-0 bg-black/80 text-gold-400 text-[8px] font-bold px-1.5 py-0.5 rounded border border-gold-500/50 z-30 shadow-lg animate-pulse">
                  TRUMP
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Default Fan Layout
  // Improved Arc Calculation
  const arcRadius = 800; // Large radius for subtle curve
  const angleStep = Math.min(5, 60 / Math.max(totalCards, 1)); // Constant angle delta, max 5 degrees
  const startAngle = -((totalCards - 1) * angleStep) / 2;

  return (
    <div className={`relative h-48 w-full flex justify-center items-end ${className} ${!isActive ? 'opacity-60 cursor-default' : ''}`}>
      {cards.map((card, index) => {
        const angle = startAngle + index * angleStep;
        // Calculate Y offset based on circle equation (x^2 + y^2 = r^2) to keep tops aligned or bottom aligned
        // Simple quadratic approximation for arch: y = x^2 * k
        const xOffsetFromCenter = index - (totalCards - 1) / 2;
        const yOffset = Math.abs(xOffsetFromCenter) * Math.abs(xOffsetFromCenter) * 1.5; 
        
        const isSelected = card.id === selectedCardId;
        // Only apply validation styling if it's the player's turn
        const isValid = isActive && validCardIds ? validCardIds.includes(card.id) : true;
        const isShaking = card.id === shakingCardId;
        const isHiddenTrump = card.id === hiddenTrumpCardId;
        const cardIsFaceUp = isHiddenTrump && !isTrumpRevealed ? false : isFaceUp;
        
        // Secondary Cue: Lift cards slightly if active
        const activeLift = isActive ? -8 : 0; 

        return (
          <div
            key={card.id}
            className="absolute transition-all duration-300 ease-out origin-bottom-center"
            style={{
              // Use transform for rotation and arc positioning
              transform: `
                translateX(${xOffsetFromCenter * 35}px) 
                translateY(${yOffset + activeLift}px) 
                rotate(${angle}deg)
              `,
              zIndex: isSelected ? 100 : index,
              bottom: 0
            }}
          >
            <PlayingCard
              suit={card.suit}
              rank={card.rank}
              isFaceUp={cardIsFaceUp}
              isSelected={isSelected}
              isValid={isValid}
              isShaking={isShaking}
              onClick={() => onCardClick && onCardClick(card.id)}
              className="shadow-xl hover:shadow-2xl"
            />
            {isHiddenTrump && (
              <div className="absolute -top-3 right-0 bg-black/80 text-gold-400 text-[8px] font-bold px-1.5 py-0.5 rounded border border-gold-500/50 z-30 shadow-lg animate-pulse rotate-0" style={{ transform: `rotate(${-angle}deg)` }}>
                TRUMP
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
