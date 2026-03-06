import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendReviewEmail } from '@/lib/email';

export async function POST(request, { params }) {
  const { id } = await params;

  // Accept email from either form field or JSON body
  let email = '';
  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
    const formData = await request.formData();
    email = (formData.get('email') || '').toString().toLowerCase();
  } else {
    try {
      const body = await request.json();
      email = (body.email || '').toString().toLowerCase();
    } catch {
      email = '';
    }
  }

  const app = await prisma.application.findUnique({ where: { id } });
  if (!app || app.email.toLowerCase() !== email?.toLowerCase()) {
    return NextResponse.json({ error: 'Application not found.' }, { status: 404 });
  }
  if (app.status !== 'mismatch') {
    return NextResponse.json({ error: 'Application is not in mismatch state.' }, { status: 400 });
  }

  // Update to review status after re-upload
  const updated = await prisma.application.update({
    where: { id },
    data: { status: 'review' },
  });

  sendReviewEmail(updated).catch(console.error);

  return NextResponse.json({ status: 'review' });
}
