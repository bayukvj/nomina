/**
 * Pembantu thumbnail video.
 *
 * 1. Video dari YouTube  -> thumbnail resmi diambil dari i.ytimg.com
 * 2. Video dari file lokal (uploads) -> frame diambil di browser (lihat PostForm)
 * 3. URL gambar langsung  -> dipakai apa adanya sebagai poster
 */

const YOUTUBE_HOSTS = [
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
];

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif'];

export function youtubeId(url: string | null | undefined): string | null {
  if (!url) return null;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  const host = parsed.hostname.toLowerCase();
  if (!YOUTUBE_HOSTS.includes(host) && host !== 'youtu.be') return null;

  if (host === 'youtu.be') {
    const id = parsed.pathname.split('/').filter(Boolean)[0];
    return id && id.length >= 11 ? id : null;
  }

  const embedMatch = parsed.pathname.match(/\/(embed|shorts|v|live)\/([\w-]{6,})/);
  if (embedMatch) return embedMatch[2];

  const v = parsed.searchParams.get('v');
  if (v) return v;

  return null;
}

export function youtubeThumbnail(url: string | null | undefined): string | null {
  const id = youtubeId(url);
  if (!id) return null;
  return `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;
}

export function isDirectImage(url: string | null | undefined): boolean {
  if (!url) return false;
  const clean = url.split('?')[0].toLowerCase();
  return IMAGE_EXTENSIONS.some((ext) => clean.endsWith(ext));
}

/**
 * Ubah URL video biasa menjadi URL embed yang bisa diputar di dalam <iframe>.
 * - youtube.com/watch?v=ID  -> youtube.com/embed/ID
 * - youtu.be/ID             -> youtube.com/embed/ID
 * - youtube.com/shorts/ID   -> youtube.com/embed/ID
 * - vimeo.com/123          -> player.vimeo.com/video/123
 * - URL lain (iframe Custom)-> dibiarkan apa adanya
 */
export function toEmbedUrl(url: string | null | undefined): string {
  if (!url) return '';

  const ytId = youtubeId(url);
  if (ytId) return `https://www.youtube.com/embed/${ytId}`;

  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;

  return url;
}

/** Apakah URL menunjuk langsung ke berkas video (bukan halaman embed) */
export function isDirectVideoFile(url: string | null | undefined): boolean {
  if (!url) return false;
  return /\.(mp4|webm|ogv|ogg|mov|m4v)(\?.*)?$/i.test(url.trim());
}

/**
 * Sumber gambar utama untuk kartu artikel:
 * cover pilihan editor > thumbnail turunan dari video > null
 */
export function resolveThumbnail(
  coverUrl: string | null | undefined,
  videoUrl: string | null | undefined,
): string | null {
  if (coverUrl) return coverUrl;

  if (isDirectImage(videoUrl)) return videoUrl ?? null;

  return youtubeThumbnail(videoUrl);
}
