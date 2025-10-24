import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 一括記録作成（複数チームを1回のリクエストで記録）
// パフォーマンス最適化版: 全データを一括取得してメモリ上で処理
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

    // ========== 最適化: 必要なデータを一括取得（DB問い合わせ4回のみ） ==========

    // 1. 全チェックポイントを取得
    const allCheckpoints = await prisma.checkpoint.findMany({
      where: { eventId: eventId },
      orderBy: { distance: 'asc' },
    });

    // 2. 現在のチェックポイントを特定
    const checkpoint = allCheckpoints.find(cp => cp.distance === parseInt(checkpointDistance));
    if (!checkpoint) {
      return NextResponse.json({ error: 'チェックポイントが見つかりません' }, { status: 404 });
    }

    const currentCheckpointIndex = allCheckpoints.findIndex(cp => cp.id === checkpoint.id);
    const maxCheckpointDistance = Math.max(...allCheckpoints.map(cp => cp.distance));

    // 3. 対象チームを一括取得
    const teams = await prisma.team.findMany({
      where: {
        eventId: eventId,
        teamNumber: { in: teamNumbers.map(n => parseInt(n)) },
      },
    });

    // チーム番号→チームIDのマップを作成
    const teamNumberToTeamMap = new Map(teams.map(t => [t.teamNumber, t]));

    // 4. 対象チームの全既存記録を一括取得
    const teamIds = teams.map(t => t.id);
    const allExistingRecords = await prisma.record.findMany({
      where: { teamId: { in: teamIds } },
      include: { checkpoint: true, team: true },
      orderBy: { timestamp: 'asc' },
    });

    // チームID別に既存記録をグループ化
    const recordsByTeamId = new Map<string, typeof allExistingRecords>();
    allExistingRecords.forEach(record => {
      if (!recordsByTeamId.has(record.teamId)) {
        recordsByTeamId.set(record.teamId, []);
      }
      recordsByTeamId.get(record.teamId)!.push(record);
    });

    // ========== メモリ上でバリデーションと記録準備 ==========

    const results = [];
    const errors = [];
    const recordsToCreate: Array<{
      teamId: string;
      checkpointId: string;
      runnerNumber: number;
      timestamp: Date;
    }> = [];

    const now = new Date();

    for (const teamNumber of teamNumbers) {
      try {
        const team = teamNumberToTeamMap.get(parseInt(teamNumber));
        if (!team) {
          errors.push({ teamNumber, error: 'チームが見つかりません' });
          continue;
        }

        const existingRecords = recordsByTeamId.get(team.id) || [];

        // 走者番号を計算
        const checkpointRunnerMap = new Map<number, number>();
        existingRecords.forEach(record => {
          const dist = record.checkpoint.distance;
          const currentMax = checkpointRunnerMap.get(dist) || 0;
          checkpointRunnerMap.set(dist, Math.max(currentMax, record.runnerNumber));
        });

        const currentMaxRunner = checkpointRunnerMap.get(checkpoint.distance) || 0;
        const runnerNumber = currentMaxRunner + 1;

        // バリデーション: 5走目を超える記録は拒否
        if (runnerNumber > 5) {
          errors.push({ teamNumber, error: 'ゼッケン番号は既にゴールしています（5走目完了）' });
          continue;
        }

        // バリデーション: 5走目の最終チェックポイント完了チェック
        const hasFinalRecord = existingRecords.some(
          r => r.checkpoint.distance === maxCheckpointDistance && r.runnerNumber === 5
        );
        if (hasFinalRecord) {
          errors.push({
            teamNumber,
            error: `ゼッケン番号は既にゴールしています（5走目の${maxCheckpointDistance}km地点完了）`
          });
          continue;
        }

        // バリデーション: 既存記録チェック
        const isDuplicate = existingRecords.some(
          r => r.checkpointId === checkpoint.id && r.runnerNumber === runnerNumber
        );
        if (isDuplicate) {
          errors.push({ teamNumber, error: 'この記録は既に登録されています' });
          continue;
        }

        // 前のチェックポイントの自動補完記録を準備
        let autoCompletedCount = 0;
        for (let i = 0; i < currentCheckpointIndex; i++) {
          const prevCheckpoint = allCheckpoints[i];

          const hasRecord = existingRecords.some(
            r => r.checkpointId === prevCheckpoint.id && r.runnerNumber === runnerNumber
          );

          if (!hasRecord) {
            recordsToCreate.push({
              teamId: team.id,
              checkpointId: prevCheckpoint.id,
              runnerNumber: runnerNumber,
              timestamp: now,
            });
            autoCompletedCount++;
          }
        }

        // 現在のチェックポイントの記録を準備
        recordsToCreate.push({
          teamId: team.id,
          checkpointId: checkpoint.id,
          runnerNumber,
          timestamp: now,
        });

        results.push({
          teamNumber,
          success: true,
          runnerNumber,
          autoCompleted: autoCompletedCount,
        });
      } catch (error) {
        console.error(`チーム${teamNumber}の処理エラー:`, error);
        errors.push({
          teamNumber,
          error: error instanceof Error ? error.message : '処理に失敗しました'
        });
      }
    }

    // ========== 一括作成（DB問い合わせ1回） ==========

    if (recordsToCreate.length > 0) {
      await prisma.record.createMany({
        data: recordsToCreate,
        skipDuplicates: true, // 重複はスキップ
      });
    }

    return NextResponse.json({
      success: results.length,
      failed: errors.length,
      results,
      errors,
      totalRecordsCreated: recordsToCreate.length,
    });
  } catch (error) {
    console.error('一括記録作成エラー:', error);
    return NextResponse.json({ error: '一括記録の作成に失敗しました' }, { status: 500 });
  }
}
