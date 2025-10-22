'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export const useSocket = (eventId?: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketInstance = io({
      path: '/api/socket',
    });

    socketInstance.on('connect', () => {
      console.log('✅ Socket接続成功');
      setIsConnected(true);
      
      if (eventId) {
        socketInstance.emit('join-event', eventId);
      }
    });

    socketInstance.on('disconnect', () => {
      console.log('❌ Socket切断');
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [eventId]);

  return { socket, isConnected };
};




