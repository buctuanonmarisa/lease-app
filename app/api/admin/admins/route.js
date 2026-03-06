import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireSuperAdmin } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function GET() {
  const session = await requireSuperAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admins = await prisma.admin.findMany({ orderBy: { createdAt: 'asc' } });
  return NextResponse.json(admins.map(({ password: _, ...a }) => a));
}

export async function POST(request) {
  const session = await requireSuperAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, email, role } = await request.json();
  if (!name || !email) return NextResponse.json({ error: 'Name and email required.' }, { status: 400 });

  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const colors = ['#1d4ed8', '#0891b2', '#059669', '#d97706', '#dc2626', '#7c3aed'];
  const color = colors[Math.floor(Math.random() * colors.length)];
  const password = await bcrypt.hash('admin123', 10);

  const admin = await prisma.admin.create({
    data: { name, email: email.toLowerCase(), role: role || 'admin', initials, color, password },
  });

  const { password: _, ...safe } = admin;
  return NextResponse.json(safe, { status: 201 });
}
