'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useParams, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

export default function ArenaPage() {
  const { arenaId } = useParams();
  const searchParams = useSearchParams(); 
  const { toast } = useToast();


  const player1 = searchParams?.get('player1') || 'Player 1';
  const player2 = searchParams?.get('player2') || 'Player 2';

  const [gameReady, setGameReady] = useState(false);

  useEffect(() => {
    if (arenaId) {
      console.log(`Arena ID: ${arenaId}`);
    } else {
      console.error('No Arena ID found in the route!');
    }

    if (player1 && player2) {
      setGameReady(true);
    }
  }, [arenaId, player1, player2]);

  const handleStartGame = () => {
    if (gameReady) {
   
      window.location.href = `/game/${arenaId}`;
    } else {
      toast({
        title: 'Game Not Ready',
        description: 'Please wait for both players to join the arena.',
      });
    }
  };

  return (
    <div className="relative h-screen w-screen xl:w-[100vw] xl:h-[110vh]">
      <Image
        src="/arena.jpg"
        alt="Game Background"
        layout="fill"
        objectFit="cover"
        quality={100}
        className="-z-10"
      />
      <div className="flex flex-col items-center justify-center h-full">
        <h1 className="text-purple-400 font-lugrasimo font-semibold text-center text-4xl md:text-5xl xl:text-[5rem] mb-10">
          Arena: {arenaId || 'Loading...'}
        </h1>
        {gameReady ? (
          <div className="flex flex-col items-center text-white text-2xl mb-6">
            <p className="mb-4">
              <span className="text-green-400">{player1}</span> vs{' '}
              <span className="text-pink-400">{player2}</span>
            </p>
            <button
              onClick={handleStartGame}
              className="px-6 py-3 bg-purple-700 text-white text-2xl rounded-lg hover:bg-purple-500 transition"
            >
              Start Game
            </button>
          </div>
        ) : (
          <p className="text-white text-xl">Waiting for players to join...</p>
        )}
      </div>
    </div>
  );
}
