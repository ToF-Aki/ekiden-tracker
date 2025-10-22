import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 記録一覧取得
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const records = await prisma.record.findMany({
      where: {
        team: {
          eventId: eventId,
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
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const body = await req.json();
    const { teamNumber, checkpointDistance } = body;

    // チームを取得
    const team = await prisma.team.findFirst({
      where: {
        eventId: eventId,
        teamNumber: parseInt(teamNumber),
      },
    });

    if (!team) {
      return NextResponse.json({ error: 'チームが見つかりません' }, { status: 404 });
    }

    // チェックポイントを取得
    const checkpoint = await prisma.checkpoint.findFirst({
      where: {
        eventId: eventId,
        distance: parseInt(checkpointDistance),
      },
    });

    if (!checkpoint) {
      return NextResponse.json({ error: 'チェックポイントが見つかりません' }, { status: 404 });
    }

    // 走者番号を計算するために、このチームの既存記録を取得
    // 1走目: 1km, 2km, 3km, 4km
    // 2走目: 1km, 2km, 3km, 4km
    // ...という仕組み
    const existingRecords = await prisma.record.findMany({
      where: { teamId: team.id },
      include: { checkpoint: true },
      orderBy: { timestamp: 'asc' },
    });

    // 既存記録から、各チェックポイントの最大走者番号を取得
    const checkpointRunnerMap = new Map<number, number>();
    existingRecords.forEach(record => {
      const dist = record.checkpoint.distance;
      const currentMax = checkpointRunnerMap.get(dist) || 0;
      checkpointRunnerMap.set(dist, Math.max(currentMax, record.runnerNumber));
    });

    // 現在のチェックポイントでの次の走者番号を計算
    const currentMaxRunner = checkpointRunnerMap.get(checkpoint.distance) || 0;
    const runnerNumber = currentMaxRunner + 1;

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

    // 前のチェックポイントの記録を自動補完
    // 例: 2km地点で入力した場合、1km地点の記録がなければ自動的に追加
    const allCheckpoints = await prisma.checkpoint.findMany({
      where: { eventId: eventId },
      orderBy: { distance: 'asc' },
    });

    const currentCheckpointIndex = allCheckpoints.findIndex(cp => cp.id === checkpoint.id);
    const createdRecords = [];

    // 現在のチェックポイントより前の地点で、同じ走者番号の記録がないものを自動補完
    // 例: 3km地点で1走目を記録する場合、1km地点と2km地点にも1走目の記録を自動作成
    for (let i = 0; i < currentCheckpointIndex; i++) {
      const prevCheckpoint = allCheckpoints[i];

      // 既存の記録をチェック（同じ走者番号）
      const prevExistingRecord = await prisma.record.findUnique({
        where: {
          teamId_checkpointId_runnerNumber: {
            teamId: team.id,
            checkpointId: prevCheckpoint.id,
            runnerNumber: runnerNumber, // 現在と同じ走者番号
          },
        },
      });

      // 記録がなければ作成
      if (!prevExistingRecord) {
        const prevRecord = await prisma.record.create({
          data: {
            teamId: team.id,
            checkpointId: prevCheckpoint.id,
            runnerNumber: runnerNumber, // 現在と同じ走者番号
            timestamp: new Date(),
          },
          include: {
            team: true,
            checkpoint: true,
          },
        });
        createdRecords.push(prevRecord);
      }
    }

    // 現在のチェックポイントの記録を作成
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
    createdRecords.push(record);

    // WebSocketで全クライアントに通知
    // Note: Next.js App Routerでは、Server Actionsを使用するか、
    // 別のWebSocketサーバーを立てる必要があります
    // ここでは簡易的に実装しています

    return NextResponse.json({
      record,
      autoCompleted: createdRecords.length - 1, // 自動補完された記録数（現在の記録を除く）
      allRecords: createdRecords,
    });
  } catch (error) {
    console.error('記録作成エラー:', error);
    return NextResponse.json({ error: '記録の作成に失敗しました' }, { status: 500 });
  }
}