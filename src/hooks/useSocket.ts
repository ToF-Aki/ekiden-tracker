'use client';

import { useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';

export const useSocket = (eventId?: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Vercel環境ではSocket.IOを無効化
    // リアルタイム更新は手動リロードまたはポーリングで代替
    console.log('⚠️ Socket.IO is disabled on Vercel. Using polling instead.');

    // ダミーの接続状態を設定（エラー防止）
    setIsConnected(false);

    return () => {
      // クリーンアップ不要
    };
  }, [eventId]);

  return { socket, isConnected };
};




