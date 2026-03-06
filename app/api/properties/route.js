import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const properties = await prisma.property.findMany({
    orderBy: [{ floor: 'asc' }, { unit: 'asc' }],
  });
  return NextResponse.json(properties);
}
