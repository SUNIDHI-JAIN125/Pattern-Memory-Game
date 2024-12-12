'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';

export default function ArenaPage() {
  const { arenaId } = useParams();
  const [players, setPlayers] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null); 

  useEffect(() => {
    if (!socketRef.current) {
      
      socketRef.current = new WebSocket('wss://pattern-memory-game.onrender.com/');

      socketRef.current.onopen = () => {
        console.log('WebSocket connection established.');
        
      };

      socketRef.current.onmessage = (message) => {
        try {
          const data = JSON.parse(message.data);
          switch (data.event) {
            case 'arena_ready':
              setPlayers(data.players);
              break;
            case 'error':
              setErrorMessage(data.message);
              break;
            default:
              console.log('Unhandled WebSocket message:', data);
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      socketRef.current.onclose = (event) => {
        console.warn('WebSocket connection closed:', event.reason);
      };

      
    }

    return () => {
      socketRef.current?.close();
      socketRef.current = null; 
    };
  }, [arenaId]);

  return (
    <div className="h-screen flex flex-col items-center justify-center">
      {errorMessage ? (
        <div className="text-red-500 text-3xl font-bold">{errorMessage}</div>
      ) : players.length === 2 ? (
        <>
          <h1 className="text-4xl font-bold text-purple-700 mb-4">Game Ready!</h1>
          <div className="text-2xl text-gray-800 mb-6">
            <p>Player 1: {players[0]}</p>
            <p>Player 2: {players[1]}</p>
          </div>
        </>
      ) : (
        <>
          <h1 className="text-4xl font-bold text-purple-700">Waiting for Player 2...</h1>
          <p className="text-lg mt-4">Share this Arena ID with your friend: {arenaId}</p>
        </>
      )}
    </div>
  );
}
