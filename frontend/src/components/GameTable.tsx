import React, { useState } from 'react';
import { CasinoButton } from "@/components/CasinoButton";
import { PlayerNameplate } from "@/components/PlayerNameplate";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { PlayingCard, Suit, Rank } from "@/components/PlayingCard";
import { CardHand } from "@/components/CardHand";

interface GameTableProps {
  onLeaveGame: () => void;
}

export const GameTable: React.FC<GameTableProps> = ({ onLeaveGame }) => {
  const [myCards, setMyCards] = useState([
    { id: '1', suit: 'spades' as Suit, rank: 'A' as Rank },
    { id: '2', suit: 'hearts' as Suit, rank: 'K' as Rank },
    { id: '3', suit: 'diamonds' as Suit, rank: 'Q' as Rank },
    { id: '4', suit: 'clubs' as Suit, rank: 'J' as Rank },
    { id: '5', suit: 'spades' as Suit, rank: '10' as Rank },
  ]);
  
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [tableCards, setTableCards] = useState<{id: string, suit: Suit, rank: Rank, player: string}[]>([]);
  const [isDealing, setIsDealing] = useState(false);

  const handleCardClick = (cardId: string) => {
    if (selectedCardId === cardId) {
      // Play card
      const card = myCards.find(c => c.id === cardId);
      if (card) {
        setMyCards(prev => prev.filter(c => c.id !== cardId));
        setTableCards(prev => [...prev, { ...card, player: 'You' }]);
        setSelectedCardId(null);
      }
    } else {
      setSelectedCardId(cardId);
    }
  };

  const handleDeal = () => {
    setIsDealing(true);
    setMyCards([]);
    setTableCards([]);
    
    // Simulate dealing animation
    setTimeout(() => {
      setMyCards([
        { id: '1', suit: 'spades' as Suit, rank: 'A' as Rank },
        { id: '2', suit: 'hearts' as Suit, rank: 'K' as Rank },
        { id: '3', suit: 'diamonds' as Suit, rank: 'Q' as Rank },
        { id: '4', suit: 'clubs' as Suit, rank: 'J' as Rank },
        { id: '5', suit: 'spades' as Suit, rank: '10' as Rank },
      ]);
      setIsDealing(false);
    }, 1000);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-between p-8 bg-casino-green-900 overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-2 z-10 relative w-full">
        <button 
          onClick={onLeaveGame}
          className="absolute left-0 top-0 text-gold-300 hover:text-gold-100 font-playfair"
        >
          ← Leave Table
        </button>
        <h1 className="font-playfair text-5xl font-bold text-gold-gradient drop-shadow-lg">
          Court Piece
        </h1>
        <p className="font-crimson text-xl text-gold-200 italic">
          The Royal Game of Strategy
        </p>
      </div>

      {/* Game Area */}
      <div className="relative w-full max-w-6xl flex-1 flex flex-col justify-center items-center perspective-1000">
        
        {/* Opponent (Top) */}
        <div className="absolute top-0 flex flex-col items-center gap-4">
          <PlayerNameplate name="Opponent" />
          <div className="flex -space-x-4">
             {[1,2,3,4,5].map(i => (
               <div key={i} className="transform scale-75 origin-top">
                 <PlayingCard suit="spades" rank="A" isFaceUp={false} />
               </div>
             ))}
          </div>
        </div>

        {/* Table Center */}
        <div className="relative w-96 h-96 rounded-full border-8 border-leather-800 bg-casino-green-800 shadow-2xl flex items-center justify-center">
          <div className="absolute inset-0 felt-texture opacity-50 rounded-full" />
          
          {/* Deck */}
          <div className="absolute left-4 top-1/2 -translate-y-1/2">
             <div className="relative">
               {[1,2,3].map(i => (
                 <div key={i} className="absolute top-0 left-0" style={{ transform: `translate(${i*2}px, ${-i*2}px)` }}>
                   <PlayingCard suit="spades" rank="A" isFaceUp={false} />
                 </div>
               ))}
             </div>
          </div>

          {/* Played Cards */}
          <div className="relative z-10 w-full h-full">
            {tableCards.map((card, index) => (
              <div 
                key={card.id} 
                className="absolute top-1/2 left-1/2 transition-all duration-500"
                style={{ 
                  transform: `translate(-50%, -50%) translate(${index * 20}px, ${index * 10}px) rotate(${index * 15}deg)` 
                }}
              >
                <PlayingCard suit={card.suit} rank={card.rank} isFaceUp={true} />
              </div>
            ))}
            
            {isDealing && (
               <div className="absolute inset-0 flex items-center justify-center">
                 <LoadingSpinner size="lg" />
               </div>
            )}
          </div>
        </div>

        {/* Player Hand (Bottom) */}
        <div className="absolute bottom-0 w-full flex flex-col items-center gap-8">
          <div className="w-full max-w-2xl">
            <CardHand 
              cards={myCards} 
              onCardClick={handleCardClick}
              selectedCardId={selectedCardId}
            />
          </div>
          
          <div className="flex items-center gap-8">
            <PlayerNameplate name="You" isActive={true} isDealer={true} />
            <div className="flex gap-4">
              <CasinoButton variant="primary" onClick={handleDeal} disabled={isDealing}>
                {isDealing ? 'Dealing...' : 'Deal Hand'}
              </CasinoButton>
              <CasinoButton variant="secondary">Sort</CasinoButton>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
