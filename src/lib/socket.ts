import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { NextApiResponse } from 'next';

export type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: NetServer & {
      io?: SocketIOServer;
    };
  };
};

export const initSocket = (res: NextApiResponseServerIO) => {
  if (!res.socket.server.io) {
    console.log('🔌 Socket.IOを初期化しています...');
    const io = new SocketIOServer(res.socket.server, {
      path: '/api/socket',
      addTrailingSlash: false,
    });
    res.socket.server.io = io;

    io.on('connection', (socket) => {
      console.log('✅ クライアントが接続しました:', socket.id);

      socket.on('join-event', (eventId: string) => {
        socket.join(`event-${eventId}`);
        console.log(`📍 クライアントがイベント ${eventId} に参加しました`);
      });

      socket.on('disconnect', () => {
        console.log('❌ クライアントが切断しました:', socket.id);
      });
    });
  }
  return res.socket.server.io;
};
