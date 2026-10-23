import { createHash, randomBytes } from 'node:crypto';
import { and, eq, gt, sql } from 'drizzle-orm';
import './env';
import { db } from '../db';
import { memberSessions, members, type Member } from '../db/schema';
import { getSettings } from './settings';

export const MEMBER_COOKIE = 'nomina_member';
export const OAUTH_STATE_COOKIE = 'nomina_oauth_state';

const TTL_HOURS = Number(process.env.SESSION_TTL_HOURS ?? 720); // 30 hari

/* ---------------- Google OAuth ---------------- */

export const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
export const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
export const GOOGLE_USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo';

export type GoogleProfile = {
  id: string;
  email: string;
  name: string;
  picture?: string;
};

export type GoogleConfig = {
  enabled: boolean;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
};

/**
 * Konfigurasi Google OAuth.
 * Sumber utama: panel Admin → Pengaturan → Login Member (Google).
 * Fallback: variabel lingkungan (.env) bila panel belum diisi.
 */
export async function getGoogleConfig(): Promise<GoogleConfig> {
  const s = await getSettings();
  const siteUrl = (process.env.SITE_URL ?? 'http://localhost:4321').replace(/\/$/, '');

  return {
    enabled: s.memberLoginGoogle !== 'false',
    clientId: (s.googleClientId ?? '').trim() || (process.env.GOOGLE_CLIENT_ID ?? '').trim(),
    clientSecret:
      (s.googleClientSecret ?? '').trim() || (process.env.GOOGLE_CLIENT_SECRET ?? '').trim(),
    redirectUri:
      (s.googleRedirectUri ?? '').trim() ||
      (process.env.GOOGLE_REDIRECT_URI ?? '').trim() ||
      `${siteUrl}/api/member/google/callback`,
  };
}

export async function isGoogleConfigured(): Promise<boolean> {
  const config = await getGoogleConfig();
  return config.enabled && Boolean(config.clientId && config.clientSecret);
}

export function createState() {
  return randomBytes(24).toString('hex');
}

export function verifyState(state: string, expected: string) {
  if (!state || !expected) return false;
  const a = createHash('sha256').update(state).digest();
  const b = createHash('sha256').update(expected).digest();
  return a.equals(b);
}

export function buildGoogleAuthUrl(config: GoogleConfig, state: string) {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account',
    access_type: 'online',
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeGoogleCode(
  config: GoogleConfig,
  code: string,
): Promise<GoogleProfile | null> {
  const body = new URLSearchParams({
    code,
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    grant_type: 'authorization_code',
  });

  const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!tokenRes.ok) return null;
  const token = (await tokenRes.json()) as { access_token?: string };
  if (!token.access_token) return null;

  const infoRes = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  if (!infoRes.ok) return null;

  const info = (await infoRes.json()) as {
    sub?: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
    picture?: string;
  };

  if (!info.sub || !info.email) return null;

  return {
    id: info.sub,
    email: info.email.toLowerCase(),
    name: info.name || info.email.split('@')[0],
    picture: info.picture,
  };
}

/* ---------------- member ---------------- */

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Masuk / daftar member lewat Google Account.
 * - Member dengan google_id yang sama -> langsung masuk
 * - Member dengan email yang sama    -> ditautkan ke akun Google
 * - Email baru                      -> dibuatkan member baru
 */
export async function loginWithGoogle(
  profile: GoogleProfile,
): Promise<{ member: Member; created: boolean }> {
  const byGoogle = await db
    .select()
    .from(members)
    .where(eq(members.googleId, profile.id))
    .limit(1);
  if (byGoogle.length > 0) return { member: byGoogle[0], created: false };

  const byEmail = await db
    .select()
    .from(members)
    .where(sql`lower(${members.email}) = ${profile.email}`)
    .limit(1);

  if (byEmail.length > 0) {
    const linked = await db
      .update(members)
      .set({
        googleId: profile.id,
        avatar: profile.picture ?? byEmail[0].avatar,
        updatedAt: new Date(),
      })
      .where(eq(members.id, byEmail[0].id))
      .returning();
    return { member: linked[0], created: false };
  }

  const created = await db
    .insert(members)
    .values({
      name: profile.name.slice(0, 80),
      email: profile.email,
      googleId: profile.id,
      avatar: profile.picture ?? null,
    })
    .returning();
  return { member: created[0], created: true };
}

export async function createMemberSession(memberId: number, userAgent?: string, ip?: string) {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + TTL_HOURS * 3600_000);

  await db.insert(memberSessions).values({
    memberId,
    token: hashToken(token),
    userAgent: userAgent?.slice(0, 300),
    ip,
    expiresAt,
  });

  return { token, expiresAt };
}

export async function getMemberByToken(token: string | undefined | null): Promise<Member | null> {
  if (!token) return null;

  const rows = await db
    .select({ member: members })
    .from(memberSessions)
    .innerJoin(members, eq(memberSessions.memberId, members.id))
    .where(and(eq(memberSessions.token, hashToken(token)), gt(memberSessions.expiresAt, new Date())))
    .limit(1);

  return rows[0]?.member ?? null;
}

export async function destroyMemberSession(token: string | undefined | null) {
  if (!token) return;
  await db.delete(memberSessions).where(eq(memberSessions.token, hashToken(token)));
}

export async function updateMemberProfile(
  memberId: number,
  data: { name?: string; phone?: string; avatar?: string },
) {
  await db
    .update(members)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(members.id, memberId));
}
