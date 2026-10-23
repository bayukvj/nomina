import type { APIRoute } from 'astro';
import {
  MEMBER_COOKIE,
  OAUTH_STATE_COOKIE,
  createMemberSession,
  exchangeGoogleCode,
  getGoogleConfig,
  isGoogleConfigured,
  loginWithGoogle,
  verifyState,
} from '../../../../lib/member-auth';
import { db } from '../../../../db';
import { members } from '../../../../db/schema';
import { eq } from 'drizzle-orm';

export const GET: APIRoute = async ({ cookies, redirect, request, url, clientAddress }) => {
  if (!(await isGoogleConfigured())) {
    return redirect('/masuk?error=google-not-configured');
  }

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const expected = cookies.get(OAUTH_STATE_COOKIE)?.value;

  cookies.delete(OAUTH_STATE_COOKIE, { path: '/' });

  if (!code || !verifyState(state ?? '', expected ?? '')) {
    return redirect('/masuk?error=state-mismatch');
  }

  const config = await getGoogleConfig();
  const profile = await exchangeGoogleCode(config, code);
  if (!profile) {
    return redirect('/masuk?error=google-failed');
  }

  const { member, created } = await loginWithGoogle(profile);
  await db.update(members).set({ lastLoginAt: new Date() }).where(eq(members.id, member.id));

  const { token, expiresAt } = await createMemberSession(
    member.id,
    request.headers.get('user-agent') ?? undefined,
    clientAddress,
  );

  cookies.set(MEMBER_COOKIE, token, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: import.meta.env.PROD,
    expires: expiresAt,
  });

  return redirect(created ? '/akun?msg=Selamat+bergabung+dengan+Nomina' : '/akun');
};
