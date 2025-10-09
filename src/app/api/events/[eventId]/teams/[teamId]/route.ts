import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// チーム更新
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string; teamId: string }> }
) {
  try {
    const { teamId } = await params;
    const body = await req.json();
    const team = await prisma.team.update({
      where: { id: teamId },
      data: body,
    });

    return NextResponse.json(team);
  } catch (error) {
    console.error('チーム更新エラー:', error);
    return NextResponse.json({ error: 'チームの更新に失敗しました' }, { status: 500 });
  }
}

// チーム削除
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string; teamId: string }> }
) {
  try {
    const { teamId } = await params;
    await prisma.team.delete({
      where: { id: teamId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('チーム削除エラー:', error);
    return NextResponse.json({ error: 'チームの削除に失敗しました' }, { status: 500 });
  }
}
