import type { APIRoute } from 'astro';
import { SESSION_COOKIE, destroySession } from '../../lib/auth';

export const POST: APIRoute = async ({ cookies, redirect }) => {
  const token = cookies.get(SESSION_COOKIE)?.value;
  await destroySession(token);
  cookies.delete(SESSION_COOKIE, { path: '/' });
  return redirect('/admin/login');
};
