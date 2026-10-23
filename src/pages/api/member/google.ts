import type { APIRoute } from 'astro';
import {
  OAUTH_STATE_COOKIE,
  buildGoogleAuthUrl,
  createState,
  getGoogleConfig,
  isGoogleConfigured,
} from '../../../lib/member-auth';

export const GET: APIRoute = async ({ cookies, redirect }) => {
  if (!(await isGoogleConfigured())) {
    return redirect('/masuk?error=google-not-configured');
  }

  const config = await getGoogleConfig();
  const state = createState();

  cookies.set(OAUTH_STATE_COOKIE, state, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: import.meta.env.PROD,
    maxAge: 600,
  });

  return redirect(buildGoogleAuthUrl(config, state));
};
