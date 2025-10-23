import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 一括記録作成（複数チームを1回のリクエストで記録）
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const body = await req.json();
    const { teamNumbers, checkpointDistance } = body;

    if (!Array.isArray(teamNumbers) || teamNumbers.length === 0) {
      return NextResponse.json({ error: 'チーム番号の配列が必要です' }, { status: 400 });
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

    // 全チェックポイントを取得
    const allCheckpoints = await prisma.checkpoint.findMany({
      where: { eventId: eventId },
      orderBy: { distance: 'asc' },
    });

    const currentCheckpointIndex = allCheckpoints.findIndex(cp => cp.id === checkpoint.id);
    const maxCheckpointDistance = Math.max(...allCheckpoints.map(cp => cp.distance));

    const results = [];
    const errors = [];

    // 各チームを処理
    for (const teamNumber of teamNumbers) {
      try {
        // チームを取得
        const team = await prisma.team.findFirst({
          where: {
            eventId: eventId,
            teamNumber: parseInt(teamNumber),
          },
        });

        if (!team) {
          errors.push({ teamNumber, error: 'チームが見つかりません' });
          continue;
        }

        // 既存記録を取得
        const existingRecords = await prisma.record.findMany({
          where: { teamId: team.id },
          include: { checkpoint: true },
          orderBy: { timestamp: 'asc' },
        });

        // 走者番号を計算
        const checkpointRunnerMap = new Map<number, number>();
        existingRecords.forEach(record => {
          const dist = record.checkpoint.distance;
          const currentMax = checkpointRunnerMap.get(dist) || 0;
          checkpointRunnerMap.set(dist, Math.max(currentMax, record.runnerNumber));
        });

        const currentMaxRunner = checkpointRunnerMap.get(checkpoint.distance) || 0;
        const runnerNumber = currentMaxRunner + 1;

        // 5走目を超える記録は拒否
        if (runnerNumber > 5) {
          errors.push({ teamNumber, error: 'ゼッケン番号は既にゴールしています（5走目完了）' });
          continue;
        }

        // 5走目の最終チェックポイント完了チェック
        const finalRecord = await prisma.record.findFirst({
          where: {
            teamId: team.id,
            checkpoint: { distance: maxCheckpointDistance },
            runnerNumber: 5,
          },
        });

        if (finalRecord) {
          errors.push({
            teamNumber,
            error: `ゼッケン番号は既にゴールしています（5走目の${maxCheckpointDistance}km地点完了）`
          });
          continue;
        }

        // 既存記録チェック
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
          errors.push({ teamNumber, error: 'この記録は既に登録されています' });
          continue;
        }

        const createdRecords = [];

        // 前のチェックポイントの自動補完
        for (let i = 0; i < currentCheckpointIndex; i++) {
          const prevCheckpoint = allCheckpoints[i];

          const prevExistingRecord = await prisma.record.findUnique({
            where: {
              teamId_checkpointId_runnerNumber: {
                teamId: team.id,
                checkpointId: prevCheckpoint.id,
                runnerNumber: runnerNumber,
              },
            },
          });

          if (!prevExistingRecord) {
            const prevRecord = await prisma.record.create({
              data: {
                teamId: team.id,
                checkpointId: prevCheckpoint.id,
                runnerNumber: runnerNumber,
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

        // 現在のチェックポイントの記録作成
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

        results.push({
          teamNumber,
          success: true,
          record,
          autoCompleted: createdRecords.length - 1,
        });
      } catch (error) {
        console.error(`チーム${teamNumber}の記録作成エラー:`, error);
        errors.push({
          teamNumber,
          error: error instanceof Error ? error.message : '記録の作成に失敗しました'
        });
      }
    }

    return NextResponse.json({
      success: results.length,
      failed: errors.length,
      results,
      errors,
    });
  } catch (error) {
    console.error('一括記録作成エラー:', error);
    return NextResponse.json({ error: '一括記録の作成に失敗しました' }, { status: 500 });
  }
}
