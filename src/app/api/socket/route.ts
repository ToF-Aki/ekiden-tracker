import { NextRequest } from 'next/server';
import { initSocket, NextApiResponseServerIO } from '@/lib/socket';

export async function GET(req: NextRequest) {
  const res = new Response() as any;
  initSocket(res as NextApiResponseServerIO);
  return new Response('Socket initialized', { status: 200 });
}
