import { db } from '../../db';
import { users } from '../../db/schema';

export const prerender = false;

export async function GET() {
  try {
    await db.select({ count: users.id }).from(users).limit(1);
    return new Response(JSON.stringify({ status: 'ok' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ status: 'error', error: String(e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
