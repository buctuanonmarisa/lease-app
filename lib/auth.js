import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const SECRET = process.env.JWT_SECRET || 'leaseflow-dev-secret-change-in-production';

export function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '7d' });
}

export function verifyToken(token) {
  try { return jwt.verify(token, SECRET); }
  catch { return null; }
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function requireAdmin(req) {
  const session = await getAdminSession();
  if (!session) return null;
  return session;
}

export async function requireSuperAdmin() {
  const session = await getAdminSession();
  if (!session || session.role !== 'superadmin') return null;
  return session;
}
