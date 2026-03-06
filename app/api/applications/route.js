import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateAppId } from '@/lib/idgen';
import { generateAIAnalysis, getInitialStatus } from '@/lib/ai';
import { sendConfirmationEmail, sendMismatchEmail, sendReviewEmail } from '@/lib/email';

const REQUIRED_DOC_TYPES = ['paystub1', 'paystub2', 'paystub3', 'employment', 'credit', 'govid', 'landlord'];

export async function POST(request) {
  try {
    const body = await request.json();

    // Extract personal/property fields
    const fields = {
      firstName:     (body.firstName     || '').toString().trim(),
      lastName:      (body.lastName      || '').toString().trim(),
      email:         (body.email         || '').toString().trim().toLowerCase(),
      phone:         (body.phone         || '').toString().trim(),
      dob:           (body.dob           || '').toString(),
      idType:        (body.idType        || '').toString(),
      unit:          (body.unit          || '').toString().trim(),
      monthlyRent:   parseFloat(body.monthlyRent   || 0),
      monthlyIncome: parseFloat(body.monthlyIncome || 0),
      moveIn:        (body.moveIn        || '').toString(),
    };

    // Validate required fields
    const missing = Object.entries(fields).filter(([, v]) => !v && v !== 0).map(([k]) => k);
    if (missing.length) {
      return NextResponse.json({ error: `Missing fields: ${missing.join(', ')}` }, { status: 400 });
    }

    // Validate all 7 documents are present
    const documents = Array.isArray(body.documents) ? body.documents : [];
    const uploadedKeys = documents.map((d) => d.key);
    const missingDocs = REQUIRED_DOC_TYPES.filter((t) => !uploadedKeys.includes(t));
    if (missingDocs.length) {
      return NextResponse.json({ error: `Missing documents: ${missingDocs.join(', ')}` }, { status: 400 });
    }

    // Generate App ID
    const id = await generateAppId();

    // Build document records from metadata (no binary upload at this step)
    const documentRecords = REQUIRED_DOC_TYPES.map((type) => {
      const doc = documents.find((d) => d.key === type);
      const filename = doc?.fileName
        ? `${type}_${doc.fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`
        : `${type}_uploaded.pdf`;
      return { type, filename, status: 'uploaded' };
    });

    // Run dummy AI analysis
    const aiResult = generateAIAnalysis({ monthlyRent: fields.monthlyRent, monthlyIncome: fields.monthlyIncome });
    const status = getInitialStatus(aiResult.scenario);

    // Create application in DB
    const app = await prisma.application.create({
      data: {
        id,
        ...fields,
        status,
        aiAnalysis: JSON.stringify(aiResult),
        documents: { create: documentRecords },
      },
      include: { documents: true },
    });

    // Send emails (fire-and-forget)
    sendConfirmationEmail(app).catch(console.error);

    if (status === 'mismatch') {
      sendMismatchEmail(app, aiResult.mismatches).catch(console.error);
    } else if (status === 'review') {
      sendReviewEmail(app).catch(console.error);
    }

    return NextResponse.json({ id, status }, { status: 201 });

  } catch (err) {
    console.error('POST /api/applications error:', err);
    return NextResponse.json({ error: 'Server error. Please try again.' }, { status: 500 });
  }
}
