// EdgeでなくNodeで動かす（Prismaが安定）
export const runtime = "nodejs";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// イベント一覧取得
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const events = await prisma.event.findMany({
      orderBy: { date: 'desc' },
      include: {
        teams: true,
        checkpoints: true,
      },
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error('イベント取得エラー:', error);
    return NextResponse.json({ error: 'イベントの取得に失敗しました' }, { status: 500 });
  }
}

// イベント作成
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    console.log('Session:', JSON.stringify(session, null, 2));

    if (!session?.user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const body = await req.json();
    const { name, date } = body;
    console.log('Request body:', { name, date });

    // ユーザーIDを取得
    const userId = (session.user as any).id;
    console.log('Session userId:', userId);

    if (!userId) {
      console.log('Error: UserId not found in session');
      return NextResponse.json({
        error: 'ユーザーIDが見つかりません。再ログインしてください。'
      }, { status: 401 });
    }

    console.log('Creating event with userId:', userId);
    const event = await prisma.event.create({
      data: {
        name,
        date: new Date(date),
        userId: userId,
      },
    });
    console.log('Event created:', event.id);

    // デフォルトのチェックポイントを作成
    console.log('Creating checkpoints...');
    await prisma.checkpoint.createMany({
      data: [
        { eventId: event.id, distance: 1, name: '1km地点' },
        { eventId: event.id, distance: 2, name: '2km地点' },
        { eventId: event.id, distance: 3, name: '3km地点' },
        { eventId: event.id, distance: 4, name: '4km地点' },
      ],
    });
    console.log('Checkpoints created');

    return NextResponse.json(event);
  } catch (error) {
    console.error('イベント作成エラー:', error);
    console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return NextResponse.json({
      error: 'イベントの作成に失敗しました',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
