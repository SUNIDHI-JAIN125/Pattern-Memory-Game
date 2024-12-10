'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [username, setUsername] = useState('');
  const router = useRouter();

  const handleCreateArena = () => {
    if (username) {
      router.push(`/create-arena?username=${username}`);
    } else {
      alert('Enter your username!');
    }
  };

  const handleJoinArena = () => {
    if (username) {
      router.push(`/join-arena?username=${username}`);
    } else {
      alert('Enter your username!');
    }
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
     
      <div className="h-full flex flex-col  gap-20 items-center  bg-black bg-opacity-50">

     
      <h1 className="relative font-montserrat mt-20 lg:mt-[150px] text-4xl md:text-6xl p-4  font-bold text-gray-900">
        <span className="absolute -inset-1.5 bg-gradient-to-r from-purple-400 to-pink-200 rounded-lg blur"></span>
        <span className="absolute -inset-3 border-4 border-purple-500 rounded-lg"></span>
        <span className="relative  font-sans  italic  text-stroke text-black ">
          Pattern Memory  Game
        </span>
      
        <style jsx>{`
          .font-montserrat {
            font-family: 'Montserrat', sans-serif;
          }
          .text-shadow {
            text-shadow: 2px 2px 5px rgba(255, 0, 0, 0.8);
          }
        `}</style>
      </h1>

     
       

     
        <div className="flex space-x-4"> 
          <button
            onClick={handleCreateArena}
            className="  px-4 py-2  text-pink-200 font-serif hover:underline italic font-bold text-2xl  rounded"
          >
            Create Arena
          </button>
          <button
            onClick={handleJoinArena}
            className="  px-4 py-2  text-pink-200 font-serif hover:underline italic font-bold text-2xl  rounded"
          >
            Join Arena
          </button>
        </div>
      </div>
      </div>

  );
}
