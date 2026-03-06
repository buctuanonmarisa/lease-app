import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';

export async function POST(request) {
  const { email, password } = await request.json();

  const admin = await prisma.admin.findUnique({ where: { email: email?.toLowerCase() } });
  if (!admin || !(await bcrypt.compare(password, admin.password))) {
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
  }

  const token = signToken({ id: admin.id, name: admin.name, email: admin.email, role: admin.role });

  const response = NextResponse.json({
    name: admin.name,
    email: admin.email,
    role: admin.role,
    initials: admin.initials,
    color: admin.color,
  });

  response.cookies.set('admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete('admin_token');
  return response;
}
