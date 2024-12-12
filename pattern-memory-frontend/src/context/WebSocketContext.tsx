"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';


interface WebSocketContextType {
  ws: WebSocket | null;
  setWs: React.Dispatch<React.SetStateAction<WebSocket | null>>;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);


interface WebSocketProviderProps {
  children: ReactNode;
}


export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ children }) => {
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    const socket = new WebSocket('wss://pattern-memory-game.onrender.com/');
    setWs(socket);

    socket.onopen = () => {
      console.log('WebSocket connected');
    };

    socket.onclose = () => {
      console.log('WebSocket disconnected, attempting to reconnect...');
      setTimeout(() => {
        setWs(new WebSocket('wss://pattern-memory-game.onrender.com/'));
      }, 5000);
    };

    return () => {
      socket.close();
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ ws, setWs }}>
      {children}
    </WebSocketContext.Provider>
  );
};


export const useWebSocket = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};
