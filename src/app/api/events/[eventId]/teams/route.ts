import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// チーム一覧取得
export async function GET(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const teams = await prisma.team.findMany({
      where: { eventId: params.eventId },
      orderBy: { teamNumber: 'asc' },
    });

    return NextResponse.json(teams);
  } catch (error) {
    console.error('チーム取得エラー:', error);
    return NextResponse.json({ error: 'チームの取得に失敗しました' }, { status: 500 });
  }
}

// チーム作成
export async function POST(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const body = await req.json();
    const team = await prisma.team.create({
      data: {
        eventId: params.eventId,
        ...body,
      },
    });

    return NextResponse.json(team);
  } catch (error) {
    console.error('チーム作成エラー:', error);
    return NextResponse.json({ error: 'チームの作成に失敗しました' }, { status: 500 });
  }
}
