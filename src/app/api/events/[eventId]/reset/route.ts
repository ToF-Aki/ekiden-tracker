import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// 記録の初期化（全削除）
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { eventId } = await params;

    // イベントの全記録を削除
    await prisma.record.deleteMany({
      where: {
        team: {
          eventId: eventId,
        },
      },
    });

    return NextResponse.json({ success: true, message: '記録を初期化しました' });
  } catch (error) {
    console.error('記録初期化エラー:', error);
    return NextResponse.json({ error: '記録の初期化に失敗しました' }, { status: 500 });
  }
}
