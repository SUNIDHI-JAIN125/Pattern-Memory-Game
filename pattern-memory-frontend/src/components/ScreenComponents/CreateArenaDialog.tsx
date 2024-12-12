import React, { useState } from 'react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from "@/hooks/use-toast"

interface CreateArenaDialogProps {
  ws: WebSocket | null;
  onArenaCreated: (arenaId: string) => void;
}

const CreateArenaDialog: React.FC<CreateArenaDialogProps> = ({ ws, onArenaCreated }) => {
  const [username, setUsername] = useState('');
  const { toast } = useToast();

  const handleCreateArena = () => {
    if (username && ws) {
      const createArenaData = { event: 'create-arena', username };
      ws.send(JSON.stringify(createArenaData));

      ws.onmessage = (message) => {
        const data = JSON.parse(message.data);
        if (data.event === 'arena-created') {
          onArenaCreated(data.arenaId);
          toast({
            title: 'Arena Created',
            description: `Arena ID: ${data.arenaId}`
          });
        }
      };
    } else {
      toast({
        title: 'Error',
        description: 'Enter your username and ensure WebSocket is connected!'
      });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="relative font-montserrat text-xl lg:text-2xl xl:text-3xl p-1 lg:p-3 mb-20 font-bold text-gray-900 hover:scale-105 transition-transform duration-300">
          <span className="absolute -inset-1.5 bg-gradient-to-r from-purple-400 to-pink-100 rounded-lg blur group-hover:from-pink-400 group-hover:to-purple-200 transition-colors"></span>
          <span className="absolute -inset-3 border-4 border-purple-400 rounded-lg"></span>
          <span className="relative font-sans italic text-black">Create New Arena</span>
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-xl mt-2 mb-2">Create Arena</DialogTitle>
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
            className="px-4 py-2 bg-purple-700 text-white text-xl rounded-lg hover:bg-purple-500"
            onClick={handleCreateArena}
          >
            Create
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateArenaDialog;
