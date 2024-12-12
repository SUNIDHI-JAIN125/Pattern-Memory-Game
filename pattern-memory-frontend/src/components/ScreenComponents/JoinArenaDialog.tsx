import React, { useState } from 'react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from "@/hooks/use-toast";

interface JoinArenaDialogProps {
  ws: WebSocket | null;
  onArenaJoined: (arenaId: string) => void; 
}

const JoinArenaDialog: React.FC<JoinArenaDialogProps> = ({ ws, onArenaJoined }) => {
  const [username, setUsername] = useState('');
  const [arenaId, setArenaId] = useState('');
  const { toast } = useToast();

  const handleJoinArena = () => {
    if (username && arenaId && ws) {
      const joinArenaData = { event: 'join-arena', username, arenaId };
      ws.send(JSON.stringify(joinArenaData));
  
      ws.onmessage = (message) => {
        const data = JSON.parse(message.data);
        if (data.event === 'arena_ready') {
          onArenaJoined(arenaId); 
          toast({
            title: 'Arena Ready',
            description: 'Successfully joined the arena!'
          });
        } else if (data.event === 'error') {
          toast({
            title: 'Error',
            description: data.message
          });
        }
      };
    } else {
      toast({
        title: 'Error',
        description: 'Please enter both your username and a valid arena ID!'
      });
    }
  };
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="relative font-montserrat text-xl lg:text-2xl xl:text-3xl p-1 lg:p-3 mb-20 font-bold text-gray-900 hover:scale-105 transition-transform duration-300">
          <span className="absolute -inset-1.5 bg-gradient-to-r from-purple-400 to-pink-100 rounded-lg blur group-hover:from-pink-400 group-hover:to-purple-200 transition-colors"></span>
          <span className="absolute -inset-3 border-4 border-purple-400 rounded-lg"></span>
          <span className="relative font-sans italic text-black">Join Arena</span>
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-xl">Join Arena</DialogTitle>
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
  );
};

export default JoinArenaDialog;
