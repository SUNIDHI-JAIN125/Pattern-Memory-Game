'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useParams, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useWebSocket } from '@/context/WebSocketContext';
import GameGrid from '@/components/ScreenComponents/GameGrid';

export default function ArenaPage() {
  const { arenaId } = useParams();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { ws, mainUser } = useWebSocket();

  const player1 = searchParams?.get('player1') || 'Player 1';
  const player2 = searchParams?.get('player2') || 'Player 2';

  const [gameReady, setGameReady] = useState(false);
  const [gridVisible, setGridVisible] = useState(false);
  const [currentRound, setCurrentRound] = useState<number[]>([]);
  const [selectedPattern, setSelectedPattern] = useState<number[]>([]);
  const [patternVisible, setPatternVisible] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [gridrows, setGridrows] = useState(0);
  const [gridcols, setGridcols] = useState(0);
  const [gameMessage, setGameMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null); 
  const [overallWinner, setOverallWinner] = useState(false);

  useEffect(() => {
    if (arenaId) {
      console.log(`Arena ID: ${arenaId}`);
    } else {
      console.error('No Arena ID found in the route!');
    }

    if (player1 && player2) {
      setGameReady(true);
    }

    

    if (ws) {
      ws.onmessage = (message) => {
        const data = JSON.parse(message.data);

        if (data.event === 'countdown') {
          
          setGameStarted(true);
          handleCountdown(); 
        }

        if (data.event === 'round-start') {
          startRound(data.pattern,data.gridSize);
        }

        if (data.event === 'round-result') {
          setGameMessage(data.message);
          setGridVisible(false); 
        }
        
        if (data.event === 'wrong-answer') {
          toast({
            title: 'Incorrect Answer',
            description: 'Your answer is incorrect!'
          });
        }

        if (data.event === "game-over") {
          setOverallWinner(true);
          setGameMessage(data.message);
          setGridVisible(false);
          
        }
        
      };

      ws.onclose = () => {
        toast({
          title: 'Websocket connection failed',
          description: 'Please restart the game!',
        });

      }
    }
  }, [arenaId, player1, player2, ws, toast]);

  const handleCountdown = () => {
    setGameMessage(null); 
    const startingValue = 3; 
  setCountdown(startingValue); 

  let currentCount = startingValue;

  const countdownInterval = setInterval(() => {
    currentCount -= 1;
    setCountdown(currentCount);

    if (currentCount <= 0) {
      clearInterval(countdownInterval); 
      setCountdown(null); 
      setGridVisible(true); 
    }
  }, 1000); 
};

  const handleStartGame = () => {
    if (gameReady) {
      setGameStarted(true);
      if (ws) {
        ws.send(
          JSON.stringify({
            event: 'start-game',
            arenaId,
          })
        );
      }
    } else {
      toast({
        title: 'Game Not Ready',
        description: 'Please wait for both players to join the arena.',
      });
    }
  };

  const startRound = (pattern: number[], gridSize: string) => {
    const [rows, columns] = gridSize.split("x").map(Number); 
    setGridrows(rows);
    setGridcols(columns);
    setCurrentRound(pattern);
  
    
    setPatternVisible(true);
    setGridVisible(true); 
    setTimeout(() => {
      setPatternVisible(false);
    }, 2000);
  };
  

  const handleCellClick = (index: number) => {
    if (selectedPattern.includes(index)) {
      setSelectedPattern(selectedPattern.filter((cell) => cell !== index)); 
    } else {
      setSelectedPattern([...selectedPattern, index]); 
    }
  };

  const handleSubmitPattern = () => {
    if (ws) {
      const sortedPattern = [...selectedPattern].sort((a, b) => a - b);
      ws.send(
        JSON.stringify({
          event: 'submit-answer',
          arenaId,
          username: mainUser,
          answer: sortedPattern,
        })
      );
      setSelectedPattern([]); 
      setGridVisible(false);
    } else {
      toast({
        title: 'Incomplete Pattern',
        description: 'Please select all the cells for the pattern.',
      });
    }
  };

  return (
    <div className="relative h-screen w-screen bg-black flex items-center justify-center">
      <div className="relative h-[100vh] w-[100vw] flex flex-col items-center">
        <div className="relative h-[100%] w-[100%] flex items-center justify-center">
          <Image
            src="/arena.jpg"
            alt="Game Background"
            layout="fill"
            objectFit="contain"
            quality={100}
            className="rounded-lg shadow-lg hidden lg:block"
          />
        </div>
        <div className=" absolute flex flex-col items-center text-white text-2xl xl:text-3xl top-1/4 sm:top-1/2 md:top-1/3 lg:1/2 xl:top-72 2xl:top-1/4">
            <p className="flex gap-4 ">
              <span className="text-green-400">{player1}</span>
              <span>v/s </span>
              <span className="text-pink-400">{player2}</span>
            </p>
        </div>
        <div className="absolute inset-0 mt-6 flex flex-col items-center top-1/4 sm:top-1/2 md:top-1/3 lg:1/2 xl:top-72 2xl:top-1/4">
  {gameReady && !gameStarted && (
    <button
      onClick={handleStartGame}
      className="px-4 mt-4 py-2 bg-transparent border-4 border-yellow-400 border-double text-white text-xl rounded-lg hover:bg-yellow-300 hover:text-black transition"
    >
      Start Game
    </button>
  )}
 
 <div className="absolute inset-0 flex flex-col items-center xl:top-[20%]">
  {gameMessage ? (
  
  
    <div className="text-yellow-300 text-2xl xl:text-3xl p-4 rounded shadow-lg">
      {gameMessage}
    </div>
  
  ) : (
    <>
      {countdown !== null && (
  <div className="flex items-center justify-center mt-4 p-4">
    <div
      className="relative flex items-center justify-center w-32 h-32 rounded-full border-4 border-yellow-400 shadow-lg"
      style={{
        background: "radial-gradient(circle, rgba(255,215,0,0.5) 50%, transparent 70%)",
      }}
    >
      <span className="text-5xl font-bold text-white">
        {countdown}
      </span>
    </div>
  </div>
)}
      {gridVisible && (
        <GameGrid
          rows={gridrows}
          columns={gridcols}
          pattern={currentRound}
          selectedPattern={selectedPattern}
          onCellClick={handleCellClick} 
          showPattern={patternVisible}
        />
      )}
      {selectedPattern.length > 0 && (
        <button
          onClick={handleSubmitPattern}
          className="px-4 py-2 bg-transparent mt-4 border-4 border-yellow-400 border-double text-white text-xl rounded-lg hover:bg-yellow-300 hover:text-black transition"
        >
          Submit Pattern
        </button>
      )}
    </>
  )}
</div>
</div>

      </div>
    </div>
  );
}
