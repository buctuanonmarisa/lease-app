import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

export async function GET(request, { params }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const app = await prisma.application.findUnique({
    where: { id },
    include: { documents: true },
  });
  if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ ...app, aiAnalysis: app.aiAnalysis ? JSON.parse(app.aiAnalysis) : null });
}
