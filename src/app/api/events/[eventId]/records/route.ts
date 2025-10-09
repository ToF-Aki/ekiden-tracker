import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 記録一覧取得
export async function GET(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const records = await prisma.record.findMany({
      where: {
        team: {
          eventId: params.eventId,
        },
      },
      include: {
        team: true,
        checkpoint: true,
      },
      orderBy: { timestamp: 'asc' },
    });

    return NextResponse.json(records);
  } catch (error) {
    console.error('記録取得エラー:', error);
    return NextResponse.json({ error: '記録の取得に失敗しました' }, { status: 500 });
  }
}

// 記録作成（通過記録）
export async function POST(
  req: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const body = await req.json();
    const { teamNumber, checkpointDistance } = body;

    // チームを取得
    const team = await prisma.team.findFirst({
      where: {
        eventId: params.eventId,
        teamNumber: parseInt(teamNumber),
      },
    });

    if (!team) {
      return NextResponse.json({ error: 'チームが見つかりません' }, { status: 404 });
    }

    // チェックポイントを取得
    const checkpoint = await prisma.checkpoint.findFirst({
      where: {
        eventId: params.eventId,
        distance: parseInt(checkpointDistance),
      },
    });

    if (!checkpoint) {
      return NextResponse.json({ error: 'チェックポイントが見つかりません' }, { status: 404 });
    }

    // 走者番号を計算（1km=1走、2km=1走、3km=2走、4km=2走、5km=3走...）
    const runnerNumber = Math.ceil(checkpoint.distance / 1);

    // 既存の記録をチェック
    const existingRecord = await prisma.record.findUnique({
      where: {
        teamId_checkpointId_runnerNumber: {
          teamId: team.id,
          checkpointId: checkpoint.id,
          runnerNumber,
        },
      },
    });

    if (existingRecord) {
      return NextResponse.json({ error: 'この記録は既に登録されています' }, { status: 400 });
    }

    // 記録を作成
    const record = await prisma.record.create({
      data: {
        teamId: team.id,
        checkpointId: checkpoint.id,
        runnerNumber,
        timestamp: new Date(),
      },
      include: {
        team: true,
        checkpoint: true,
      },
    });

    // WebSocketで全クライアントに通知
    // Note: Next.js App Routerでは、Server Actionsを使用するか、
    // 別のWebSocketサーバーを立てる必要があります
    // ここでは簡易的に実装しています
    
    return NextResponse.json(record);
  } catch (error) {
    console.error('記録作成エラー:', error);
    return NextResponse.json({ error: '記録の作成に失敗しました' }, { status: 500 });
  }
}