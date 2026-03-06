import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request, { params }) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email')?.toLowerCase();

  if (!email) {
    return NextResponse.json({ error: 'Email parameter required.' }, { status: 400 });
  }

  const app = await prisma.application.findUnique({
    where: { id },
    include: { documents: true },
  });

  if (!app || app.email.toLowerCase() !== email) {
    return NextResponse.json({ error: 'Application not found.' }, { status: 404 });
  }

  return NextResponse.json({
    id: app.id,
    status: app.status,
    firstName: app.firstName,
    lastName: app.lastName,
    unit: app.unit,
    monthlyRent: app.monthlyRent,
    monthlyIncome: app.monthlyIncome,
    moveIn: app.moveIn,
    submittedAt: app.submittedAt,
    decidedBy: app.decidedBy,
    decidedAt: app.decidedAt,
    decisionNotes: app.decisionNotes,
    aiAnalysis: app.aiAnalysis ? JSON.parse(app.aiAnalysis) : null,
    documents: app.documents,
  });
}
