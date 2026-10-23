import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const IMAGE_WIDTHS = [320, 640, 960, 1280, 1920];

/**
 * Buat varian gambar (WebP) pada beberapa lebar + thumbnail JPG.
 * Mengembalikan peta { lebar: { url, width } }.
 */
export async function generateImageVariants(
  buffer: Buffer,
  baseName: string,
  folder: string,
  mimeType: string,
): Promise<{
  sizes: Record<string, { url: string; width: number }>;
  width: number | null;
  height: number | null;
}> {
  const empty = { sizes: {}, width: null, height: null };

  if (!mimeType.startsWith('image/') || mimeType === 'image/svg+xml') {
    return empty;
  }

  const sharpImport = await import('sharp').catch(() => null);
  const sharp = sharpImport ? sharpImport.default : null;
  if (!sharp) return empty;

  try {
    const image = sharp(buffer);
    const meta = await image.metadata();
    const originalWidth = meta.width ?? 0;
    const originalHeight = meta.height ?? 0;
    if (!originalWidth) return empty;

    const dir = path.resolve(process.cwd(), 'public', 'uploads', folder);
    await mkdir(dir, { recursive: true });

    const sizes: Record<string, { url: string; width: number }> = {};
    const ratio = originalHeight / originalWidth;

    for (const width of IMAGE_WIDTHS) {
      if (width > originalWidth && Object.keys(sizes).length > 0) break;

      const filename = `${baseName}-${width}.webp`;
      const out = await sharp(buffer)
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();

      await writeFile(path.join(dir, filename), out);
      sizes[String(width)] = {
        url: `/uploads/${folder}/${filename}`,
        width: Math.min(width, originalWidth),
      };
    }

    /* thumbnail kecil untuk avatar & daftar */
    const thumbName = `${baseName}-thumb.webp`;
    await sharp(buffer)
      .resize({ width: 160, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer()
      .then(async (buf: Buffer) => {
        await writeFile(path.join(dir, thumbName), buf);
      });
    sizes['thumb'] = { url: `/uploads/${folder}/${thumbName}`, width: 160 };

    return { sizes, width: originalWidth, height: originalHeight };
  } catch {
    return empty;
  }
}

/**
 * Bangun atribut srcset + sizes dari peta varian.
 */
export function buildSrcset(
  sizes: Record<string, { url: string; width: number }> | null | undefined,
): string | undefined {
  if (!sizes) return undefined;

  const entries = Object.entries(sizes)
    .filter(([key]) => key !== 'thumb')
    .map(([, v]) => `${v.url} ${v.width}w`)
    .sort((a, b) => {
      const aw = Number(a.split(' ')[1].replace('w', ''));
      const bw = Number(b.split(' ')[1].replace('w', ''));
      return aw - bw;
    });

  return entries.length > 0 ? entries.join(', ') : undefined;
}
