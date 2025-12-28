"use client";

import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { LandingScreen } from "@/components/LandingScreen";
import { WaitingRoom } from "@/components/WaitingRoom";
import { GameBoard } from "@/components/GameBoard";

// Types (should match backend)
interface Player {
  id: string;
  name: string;
  isReady: boolean;
  isHost?: boolean;
  socketId: string;
}

interface Room {
  code: string;
  players: Player[];
  status: 'waiting' | 'playing';
  maxPlayers: number;
}

// Initialize socket outside component to prevent multiple connections
const socket: Socket = io('https://dehlabackend.duckdns.org/', {
  autoConnect: false
});

export default function Home() {
  const [gameState, setGameState] = useState<'lobby' | 'waiting' | 'playing'>('lobby');
  const [roomCode, setRoomCode] = useState<string>('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerId, setCurrentPlayerId] = useState<string>('');
  const [gameData, setGameData] = useState<any>(null); // Store game state
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  useEffect(() => {
    // Socket Event Listeners
    socket.on('connect', () => {
      console.log('Connected to server');
    });

    socket.on('room_update', (room: Room) => {
      setPlayers(room.players);
      if (room.status === 'playing') {
        setGameState('playing');
      }
    });

    socket.on('game_start', (initialState: any) => {
      setGameData(initialState);
      setGameState('playing');
    });

    socket.on('game_update', (updatedState: any) => {
      setGameData(updatedState);
    });

    socket.on('hint_received', (data: { hint: string }) => {
      setHint(data.hint);
      // Clear hint after 8 seconds (matching UI)
      setTimeout(() => setHint(null), 8000);
    });

    socket.on('error', (err: { message: string }) => {
      setError(err.message);
      setTimeout(() => setError(null), 3000);
    });

    return () => {
      socket.off('connect');
      socket.off('room_update');
      socket.off('game_start');
      socket.off('game_update');
      socket.off('hint_received');
      socket.off('error');
    };
  }, []);

  const handleCreateGame = (playerName: string) => {
    socket.connect();
    socket.emit('create_room', { playerName }, (response: any) => {
      if (response.success && response.room) {
        setRoomCode(response.room.code);
        setPlayers(response.room.players);
        setCurrentPlayerId(response.playerId);
        setGameState('waiting');
      } else if (response.error) {
        setError(response.error);
      }
    });
  };

  const handleJoinGame = (code: string, playerName: string) => {
    socket.connect();
    socket.emit('join_room', { roomCode: code, playerName }, (response: any) => {
      if (response.success && response.room) {
        setRoomCode(response.room.code);
        setPlayers(response.room.players);
        setCurrentPlayerId(response.playerId);
        setGameState('waiting');
      } else if (response.error) {
        setError(response.error);
      }
    });
  };

  const handleLeaveLobby = () => {
    socket.emit('leave_room');
    setGameState('lobby');
    setPlayers([]);
    setRoomCode('');
    socket.disconnect();
  };

  const handleStartGame = () => {
    socket.emit('start_game');
  };

  const handleReadyToggle = () => {
    socket.emit('player_ready');
  };

  // Game Actions
  const handleSetTrump = (cardId: string) => {
    socket.emit('set_trump', { cardId });
  };

  const handleRevealTrump = () => {
    socket.emit('reveal_trump');
  };

  const handlePlayCard = (cardId: string) => {
    socket.emit('play_card', { cardId });
  };

  const handleGetHint = () => {
    socket.emit('request_hint');
  };

  return (
    <main>
      {error && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in-down">
          {error}
        </div>
      )}

      {gameState === 'lobby' && (
        <LandingScreen 
          onCreateGame={handleCreateGame} 
          onJoinGame={handleJoinGame} 
        />
      )}
      
      {gameState === 'waiting' && (
        <WaitingRoom 
          roomCode={roomCode}
          players={players}
          currentPlayerId={currentPlayerId}
          onReadyToggle={handleReadyToggle}
          onLeave={handleLeaveLobby}
          onStartGame={handleStartGame}
        />
      )}

      {gameState === 'playing' && (
        <GameBoard 
          gameData={gameData}
          players={players}
          currentPlayerId={currentPlayerId}
          onLeaveGame={handleLeaveLobby}
          onPlayCard={handlePlayCard}
          onSetTrump={handleSetTrump}
          onRevealTrump={handleRevealTrump}
          onGetHint={handleGetHint}
          hint={hint}
        />
      )}
    </main>
  );
}
