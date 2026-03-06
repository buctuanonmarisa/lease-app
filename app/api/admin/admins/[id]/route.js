import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireSuperAdmin } from '@/lib/auth';

export async function DELETE(request, { params }) {
  const session = await requireSuperAdmin();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const adminId = parseInt(id);

  if (adminId === session.id) {
    return NextResponse.json({ error: 'Cannot remove your own account.' }, { status: 400 });
  }

  await prisma.admin.delete({ where: { id: adminId } });
  return NextResponse.json({ ok: true });
}
