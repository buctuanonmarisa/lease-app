import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(request) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const apps = await prisma.application.findMany({
    include: { documents: true },
    orderBy: { submittedAt: 'desc' },
  });

  return NextResponse.json(apps.map(a => ({
    ...a,
    aiAnalysis: a.aiAnalysis ? JSON.parse(a.aiAnalysis) : null,
  })));
}
