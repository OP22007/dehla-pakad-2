export interface Player {
  id: string;
  name: string;
  isReady: boolean;
  isHost: boolean;
  socketId: string;
  connected: boolean; // Track connection status
}

export interface Room {
  code: string;
  players: Player[];
  status: 'waiting' | 'playing';
  maxPlayers: number;
  voiceChatEnabled: boolean; // New field
}

export interface CreateRoomPayload {
  playerName: string;
}

export interface JoinRoomPayload {
  roomCode: string;
  playerName: string;
}

export interface RoomUpdatePayload {
  roomCode: string;
  players: Player[];
  status: 'waiting' | 'playing';
}

export interface ApiResponse<T = any> {
  success: boolean;
  error?: string;
  room?: Room;
  playerId?: string;
  data?: T;
}

export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  id: string;
  suit: Suit;
  rank: Rank;
}

export interface PlayedCard {
  playerId: string;
  card: Card;
}

export type SignalType = 'tea' | 'watch' | 'glasses';
export type SignalResponse = 'agree' | 'refuse';

export interface SignalPayload {
  roomId: string;
  senderId: string;
  signal: SignalType;
}

export interface SignalResponsePayload {
  roomId: string;
  responderId: string;
  originalSenderId: string;
  response: SignalResponse;
}

export interface GameState {
  roomId: string;
  players: string[]; // Array of player IDs in turn order
  hands: { [playerId: string]: Card[] };
  currentTrick: PlayedCard[];
  trumpSuit: Suit | null;
  hiddenTrumpCard: Card | null; // New field for the blind trump card
  isTrumpRevealed: boolean;
  trumpCallerId: string;
  trumpRevealerId?: string | null; // ID of the player who revealed the trump
  currentTurn: string; // Player ID
  teams: {
    team1: TeamState; // Players at index 0 and 2
    team2: TeamState; // Players at index 1 and 3
  };
  status: 'dealing' | 'calling_trump' | 'playing' | 'finished';
  winner: 'team1' | 'team2' | null;
  logs: string[];
  lastTrickWinner?: string | null;
  lastTrickCards?: PlayedCard[] | null;
}

export interface TeamState {
  players: string[];
  tricksWon: number;
  tensCollected: number;
  wonCards: Card[];
}
