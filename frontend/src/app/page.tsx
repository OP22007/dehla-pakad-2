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
const socket: Socket = io('https://dehlabackend.duckdns.org', {
  autoConnect: false
});

export default function Home() {
  const [gameState, setGameState] = useState<'lobby' | 'waiting' | 'playing'>('lobby');
  const [roomCode, setRoomCode] = useState<string>('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerId, setCurrentPlayerId] = useState<string>('');
  const [gameData, setGameData] = useState<any>(null); // Store game state
  const [error, setError] = useState<string | null>(null);
  const [incomingSignal, setIncomingSignal] = useState<{senderId: string, signal: 'tea' | 'watch' | 'glasses'} | null>(null);
  const [signalFeedback, setSignalFeedback] = useState<{responderId: string, response: 'agree' | 'refuse'} | null>(null);
  const [voiceChatEnabled, setVoiceChatEnabled] = useState(true);

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

    socket.on('receive_signal', (data: {senderId: string, signal: 'tea' | 'watch' | 'glasses'}) => {
      setIncomingSignal(data);
    });

    socket.on('signal_feedback', (data: {responderId: string, response: 'agree' | 'refuse'}) => {
      setSignalFeedback(data);
      setTimeout(() => setSignalFeedback(null), 3000);
    });

    socket.on('voice_chat_status', ({ enabled }: { enabled: boolean }) => {
      setVoiceChatEnabled(enabled);
    });

    socket.on('error', (err: { message: string }) => {
      setError(err.message);
      // setTimeout(() => setError(null), 3000); // Handled by useEffect now
    });

    return () => {
      socket.off('connect');
      socket.off('room_update');
      socket.off('game_start');
      socket.off('game_update');
      socket.off('receive_signal');
      socket.off('signal_feedback');
      socket.off('voice_chat_status');
      socket.off('error');
    };
  }, []);

  // Auto-dismiss error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

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

  const handleForfeit = () => {
    socket.emit('forfeit_game', { roomCode });
  };

  const handlePlayAgain = () => {
    socket.emit('play_again', { roomCode });
  };

  const handleSendSignal = (signal: 'tea' | 'watch' | 'glasses') => {
    socket.emit('send_signal', { roomId: roomCode, senderId: currentPlayerId, signal });
  };

  const handleRespondSignal = (originalSenderId: string, response: 'agree' | 'refuse') => {
    socket.emit('respond_signal', { roomId: roomCode, responderId: currentPlayerId, originalSenderId, response });
    setIncomingSignal(null);
  };

  const handleToggleVoiceChat = (enabled: boolean) => {
    socket.emit('toggle_voice_chat', { roomId: roomCode, enabled });
  };

  return (
    <main className="min-h-screen bg-casino-green-950 text-white overflow-hidden">
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
          voiceChatEnabled={voiceChatEnabled}
          onToggleVoiceChat={handleToggleVoiceChat}
        />
      )}

      {gameState === 'playing' && (
        <GameBoard 
          gameData={gameData}
          players={players}
          currentPlayerId={currentPlayerId}
          onLeaveGame={handleLeaveLobby}
          onPlayAgain={handlePlayAgain}
          onPlayCard={handlePlayCard}
          onSetTrump={handleSetTrump}
          onRevealTrump={handleRevealTrump}
          onForfeit={handleForfeit}
          incomingSignal={incomingSignal}
          signalFeedback={signalFeedback}
          onSendSignal={handleSendSignal}
          onRespondSignal={handleRespondSignal}
          voiceChatEnabled={voiceChatEnabled}
          onToggleVoiceChat={handleToggleVoiceChat}
          socket={socket}
          roomCode={roomCode}
        />
      )}
      
      {/* Error Toast */}
      {error && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in-down">
          {error}
        </div>
      )}
    </main>
  );
}
