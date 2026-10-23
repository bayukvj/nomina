import type { APIRoute } from 'astro';
import { MEMBER_COOKIE, destroyMemberSession } from '../../../lib/member-auth';

export const POST: APIRoute = async ({ cookies, redirect }) => {
  const token = cookies.get(MEMBER_COOKIE)?.value;
  await destroyMemberSession(token);
  cookies.delete(MEMBER_COOKIE, { path: '/' });
  return redirect('/');
};
