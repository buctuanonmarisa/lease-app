import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { sendApprovedEmail, sendRejectedEmail } from '@/lib/email';

export async function POST(request, { params }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const { decision, notes } = await request.json();

  if (!['approved', 'rejected'].includes(decision)) {
    return NextResponse.json({ error: 'Invalid decision.' }, { status: 400 });
  }
  if (!notes?.trim()) {
    return NextResponse.json({ error: 'Decision notes are required.' }, { status: 400 });
  }

  const app = await prisma.application.findUnique({ where: { id } });
  if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!['review', 'processing'].includes(app.status)) {
    return NextResponse.json({ error: 'Application cannot be decided in its current state.' }, { status: 400 });
  }

  const updated = await prisma.application.update({
    where: { id },
    data: {
      status: decision,
      decidedBy: session.name,
      decidedAt: new Date(),
      decisionNotes: notes.trim(),
    },
  });

  // Send email notification
  const ai = app.aiAnalysis ? JSON.parse(app.aiAnalysis) : {};
  if (decision === 'approved') {
    sendApprovedEmail(updated, session.name).catch(console.error);
  } else {
    const reasons = [];
    if (ai.creditPass === false) reasons.push(`Credit score ${ai.creditScore} is below minimum 650`);
    if (ai.incomePass === false) reasons.push(`Income ratio ${ai.incomeRatio}× is below minimum 2.5×`);
    sendRejectedEmail(updated, reasons.join('<br>')).catch(console.error);
  }

  return NextResponse.json({ status: decision });
}
