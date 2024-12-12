'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ClipboardCopy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import CreateArenaDialog from '../components/ScreenComponents/CreateArenaDialog';
import JoinArenaDialog from '../components/ScreenComponents/JoinArenaDialog';

export default function Home() {
  const [arenaId, setArenaId] = useState('');
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isArenaCreated, setIsArenaCreated] = useState(false); 
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const socket = new WebSocket('wss://pattern-memory-game.onrender.com/');
    setWs(socket);

    socket.onopen = () => console.log('WebSocket connected');

    const handleReconnection = () => {
      setTimeout(() => {
        const socket = new WebSocket('wss://pattern-memory-game.onrender.com/');
        setWs(socket);
      }, 5000);
    };

    socket.onclose = handleReconnection;
    return () => socket.close();
  }, []);

  const handleArenaCreated = (arenaId: string) => {
    setArenaId(arenaId);
    setIsArenaCreated(true);


    if(ws) {
    ws.onmessage = (message) => {
      const data = JSON.parse(message.data);
      if (data.event === 'arena_ready') {
        toast({
          title: 'Arena Ready',
          description: 'The second player has joined the arena!'
        });
        router.push(`/arena/${arenaId}`);
      }
    };
  }
};

  const handleArenaJoined = (arenaId:string) => {
    router.push(`/arena/${arenaId}`);
  };

  const handleCopyArenaId = () => {
    navigator.clipboard.writeText(arenaId);
    toast({
      title: 'Arena ID Copied',
      description: 'Share with Player 2'
    });
  };

  return (
    <div className="relative h-screen w-screen">
      <Image
        src="/gamebg5.avif"
        alt="Game Background"
        layout="fill"
        objectFit="cover"
        quality={100}
        className="-z-10"
      />
      <div className="h-full flex flex-col items-center bg-black bg-opacity-50">
        <div className="mt-20"></div>
        <h1 className="text-purple-400 font-lugrasimo font-semibold text-center text-4xl md:text-5xl xl:text-[5rem] mb-20 mt-20">
          Pattern Memory Game
        </h1>
        
        
        {isArenaCreated ? (
          <div className="flex  mt-2 flex-col items-center">
      
          <div className="flex items-center space-x-4 cursor-pointer  transition duration-300"
            onClick={handleCopyArenaId} >
           <span className="font-bold mt-2 text-xl lg:text-3xl text-red-200 italic">{arenaId}</span>
            <ClipboardCopy className="w-6  mt-2 h-6 hover:scale-110 text-red-400" />
          </div>
          
          <p className=" text-xl lg:text-2xl  text-purple-200  mt-4 ">Share this ID with your friend to join the arena!</p>
          
        </div>
        
        ) : (
          <div className="flex flex-col sm:flex-row sm:space-x-20 mt-2 xl:mt-8">
            <CreateArenaDialog ws={ws} onArenaCreated={handleArenaCreated} />
            <JoinArenaDialog ws={ws} onArenaJoined={handleArenaJoined} />
          </div>
        )}
      </div>
    </div>
  );
}
