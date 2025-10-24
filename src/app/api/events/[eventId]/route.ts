import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// イベント詳細取得
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        teams: {
          orderBy: { teamNumber: 'asc' },
        },
        checkpoints: {
          orderBy: { distance: 'asc' },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'イベントが見つかりません' }, { status: 404 });
    }

    // 10秒間のキャッシュを設定（イベント情報は変更が少ない）
    return NextResponse.json(event, {
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=30',
      },
    });
  } catch (error) {
    console.error('イベント取得エラー:', error);
    return NextResponse.json({ error: 'イベントの取得に失敗しました' }, { status: 500 });
  }
}

// イベント更新
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const body = await req.json();
    const event = await prisma.event.update({
      where: { id: eventId },
      data: body,
    });

    return NextResponse.json(event);
  } catch (error) {
    console.error('イベント更新エラー:', error);
    return NextResponse.json({ error: 'イベントの更新に失敗しました' }, { status: 500 });
  }
}

// イベント削除
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    await prisma.event.delete({
      where: { id: eventId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('イベント削除エラー:', error);
    return NextResponse.json({ error: 'イベントの削除に失敗しました' }, { status: 500 });
  }
}
