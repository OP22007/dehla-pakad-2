import React, { useState, useEffect } from 'react';
import { PlayingCard, Suit, Rank } from './PlayingCard';
import { CardHand } from './CardHand';
import { PlayerNameplate } from './PlayerNameplate';
import { CasinoButton } from './CasinoButton';
import { Spades, Hearts, Diamonds, Clubs } from './icons/SuitIcons';
import OrientationPrompt from './OrientationPrompt';

// Types
interface Card {
  id: string;
  suit: Suit | 'unknown';
  rank: Rank | 'unknown';
}

interface PlayedCard {
  playerId: string;
  card: Card;
}

interface TeamState {
  players: string[];
  tricksWon: number;
  tensCollected: number;
  wonCards: Card[];
}

interface GameState {
  players: string[]; // IDs
  hands: { [playerId: string]: Card[] };
  currentTurn: string;
  trumpSuit: Suit | null;
  isTrumpRevealed: boolean;
  trumpCallerId: string;
  currentTrick: PlayedCard[];
  teams: {
    team1: TeamState;
    team2: TeamState;
  };
  status: 'calling_trump' | 'playing' | 'finished';
  winner?: string;
  lastTrickWinner?: string | null;
  lastTrickCards?: PlayedCard[] | null;
  hiddenTrumpCard?: Card | null;
}

interface Player {
  id: string;
  name: string;
}

interface GameBoardProps {
  gameData: GameState | null;
  players: Player[];
  currentPlayerId: string;
  onLeaveGame: () => void;
  onPlayCard: (cardId: string) => void;
  onSetTrump: (cardId: string) => void;
  onRevealTrump: () => void;
  onGetHint: () => void;
  hint: string | null;
}

const SetsHistoryModal = ({ isOpen, onClose, gameData, currentPlayerId }: { isOpen: boolean; onClose: () => void; gameData: GameState; currentPlayerId: string }) => {
  if (!isOpen) return null;

  const chunk = <T,>(arr: T[], size: number): T[][] => {
    return Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
      arr.slice(i * size, i * size + size)
    );
  };

  const team1Sets = chunk(gameData.teams.team1.wonCards, 4);
  const team2Sets = chunk(gameData.teams.team2.wonCards, 4);
  
  const isTeam1 = gameData.teams.team1.players.includes(currentPlayerId);
  const isTeam2 = gameData.teams.team2.players.includes(currentPlayerId);
  const isSpectator = !isTeam1 && !isTeam2;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4">
       <div className="bg-casino-green-900 border border-gold-500/50 rounded-xl p-4 md:p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto shadow-2xl relative flex flex-col">
          <button onClick={onClose} className="absolute top-4 right-4 text-gold-400 hover:text-white text-xl font-bold z-10">✕</button>
          <h2 className="text-2xl md:text-3xl font-playfair text-gold-100 mb-6 text-center sticky top-0 bg-casino-green-900/95 py-2 z-10">Collected Sets</h2>
          
          <div className={`grid gap-8 overflow-y-auto pr-2 ${isSpectator ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 justify-items-center'}`}>
             {/* Team 1 */}
             {(isTeam1 || isSpectator) && (
             <div className={`bg-black/20 rounded-lg p-4 ${!isSpectator ? 'w-full max-w-2xl' : ''}`}>
                <div className="flex justify-between items-center mb-4 border-b border-gold-500/30 pb-2">
                  <h3 className="text-gold-400 font-bold uppercase tracking-widest">Team 1</h3>
                  <span className="text-gold-200 font-playfair">{gameData.teams.team1.tricksWon} Sets</span>
                </div>
                <div className="space-y-3">
                   {team1Sets.length === 0 && <p className="text-gray-500 text-center italic text-sm py-4">No sets collected yet</p>}
                   {team1Sets.map((set, i) => (
                      <div key={i} className="bg-black/40 p-2 rounded-lg flex gap-1 justify-center items-center border border-gold-500/10">
                         {set.map((card, idx) => (
                           <div key={idx} className="transform scale-75 -mx-2 first:ml-0">
                             <PlayingCard 
                               suit={card.suit as Suit} 
                               rank={card.rank as Rank} 
                               isFaceUp={true} 
                               className="shadow-md"
                             />
                           </div>
                         ))}
                      </div>
                   ))}
                </div>
             </div>
             )}

             {/* Team 2 */}
             {(isTeam2 || isSpectator) && (
             <div className={`bg-black/20 rounded-lg p-4 ${!isSpectator ? 'w-full max-w-2xl' : ''}`}>
                <div className="flex justify-between items-center mb-4 border-b border-gold-500/30 pb-2">
                  <h3 className="text-gold-400 font-bold uppercase tracking-widest">Team 2</h3>
                  <span className="text-gold-200 font-playfair">{gameData.teams.team2.tricksWon} Sets</span>
                </div>
                <div className="space-y-3">
                   {team2Sets.length === 0 && <p className="text-gray-500 text-center italic text-sm py-4">No sets collected yet</p>}
                   {team2Sets.map((set, i) => (
                      <div key={i} className="bg-black/40 p-2 rounded-lg flex gap-1 justify-center items-center border border-gold-500/10">
                         {set.map((card, idx) => (
                           <div key={idx} className="transform scale-75 -mx-2 first:ml-0">
                             <PlayingCard 
                               suit={card.suit as Suit} 
                               rank={card.rank as Rank} 
                               isFaceUp={true} 
                               className="shadow-md"
                             />
                           </div>
                         ))}
                      </div>
                   ))}
                </div>
             </div>
             )}
          </div>
       </div>
    </div>
  );
};

export const GameBoard: React.FC<GameBoardProps> = ({ 
  gameData, 
  players,
  currentPlayerId, 
  onLeaveGame,
  onPlayCard,
  onSetTrump,
  onRevealTrump,
  onGetHint,
  hint
}) => {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [prevScores, setPrevScores] = useState({ team1: 0, team2: 0 });
  const [scoreAnimating, setScoreAnimating] = useState<'team1' | 'team2' | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [shakingCardId, setShakingCardId] = useState<string | null>(null);
  const [trickAnimating, setTrickAnimating] = useState(false);
  const [timeLeft, setTimeLeft] = useState(45);
  const [isMobileLandscape, setIsMobileLandscape] = useState(false);
  const [showSetsHistory, setShowSetsHistory] = useState(false);

  // Detect Mobile Landscape
  useEffect(() => {
    const checkMobileLandscape = () => {
      const isLandscape = window.matchMedia('(orientation: landscape)').matches;
      const isMobile = window.matchMedia('(max-width: 900px)').matches; // Tablet/Mobile width
      setIsMobileLandscape(isLandscape && isMobile);
    };

    checkMobileLandscape();
    window.addEventListener('resize', checkMobileLandscape);
    return () => window.removeEventListener('resize', checkMobileLandscape);
  }, []);

  // Timer Logic
  useEffect(() => {
    if (gameData?.status === 'playing') {
      setTimeLeft(45);
      const timer = setInterval(() => {
        setTimeLeft(prev => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    } else {
      setTimeLeft(45);
    }
  }, [gameData?.currentTurn, gameData?.status]);

  // Trick Animation Logic
  useEffect(() => {
    if (gameData?.lastTrickWinner && gameData.currentTrick.length === 0) {
      setTrickAnimating(true);
      const timer = setTimeout(() => setTrickAnimating(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [gameData?.lastTrickWinner, gameData?.currentTrick.length]);

  useEffect(() => {
    if (hint) {
      setShowHint(true);
      const timer = setTimeout(() => setShowHint(false), 8000); // Hide hint after 8s
      return () => clearTimeout(timer);
    }
  }, [hint]);

  useEffect(() => {
    if (!gameData) return;
    
    if (gameData.teams.team1.tricksWon > prevScores.team1) {
      setScoreAnimating('team1');
      const timer = setTimeout(() => setScoreAnimating(null), 500);
      return () => clearTimeout(timer);
    }
    
    if (gameData.teams.team2.tricksWon > prevScores.team2) {
      setScoreAnimating('team2');
      const timer = setTimeout(() => setScoreAnimating(null), 500);
      return () => clearTimeout(timer);
    }

    setPrevScores({ 
      team1: gameData.teams.team1.tricksWon, 
      team2: gameData.teams.team2.tricksWon 
    });
  }, [gameData?.teams.team1.tricksWon, gameData?.teams.team2.tricksWon]);

  if (!gameData) return <div className="min-h-screen bg-casino-green-950 flex items-center justify-center text-gold-200 font-playfair text-2xl">Loading Game...</div>;

  // Helper to get relative player positions
  const getRelativePlayerId = (offset: number) => {
    const myIndex = gameData.players.indexOf(currentPlayerId);
    if (myIndex === -1) return null;
    const targetIndex = (myIndex + offset) % 4;
    return gameData.players[targetIndex];
  };

  const partnerId = getRelativePlayerId(2);
  const leftOpponentId = getRelativePlayerId(1);
  const rightOpponentId = getRelativePlayerId(3);

  const myCards = gameData.hands[currentPlayerId] || [];
  const isMyTurn = gameData.currentTurn === currentPlayerId;
  const showTrumpSelector = gameData.status === 'calling_trump' && isMyTurn;

  // Logic for enabling "Call Trump" button
  const canCallTrump = isMyTurn && 
                       gameData.status === 'playing' && 
                       !gameData.isTrumpRevealed && 
                       gameData.currentTrick.length > 0 && 
                       !myCards.some(c => c.suit === gameData.currentTrick[0].card.suit);

  // Validation Logic
  const getValidCardIds = () => {
    if (!isMyTurn || gameData.status !== 'playing') return [];
    
    let validIds = myCards.map(c => c.id);

    // Exclude hidden trump card if not revealed
    if (gameData.hiddenTrumpCard && !gameData.isTrumpRevealed) {
      validIds = validIds.filter(id => id !== gameData.hiddenTrumpCard!.id);
    }

    if (gameData.currentTrick.length === 0) {
      return validIds;
    }

    const leadSuit = gameData.currentTrick[0].card.suit;
    const hasLeadSuit = myCards.some(c => c.suit === leadSuit && (!gameData.hiddenTrumpCard || c.id !== gameData.hiddenTrumpCard.id));

    if (hasLeadSuit) {
      return validIds.filter(id => {
        const card = myCards.find(c => c.id === id);
        return card?.suit === leadSuit;
      });
    }

    return validIds;
  };

  const validCardIds = getValidCardIds();

  const handleCardClick = (cardId: string) => {
    if (!isMyTurn || gameData.status !== 'playing') return;
    
    if (!validCardIds.includes(cardId)) {
      setShakingCardId(cardId);
      setTimeout(() => setShakingCardId(null), 500);
      return;
    }
    
    if (selectedCardId === cardId) {
      onPlayCard(cardId);
      setSelectedCardId(null);
    } else {
      setSelectedCardId(cardId);
    }
  };

  // Calculate rotation for table cards based on player position
  const getCardRotation = (playerId: string) => {
    if (playerId === currentPlayerId) return 0;
    if (playerId === leftOpponentId) return 90;
    if (playerId === partnerId) return 180;
    if (playerId === rightOpponentId) return -90;
    return 0;
  };

  const getCardPosition = (playerId: string) => {
     if (playerId === currentPlayerId) return { x: 0, y: 30 };
    if (playerId === leftOpponentId) return { x: -50, y: 0 };
    if (playerId === partnerId) return { x: 0, y: -30 };
    if (playerId === rightOpponentId) return { x: 50, y: 0 };
    return { x: 0, y: 0 };
  };

  // Helper to get team name
  const getTeamName = (playerId: string) => {
    if (gameData.teams.team1.players.includes(playerId)) return "Team 1";
    if (gameData.teams.team2.players.includes(playerId)) return "Team 2";
    return "";
  };

  const getPlayerName = (id: string) => {
    const p = players.find(p => p.id === id);
    return p ? p.name : "Unknown";
  };

  return (
    <div className="relative w-full h-screen bg-casino-green-900 overflow-hidden select-none font-sans flex flex-col">
      <OrientationPrompt />
      
      {/* Background Texture */}
      <div className="absolute inset-0 felt-texture pointer-events-none" />
        
        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-start z-20 pointer-events-none">
          {!isMobileLandscape && (
            <button 
              onClick={onLeaveGame}
              className="pointer-events-auto text-gold-400 hover:text-gold-200 font-playfair text-sm bg-black/40 px-6 py-2 rounded-full backdrop-blur-md border border-gold-500/30 transition-all hover:border-gold-400 shadow-lg"
            >
              Exit Game
            </button>
          )}
          
          {/* Score Board */}
          {isMobileLandscape ? (
            <div className="fixed top-2 left-1/2 -translate-x-1/2 flex gap-6 bg-black/60 backdrop-blur-md rounded-full px-6 py-1 border border-gold-500/20 shadow-lg pointer-events-auto z-50">
              <div className="flex items-center gap-2">
                <span className="text-gold-500 text-[8px] font-bold uppercase tracking-widest">T1</span>
                <span className="text-gold-100 font-playfair text-xl font-bold">{gameData.teams.team1.tricksWon}</span>
                <div className="flex gap-0.5">
                  {[...Array(gameData.teams.team1.tensCollected)].map((_, i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-gold-400 shadow-[0_0_4px_rgba(212,175,55,0.8)]" />
                  ))}
                </div>
              </div>
              <div className="w-px bg-gold-500/30 h-4 self-center" />
              <div className="flex items-center gap-2">
                <span className="text-gold-500 text-[8px] font-bold uppercase tracking-widest">T2</span>
                <span className="text-gold-100 font-playfair text-xl font-bold">{gameData.teams.team2.tricksWon}</span>
                <div className="flex gap-0.5">
                  {[...Array(gameData.teams.team2.tensCollected)].map((_, i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-gold-400 shadow-[0_0_4px_rgba(212,175,55,0.8)]" />
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="wood-panel rounded-lg md:rounded-xl px-4 py-2 md:px-8 md:py-3 shadow-2xl flex gap-4 md:gap-10 pointer-events-auto transform hover:scale-105 transition-transform">
              <div className="flex flex-col items-center">
                <span className="text-gold-500 text-[8px] md:text-[10px] font-bold tracking-[0.2em] uppercase mb-0.5 md:mb-1">Team 1</span>
                <div className="flex items-baseline gap-1 md:gap-2">
                  <span className={`text-gold-100 font-playfair text-2xl md:text-4xl font-bold drop-shadow-md leading-none transition-all ${scoreAnimating === 'team1' ? 'animate-score-update text-white drop-shadow-[0_0_10px_rgba(212,175,55,0.8)]' : ''}`}>
                    {gameData.teams.team1.tricksWon}
                  </span>
                  <span className="text-gold-400 text-[10px] md:text-xs font-bold">({gameData.teams.team1.tensCollected} 10s)</span>
                </div>
              </div>
              <div className="w-px bg-gold-500/30 h-8 md:h-12 self-center" />
              <div className="flex flex-col items-center">
                <span className="text-gold-500 text-[8px] md:text-[10px] font-bold tracking-[0.2em] uppercase mb-0.5 md:mb-1">Team 2</span>
                <div className="flex items-baseline gap-1 md:gap-2">
                  <span className={`text-gold-100 font-playfair text-2xl md:text-4xl font-bold drop-shadow-md leading-none transition-all ${scoreAnimating === 'team2' ? 'animate-score-update text-white drop-shadow-[0_0_10px_rgba(212,175,55,0.8)]' : ''}`}>
                    {gameData.teams.team2.tricksWon}
                  </span>
                  <span className="text-gold-400 text-[10px] md:text-xs font-bold">({gameData.teams.team2.tensCollected} 10s)</span>
                </div>
              </div>
            </div>
          )}

          {/* Trump Indicator & History */}
          {isMobileLandscape ? (
            <>
              {/* History Button (Mobile) */}
              <button 
                onClick={() => setShowSetsHistory(true)}
                className="fixed top-2 right-14 w-10 h-10 bg-black/40 backdrop-blur rounded-full border border-gold-500/30 flex items-center justify-center shadow-lg z-50 active:scale-95 transition-transform"
              >
                <div className="flex flex-col gap-0.5 opacity-80">
                  <div className="w-4 h-3 border border-gold-400 rounded-[1px] bg-gold-500/10"></div>
                  <div className="w-4 h-3 border border-gold-400 rounded-[1px] bg-gold-500/10 -mt-2 ml-1"></div>
                </div>
              </button>

              <div className="fixed top-2 right-2 pointer-events-auto z-50">
                 {gameData.isTrumpRevealed && gameData.trumpSuit ? (
                   <div className="w-10 h-10 bg-black/40 backdrop-blur rounded-full border border-gold-500/30 flex items-center justify-center shadow-lg">
                      <span className={`text-2xl drop-shadow-md ${
                        ['hearts', 'diamonds'].includes(gameData.trumpSuit) ? 'text-red-500' : 'text-white'
                      }`}>
                      {gameData.trumpSuit === 'spades' && '♠'}
                      {gameData.trumpSuit === 'hearts' && '♥'}
                      {gameData.trumpSuit === 'diamonds' && '♦'}
                      {gameData.trumpSuit === 'clubs' && '♣'}
                      </span>
                   </div>
                 ) : (
                   <div className="w-10 h-10 rounded-full border-2 border-dashed border-gold-500/30 flex items-center justify-center opacity-50 bg-black/20">
                     <Spades className="w-4 h-4 text-gold-600" />
                   </div>
                 )}
              </div>
            </>
          ) : (
            <div className="flex gap-4 items-start pointer-events-auto">
              <button 
                onClick={() => setShowSetsHistory(true)}
                className="bg-black/40 px-4 py-2 rounded-lg border border-gold-500/30 backdrop-blur-md hover:bg-black/60 transition-colors flex flex-col items-center gap-1 group h-full justify-center shadow-lg"
              >
                <div className="flex flex-col gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
                  <div className="w-5 h-3 border border-gold-400 rounded-[1px] bg-gold-500/10"></div>
                  <div className="w-5 h-3 border border-gold-400 rounded-[1px] bg-gold-500/10 -mt-2 ml-1"></div>
                </div>
                <span className="text-[8px] md:text-[10px] text-gold-400 uppercase tracking-widest">Sets</span>
              </button>

              <div className="bg-black/40 px-3 py-2 md:px-6 md:py-3 rounded-lg md:rounded-xl border border-gold-500/30 backdrop-blur-md shadow-lg flex flex-col items-center min-w-16 md:min-w-25">
                 <span className="text-gold-400 text-[8px] md:text-[10px] uppercase tracking-[0.2em] mb-1 md:mb-2">Trump</span>
                 {gameData.isTrumpRevealed && gameData.trumpSuit ? (
                   <div className="text-gold-100 font-bold capitalize flex items-center justify-center animate-pop-in">
                      {/* Large Suit Icon */}
                      <span className={`text-2xl md:text-4xl drop-shadow-lg ${
                        ['hearts', 'diamonds'].includes(gameData.trumpSuit) ? 'text-red-500' : 'text-white'
                      }`}>
                      {gameData.trumpSuit === 'spades' && '♠'}
                      {gameData.trumpSuit === 'hearts' && '♥'}
                      {gameData.trumpSuit === 'diamonds' && '♦'}
                      {gameData.trumpSuit === 'clubs' && '♣'}
                      </span>
                   </div>
                 ) : (
                   <div className="w-6 h-6 md:w-10 md:h-10 rounded-full border-2 border-dashed border-gold-500/30 flex items-center justify-center opacity-50">
                     <Spades className="w-3 h-3 md:w-4 md:h-4 text-gold-600" />
                   </div>
                 )}
              </div>
            </div>
          )}
        </div>

        {/* Game Area */}
        <div className="flex-1 relative perspective-1000 flex items-center justify-center">
          
          {/* Center Trick Area */}
          <div className={`
            absolute rounded-full border-2 border-dashed border-gold-500/10 flex items-center justify-center bg-black/20 shadow-[inset_0_0_60px_rgba(0,0,0,0.4)]
            ${isMobileLandscape ? 'w-64 h-64' : 'w-80 h-80'}
          `}>
            {/* Inner stitching ring */}
            <div className="absolute inset-3 rounded-full border border-gold-500/10 border-dashed opacity-60" />
            
            {/* Vignette for Mobile Landscape */}
            {isMobileLandscape && (
              <div className="fixed inset-0 bg-radial-transparent-black pointer-events-none z-[-1]" style={{ background: 'radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.7) 100%)' }} />
            )}
            
            {gameData.currentTrick.map((played, index) => {
               const rotation = getCardRotation(played.playerId);
               const pos = getCardPosition(played.playerId);
               // Tighter stacking for mobile landscape
               const mobileScale = isMobileLandscape ? 0.6 : 1;
               
               return (
                <div 
                  key={`${played.playerId}-${index}`}
                  className="absolute transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)"
                  style={{ 
                    transform: `translate(${pos.x * mobileScale}px, ${pos.y * mobileScale}px) rotate(${rotation + (Math.random() * 4 - 2)}deg)`, // Add slight randomness
                    zIndex: index
                  }}
                >
                  <PlayingCard 
                    suit={played.card.suit as Suit} 
                    rank={played.card.rank as Rank} 
                    isFaceUp={true} 
                    className="shadow-2xl"
                  />
                </div>
              );
            })}
          </div>

          {/* Trump Selector Overlay (Blind Selection) */}
          {showTrumpSelector && (
            <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center animate-fade-in">
              <div className="flex flex-col items-center gap-8">
                <h3 className="text-3xl font-playfair text-gold-100 drop-shadow-lg">Select a Hidden Trump Card</h3>
                <p className="text-gold-400 italic">Pick one card to set the trump suit secretly</p>
                
                <div className="flex gap-4 perspective-1000">
                  {myCards.slice(0, 5).map((card, index) => (
                    <div 
                      key={card.id}
                      onClick={() => onSetTrump(card.id)}
                      className="w-32 h-48 bg-casino-green-800 rounded-xl border-2 border-gold-600 shadow-2xl cursor-pointer transform hover:-translate-y-6 hover:scale-105 transition-all duration-300 group relative"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      {/* Card Back Pattern */}
                      <div className="absolute inset-0 w-full h-full rounded-xl overflow-hidden">
                        <div className="w-full h-full opacity-40 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDIwIDIwIiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmQiIHN0cm9rZS13aWR0aD0iMSI+PHBhdGggZD0iTTAgMGwyMCAyME0yMCAwbC0yMCAyMCIvPjwvc3ZnPg==')]"></div>
                        <div className="absolute inset-2 border border-gold-500/50 rounded-lg"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                           <div className="w-16 h-16 rounded-full border-2 border-gold-400 flex items-center justify-center bg-casino-green-900 shadow-lg group-hover:scale-110 transition-transform">
                              <span className="text-2xl font-playfair text-gold-300">CP</span>
                           </div>
                        </div>
                      </div>
                      {/* Glow on hover */}
                      <div className="absolute inset-0 rounded-xl bg-gold-400/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Player: North (Partner) */}
          {partnerId && (
            <div className={`absolute left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 transition-all duration-300 ${isMobileLandscape ? 'top-2 scale-90' : 'top-8'}`}>
              <PlayerNameplate 
                name={getPlayerName(partnerId)} 
                team={getTeamName(partnerId)} 
                isActive={gameData.currentTurn === partnerId} 
                timeLeft={gameData.currentTurn === partnerId ? timeLeft : undefined}
                variant={isMobileLandscape ? 'minimal' : 'standard'}
              />
              <div className={`origin-top opacity-90 ${isMobileLandscape ? 'scale-75 -mt-2' : 'scale-75'}`}>
                 {/* Show back of cards */}
               <div className="flex -space-x-16">
                 {gameData.hands[partnerId]?.map((_, i) => (
                   <div key={i} className="w-16 h-24 sm:w-20 sm:h-28 lg:w-24 lg:h-36 bg-casino-green-800 rounded-md sm:rounded-lg border-2 border-gold-600 shadow-lg transform hover:-translate-y-2 transition-transform">
                      <div className="w-full h-full opacity-40 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDIwIDIwIiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmQiIHN0cm9rZS13aWR0aD0iMSI+PHBhdGggZD0iTTAgMGwyMCAyME0yMCAwbC0yMCAyMCIvPjwvc3ZnPg==')]"></div>
                   </div>
                 ))}
               </div>
               </div>
            </div>
          )}

          {/* Player: West (Left Opponent) */}
          {leftOpponentId && (
            <div className={`absolute top-1/2 -translate-y-1/2 flex flex-col items-center gap-4 -rotate-90 origin-center transition-all duration-300 ${isMobileLandscape ? 'left-2 scale-90' : 'left-12'}`}>
              <PlayerNameplate 
                name={getPlayerName(leftOpponentId)} 
                team={getTeamName(leftOpponentId)} 
                isActive={gameData.currentTurn === leftOpponentId} 
                timeLeft={gameData.currentTurn === leftOpponentId ? timeLeft : undefined}
                variant={isMobileLandscape ? 'minimal' : 'standard'}
              />
               <div className={`origin-center mt-4 opacity-90 ${isMobileLandscape ? 'scale-75 -mt-2' : 'scale-75'}`}>
                 <div className="flex -space-x-16">
                   {gameData.hands[leftOpponentId]?.map((_, i) => (
                     <div key={i} className="w-16 h-24 sm:w-20 sm:h-28 lg:w-24 lg:h-36 bg-casino-green-800 rounded-md sm:rounded-lg border-2 border-gold-600 shadow-lg">
                        <div className="w-full h-full opacity-40 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDIwIDIwIiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmQiIHN0cm9rZS13aWR0aD0iMSI+PHBhdGggZD0iTTAgMGwyMCAyME0yMCAwbC0yMCAyMCIvPjwvc3ZnPg==')]"></div>
                     </div>
                   ))}
                 </div>
               </div>
            </div>
          )}

          {/* Player: East (Right Opponent) */}
          {rightOpponentId && (
            <div className={`absolute top-1/2 -translate-y-1/2 flex flex-col items-center gap-4 rotate-90 origin-center transition-all duration-300 ${isMobileLandscape ? 'right-2 scale-90' : 'right-12'}`}>
              <PlayerNameplate 
                name={getPlayerName(rightOpponentId)} 
                team={getTeamName(rightOpponentId)} 
                isActive={gameData.currentTurn === rightOpponentId} 
                timeLeft={gameData.currentTurn === rightOpponentId ? timeLeft : undefined}
                variant={isMobileLandscape ? 'minimal' : 'standard'}
              />
               <div className={`origin-center mt-4 opacity-90 ${isMobileLandscape ? 'scale-75 -mt-2' : 'scale-75'}`}>
                 <div className="flex -space-x-16">
                   {gameData.hands[rightOpponentId]?.map((_, i) => (
                     <div key={i} className="w-16 h-24 sm:w-20 sm:h-28 lg:w-24 lg:h-36 bg-casino-green-800 rounded-md sm:rounded-lg border-2 border-gold-600 shadow-lg">
                        <div className="w-full h-full opacity-40 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDIwIDIwIiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmQiIHN0cm9rZS13aWR0aD0iMSI+PHBhdGggZD0iTTAgMGwyMCAyME0yMCAwbC0yMCAyMCIvPjwvc3ZnPg==')]"></div>
                     </div>
                   ))}
                 </div>
               </div>
            </div>
          )}

          {/* Player: South (Me) */}
          <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-5xl flex flex-col items-center gap-4 transition-all duration-300 ${isMobileLandscape ? 'pb-0' : 'pb-4'}`}>
            {/* My Hand */}
            <div className={`relative w-full flex justify-center items-end perspective-1000 z-10 transition-all duration-500 ${isMobileLandscape ? 'h-40' : 'h-56'} ${!isMyTurn ? 'opacity-70 grayscale-30 pointer-events-none' : ''}`}>
               <CardHand 
                 cards={myCards.map(c => ({ ...c, suit: c.suit as Suit, rank: c.rank as Rank }))}
                 onCardClick={handleCardClick}
                 selectedCardId={selectedCardId}
                 validCardIds={validCardIds}
                 shakingCardId={shakingCardId}
                 isActive={isMyTurn}
                 layout={isMobileLandscape ? 'scroll' : 'fan'}
                 hiddenTrumpCardId={gameData.hiddenTrumpCard?.id}
               />
            </div>
            
            <div className="relative z-20">
               <PlayerNameplate 
                 name={getPlayerName(currentPlayerId)} 
                 team={getTeamName(currentPlayerId)} 
                 isActive={isMyTurn} 
                 timeLeft={isMyTurn ? timeLeft : undefined}
                 variant={isMobileLandscape ? 'minimal' : 'standard'}
               />
               {isMyTurn && (
                 <div className={`absolute left-1/2 -translate-x-1/2 bg-gold-500 text-black font-bold px-4 py-1 rounded-full animate-pulse shadow-[0_0_15px_rgba(255,215,0,0.8)] whitespace-nowrap ${isMobileLandscape ? '-top-8 text-xs' : '-top-12'}`}>
                   YOUR TURN
                 </div>
               )}
            </div>
          </div>

        </div>

        {/* Bottom UI Panel */}
        <div className={`absolute bottom-0 left-0 right-0 h-16 md:h-24 bg-linear-to-t from-black/90 via-black/50 to-transparent flex items-center px-4 md:px-12 pb-2 md:pb-6 z-30 pointer-events-none ${isMobileLandscape ? 'justify-end' : 'justify-between'}`}>
          
          {/* Trump Reveal Indicator (Passive) - Hidden on Mobile Landscape (moved to top) */}
          {!isMobileLandscape && (
          <div className="relative group pointer-events-auto">
            <div className={`
              w-12 h-16 md:w-20 md:h-28 rounded-md md:rounded-lg border-2 border-gold-500 shadow-[0_0_20px_rgba(0,0,0,0.5)] transition-all duration-700 transform-style-3d
              ${gameData.isTrumpRevealed ? 'rotate-y-0' : 'rotate-y-180'}
            `}>
              {/* Front (Revealed) */}
              <div className="absolute inset-0 backface-hidden bg-white rounded-sm md:rounded-md flex items-center justify-center border border-gray-300">
                <span className={`text-2xl md:text-5xl ${['hearts', 'diamonds'].includes(gameData.trumpSuit || '') ? 'text-red-600' : 'text-black'}`}>
                  {gameData.trumpSuit === 'spades' && '♠'}
                  {gameData.trumpSuit === 'hearts' && '♥'}
                  {gameData.trumpSuit === 'diamonds' && '♦'}
                  {gameData.trumpSuit === 'clubs' && '♣'}
                </span>
              </div>

              {/* Back (Hidden) */}
              <div className="absolute inset-0 backface-hidden rotate-y-180 bg-casino-green-800 rounded-sm md:rounded-md flex items-center justify-center border-2 border-gold-600 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDIwIDIwIiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmQiIHN0cm9rZS13aWR0aD0iMSI+PHBhdGggZD0iTTAgMGwyMCAyME0yMCAwbC0yMCAyMCIvPjwvc3ZnPg==')]">
                <div className="bg-black/60 px-1 py-0.5 md:px-2 md:py-1 rounded backdrop-blur-sm border border-gold-500/30">
                  <span className="text-gold-400 font-bold text-[8px] md:text-[10px] tracking-widest uppercase">Trump</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Call Trump Button */}
        <div className="flex gap-2 md:gap-4 items-end pointer-events-auto">
          {/* Ask Ishara Button */}
          <button
            onClick={onGetHint}
            disabled={!isMyTurn || gameData.status !== 'playing'}
            className={`
              w-10 h-10 md:w-16 md:h-16 rounded-full border-2 flex items-center justify-center
              transform transition-all duration-300 group relative
              ${isMyTurn && gameData.status === 'playing'
                ? 'bg-purple-900/80 border-purple-400 shadow-[0_0_20px_rgba(147,51,234,0.5)] hover:scale-110 hover:bg-purple-800 cursor-pointer' 
                : 'bg-gray-800 border-gray-600 opacity-50 cursor-not-allowed grayscale'}
            `}
          >
            <div className="flex flex-col items-center">
              <span className="text-lg md:text-2xl">🔮</span>
              <span className="text-[6px] md:text-[8px] text-purple-200 font-bold uppercase tracking-wider mt-0.5 md:mt-1">Ishara</span>
            </div>
            
            {/* Tooltip */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 text-purple-200 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none hidden md:block">
              Ask the Spirit
            </div>
          </button>

          <button 
            onClick={onRevealTrump}
            disabled={!canCallTrump}
            className={`
              w-16 h-16 md:w-24 md:h-24 rounded-full border-2 md:border-4 flex items-center justify-center
              transform transition-all duration-300
              ${canCallTrump 
                ? 'bg-gold-gradient border-gold-200 shadow-[0_0_40px_rgba(255,215,0,0.8)] hover:scale-110 active:scale-95 animate-pulse-slow cursor-pointer ring-2 md:ring-4 ring-gold-400/50' 
                : 'bg-gray-800 border-gray-600 opacity-50 cursor-not-allowed grayscale'}
            `}
          >
            <div className={`
              w-14 h-14 md:w-20 md:h-20 rounded-full border-2 flex items-center justify-center flex-col
              ${canCallTrump ? 'border-casino-green-900/50 bg-white/10 backdrop-blur-sm' : 'border-gray-500/30'}
            `}>
              <span className={`font-bold text-[8px] md:text-xs tracking-widest drop-shadow-md ${canCallTrump ? 'text-casino-green-950' : 'text-gray-400'}`}>CALL</span>
              <span className={`font-bold text-[8px] md:text-xs tracking-widest drop-shadow-md ${canCallTrump ? 'text-casino-green-950' : 'text-gray-400'}`}>TRUMP</span>
            </div>
            {/* Shine Effect */}
            {canCallTrump && (
              <div className="absolute inset-0 rounded-full bg-linear-to-tr from-transparent via-white/40 to-transparent animate-spin-slow pointer-events-none" />
            )}
          </button>
        </div>

      </div>

      {/* Ishara Hint Overlay */}
      {showHint && hint && (
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up pointer-events-none">
          <div className="bg-purple-900/90 backdrop-blur-md border border-purple-400/50 px-8 py-6 rounded-xl shadow-[0_0_50px_rgba(147,51,234,0.4)] max-w-md text-center relative overflow-hidden">
            {/* Mystical Glow */}
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-purple-400/10 to-transparent animate-shimmer" />
            
            <div className="relative z-10">
              <div className="text-3xl mb-2">🔮</div>
              <h4 className="text-purple-200 font-playfair text-lg mb-2 italic">The Spirit Whispers...</h4>
              <p className="text-white font-serif text-xl leading-relaxed drop-shadow-md">
                "{hint}"
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Trick Collection Animation */}
      {trickAnimating && gameData.lastTrickCards && gameData.lastTrickWinner && (
        <div className="absolute inset-0 pointer-events-none z-40">
          {gameData.lastTrickCards.map((played, index) => {
            const startPos = { x: 0, y: 0 }; // Center
            const endPos = getCardPosition(gameData.lastTrickWinner!); // Winner's position
            
            return (
              <div
                key={`anim-${index}`}
                className="absolute left-1/2 top-1/2 w-32 h-48"
                style={{
                  '--dest-x': `${endPos.x}px`,
                  '--dest-y': `${endPos.y}px`,
                  animation: 'fly-to-winner 1s forwards ease-in-out'
                } as React.CSSProperties}
              >
                <PlayingCard 
                  suit={played.card.suit as Suit} 
                  rank={played.card.rank as Rank} 
                  isFaceUp={true} 
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Victory Screen */}
      {gameData.status === 'finished' && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-lg flex flex-col items-center justify-center animate-fade-in">
          <div className="text-6xl mb-8 animate-bounce">🏆</div>
          <h2 className="text-5xl font-playfair text-gold-100 mb-4 drop-shadow-[0_0_20px_rgba(255,215,0,0.5)]">
            {gameData.winner === 'team1' ? 'Team 1 Wins!' : 'Team 2 Wins!'}
          </h2>
          
          <div className="flex gap-12 mt-8">
            <div className="flex flex-col items-center">
              <span className="text-gold-400 uppercase tracking-widest text-sm mb-2">Team 1</span>
              <span className="text-4xl font-bold text-white">{gameData.teams.team1.tensCollected}</span>
              <span className="text-xs text-gray-400">Tens</span>
              <span className="text-2xl font-bold text-white mt-2">{gameData.teams.team1.tricksWon}</span>
              <span className="text-xs text-gray-400">Tricks</span>
            </div>
            
            <div className="w-px bg-gold-500/30" />
            
            <div className="flex flex-col items-center">
              <span className="text-gold-400 uppercase tracking-widest text-sm mb-2">Team 2</span>
              <span className="text-4xl font-bold text-white">{gameData.teams.team2.tensCollected}</span>
              <span className="text-xs text-gray-400">Tens</span>
              <span className="text-2xl font-bold text-white mt-2">{gameData.teams.team2.tricksWon}</span>
              <span className="text-xs text-gray-400">Tricks</span>
            </div>
          </div>

          <button 
            onClick={onLeaveGame}
            className="mt-12 px-8 py-3 bg-gold-600 text-black font-bold rounded-full hover:bg-gold-400 transition-colors shadow-lg"
          >
            Return to Lobby
          </button>
          
          {/* Simple CSS Confetti */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(50)].map((_, i) => (
              <div 
                key={i}
                className="absolute w-2 h-2 bg-gold-400 rounded-full animate-confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `-10px`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${2 + Math.random() * 3}s`
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Orientation Prompt (Mobile Landscape) */}
      {isMobileLandscape && (
        <OrientationPrompt />
      )}

      {/* Sets History Modal */}
      {gameData && (
        <SetsHistoryModal 
          isOpen={showSetsHistory} 
          onClose={() => setShowSetsHistory(false)} 
          gameData={gameData} 
          currentPlayerId={currentPlayerId}
        />
      )}
    </div>
  );
};
