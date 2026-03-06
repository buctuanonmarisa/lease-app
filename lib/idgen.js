import { prisma } from './db.js';

export async function generateAppId() {
  const year = new Date().getFullYear();
  const last = await prisma.application.findFirst({
    where: { id: { startsWith: `APP-${year}-` } },
    orderBy: { id: 'desc' },
  });
  const lastNum = last ? parseInt(last.id.split('-').pop()) : 1000;
  return `APP-${year}-${lastNum + 1}`;
}
