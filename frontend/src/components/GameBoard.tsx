import React, { useState, useEffect } from 'react';
import { PlayingCard, Suit, Rank } from './PlayingCard';
import { CardHand } from './CardHand';
import { PlayerNameplate } from './PlayerNameplate';
import { CasinoButton } from './CasinoButton';
import { Spades, Hearts, Diamonds, Clubs } from './icons/SuitIcons';
import { TeaIcon, WatchIcon, GlassesIcon, CheckIcon, XIcon, MicIcon, MicOffIcon } from './icons/GeneralIcons';
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
  trumpRevealerId?: string | null;
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
  isHost?: boolean;
}

interface GameBoardProps {
  gameData: GameState | null;
  players: Player[];
  currentPlayerId: string;
  onLeaveGame: () => void;
  onPlayAgain: () => void;
  onPlayCard: (cardId: string) => void;
  onSetTrump: (cardId: string) => void;
  onRevealTrump: () => void;
  onForfeit: () => void;
  incomingSignal: {senderId: string, signal: 'tea' | 'watch' | 'glasses'} | null;
  signalFeedback: {responderId: string, response: 'agree' | 'refuse'} | null;
  onSendSignal: (signal: 'tea' | 'watch' | 'glasses') => void;
  onRespondSignal: (originalSenderId: string, response: 'agree' | 'refuse') => void;
  voiceChatEnabled: boolean;
  onToggleVoiceChat: (enabled: boolean) => void;
  socket: any;
  roomCode: string;
}

const TensStatus = ({ gameData, currentPlayerId, isMobileLandscape }: { gameData: GameState, currentPlayerId: string, isMobileLandscape: boolean }) => {
  const suits: Suit[] = ['spades', 'hearts', 'clubs', 'diamonds'];
  
  const getTenOwner = (suit: Suit) => {
    const isInTeam1 = gameData.teams.team1.wonCards.some(c => c.rank === '10' && c.suit === suit);
    if (isInTeam1) return 'team1';
    const isInTeam2 = gameData.teams.team2.wonCards.some(c => c.rank === '10' && c.suit === suit);
    if (isInTeam2) return 'team2';
    return null;
  };

  const isPlayerTeam1 = gameData.teams.team1.players.includes(currentPlayerId);

  return (
    <div className={`flex items-center gap-2 bg-black/40 backdrop-blur-md rounded-lg border border-gold-500/30 pointer-events-auto ${isMobileLandscape ? 'px-2 py-1 ml-2' : 'px-3 py-1.5 ml-4'}`}>
      <span className={`text-gold-400 font-playfair uppercase tracking-widest ${isMobileLandscape ? 'text-[8px]' : 'text-[10px]'}`}>Tens:</span>
      <div className="flex gap-1 md:gap-2">
        {suits.map(suit => {
          const owner = getTenOwner(suit);
          const Icon = suit === 'spades' ? Spades : suit === 'hearts' ? Hearts : suit === 'clubs' ? Clubs : Diamonds;
          
          // Determine color/style based on owner
          let opacity = 'opacity-30 grayscale';
          let border = 'border-transparent';
          let bg = 'bg-transparent';
          let tooltip = 'Not collected';
          let indicatorColor = '';

          if (owner) {
            opacity = 'opacity-100';
            const isMyTeam = (owner === 'team1' && isPlayerTeam1) || (owner === 'team2' && !isPlayerTeam1);
            
            if (isMyTeam) {
              border = 'border-green-500/50';
              bg = 'bg-green-900/30';
              tooltip = 'Collected by Your Team';
              indicatorColor = 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.8)]';
            } else {
              border = 'border-red-500/50';
              bg = 'bg-red-900/30';
              tooltip = 'Collected by Opponents';
              indicatorColor = 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)]';
            }
          }

          return (
            <div key={suit} className={`
              relative rounded p-0.5 md:p-1 border ${border} ${bg} transition-all duration-300
              ${isMobileLandscape ? 'w-5 h-5' : 'w-6 h-6 md:w-8 md:h-8'} flex items-center justify-center
            `} title={tooltip}>
              <div className={`${opacity} transition-all duration-300 w-full h-full`}>
                <Icon className="w-full h-full" />
              </div>
              {/* Small indicator dot for owner */}
              {owner && (
                <div className={`absolute -top-1 -right-1 w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${indicatorColor}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

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

  // Check for mobile landscape
  const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-height: 500px) and (orientation: landscape)').matches;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-2 md:p-4">
       <div className={`bg-casino-green-900 border border-gold-500/50 rounded-xl shadow-2xl relative flex flex-col ${isMobile ? 'p-2 w-full max-w-lg max-h-[90vh]' : 'p-4 md:p-6 w-full max-w-4xl max-h-[80vh]'} overflow-y-auto`}>
          <button onClick={onClose} className={`absolute text-gold-400 hover:text-white font-bold z-50 ${isMobile ? 'top-2 right-2 text-lg' : 'top-4 right-4 text-xl'}`}>✕</button>
          <h2 className={`font-playfair text-gold-100 text-center sticky top-0 bg-casino-green-900/95 z-10 ${isMobile ? 'text-lg mb-2 py-1' : 'text-2xl md:text-3xl mb-6 py-2'}`}>Collected Sets</h2>
          
          <div className={`grid overflow-y-auto pr-2 ${isMobile ? 'gap-3 grid-cols-1' : `gap-8 ${isSpectator ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 justify-items-center'}`}`}>
             {/* Team 1 */}
             {(isTeam1 || isSpectator) && (
             <div className={`bg-black/20 rounded-lg ${isMobile ? 'p-2' : 'p-4'} ${!isSpectator && !isMobile ? 'w-full max-w-2xl' : ''}`}>
                <div className={`flex justify-between items-center border-b border-gold-500/30 ${isMobile ? 'mb-2 pb-1' : 'mb-4 pb-2'}`}>
                  <h3 className={`text-gold-400 font-bold uppercase tracking-widest ${isMobile ? 'text-xs' : ''}`}>Team 1</h3>
                  <span className={`text-gold-200 font-playfair ${isMobile ? 'text-xs' : ''}`}>{gameData.teams.team1.tricksWon} Sets</span>
                </div>
                <div className={isMobile ? 'space-y-1' : 'space-y-3'}>
                   {team1Sets.length === 0 && <p className={`text-gray-500 text-center italic ${isMobile ? 'text-xs py-2' : 'text-sm py-4'}`}>No sets collected yet</p>}
                   {team1Sets.map((set, i) => (
                      <div key={i} className={`bg-black/40 rounded-lg flex gap-1 justify-center items-center border border-gold-500/10 ${isMobile ? 'p-1' : 'p-2'}`}>
                         {set.map((card, idx) => (
                           <div key={idx} className={`${isMobile ? 'transform scale-50 -mx-3 first:ml-0' : 'transform scale-75 -mx-2 first:ml-0'}`}>
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
             <div className={`bg-black/20 rounded-lg ${isMobile ? 'p-2' : 'p-4'} ${!isSpectator && !isMobile ? 'w-full max-w-2xl' : ''}`}>
                <div className={`flex justify-between items-center border-b border-gold-500/30 ${isMobile ? 'mb-2 pb-1' : 'mb-4 pb-2'}`}>
                  <h3 className={`text-gold-400 font-bold uppercase tracking-widest ${isMobile ? 'text-xs' : ''}`}>Team 2</h3>
                  <span className={`text-gold-200 font-playfair ${isMobile ? 'text-xs' : ''}`}>{gameData.teams.team2.tricksWon} Sets</span>
                </div>
                <div className={isMobile ? 'space-y-1' : 'space-y-3'}>
                   {team2Sets.length === 0 && <p className={`text-gray-500 text-center italic ${isMobile ? 'text-xs py-2' : 'text-sm py-4'}`}>No sets collected yet</p>}
                   {team2Sets.map((set, i) => (
                      <div key={i} className={`bg-black/40 rounded-lg flex gap-1 justify-center items-center border border-gold-500/10 ${isMobile ? 'p-1' : 'p-2'}`}>
                         {set.map((card, idx) => (
                           <div key={idx} className={`${isMobile ? 'transform scale-50 -mx-3 first:ml-0' : 'transform scale-75 -mx-2 first:ml-0'}`}>
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
  onPlayAgain,
  onPlayCard,
  onSetTrump,
  onRevealTrump,
  onForfeit,
  incomingSignal,
  signalFeedback,
  onSendSignal,
  onRespondSignal,
  voiceChatEnabled,
  onToggleVoiceChat,
  socket,
  roomCode
}: GameBoardProps) => {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [prevScores, setPrevScores] = useState({ team1: 0, team2: 0 });
  const [scoreAnimating, setScoreAnimating] = useState<'team1' | 'team2' | null>(null);
  const [shakingCardId, setShakingCardId] = useState<string | null>(null);
  const [trickAnimating, setTrickAnimating] = useState(false);
  const [timeLeft, setTimeLeft] = useState(45);
  const [isMobileLandscape, setIsMobileLandscape] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(true);
  const [peers, setPeers] = useState<{ [id: string]: RTCPeerConnection }>({});
  const [streamReady, setStreamReady] = useState(false);
  const [showTrumpRevealNotification, setShowTrumpRevealNotification] = useState(false);
  const [showSetsHistory, setShowSetsHistory] = useState(false);
  const localStreamRef = React.useRef<MediaStream | null>(null);
  const peersRef = React.useRef<{ [id: string]: RTCPeerConnection }>({});

  const prevGameDataRef = React.useRef<GameState | null>(null);

  // Detect Mobile Landscape
  useEffect(() => {
    const checkMobileLandscape = () => {
      const isLandscape = window.matchMedia('(orientation: landscape)').matches;
      const isMobileWidth = window.matchMedia('(max-width: 932px)').matches; // Mobile width (typical phone landscape)
      const isSmallHeight = window.matchMedia('(max-height: 500px)').matches; // Small height devices
      setIsMobileLandscape(isLandscape && (isMobileWidth || isSmallHeight));
    };

    checkMobileLandscape();
    window.addEventListener('resize', checkMobileLandscape);
    return () => window.removeEventListener('resize', checkMobileLandscape);
  }, []);

  // Trump Reveal Notification Logic
  useEffect(() => {
    if (gameData?.isTrumpRevealed && gameData?.trumpRevealerId) {
      setShowTrumpRevealNotification(true);
      const timer = setTimeout(() => setShowTrumpRevealNotification(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [gameData?.isTrumpRevealed, gameData?.trumpRevealerId]);

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

  // Sound Effects Logic
  useEffect(() => {
    if (!gameData) return;
    const prev = prevGameDataRef.current;

    // Helper to play sound
    const playSound = (name: string) => {
      const audio = new Audio(`/sounds/${name}.mp3`);
      audio.volume = 0.6;
      audio.play().catch(e => console.log('Audio play failed:', e));
    };

    if (prev) {
      // Card Played
      if (gameData.currentTrick.length > prev.currentTrick.length) {
        playSound('card-place');
      }

      // Trump Revealed
      if (!prev.isTrumpRevealed && gameData.isTrumpRevealed) {
        playSound('trump-reveal');
      }

      // Trick Won (Collection)
      if (!prev.lastTrickWinner && gameData.lastTrickWinner) {
        setTimeout(() => playSound('chips-stack'), 500); // Delay for animation
      }

      // Game Over
      if (prev.status !== 'finished' && gameData.status === 'finished') {
        playSound('win');
      }
      
      // Your Turn
      if (gameData.currentTurn === currentPlayerId && prev.currentTurn !== currentPlayerId) {
        playSound('your-turn');
      }
    }

    prevGameDataRef.current = gameData;
  }, [gameData, currentPlayerId]);

  // Voice Chat Logic - Initialization
  useEffect(() => {
    if (!voiceChatEnabled) {
      // Cleanup
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
      Object.values(peersRef.current).forEach(peer => peer.close());
      peersRef.current = {};
      setPeers({});
      setStreamReady(false);
      setIsMicMuted(true);
      return;
    }

    let mounted = true;

    const init = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!mounted) {
            stream.getTracks().forEach(t => t.stop());
            return;
        }
        
        localStreamRef.current = stream;
        stream.getAudioTracks()[0].enabled = !isMicMuted;
        setStreamReady(true);

        // Listeners
        socket.on('voice_offer', async ({ offer, senderId }: { offer: RTCSessionDescriptionInit, senderId: string }) => {
            if (!localStreamRef.current) return;
            
            // If a peer exists, close it first to avoid state conflicts
            if (peersRef.current[senderId]) {
                peersRef.current[senderId].close();
            }

            const peer = createPeer(senderId, localStreamRef.current);
            peersRef.current[senderId] = peer;
            setPeers(prev => ({ ...prev, [senderId]: peer }));

            await peer.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await peer.createAnswer();
            await peer.setLocalDescription(answer);
            socket.emit('voice_answer', { answer, targetId: senderId, roomId: roomCode });
        });

        socket.on('voice_answer', async ({ answer, senderId }: { answer: RTCSessionDescriptionInit, senderId: string }) => {
            const peer = peersRef.current[senderId];
            if (peer && peer.signalingState !== 'stable') {
                await peer.setRemoteDescription(new RTCSessionDescription(answer));
            }
        });

        socket.on('voice_ice_candidate', async ({ candidate, senderId }: { candidate: RTCIceCandidateInit, senderId: string }) => {
            const peer = peersRef.current[senderId];
            if (peer) {
                await peer.addIceCandidate(new RTCIceCandidate(candidate));
            }
        });

      } catch (e) {
        console.error("Mic error", e);
      }
    };

    init();

    return () => {
        mounted = false;
        socket.off('voice_offer');
        socket.off('voice_answer');
        socket.off('voice_ice_candidate');
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(t => t.stop());
            localStreamRef.current = null;
        }
        Object.values(peersRef.current).forEach(p => p.close());
        peersRef.current = {};
        setPeers({});
        setStreamReady(false);
    };
  }, [voiceChatEnabled, roomCode, currentPlayerId]);

  // Voice Chat Logic - Connection Management
  useEffect(() => {
      if (!streamReady || !localStreamRef.current) return;

      // 1. Remove peers for players who left
      const currentIds = players.map(p => p.id);
      Object.keys(peersRef.current).forEach(peerId => {
          if (!currentIds.includes(peerId)) {
              peersRef.current[peerId].close();
              delete peersRef.current[peerId];
              setPeers(prev => {
                  const next = {...prev};
                  delete next[peerId];
                  return next;
              });
          }
      });

      // 2. Initiate connections for new players (if we are the offerer)
      players.forEach(player => {
          if (player.id === currentPlayerId) return;
          
          if (!peersRef.current[player.id]) {
              // ID Comparison to avoid glare: Lower ID initiates
              if (currentPlayerId < player.id) {
                  const peer = createPeer(player.id, localStreamRef.current!);
                  peersRef.current[player.id] = peer;
                  setPeers(prev => ({ ...prev, [player.id]: peer }));
                  
                  peer.createOffer().then(async (offer) => {
                      await peer.setLocalDescription(offer);
                      socket.emit('voice_offer', { offer, targetId: player.id, roomId: roomCode });
                  });
              }
          }
      });

  }, [players, streamReady, currentPlayerId, roomCode]);

  useEffect(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks()[0].enabled = !isMicMuted;
    }
  }, [isMicMuted]);

  const createPeer = (targetId: string, stream: MediaStream) => {
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    stream.getTracks().forEach(track => peer.addTrack(track, stream));

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('voice_ice_candidate', { candidate: event.candidate, targetId, roomId: roomCode });
      }
    };

    peer.ontrack = (event) => {
      const audio = new Audio();
      audio.srcObject = event.streams[0];
      audio.play();
    };

    return peer;
  };

  const toggleMic = () => {
    setIsMicMuted(!isMicMuted);
  };

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
                       !myCards.some(c => c.suit === gameData.currentTrick[0].card.suit && (!gameData.hiddenTrumpCard || c.id !== gameData.hiddenTrumpCard.id));

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

  // Check for forfeit condition (4 tens collected by one team)
  const isTeam1 = gameData.teams.team1.players.includes(currentPlayerId);
  const myTeam = isTeam1 ? gameData.teams.team1 : gameData.teams.team2;
  const otherTeam = isTeam1 ? gameData.teams.team2 : gameData.teams.team1;
  const canForfeit = otherTeam.tensCollected === 4 && gameData.status === 'playing';

  return (
    <div className={`relative w-full h-screen bg-casino-green-900 overflow-hidden select-none font-sans flex flex-col ${isMobileLandscape ? 'mobile-landscape-game' : ''}`}>
      <OrientationPrompt />
      
      {/* Background Texture */}
      <div className="absolute inset-0 felt-texture pointer-events-none" />
        
        {/* Top Bar */}
        <div className="absolute top-0 left-0 right-0 p-4 md:p-6 flex justify-between items-start z-20 pointer-events-none">
          {!isMobileLandscape && (
            <div className="flex gap-2 pointer-events-auto">
              <button 
                onClick={onLeaveGame}
                className="text-gold-400 hover:text-gold-200 font-playfair text-xs md:text-sm bg-black/40 px-4 py-1.5 md:px-6 md:py-2 rounded-full backdrop-blur-md border border-gold-500/30 transition-all hover:border-gold-400 shadow-lg"
              >
                Exit
              </button>
              <button 
                onClick={onPlayAgain}
                className="text-gold-400 hover:text-gold-200 font-playfair text-xs md:text-sm bg-black/40 px-4 py-1.5 md:px-6 md:py-2 rounded-full backdrop-blur-md border border-gold-500/30 transition-all hover:border-gold-400 shadow-lg"
              >
                Restart
              </button>
              {canForfeit && (
                <button 
                  onClick={onForfeit}
                  className="text-red-400 hover:text-red-200 font-playfair text-xs md:text-sm bg-red-900/40 px-4 py-1.5 md:px-6 md:py-2 rounded-full backdrop-blur-md border border-red-500/30 transition-all hover:border-red-400 shadow-lg animate-pulse"
                >
                  Forfeit
                </button>
              )}
              
              {/* Tens Status Display */}
              <TensStatus gameData={gameData} currentPlayerId={currentPlayerId} isMobileLandscape={false} />
            </div>
          )}
          
          {/* Mobile Score Board - Redesigned for landscape */}
          {isMobileLandscape && (
            <div className="fixed top-0 left-0 right-0 flex justify-between items-center px-2 py-1.5 pointer-events-auto z-50 bg-linear-to-b from-black/70 to-transparent">
              {/* Left: Exit/Restart buttons */}
              <div className="flex gap-1.5 opacity-60 hover:opacity-100 transition-opacity">
                <button 
                  onClick={onLeaveGame}
                  className="bg-black/50 px-2 py-0.5 rounded-md border border-gold-500/40 text-[9px] text-gold-400 hover:bg-black/70 transition-colors font-semibold"
                >
                  Exit
                </button>
                <button 
                  onClick={onPlayAgain}
                  className="bg-black/50 px-2 py-0.5 rounded-md border border-gold-500/40 text-[9px] text-gold-400 hover:bg-black/70 transition-colors font-semibold"
                >
                  Restart
                </button>
                {canForfeit && (
                  <button 
                    onClick={onForfeit}
                    className="bg-red-900/80 px-2 py-0.5 rounded-md border border-red-500/40 text-[9px] text-red-200 hover:bg-red-800 transition-colors font-semibold animate-pulse"
                  >
                    Forfeit
                  </button>
                )}
                
                {/* Tens Status Display (Mobile) */}
                <TensStatus gameData={gameData} currentPlayerId={currentPlayerId} isMobileLandscape={true} />
              </div>

              {/* Right Group: Scoreboard + Sets + Trump */}
              <div className="flex items-center gap-2">
                {/* Scoreboard */}
                <div className="flex items-center gap-3 bg-black/60 backdrop-blur-sm rounded-lg px-4 py-1.5 border border-gold-500/30 shadow-lg">
                  {/* Team 1 */}
                  <div className="flex flex-col items-center min-w-12">
                    <span className="text-gold-500 text-[8px] md:text-[10px] font-bold tracking-[0.2em] uppercase mb-0.5 md:mb-1">Team 1</span>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-gold-100 font-playfair text-xl font-bold leading-none ${scoreAnimating === 'team1' ? 'animate-score-update' : ''}`}>
                        {gameData.teams.team1.tricksWon}
                      </span>
                      <span className="text-gold-400 text-[8px]">({gameData.teams.team1.tensCollected} 10s)</span>
                    </div>
                  </div>
                  
                  {/* Divider */}
                  <div className="w-px bg-gold-500/40 h-6" />
                  
                  {/* Team 2 */}
                  <div className="flex flex-col items-center min-w-12">
                    <span className="text-gold-500 text-[8px] md:text-[10px] font-bold tracking-[0.2em] uppercase mb-0.5 md:mb-1">Team 2</span>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-gold-100 font-playfair text-xl font-bold leading-none ${scoreAnimating === 'team2' ? 'animate-score-update' : ''}`}>
                        {gameData.teams.team2.tricksWon}
                      </span>
                      <span className="text-gold-400 text-[8px]">({gameData.teams.team2.tensCollected} 10s)</span>
                    </div>
                  </div>
                </div>

                {/* Sets Button */}
                <button 
                  onClick={() => setShowSetsHistory(true)}
                  className="w-8 h-8 bg-black/50 backdrop-blur rounded-md border border-gold-500/40 flex items-center justify-center shadow-md active:scale-95 transition-transform"
                  title="View Sets"
                >
                  <div className="flex flex-col gap-0.5 opacity-80">
                    <div className="w-3 h-2 border border-gold-400 rounded-[1px] bg-gold-500/10"></div>
                    <div className="w-3 h-2 border border-gold-400 rounded-[1px] bg-gold-500/10 -mt-1.5 ml-0.5"></div>
                  </div>
                </button>

                {/* Trump Indicator */}
                <div className="w-8 h-8 bg-black/50 backdrop-blur rounded-md border border-gold-500/40 flex items-center justify-center shadow-md">
                  {gameData.isTrumpRevealed && gameData.trumpSuit ? (
                    <span className={`text-xl drop-shadow-sm ${
                      ['hearts', 'diamonds'].includes(gameData.trumpSuit) ? 'text-red-500' : 'text-white'
                    }`}>
                      {gameData.trumpSuit === 'spades' && '♠'}
                      {gameData.trumpSuit === 'hearts' && '♥'}
                      {gameData.trumpSuit === 'diamonds' && '♦'}
                      {gameData.trumpSuit === 'clubs' && '♣'}
                    </span>
                  ) : (
                    <Spades className="w-4 h-4 text-gold-600/60" />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Desktop Right Side: Scoreboard + Sets + Trump */}
          {!isMobileLandscape && (
            <div className="flex gap-6 items-start pointer-events-auto ml-auto">
               {/* Scoreboard */}
               <div className="wood-panel rounded-lg md:rounded-xl px-4 py-2 md:px-8 md:py-3 shadow-2xl flex gap-4 md:gap-10 transform hover:scale-105 transition-transform">
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

               {/* Sets & Trump */}
               <div className="flex gap-4 items-start">
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
            </div>
          )}

          {/* Mobile Landscape controls now in top bar */}
        </div>

        {/* Game Area */}
        <div className={`flex-1 relative perspective-1000 flex items-center justify-center ${isMobileLandscape ? 'pt-2' : ''}`}>
          
          {/* Center Trick Area */}
          <div className={`
            absolute rounded-full border-2 border-dashed border-gold-500/10 flex items-center justify-center bg-black/20 shadow-[inset_0_0_60px_rgba(0,0,0,0.4)]
            ${isMobileLandscape ? 'w-28 h-28 -translate-y-6' : 'w-72 h-72 -translate-y-12'}
          `}>
            {/* Inner stitching ring */}
            <div className="absolute inset-2 rounded-full border border-gold-500/10 border-dashed opacity-60" />
            
            {/* Subtle felt pattern for center */}
            <div className="absolute inset-0 rounded-full opacity-30 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')]"></div>

            {/* Dealer Chip / Logo Watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
              <div className={`rounded-full border-2 border-gold-500/30 flex items-center justify-center ${isMobileLandscape ? 'w-16 h-16' : 'w-32 h-32'}`}>
                  <span className={`font-playfair text-gold-500 font-bold ${isMobileLandscape ? 'text-xs' : 'text-2xl'}`}>DEHLA</span>
              </div>
            </div>
            
            {/* Vignette for All Screens - Removed as per request to remove square */}
            {/* <div className="fixed inset-0 bg-radial-transparent-black pointer-events-none z-[-1]" style={{ background: 'radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.6) 100%)' }} /> */}
            
            {gameData.currentTrick.map((played, index) => {
               const rotation = getCardRotation(played.playerId);
               const pos = getCardPosition(played.playerId);
               // Tighter stacking for mobile landscape
               const mobileScale = isMobileLandscape ? 0.35 : 1;
               
               return (
                <div 
                  key={`${played.playerId}-${index}`}
                  className="absolute transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)"
                  style={{ 
                    transform: `translate(${pos.x * mobileScale}px, ${pos.y * mobileScale}px) rotate(${rotation + (Math.random() * 4 - 2)}deg) scale(${isMobileLandscape ? 0.4 : 1})`, // Add slight randomness
                    zIndex: 20 + index
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
              <div className={`flex flex-col items-center ${isMobileLandscape ? 'gap-2' : 'gap-8'}`}>
                <h3 className={`font-playfair text-gold-100 drop-shadow-lg ${isMobileLandscape ? 'text-lg' : 'text-3xl'}`}>Select a Hidden Trump Card</h3>
                <p className={`text-gold-400 italic ${isMobileLandscape ? 'text-xs' : ''}`}>Pick one card to set the trump suit secretly</p>
                
                <div className={`flex perspective-1000 ${isMobileLandscape ? 'gap-2' : 'gap-4'}`}>
                  {myCards.slice(0, 5).map((card, index) => (
                    <div 
                      key={card.id}
                      onClick={() => onSetTrump(card.id)}
                      className={`bg-casino-green-800 border-2 border-gold-600 shadow-2xl cursor-pointer transform hover:-translate-y-4 hover:scale-105 transition-all duration-300 group relative ${isMobileLandscape ? 'w-14 h-20 rounded-md' : 'w-32 h-48 rounded-xl'}`}
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      {/* Card Back Pattern */}
                      <div className={`absolute inset-0 w-full h-full overflow-hidden ${isMobileLandscape ? 'rounded-md' : 'rounded-xl'}`}>
                        <div className="w-full h-full opacity-40 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDIwIDIwIiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmQiIHN0cm9rZS13aWR0aD0iMSI+PHBhdGggZD0iTTAgMGwyMCAyME0yMCAwbC0yMCAyMCIvPjwvc3ZnPg==')]"></div>
                        <div className={`absolute border border-gold-500/50 ${isMobileLandscape ? 'inset-1 rounded-sm' : 'inset-2 rounded-lg'}`}></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                           <div className={`rounded-full border-2 border-gold-400 flex items-center justify-center bg-casino-green-900 shadow-lg group-hover:scale-110 transition-transform ${isMobileLandscape ? 'w-8 h-8' : 'w-16 h-16'}`}>
                              <span className={`font-playfair text-gold-300 ${isMobileLandscape ? 'text-xs' : 'text-2xl'}`}>CP</span>
                           </div>
                        </div>
                      </div>
                      {/* Glow on hover */}
                      <div className={`absolute inset-0 bg-gold-400/20 opacity-0 group-hover:opacity-100 transition-opacity ${isMobileLandscape ? 'rounded-md' : 'rounded-xl'}`} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Player: North (Partner) */}
          {partnerId && (
            <div className={`absolute left-1/2 -translate-x-1/2 flex flex-col items-center transition-all duration-300 ${isMobileLandscape ? 'top-3 gap-1' : 'top-2 gap-4'}`}>
              <PlayerNameplate 
                name={getPlayerName(partnerId)} 
                team={getTeamName(partnerId)} 
                isActive={gameData.currentTurn === partnerId} 
                timeLeft={gameData.currentTurn === partnerId ? timeLeft : undefined}
                variant="standard"
              />
              <div className={`origin-top opacity-90 ${isMobileLandscape ? 'scale-50 -mt-3' : 'scale-75'}`}>
                 {/* Show back of cards */}
               <div className="flex -space-x-16">
                 {gameData.hands[partnerId]?.map((_, i) => (
                   <div key={i} className={`bg-casino-green-800 rounded-md sm:rounded-lg border-2 border-gold-600 shadow-lg transform hover:-translate-y-2 transition-transform ${isMobileLandscape ? 'w-12 h-18' : 'w-16 h-24 sm:w-20 sm:h-28 lg:w-24 lg:h-28'}`}>
                      <div className="w-full h-full opacity-40 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDIwIDIwIiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmQiIHN0cm9rZS13aWR0aD0iMSI+PHBhdGggZD0iTTAgMGwyMCAyME0yMCAwbC0yMCAyMCIvPjwvc3ZnPg==')]"></div>
                   </div>
                 ))}
               </div>
               </div>
            </div>
          )}

          {/* Player: West (Left Opponent) */}
          {leftOpponentId && (
            <div className={`absolute top-1/2 -translate-y-1/2 flex items-center -rotate-90 origin-center transition-all duration-300 ${isMobileLandscape ? 'left-16 gap-1 flex-col' : 'left-12 gap-4 flex-col'}`}>
              <PlayerNameplate 
                name={getPlayerName(leftOpponentId)} 
                team={getTeamName(leftOpponentId)} 
                isActive={gameData.currentTurn === leftOpponentId} 
                timeLeft={gameData.currentTurn === leftOpponentId ? timeLeft : undefined}
                variant="standard"
              />
               <div className={`origin-center opacity-90 ${isMobileLandscape ? 'scale-50' : 'scale-75 mt-4'}`}>
                 <div className="flex -space-x-16">
                   {gameData.hands[leftOpponentId]?.map((_, i) => (
                     <div key={i} className={`bg-casino-green-800 rounded-md sm:rounded-lg border-2 border-gold-600 shadow-lg ${isMobileLandscape ? 'w-12 h-18' : 'w-16 h-24 sm:w-20 sm:h-28 lg:w-24 lg:h-36'}`}>
                        <div className="w-full h-full opacity-40 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDIwIDIwIiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmQiIHN0cm9rZS13aWR0aD0iMSI+PHBhdGggZD0iTTAgMGwyMCAyME0yMCAwbC0yMCAyMCIvPjwvc3ZnPg==')]"></div>
                     </div>
                   ))}
                 </div>
               </div>
            </div>
          )}

          {/* Player: East (Right Opponent) */}
          {rightOpponentId && (
            <div className={`absolute top-1/2 -translate-y-1/2 flex items-center rotate-90 origin-center transition-all duration-300 ${isMobileLandscape ? 'right-12 gap-1 flex-col' : 'right-12 gap-4 flex-col'}`}>
              <PlayerNameplate 
                name={getPlayerName(rightOpponentId)} 
                team={getTeamName(rightOpponentId)} 
                isActive={gameData.currentTurn === rightOpponentId} 
                timeLeft={gameData.currentTurn === rightOpponentId ? timeLeft : undefined}
                variant="standard"
              />
               <div className={`origin-center opacity-90 ${isMobileLandscape ? 'scale-50' : 'scale-75 mt-4'}`}>
                 <div className="flex -space-x-16">
                   {gameData.hands[rightOpponentId]?.map((_, i) => (
                     <div key={i} className={`bg-casino-green-800 rounded-md sm:rounded-lg border-2 border-gold-600 shadow-lg ${isMobileLandscape ? 'w-12 h-18' : 'w-16 h-24 sm:w-20 sm:h-28 lg:w-24 lg:h-36'}`}>
                        <div className="w-full h-full opacity-40 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDIwIDIwIiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmQiIHN0cm9rZS13aWR0aD0iMSI+PHBhdGggZD0iTTAgMGwyMCAyME0yMCAwbC0yMCAyMCIvPjwvc3ZnPg==')]"></div>
                     </div>
                   ))}
                 </div>
               </div>
            </div>
          )}

          {/* Player: South (Me) */}
          <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center transition-all duration-300 ${isMobileLandscape ? 'w-[85%] pb-3 gap-0' : 'w-full max-w-5xl pb-4 gap-4'}`}>
            {/* My Hand */}
            <div className={`relative w-full flex justify-center items-end perspective-1000 z-10 transition-all duration-500 ${isMobileLandscape ? 'h-28' : 'h-56'} ${!isMyTurn ? 'opacity-70 grayscale-30 pointer-events-none' : ''}`}>
               <CardHand 
                 cards={myCards.map(c => ({ ...c, suit: c.suit as Suit, rank: c.rank as Rank }))}
                 onCardClick={handleCardClick}
                 selectedCardId={selectedCardId}
                 validCardIds={validCardIds}
                 shakingCardId={shakingCardId}
                 isActive={isMyTurn}
                 layout={isMobileLandscape ? 'scroll' : 'fan'}
                 hiddenTrumpCardId={gameData.hiddenTrumpCard?.id}
                 isTrumpRevealed={gameData.isTrumpRevealed}
                 isMobileLandscape={isMobileLandscape}
               />
            </div>
            
            <div className={`relative z-20 ${isMobileLandscape ? '-mt-1' : ''}`}>
               <PlayerNameplate 
                 name={getPlayerName(currentPlayerId)} 
                 team={getTeamName(currentPlayerId)} 
                 isActive={isMyTurn} 
                 timeLeft={isMyTurn ? timeLeft : undefined}
                 variant="standard"
               />
               {isMyTurn && (
                 <div className={`absolute left-1/2 -translate-x-1/2 bg-gold-500 text-black font-bold rounded-full animate-pulse shadow-[0_0_15px_rgba(255,215,0,0.8)] whitespace-nowrap ${isMobileLandscape ? '-top-6 text-[9px] px-2 py-0.5' : '-top-12 px-4 py-1'}`}>
                   YOUR TURN
                 </div>
               )}
            </div>
          </div>

        </div>

        {/* Bottom UI Panel */}
        <div className={`absolute left-0 right-0 flex items-center z-30 pointer-events-none ${
          isMobileLandscape 
            ? 'bottom-2 justify-end px-2 h-auto' 
            : 'bottom-0 h-16 md:h-24 bg-linear-to-t from-black/90 via-black/50 to-transparent justify-between px-4 md:px-12 pb-2 md:pb-6'
        }`}>
          
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
        <div className={`flex items-end pointer-events-auto ${isMobileLandscape ? 'gap-4 fixed bottom-4 right-4 flex-row z-50 items-center' : 'gap-2 md:gap-4'}`}>
          {/* Voice Chat Controls */}
          <div className="flex gap-2 mr-2 items-center">
            {/* Host Global Toggle */}
            {players.find(p => p.id === currentPlayerId)?.isHost && (
              <button 
                onClick={() => onToggleVoiceChat(!voiceChatEnabled)}
                className={`p-2 md:p-3 rounded-full border transition-all hover:scale-110 group relative ${voiceChatEnabled ? 'bg-green-900/60 border-green-500/30' : 'bg-red-900/60 border-red-500/30'}`}
                title={voiceChatEnabled ? "Disable Voice Chat for All" : "Enable Voice Chat for All"}
              >
                <div className="relative">
                  {voiceChatEnabled ? <MicIcon className="w-5 h-5 md:w-8 md:h-8 text-green-400" /> : <MicOffIcon className="w-5 h-5 md:w-8 md:h-8 text-red-400" />}
                  <span className="absolute -top-1 -right-1 text-[8px] bg-gold-500 text-black px-1 rounded-full font-bold">H</span>
                </div>
              </button>
            )}

            {/* Personal Mic Toggle */}
            {voiceChatEnabled && (
              <button 
                onClick={toggleMic} 
                className={`p-2 md:p-3 rounded-full border transition-all hover:scale-110 group relative ${isMicMuted ? 'bg-red-900/60 border-red-500/30 hover:bg-red-900/80' : 'bg-green-900/60 border-green-500/30 hover:bg-green-900/80'}`} 
                title={isMicMuted ? "Unmute Mic" : "Mute Mic"}
              >
                {isMicMuted ? <MicOffIcon className="w-5 h-5 md:w-8 md:h-8 text-red-400" /> : <MicIcon className="w-5 h-5 md:w-8 md:h-8 text-green-400" />}
              </button>
            )}
          </div>

          {/* Secret Signal Buttons */}
          {isMyTurn && gameData.status === 'playing' && (
            <div className="flex gap-2 mr-2">
              <button onClick={() => onSendSignal('tea')} className="bg-black/60 p-2 md:p-3 rounded-full hover:bg-black/80 border border-gold-500/30 transition-all hover:scale-110 group relative" title="Sip Tea (Trump?)">
                <TeaIcon className="w-5 h-5 md:w-8 md:h-8 text-gold-400" />
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/90 text-gold-100 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Trump?</span>
              </button>
              <button onClick={() => onSendSignal('watch')} className="bg-black/60 p-2 md:p-3 rounded-full hover:bg-black/80 border border-gold-500/30 transition-all hover:scale-110 group relative" title="Check Watch (Protect 10?)">
                <WatchIcon className="w-5 h-5 md:w-8 md:h-8 text-gold-400" />
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/90 text-gold-100 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Protect 10?</span>
              </button>
              <button onClick={() => onSendSignal('glasses')} className="bg-black/60 p-2 md:p-3 rounded-full hover:bg-black/80 border border-gold-500/30 transition-all hover:scale-110 group relative" title="Adjust Glasses (Lead High?)">
                <GlassesIcon className="w-5 h-5 md:w-8 md:h-8 text-gold-400" />
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/90 text-gold-100 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">Lead High?</span>
              </button>
            </div>
          )}

          <button 
            onClick={onRevealTrump}
            disabled={!canCallTrump}
            className={`
              relative rounded-full border-2 md:border-4 flex items-center justify-center
              transform transition-all duration-300
              ${isMobileLandscape ? 'w-16 h-16' : 'w-16 h-16 md:w-24 md:h-24'}
              ${canCallTrump  
                ? 'bg-linear-to-b from-yellow-200 via-yellow-400 to-yellow-500 border-yellow-200  hover:scale-110 active:scale-95  cursor-pointer ring-4 ring-yellow-400/80 ' 
                : 'bg-gray-900/80 border-gray-500 cursor-not-allowed backdrop-blur-sm'}
            `}
          >
            <div className={`
              rounded-full border-2 flex items-center justify-center flex-col
              ${isMobileLandscape ? 'w-14 h-14' : 'w-14 h-14 md:w-20 md:h-20'}
              ${canCallTrump ? 'border-casino-green-900/50 bg-white/10 backdrop-blur-sm' : 'border-gray-500/30'}
            `}>
              <span className={`font-bold tracking-widest drop-shadow-md ${isMobileLandscape ? 'text-[9px]' : 'text-[8px] md:text-xs'} ${canCallTrump ? 'text-casino-green-950' : 'text-gray-300'}`}>CALL</span>
              <span className={`font-bold tracking-widest drop-shadow-md ${isMobileLandscape ? 'text-[9px]' : 'text-[8px] md:text-xs'} ${canCallTrump ? 'text-casino-green-950' : 'text-gray-300'}`}>TRUMP</span>
            </div>
            {/* Shine Effect */}
            {canCallTrump && (
              <div className="absolute inset-0 rounded-full bg-linear-to-tr from-transparent via-white/40 to-transparent animate-spin-slow pointer-events-none" />
            )}
          </button>
        </div>

      </div>

      {/* Incoming Signal Overlay */}
      {incomingSignal && (
        <div className="absolute inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-casino-green-900 border-2 border-gold-500 rounded-xl p-6 shadow-2xl flex flex-col items-center gap-4 max-w-sm mx-4">
            <h3 className="text-gold-100 font-playfair text-xl text-center">Teammate Signal</h3>
            
            <div className="w-24 h-24 bg-black/30 rounded-full flex items-center justify-center border border-gold-500/30 animate-pulse">
              {incomingSignal.signal === 'tea' && <TeaIcon className="w-12 h-12 text-gold-400" />}
              {incomingSignal.signal === 'watch' && <WatchIcon className="w-12 h-12 text-gold-400" />}
              {incomingSignal.signal === 'glasses' && <GlassesIcon className="w-12 h-12 text-gold-400" />}
            </div>
            
            <p className="text-gold-200 text-center italic text-sm">
              {incomingSignal.signal === 'tea' && "I am going to use a Trump. Should I?"}
              {incomingSignal.signal === 'watch' && "I have a 10. Can you protect/win it?"}
              {incomingSignal.signal === 'glasses' && "I have high cards. Should I lead?"}
            </p>

            <div className="flex gap-4 w-full">
              <button 
                onClick={() => onRespondSignal(incomingSignal.senderId, 'agree')}
                className="flex-1 bg-green-900/80 hover:bg-green-800 text-green-100 py-2 rounded-lg border border-green-500/50 flex items-center justify-center gap-2 transition-colors"
              >
                <CheckIcon className="w-5 h-5" />
                <span>{incomingSignal.signal === 'tea' ? "Go ahead" : incomingSignal.signal === 'watch' ? "I've got it" : "Yes"}</span>
              </button>
              <button 
                onClick={() => onRespondSignal(incomingSignal.senderId, 'refuse')}
                className="flex-1 bg-red-900/80 hover:bg-red-800 text-red-100 py-2 rounded-lg border border-red-500/50 flex items-center justify-center gap-2 transition-colors"
              >
                <XIcon className="w-5 h-5" />
                <span>{incomingSignal.signal === 'tea' ? "Wait" : incomingSignal.signal === 'watch' ? "I can't" : "No"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Signal Feedback Overlay */}
      {signalFeedback && (
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 z-60 animate-bounce-in pointer-events-none">
          <div className={`
            flex items-center gap-3 px-6 py-3 rounded-full border shadow-xl backdrop-blur-md
            ${signalFeedback.response === 'agree' ? 'bg-green-900/90 border-green-500 text-green-100' : 'bg-red-900/90 border-red-500 text-red-100'}
          `}>
            {signalFeedback.response === 'agree' ? <CheckIcon className="w-8 h-8" /> : <XIcon className="w-8 h-8" />}
            <span className="font-bold text-lg">
              {signalFeedback.response === 'agree' ? "Agreed" : "Refused"}
            </span>
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
        <div className={`absolute inset-0 z-50 bg-black/90 backdrop-blur-lg flex flex-col items-center justify-center animate-fade-in ${isMobileLandscape ? 'px-4' : ''}`}>
          <div className={`animate-bounce ${isMobileLandscape ? 'text-3xl mb-2' : 'text-6xl mb-8'}`}>🏆</div>
          <h2 className={`font-playfair text-gold-100 drop-shadow-[0_0_20px_rgba(255,215,0,0.5)] ${isMobileLandscape ? 'text-2xl mb-2' : 'text-5xl mb-4'}`}>
            {gameData.winner === 'team1' ? 'Team 1 Wins!' : 'Team 2 Wins!'}
          </h2>
          
          <div className={`flex ${isMobileLandscape ? 'gap-6 mt-2' : 'gap-12 mt-8'}`}>
            <div className="flex flex-col items-center">
              <span className={`text-gold-400 uppercase tracking-widest ${isMobileLandscape ? 'text-[8px] mb-1' : 'text-sm mb-2'}`}>Team 1</span>
              <span className={`font-bold text-white ${isMobileLandscape ? 'text-xl' : 'text-4xl'}`}>{gameData.teams.team1.tensCollected}</span>
              <span className={`text-gray-400 ${isMobileLandscape ? 'text-[8px]' : 'text-xs'}`}>Tens</span>
              <span className={`font-bold text-white ${isMobileLandscape ? 'text-lg mt-1' : 'text-2xl mt-2'}`}>{gameData.teams.team1.tricksWon}</span>
              <span className={`text-gray-400 ${isMobileLandscape ? 'text-[8px]' : 'text-xs'}`}>Tricks</span>
            </div>
            
            <div className="w-px bg-gold-500/30" />
            
            <div className="flex flex-col items-center">
              <span className={`text-gold-400 uppercase tracking-widest ${isMobileLandscape ? 'text-[8px] mb-1' : 'text-sm mb-2'}`}>Team 2</span>
              <span className={`font-bold text-white ${isMobileLandscape ? 'text-xl' : 'text-4xl'}`}>{gameData.teams.team2.tensCollected}</span>
              <span className={`text-gray-400 ${isMobileLandscape ? 'text-[8px]' : 'text-xs'}`}>Tens</span>
              <span className={`font-bold text-white ${isMobileLandscape ? 'text-lg mt-1' : 'text-2xl mt-2'}`}>{gameData.teams.team2.tricksWon}</span>
              <span className={`text-gray-400 ${isMobileLandscape ? 'text-[8px]' : 'text-xs'}`}>Tricks</span>
                       </div>
          </div>

          <div className={`flex gap-4 ${isMobileLandscape ? 'mt-4' : 'mt-12'}`}>
                       <button 
              onClick={onPlayAgain}
              className={`bg-gold-600 text-black font-bold rounded-full hover:bg-gold-400 transition-colors shadow-lg animate-pulse ${isMobileLandscape ? 'px-4 py-1.5 text-xs' : 'px-8 py-3'}`}
            >
              Next Round
            </button>
            <button 
              onClick={onLeaveGame}
              className={`bg-black/40 text-gold-400 font-bold rounded-full border border-gold-500/30 hover:bg-black/60 transition-colors shadow-lg ${isMobileLandscape ? 'px-4 py-1.5 text-xs' : 'px-8 py-3'}`}
            >
              Return to Lobby
            </button>
          </div>
          
          {/* Simple CSS Confetti */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(isMobileLandscape ? 30 : 50)].map((_, i) => (
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

      {/* Sets History Modal */}
      {gameData && (
        <SetsHistoryModal 
          isOpen={showSetsHistory} 
          onClose={() => setShowSetsHistory(false)} 
          gameData={gameData} 
          currentPlayerId={currentPlayerId}
        />
      )}

      {/* Status Messages Overlay */}
      <div className={`absolute left-0 right-0 flex flex-col items-center gap-2 z-40 pointer-events-none ${isMobileLandscape ? 'top-14' : 'top-24'}`}>
         {/* Trump Selection Status */}
         {gameData.status === 'calling_trump' && !isMyTurn && (
           <div className={`bg-black/60 backdrop-blur-md border border-gold-500/30 rounded-full animate-pulse flex items-center gap-2 ${isMobileLandscape ? 'px-3 py-1' : 'px-6 py-2'}`}>
             <div className="w-2 h-2 bg-gold-400 rounded-full animate-ping" />
             <span className={`text-gold-200 font-playfair ${isMobileLandscape ? 'text-[10px]' : ''}`}>
               Waiting for <span className="text-gold-400 font-bold">{getPlayerName(gameData.trumpCallerId)}</span> to select trump...
             </span>
           </div>
         )}

         {/* Trump Reveal Notification */}
         {showTrumpRevealNotification && gameData.trumpRevealerId && (
           <div className={`bg-red-900/90 backdrop-blur-md border border-red-500/50 rounded-full animate-bounce-in shadow-[0_0_30px_rgba(220,38,38,0.5)] flex items-center gap-2 ${isMobileLandscape ? 'px-4 py-1' : 'px-8 py-3 gap-3'}`}>
             <span className={isMobileLandscape ? 'text-base' : 'text-2xl'}>📢</span>
             <span className={`text-white font-bold ${isMobileLandscape ? 'text-xs' : 'text-lg'}`}>
               {getPlayerName(gameData.trumpRevealerId)} called Trump!
             </span>
           </div>
         )}
      </div>
    </div>
  );
};
