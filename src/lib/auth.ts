import bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
import { and, eq, gt } from 'drizzle-orm';
import './env';
import { db } from '../db';
import { sessions, users, type User } from '../db/schema';

export const SESSION_COOKIE = 'nomina_session';

const TTL_HOURS = Number(process.env.SESSION_TTL_HOURS ?? 168);

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export async function createSession(userId: number, userAgent?: string, ip?: string) {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + TTL_HOURS * 3600_000);

  await db.insert(sessions).values({
    userId,
    token: hashToken(token),
    userAgent: userAgent?.slice(0, 300),
    ip,
    expiresAt,
  });

  return { token, expiresAt };
}

export async function getUserByToken(token: string | undefined | null): Promise<User | null> {
  if (!token) return null;

  const rows = await db
    .select({
      user: users,
      sessionId: sessions.id,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.token, hashToken(token)), gt(sessions.expiresAt, new Date())))
    .limit(1);

  if (rows.length === 0) return null;
  const { user } = rows[0];
  if (!user.active) return null;
  return user;
}

export async function destroySession(token: string | undefined | null) {
  if (!token) return;
  await db.delete(sessions).where(eq(sessions.token, hashToken(token)));
}

export async function destroyAllSessions(userId: number) {
  await db.delete(sessions).where(eq(sessions.userId, userId));
}

export async function touchSession(token: string) {
  await db
    .update(sessions)
    .set({ expiresAt: new Date(Date.now() + TTL_HOURS * 3600_000) })
    .where(eq(sessions.token, hashToken(token)));
}

export function canAccess(user: User | null, roles: string[]) {
  if (!user) return false;
  if (roles.includes('*')) return true;
  return roles.includes(user.role);
}

/** Hanya Administrator yang boleh menetapkan penulis artikel */
export function canChooseAuthor(role: string | undefined | null): boolean {
  return role === 'admin' || role === 'editor';
}

/** Hanya Administrator yang boleh membuat kategori baru */
export function canManageCategories(role: string | undefined | null): boolean {
  return role === 'admin';
}

export const roleLabel: Record<string, string> = {
  admin: 'Administrator',
  editor: 'Editor',
  author: 'Penulis',
};
