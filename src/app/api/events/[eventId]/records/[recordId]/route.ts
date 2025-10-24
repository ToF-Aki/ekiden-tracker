import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// 記録削除
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string; recordId: string }> }
) {
  try {
    // 認証チェック
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { recordId } = await params;

    await prisma.record.delete({
      where: { id: recordId },
    });

    return NextResponse.json({ success: true, message: '記録を削除しました' });
  } catch (error) {
    console.error('記録削除エラー:', error);
    return NextResponse.json({ error: '記録の削除に失敗しました' }, { status: 500 });
  }
}
