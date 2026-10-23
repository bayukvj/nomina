import type { APIRoute } from 'astro';
import { writeFile, mkdir, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { eq, desc } from 'drizzle-orm';
import { db } from '../../../db';
import { media } from '../../../db/schema';
import { getSettings } from '../../../lib/settings';
import { slugify } from '../../../lib/utils';
import { generateImageVariants } from '../../../lib/images';
import { canManageMedia } from '../../../lib/rbac';

const UPLOAD_DIR = path.resolve(process.cwd(), 'public', 'uploads');

export const DELETE: APIRoute = async ({ request, locals }) => {
  if (!canManageMedia(locals.user)) {
    return new Response('Forbidden', { status: 403 });
  }

  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!id) return new Response('ID tidak valid', { status: 400 });

  const rows = await db.select().from(media).where(eq(media.id, id)).limit(1);
  if (rows.length === 0) return new Response('Media tidak ditemukan', { status: 404 });

  if (rows[0].path) {
    try {
      await unlink(rows[0].path);
    } catch {
    }
  }

  await db.delete(media).where(eq(media.id, id));
  return Response.json({ ok: true });
};

export const GET: APIRoute = async ({ locals }) => {
  if (!canManageMedia(locals.user)) {
    return new Response('Forbidden', { status: 403 });
  }

  const rows = await db
    .select()
    .from(media)
    .orderBy(desc(media.createdAt))
    .limit(300);

  return Response.json(
    rows.map((m) => ({
      id: m.id,
      url: m.url,
      filename: m.filename,
      originalName: m.originalName,
      mimeType: m.mimeType,
      alt: m.alt,
      caption: m.caption,
    })),
  );
};

export const PATCH: APIRoute = async ({ request, locals }) => {
  if (!canManageMedia(locals.user)) {
    return new Response('Forbidden', { status: 403 });
  }

  const url = new URL(request.url);
  const id = Number(url.searchParams.get('id'));
  if (!id) return new Response('ID tidak valid', { status: 400 });

  const body = await request.json().catch(() => ({}));
  const values: Record<string, string | null> = {};

  if (typeof body.alt === 'string') values.alt = body.alt.trim() || null;
  if (typeof body.caption === 'string') values.caption = body.caption.trim() || null;

  if (Object.keys(values).length === 0) {
    return Response.json({ ok: true });
  }

  await db.update(media).set(values).where(eq(media.id, id));
  return Response.json({ ok: true, ...values });
};

export const POST: APIRoute = async ({ request, locals }) => {
  if (!canManageMedia(locals.user)) {
    return new Response('Forbidden', { status: 403 });
  }

  const settings = await getSettings();
  const form = await request.formData();

  const file = form.get('file');
  const alt = String(form.get('alt') ?? '');

  if (!(file instanceof File) || file.size === 0) {
    return new Response('File tidak ditemukan', { status: 400 });
  }

  const maxMb = Number(settings.uploadMaxSizeMb) || 10;
  if (file.size > maxMb * 1024 * 1024) {
    return new Response(`Ukuran berkas melebihi ${maxMb} MB`, { status: 400 });
  }

  const allowed = settings.mediaAllowedTypes
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
  if (allowed.length > 0 && !allowed.includes(file.type)) {
    return new Response(`Tipe berkas ${file.type} tidak diizinkan`, { status: 400 });
  }

  const now = new Date();
  const yyyy = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const folder =
    settings.mediaFolderPrefix === 'yyyy/mm'
      ? `${yyyy}/${mm}`
      : settings.mediaFolderPrefix || 'umum';

  const dir = path.join(UPLOAD_DIR, folder);
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });

  const originalName = file.name || 'berkas';
  const ext = path.extname(originalName).toLowerCase() || '.bin';
  const base = slugify(path.basename(originalName, ext)) || 'berkas';
  const filename = `${base}-${Date.now().toString(36)}${ext}`;
  const filePath = path.join(dir, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  const url = `/uploads/${folder}/${filename}`;
  const imageVariants = await generateImageVariants(buffer, base, folder, file.type);

  const user = locals.user;
  if (!user) return new Response('Unauthorized', { status: 401 });

  const inserted = await db
    .insert(media)
    .values({
      filename,
      originalName,
      url,
      path: filePath,
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
      width: imageVariants.width,
      height: imageVariants.height,
      sizes: Object.keys(imageVariants.sizes).length > 0 ? imageVariants.sizes : null,
      alt,
      folder,
      uploadedBy: user.id,
    })
    .returning({ id: media.id });

  return Response.json({ ok: true, id: inserted[0].id, url });
};
