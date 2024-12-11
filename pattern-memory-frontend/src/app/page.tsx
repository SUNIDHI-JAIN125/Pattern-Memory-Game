'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export default function Home() {
  const [username, setUsername] = useState('');
  const [arenaId, setArenaId] = useState('');
  const [ws, setWs] = useState<WebSocket | null>(null); // Explicitly type as WebSocket | null
  const router = useRouter();

  useEffect(() => {
    const socket = new WebSocket('ws://pattern-memory-game.onrender.com/');
    setWs(socket);

    socket.onopen = () => console.log('WebSocket connected');
    socket.onclose = () => console.log('WebSocket disconnected');

    return () => socket.close();
  }, []);

  const handleCreateArena = () => {
    if (username && ws) { // Ensure ws is non-null before sending
      const createArenaData = { event: 'create-arena', username };
      ws.send(JSON.stringify(createArenaData));

      ws.onmessage = (message) => {
        const data = JSON.parse(message.data);
        if (data.event === 'arena-created') {
          setArenaId(data.arenaId);
          router.push(`/arena/${data.arenaId}`);
        }
      };
    } else {
      alert('Enter your username and ensure WebSocket is connected!');
    }
  };

  const handleJoinArena = () => {
    if (username && arenaId && ws) { // Ensure ws is non-null before sending
      const joinArenaData = { event: 'join-arena', username, arenaId };
      ws.send(JSON.stringify(joinArenaData));

      ws.onmessage = (message) => {
        const data = JSON.parse(message.data);
        if (data.event === 'arena_ready') {
          router.push(`/arena/${arenaId}`);
        } else if (data.event === 'error') {
          alert(data.message);
        }
      };
    } else {
      alert('Enter your username and arena ID, and ensure WebSocket is connected!');
    }
  };

  return (
    <div className="relative h-screen w-screen">
      {/* Background Image */}
      <Image
        src="/gamebg5.avif"
        alt="Game Background"
        layout="fill"
        objectFit="cover"
        quality={100}
        className="-z-10"
      />

      {/* Overlay */}
      <div className="h-full flex flex-col items-center bg-black bg-opacity-50">
        <div className="mt-20"></div>
        <div className="mt-20"></div>

        {/* Title */}
        <h1 className="text-purple-400 font-lugrasimo font-semibold text-center text-4xl md:text-5xl xl:text-[5rem] mb-20 mt-20">
          Pattern Memory Game
        </h1>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row sm:space-x-20 mt-2 lg:mt-8 ">
          {/* Create Arena Button */}
          <Dialog>
            <DialogTrigger>
              <button className="relative font-montserrat text-xl lg:text-2xl xl:text-3xl p-1 lg:p-3 mb-20 font-bold text-gray-900 hover:scale-105 transition-transform duration-300">
                <span className="absolute -inset-1.5 bg-gradient-to-r from-purple-400 to-pink-100 rounded-lg blur group-hover:from-pink-400 group-hover:to-purple-200 transition-colors"></span>
                <span className="absolute -inset-3 border-4 border-purple-400 rounded-lg"></span>
                <span className="relative font-sans italic text-black">Create New Arena</span>
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className='text-xl mt-2 mb-2'>Create Arena</DialogTitle>
              </DialogHeader>
              <input
                type="text"
                className="w-full p-2 border rounded-lg mb-4"
                placeholder="Enter Your Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <DialogFooter>

                <button
                  className="px-4 py-2  bg-purple-700 text-white text-xl rounded-lg hover:bg-purple-500"
                  onClick={handleCreateArena}
                >
                  Create
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Join Arena Button */}
          <Dialog>
            <DialogTrigger>
              <button className="relative font-montserrat text-xl  lg:text-2xl xl:text-3xl p-1 lg:p-3 mb-20 font-bold text-gray-900 hover:scale-105 transition-transform duration-300">
                <span className="absolute -inset-1.5 bg-gradient-to-r from-purple-400 to-pink-100 rounded-lg blur group-hover:from-pink-400 group-hover:to-purple-200 transition-colors"></span>
                <span className="absolute -inset-3 border-4 border-purple-400 rounded-lg"></span>
                <span className="relative font-sans italic text-black">Join Arena</span>
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className='text-xl'>Join Arena</DialogTitle>
              </DialogHeader>
              <input
                type="text"
                className="w-full p-2 border rounded-lg mb-4"
                placeholder="Enter Your Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <input
                type="text"
                className="w-full p-2 border rounded-lg mb-4"
                placeholder="Enter Arena ID"
                value={arenaId}
                onChange={(e) => setArenaId(e.target.value)}
              />
              <DialogFooter>
                <button
                  className="px-4 py-2 bg-purple-700 text-xl text-white rounded-lg hover:bg-purple-500"
                  onClick={handleJoinArena}
                >
                  Join Arena
                </button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
