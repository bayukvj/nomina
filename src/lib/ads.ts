import { and, desc, eq, gte, inArray, lte, or, sql } from 'drizzle-orm';
import { db } from '../db';
import { ads, categories, media, type Ad } from '../db/schema';
import { getSettings } from './settings';

export type AdPlacement =
  | 'below_hero'
  | 'sidebar_top'
  | 'sidebar_bottom'
  | 'in_article'
  | 'after_content'
  | 'between_posts'
  | 'footer';

export const placementLabels: Record<AdPlacement, string> = {
  below_hero: 'Bawah Hero (Beranda)',
  sidebar_top: 'Sidebar Atas',
  sidebar_bottom: 'Sidebar Bawah',
  in_article: 'Dalam Artikel ( tengah konten)',
  after_content: 'Setelah Isi Artikel',
  between_posts: 'Antar Kartu Artikel',
  footer: 'Atas Footer',
};

export const placementHints: Record<AdPlacement, string> = {
  below_hero:
    'Banner lebar (728×90 / responsif) tepat di bawah hero. Posisi dengan views tertinggi.',
  sidebar_top: 'Ilan di bagian atas sidebar, terlihat pertama kali oleh pembaca.',
  sidebar_bottom: 'Ilan di bagian bawah sidebar, dekat dengan footer.',
  in_article:
    'Ilan di tengah isi artikel (setelah paragraf ke-3). Posisi natural, tidak mengganggu.',
  after_content: 'Ilan setelah artikel selesai dibaca, sebelum post terkait.',
  between_posts: 'Ilan selang di antara kartu artikel pada daftar/arsip.',
  footer: 'Ilan melintang penuh di atas footer.',
};

export const adTypeLabels: Record<string, string> = {
  image: 'Gambar (Banner)',
  code: 'Kode Custom (HTML/JS)',
  adsense: 'Google AdSense',
};

/** Ambil iklan aktif untuk sebuah penempatan (dengan targeting kategori) */
export async function getAdForPlacement(
  placement: AdPlacement,
  categoryId?: number | null,
): Promise<(Ad & { mediaUrl: string | null; mediaAlt: string | null }) | null> {
  const settings = await getSettings();
  if (settings.adsEnabled === 'false') return null;

  const now = new Date();
  const conditions = [
    eq(ads.placement, placement),
    eq(ads.status, 'active'),
    or(sql`${ads.startAt} is null`, lte(ads.startAt, now)),
    or(sql`${ads.endAt} is null`, gte(ads.endAt, now)),
  ];

  const rows = await db
    .select({ ad: ads, mediaUrl: media.url, mediaAlt: media.alt })
    .from(ads)
    .leftJoin(media, eq(ads.mediaId, media.id))
    .where(and(...conditions))
    .orderBy(desc(ads.id));

  if (rows.length === 0) return null;

  /* utamakan iklan yang tidak dibatasi kategori */
  const targeted = categoryId
    ? rows.filter((r) => {
        const cats = (r.ad.targetCategories ?? []) as number[];
        return cats.length === 0 || cats.includes(categoryId);
      })
    : rows;

  const chosen = targeted.find((r) => {
    const cats = (r.ad.targetCategories ?? []) as number[];
    return cats.length === 0;
  }) ?? targeted[0];

  if (!chosen) return null;

  return { ...chosen.ad, mediaUrl: chosen.mediaUrl, mediaAlt: chosen.mediaAlt };
}

export async function recordAdImpression(adId: number) {
  await db.update(ads).set({ impressions: sql`${ads.impressions} + 1` }).where(eq(ads.id, adId));
}

export async function recordAdClick(adId: number) {
  await db.update(ads).set({ clicks: sql`${ads.clicks} + 1` }).where(eq(ads.id, adId));
}

export async function getAllAds() {
  return db
    .select({
      ad: ads,
      mediaUrl: media.url,
      mediaName: media.originalName,
      categoryNames: sql<string[]>`(
        select coalesce(array_agg(c.name), '{}')
        from "categories" c
        where c.id in (
          select jsonb_array_elements_text(${ads.targetCategories})::int
        )
      )`,
    })
    .from(ads)
    .leftJoin(media, eq(ads.mediaId, media.id))
    .orderBy(desc(ads.id));
}

export async function getAdById(id: number) {
  const rows = await db.select().from(ads).where(eq(ads.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getAdStats() {
  const [row] = await db
    .select({
      total: sql<number>`count(*)::int`,
      active: sql<number>`count(*) filter (where ${ads.status} = 'active')::int`,
      impressions: sql<number>`coalesce(sum(${ads.impressions}), 0)::int`,
      clicks: sql<number>`coalesce(sum(${ads.clicks}), 0)::int`,
    })
    .from(ads);

  const impressions = row?.impressions ?? 0;
  const clicks = row?.clicks ?? 0;

  return {
    total: row?.total ?? 0,
    active: row?.active ?? 0,
    impressions,
    clicks,
    ctr: impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) : '0.00',
  };
}

export async function getAdCategories() {
  return db.select({ id: categories.id, name: categories.name }).from(categories);
}

export function escapeHtml(str: string) {
  return (str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Render iklan menjadi HTML string.
 * Dipakai oleh komponen <Ads> maupun untuk menyisipkan iklan di tengah artikel.
 */
export function renderAdHtml(
  ad: { id: number; type: string; mediaUrl?: string | null; altText?: string | null; linkUrl?: string | null; code?: string | null; name: string },
  label: string,
): string {
  const labelHtml = `<p class="border-b border-ink-100 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-ink-400">${escapeHtml(label)}</p>`;

  if (ad.type === 'image' && ad.mediaUrl) {
    return `<aside class="ad-slot overflow-hidden rounded-2xl border border-ink-100 bg-surface" data-ad-id="${ad.id}" data-ad-type="image" aria-label="${escapeHtml(label)}">${labelHtml}<a href="/go/${ad.id}" class="block" target="_blank" rel="noopener sponsored nofollow" data-ad-click="${ad.id}"><img src="${escapeHtml(ad.mediaUrl)}" alt="${escapeHtml(ad.altText ?? ad.name)}" loading="lazy" class="block h-auto w-full"></a></aside>`;
  }

  if ((ad.type === 'code' || ad.type === 'adsense') && ad.code) {
    return `<aside class="ad-slot overflow-hidden rounded-2xl border border-ink-100 bg-surface" data-ad-id="${ad.id}" data-ad-type="${escapeHtml(ad.type)}" aria-label="${escapeHtml(label)}">${labelHtml}<div class="${ad.type === 'adsense' ? 'ad-adsense' : 'ad-code'} p-2">${ad.code}</div></aside>`;
  }

  return '';
}

/**
 * Sisipkan iklan di tengah isi artikel (setelah paragraf ke-3).
 * Isi artikel berupa HTML, jadi disisipkan sebelum tag </p> ke-3.
 */
export function injectAdInContent(html: string, adHtml: string, afterParagraph = 3): string {
  if (!html || !adHtml) return html;

  const parts = html.split(/<\/p>/i);
  if (parts.length <= afterParagraph) {
    return html + adHtml;
  }

  const index = afterParagraph;
  const head = parts.slice(0, index).join('</p>');
  const tail = parts.slice(index).join('</p>');
  return `${head}</p>${adHtml}${tail}`;
}
