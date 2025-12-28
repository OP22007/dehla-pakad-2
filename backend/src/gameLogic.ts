import { v4 as uuidv4 } from 'uuid';
import { Card, GameState, Rank, Suit, TeamState, PlayedCard } from './types';

const SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

// Rank values for comparison (higher is better)
const RANK_VALUES: { [key in Rank]: number } = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
  '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
};

export class GameLogic {
  
  static createDeck(): Card[] {
    const deck: Card[] = [];
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        deck.push({
          id: uuidv4(),
          suit,
          rank
        });
      }
    }
    return deck;
  }

  static shuffleDeck(deck: Card[]): Card[] {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }

  static initializeGame(roomId: string, playerIds: string[], previousWinnerTeam?: 'team1' | 'team2'): GameState {
    if (playerIds.length !== 4) {
      throw new Error("Game requires exactly 4 players");
    }

    // Determine Cutter (Trump Caller)
    let trumpCallerId: string;
    if (previousWinnerTeam) {
      // Randomly select from the winning team
      const teamIndices = previousWinnerTeam === 'team1' ? [0, 2] : [1, 3];
      const randomIdx = teamIndices[Math.floor(Math.random() * teamIndices.length)];
      trumpCallerId = playerIds[randomIdx];
    } else {
      // Randomly select any player for the first game
      trumpCallerId = playerIds[Math.floor(Math.random() * 4)];
    }

    // Initial State
    const state: GameState = {
      roomId,
      players: playerIds,
      hands: {},
      currentTrick: [],
      trumpSuit: null,
      hiddenTrumpCard: null,
      isTrumpRevealed: false,
      trumpCallerId,
      currentTurn: trumpCallerId, // Cutter starts or deals? Usually cutter gets first 5 cards.
      // In Court Piece, dealer deals 5 cards to everyone. Cutter calls trump.
      // Let's assume the person AFTER the dealer is the cutter/first player.
      // For simplicity, let's say 'trumpCallerId' is the one who calls trump.
      teams: {
        team1: {
          players: [playerIds[0], playerIds[2]],
          tricksWon: 0,
          tensCollected: 0,
          wonCards: []
        },
        team2: {
          players: [playerIds[1], playerIds[3]],
          tricksWon: 0,
          tensCollected: 0,
          wonCards: []
        }
      },
      status: 'dealing',
      winner: null,
      logs: [`Game initialized. ${trumpCallerId} will call trump.`]
    };

    // Initialize empty hands
    playerIds.forEach(id => state.hands[id] = []);

    return this.dealInitialCards(state);
  }

  static dealInitialCards(state: GameState): GameState {
    const deck = this.shuffleDeck(this.createDeck());
    
    // Deal 5 cards to each player
    // In a real game, we'd deal in batches. Here we just distribute.
    // We need to keep the rest of the deck for the second phase?
    // Or just deal all and hide them?
    // "Cutter selection (5 cards)" implies a phase.
    
    // Let's deal 5 cards to everyone.
    let cardIdx = 0;
    for (const playerId of state.players) {
      state.hands[playerId] = deck.slice(cardIdx, cardIdx + 5);
      cardIdx += 5;
    }

    // Store the rest of the deck temporarily? 
    // For statelessness, we might need to put the rest of the deck in the state 
    // or just deal everything now but mark them as "undealt" or handle it in phases.
    // To simplify, let's deal ALL cards now, but the frontend will only show 5 
    // until trump is called.
    // Actually, better to follow the phases strictly to prevent cheating via network inspection.
    
    // But `GameState` doesn't have a `deck` property in the interface I defined.
    // Let's add `deck` to GameState or just deal all and rely on 'status' to hide cards on frontend.
    // Ideally, backend should not send full hands if they aren't supposed to be seen.
    // For this implementation, let's deal all 13 cards to state, but logic will enforce the flow.
    
    for (const playerId of state.players) {
      state.hands[playerId] = [
        ...state.hands[playerId],
        ...deck.slice(cardIdx, cardIdx + 8)
      ];
      cardIdx += 8;
    }

    state.status = 'calling_trump';
    return state;
  }

  static setTrump(state: GameState, cardId: string): GameState {
    if (state.status !== 'calling_trump') throw new Error("Not in calling trump phase");
    
    const hand = state.hands[state.trumpCallerId];
    const cardIndex = hand.findIndex(c => c.id === cardId);
    
    if (cardIndex === -1) throw new Error("Selected card not in hand");
    
    const selectedTrumpCard = hand[cardIndex];
    
    // Keep card in hand but mark it as hidden trump
    // state.hands[state.trumpCallerId] = hand.filter(c => c.id !== cardId);
    
    // Set hidden trump state
    state.hiddenTrumpCard = selectedTrumpCard;
    state.trumpSuit = selectedTrumpCard.suit;
    state.isTrumpRevealed = false;
    state.status = 'playing';
    state.logs.push(`Trump card selected (hidden).`);
    
    return state;
  }

  static revealTrump(state: GameState): GameState {
    if (!state.hiddenTrumpCard || state.isTrumpRevealed) return state;

    state.isTrumpRevealed = true;
    
    // Card is already in hand, just reveal it
    // state.hands[state.trumpCallerId].push(state.hiddenTrumpCard);
    
    state.logs.push(`Trump revealed! It is ${state.hiddenTrumpCard.suit} (${state.hiddenTrumpCard.rank}).`);
    
    // Clear the hidden card reference (optional, but good for cleanup, though we might want to keep it for history)
    // state.hiddenTrumpCard = null; 
    
    return state;
  }

  static playCard(state: GameState, playerId: string, cardId: string): GameState {
    if (state.status !== 'playing') throw new Error("Game not in playing state");
    if (state.currentTurn !== playerId) throw new Error("Not your turn");

    // Check if trying to play hidden trump
    if (state.hiddenTrumpCard && cardId === state.hiddenTrumpCard.id && !state.isTrumpRevealed) {
      throw new Error("Cannot play the hidden trump card until it is revealed");
    }

    const hand = state.hands[playerId];
    const cardIndex = hand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) throw new Error("Card not in hand");

    const card = hand[cardIndex];

    // Validate Move
    if (state.currentTrick.length > 0) {
      const leadSuit = state.currentTrick[0].card.suit;
      const hasLeadSuit = hand.some(c => c.suit === leadSuit);
      
      if (card.suit !== leadSuit && hasLeadSuit) {
        throw new Error(`Must follow suit: ${leadSuit}`);
      }
    }

    // Remove card from hand
    state.hands[playerId].splice(cardIndex, 1);
    
    // Add to trick
    state.currentTrick.push({ playerId, card });

    // Check for Trump Reveal condition (if player couldn't follow suit)
    if (state.currentTrick.length > 1) {
       const leadSuit = state.currentTrick[0].card.suit;
       if (card.suit !== leadSuit && !state.isTrumpRevealed) {
         // Player played a different suit.
         // If they played the trump suit (and they have it), it might be revealed?
         // In Court Piece, trump is revealed when a player cannot follow suit 
         // and asks to see the trump (or plays a trump if they are the one revealing).
         // Simplified: If a player breaks suit, trump is revealed immediately if not already.
         state.isTrumpRevealed = true;
         state.logs.push(`Trump revealed: ${state.trumpSuit}`);
       }
    }

    // Advance turn
    const currentPlayerIdx = state.players.indexOf(playerId);
    state.currentTurn = state.players[(currentPlayerIdx + 1) % 4];

    // Check if trick is complete
    if (state.currentTrick.length === 4) {
      this.resolveTrick(state);
    }

    return state;
  }

  static playRandomCard(state: GameState, playerId: string): GameState {
    if (state.status !== 'playing') return state;
    if (state.currentTurn !== playerId) return state;

    const hand = state.hands[playerId];
    if (hand.length === 0) return state;

    let validCards = hand;

    // Filter for valid cards if following suit
    if (state.currentTrick.length > 0) {
      const leadSuit = state.currentTrick[0].card.suit;
      const hasLeadSuit = hand.some(c => c.suit === leadSuit);
      
      if (hasLeadSuit) {
        validCards = hand.filter(c => c.suit === leadSuit);
      }
    }

    // Pick random valid card
    const randomCard = validCards[Math.floor(Math.random() * validCards.length)];
    
    // Play it
    return this.playCard(state, playerId, randomCard.id);
  }

  static resolveTrick(state: GameState) {
    const leadSuit = state.currentTrick[0].card.suit;
    let winningCard = state.currentTrick[0];
    let highestRank = RANK_VALUES[winningCard.card.rank];
    let trumpPlayed = false;

    // Determine winner
    for (let i = 1; i < state.currentTrick.length; i++) {
      const played = state.currentTrick[i];
      const card = played.card;
      
      if (state.isTrumpRevealed && card.suit === state.trumpSuit) {
        if (!trumpPlayed) {
          // First trump played becomes winner
          winningCard = played;
          highestRank = RANK_VALUES[card.rank];
          trumpPlayed = true;
        } else {
          // Higher trump wins
          if (RANK_VALUES[card.rank] > highestRank) {
            winningCard = played;
            highestRank = RANK_VALUES[card.rank];
          }
        }
      } else if (!trumpPlayed && card.suit === leadSuit) {
        // Higher rank of lead suit wins
        if (RANK_VALUES[card.rank] > highestRank) {
          winningCard = played;
          highestRank = RANK_VALUES[card.rank];
        }
      }
    }

    const winnerId = winningCard.playerId;
    const winningTeamKey = state.teams.team1.players.includes(winnerId) ? 'team1' : 'team2';
    
    // Update Scores
    state.teams[winningTeamKey].tricksWon += 1;
    
    // Collect cards
    const trickCards = state.currentTrick.map(p => p.card);
    state.teams[winningTeamKey].wonCards.push(...trickCards);
    
    // Count Tens (Dehla Pakad specific rule: collecting 10s)
    const tensCount = trickCards.filter(c => c.rank === '10').length;
    state.teams[winningTeamKey].tensCollected += tensCount;

    state.logs.push(`${winnerId} won the trick.`);

    // Store last trick info for animation
    state.lastTrickWinner = winnerId;
    state.lastTrickCards = [...state.currentTrick];

    // Clear trick
    state.currentTrick = [];
    
    // Winner leads next trick
    state.currentTurn = winnerId;

    // Check Game End
    const totalTricks = state.teams.team1.tricksWon + state.teams.team2.tricksWon;
    if (totalTricks === 13) {
      state.status = 'finished';
      
      const t1Tens = state.teams.team1.tensCollected;
      const t2Tens = state.teams.team2.tensCollected;
      
      if (t1Tens > t2Tens) {
        state.winner = 'team1';
      } else if (t2Tens > t1Tens) {
        state.winner = 'team2';
      } else {
        // Tie in tens, check tricks
        if (state.teams.team1.tricksWon > state.teams.team2.tricksWon) {
          state.winner = 'team1';
        } else {
          state.winner = 'team2';
        }
      }
      state.logs.push(`Game finished. Winner: ${state.winner}`);
    }
  }

  // Helper to filter state for a specific player
  static getPlayerState(state: GameState, playerId: string): any {
    // Clone state to avoid mutation
    const publicState = JSON.parse(JSON.stringify(state));

    // If in calling_trump phase, only show first 5 cards
    if (state.status === 'calling_trump') {
       for (const pid of state.players) {
          if (publicState.hands[pid].length > 5) {
             publicState.hands[pid] = publicState.hands[pid].slice(0, 5);
          }
       }
    }

    // Hide other players' hands
    for (const pid of state.players) {
      if (pid !== playerId) {
        // Replace cards with back-face placeholders or just count
        publicState.hands[pid] = publicState.hands[pid].map((c: Card) => ({ id: c.id, suit: 'unknown', rank: 'unknown' })); 
        // Actually, we shouldn't even send IDs if we want to be secure, but for animation we might need them.
        // Let's just send count or nulls.
      }
    }

    // Hide Trump if not revealed
    if (!state.isTrumpRevealed && playerId !== state.trumpCallerId) {
       publicState.trumpSuit = null;
       publicState.hiddenTrumpCard = null;
    }

    // Hide opponents' won cards (as per requirement)
    const myTeam = state.teams.team1.players.includes(playerId) ? 'team1' : 'team2';
    const otherTeam = myTeam === 'team1' ? 'team2' : 'team1';
    
    // Mask won cards of other team
    publicState.teams[otherTeam].wonCards = publicState.teams[otherTeam].wonCards.map(() => ({ id: 'hidden', suit: 'unknown', rank: 'unknown' }));

    return publicState;
  }
}
