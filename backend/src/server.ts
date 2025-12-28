import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { Room, Player, CreateRoomPayload, JoinRoomPayload, ApiResponse, GameState, Suit } from './types';
import { generateRoomCode } from './utils';
import { GameLogic } from './gameLogic';
import { generateCrypticHint } from './services/geminiService';

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins for dev
    methods: ["GET", "POST"]
  }
});

// State
const rooms = new Map<string, Room>();
const games = new Map<string, GameState>(); // roomId -> GameState
const playerRoomMap = new Map<string, string>(); // socketId -> roomCode
const turnTimers = new Map<string, NodeJS.Timeout>(); // roomCode -> timer

const TURN_TIMEOUT = 45 * 1000; // 45 seconds

const resetTurnTimer = (roomCode: string) => {
  // Clear existing timer
  if (turnTimers.has(roomCode)) {
    clearTimeout(turnTimers.get(roomCode)!);
    turnTimers.delete(roomCode);
  }

  const gameState = games.get(roomCode);
  if (!gameState || gameState.status === 'finished') return;

  // Start new timer
  const timer = setTimeout(() => {
    console.log(`Turn timeout in room ${roomCode} for player ${gameState.currentTurn}`);
    
    try {
      // Auto-play random card
      const updatedState = GameLogic.playRandomCard(gameState, gameState.currentTurn);
      games.set(roomCode, updatedState);
      broadcastGameState(roomCode, updatedState);
      
      // Reset timer for next player
      resetTurnTimer(roomCode);
    } catch (e) {
      console.error(`Error in auto-play for room ${roomCode}:`, e);
    }
  }, TURN_TIMEOUT);

  turnTimers.set(roomCode, timer);
};

io.on('connection', (socket: Socket) => {
  console.log('User connected:', socket.id);

  // Create Room
  socket.on('create_room', ({ playerName }: CreateRoomPayload, callback: (res: ApiResponse) => void) => {
    try {
      let roomCode = generateRoomCode();
      // Ensure uniqueness
      while (rooms.has(roomCode)) {
        roomCode = generateRoomCode();
      }

      const newPlayer: Player = {
        id: uuidv4(),
        name: playerName,
        isReady: false,
        isHost: true,
        socketId: socket.id
      };

      const newRoom: Room = {
        code: roomCode,
        players: [newPlayer],
        status: 'waiting',
        maxPlayers: 4
      };

      rooms.set(roomCode, newRoom);
      playerRoomMap.set(socket.id, roomCode);
      socket.join(roomCode);

      console.log(`Room created: ${roomCode} by ${playerName}`);
      
      callback({ success: true, room: newRoom, playerId: newPlayer.id });
    } catch (error) {
      console.error('Error creating room:', error);
      callback({ success: false, error: 'Failed to create room' });
    }
  });

  // Join Room
  socket.on('join_room', ({ roomCode, playerName }: JoinRoomPayload, callback: (res: ApiResponse) => void) => {
    try {
      const room = rooms.get(roomCode);

      if (!room) {
        return callback({ success: false, error: 'Room not found' });
      }

      if (room.players.length >= room.maxPlayers) {
        return callback({ success: false, error: 'Room is full' });
      }

      if (room.status === 'playing') {
        return callback({ success: false, error: 'Game already started' });
      }

      const newPlayer: Player = {
        id: uuidv4(),
        name: playerName,
        isReady: false,
        isHost: false,
        socketId: socket.id
      };

      room.players.push(newPlayer);
      playerRoomMap.set(socket.id, roomCode);
      socket.join(roomCode);

      console.log(`Player ${playerName} joined room ${roomCode}`);

      // Broadcast update to everyone in the room
      io.to(roomCode).emit('room_update', room);
      
      callback({ success: true, room, playerId: newPlayer.id });
    } catch (error) {
      console.error('Error joining room:', error);
      callback({ success: false, error: 'Failed to join room' });
    }
  });

  // Leave Room
  socket.on('leave_room', () => {
    handleLeaveRoom(socket);
  });

  // Player Ready Toggle
  socket.on('player_ready', () => {
    const roomCode = playerRoomMap.get(socket.id);
    if (!roomCode) return;

    const room = rooms.get(roomCode);
    if (!room) return;

    const player = room.players.find(p => p.socketId === socket.id);
    if (player) {
      player.isReady = !player.isReady;
      io.to(roomCode).emit('room_update', room);
    }
  });

  // Start Game
  socket.on('start_game', () => {
    const roomCode = playerRoomMap.get(socket.id);
    if (!roomCode) return;

    const room = rooms.get(roomCode);
    if (!room || !room.players.find(p => p.socketId === socket.id)?.isHost) return;

    if (room.players.length !== 4) return; // Must have 4 players

    room.status = 'playing';
    io.to(roomCode).emit('room_update', room);

    // Initialize Game Logic
    const playerIds = room.players.map(p => p.id);
    const gameState = GameLogic.initializeGame(roomCode, playerIds);
    games.set(roomCode, gameState);

    // Start Timer
    resetTurnTimer(roomCode);

    // Broadcast initial game state (customized for each player)
    room.players.forEach(p => {
      const playerState = GameLogic.getPlayerState(gameState, p.id);
      io.to(p.socketId).emit('game_start', playerState);
    });
  });

  // Game Actions
  socket.on('set_trump', ({ cardId }: { cardId: string }) => {
    const roomCode = playerRoomMap.get(socket.id);
    if (!roomCode) return;
    
    let gameState = games.get(roomCode);
    if (!gameState) return;

    try {
      gameState = GameLogic.setTrump(gameState, cardId);
      games.set(roomCode, gameState);
      broadcastGameState(roomCode, gameState);
      resetTurnTimer(roomCode);
    } catch (e) {
      socket.emit('error', { message: (e as Error).message });
    }
  });

  socket.on('reveal_trump', () => {
    const roomCode = playerRoomMap.get(socket.id);
    if (!roomCode) return;
    
    let gameState = games.get(roomCode);
    if (!gameState) return;

    const room = rooms.get(roomCode);
    const player = room?.players.find(p => p.socketId === socket.id);
    if (!player) return;

    try {
      gameState = GameLogic.revealTrump(gameState, player.id);
      games.set(roomCode, gameState);
      broadcastGameState(roomCode, gameState);
    } catch (e) {
      socket.emit('error', { message: (e as Error).message });
    }
  });

  socket.on('play_card', ({ cardId }: { cardId: string }) => {
    const roomCode = playerRoomMap.get(socket.id);
    if (!roomCode) return;
    
    let gameState = games.get(roomCode);
    if (!gameState) return;

    const room = rooms.get(roomCode);
    const player = room?.players.find(p => p.socketId === socket.id);
    if (!player) return;

    try {
      gameState = GameLogic.playCard(gameState, player.id, cardId);
      games.set(roomCode, gameState);
      broadcastGameState(roomCode, gameState);
      resetTurnTimer(roomCode);
    } catch (e) {
      socket.emit('error', { message: (e as Error).message });
    }
  });

  // Hint Request
  socket.on('request_hint', async () => {
    const roomCode = playerRoomMap.get(socket.id);
    if (!roomCode) return;
    
    const gameState = games.get(roomCode);
    if (!gameState) return;

    const room = rooms.get(roomCode);
    const player = room?.players.find(p => p.socketId === socket.id);
    if (!player) return;

    try {
      const hand = gameState.hands[player.id];
      const hint = await generateCrypticHint(player.id, gameState, hand);
      socket.emit('hint_received', { hint });
    } catch (e) {
      socket.emit('error', { message: (e as Error).message });
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    handleLeaveRoom(socket);
  });
});

const handleLeaveRoom = (socket: Socket) => {
  const roomCode = playerRoomMap.get(socket.id);
  if (!roomCode) return;

  const room = rooms.get(roomCode);
  if (!room) return;

  // Remove player
  const playerIndex = room.players.findIndex(p => p.socketId === socket.id);
  if (playerIndex !== -1) {
    const player = room.players[playerIndex];
    room.players.splice(playerIndex, 1);
    playerRoomMap.delete(socket.id);
    socket.leave(roomCode);
    console.log(`Player ${player.name} left room ${roomCode}`);

    if (room.players.length === 0) {
      // Delete room if empty
      rooms.delete(roomCode);
      games.delete(roomCode);
      if (turnTimers.has(roomCode)) {
        clearTimeout(turnTimers.get(roomCode)!);
        turnTimers.delete(roomCode);
      }
      console.log(`Room ${roomCode} deleted`);
    } else {
      // Assign new host if host left
      if (player.isHost) {
        room.players[0].isHost = true;
      }
      // Broadcast update
      io.to(roomCode).emit('room_update', room);
    }
  }
};

const broadcastGameState = (roomCode: string, gameState: GameState) => {
  const room = rooms.get(roomCode);
  if (!room) return;

  room.players.forEach(p => {
    const playerState = GameLogic.getPlayerState(gameState, p.id);
    io.to(p.socketId).emit('game_update', playerState);
  });
};

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
