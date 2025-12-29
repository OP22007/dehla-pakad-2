import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import { Card, GameState, Suit, Rank } from "../types";

dotenv.config();

// Initialize Gemini
const API_KEY = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

// Rate limiting map: playerId -> lastHintTime
const lastHintTime = new Map<string, number>();
const HINT_COOLDOWN = 60 * 1000; // 1 minute cooldown (approx 1 turn)

export const generateCrypticHint = async (
  playerId: string,
  gameState: GameState,
  playerHand: Card[]
): Promise<string> => {
  // 1. Rate Limiting Check
  const now = Date.now();
  const lastTime = lastHintTime.get(playerId);
  if (lastTime && now - lastTime < HINT_COOLDOWN) {
    throw new Error("The spirits are silent. You must wait before seeking another sign.");
  }

  // 2. Context Gathering
  const currentPlayer = gameState.players.find(p => p === playerId);
  if (!currentPlayer) throw new Error("Player not found");

  // Identify Teammate
  const playerIndex = gameState.players.indexOf(playerId);
  const teammateId = gameState.players[(playerIndex + 2) % 4];
  const teammateHand = gameState.hands[teammateId] || [];
  
  // Analyze Hand (Simplified for prompt)
  const suits = playerHand.reduce((acc, card) => {
    acc[card.suit] = (acc[card.suit] || 0) + 1;
    return acc;
  }, {} as Record<Suit, number>);
  
  const strongSuits = Object.entries(suits)
    .filter(([_, count]) => count >= 4)
    .map(([suit]) => suit);

  const hasTrump = playerHand.some(c => c.suit === gameState.trumpSuit);
  const trumpCount = playerHand.filter(c => c.suit === gameState.trumpSuit).length;

  // 3. Construct Prompt
  const prompt = `
    You are "Ishara", a mystical spirit of the card table. Your goal is to give a cryptic, poetic hint to a player in the game of Court Piece (Dehla Pakad).
    Don't make the hint too hard and ensure it subtly guides the player towards capturing Tens.Also don't use complex english keep it simple and straightforward.
    
    **Game Rules (Dehla Pakad) for Context:**
    1. **The Tens (Dehlas) are Sacred:** The ultimate goal is to capture the four 10s. The team with more 10s wins, regardless of total tricks (unless 10s are tied).
    2. **Capture Strategy:** High cards (Aces, Kings) should be used to capture 10s, not just to win empty tricks.
    3. **Trump Usage:** Trumps are powerful tools to secure 10s when a player is void in the led suit.

    **Context:**
    - The player holds these cards: ${JSON.stringify(playerHand.map(c => `${c.rank} of ${c.suit}`))}.
    - The teammate holds these cards: ${JSON.stringify(teammateHand.map(c => `${c.rank} of ${c.suit}`))}.
    - Trump Suit: ${gameState.trumpSuit || "Not yet chosen"}.
    - Trump Revealed: ${gameState.isTrumpRevealed}.
    - Strong Suits: ${strongSuits.join(", ") || "None"}.
    
    **Rules for the Hint:**
    1. **Metaphorical & Cryptic:** Do NOT say "Play a spade" or "You have many hearts". Use literary devices.
    2. **Literary Devices:** Use one of the following:
       - **Personification:** e.g., "The crimson warrior sleeps in my palm" (for Hearts).
       - **Paradox:** e.g., "Strength lies in my weakest defense".
       - **Synecdoche:** e.g., "The crown awaits its loyal subjects" (referring to Kings/Queens).
       - **Metaphor:** e.g., "Thunder brews where diamonds dare not tread".
       - **Symbolism:** e.g., "The moon's shadow guards my treasure".
    3. **No Explicit Info:** Never mention specific ranks (Ace, King) or suit names directly. Use colors, elements, or abstract concepts (Red/Crimson/Blood for Hearts/Diamonds, Black/Night/Shadow for Spades/Clubs).
    4. **Strategic Value:** The hint should subtly suggest a strategy based on BOTH your hand and your teammate's hand (e.g., "Your partner holds the key", "Together you are strong in shadows").
    5. **Length:** Keep it under 20 words.
    
    **Generate one single cryptic hint.**
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const hint = response.text().trim();
    
    // Update rate limit
    lastHintTime.set(playerId, now);
    
    return hint;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "The stars are clouded. No hint is available.";
  }
};
