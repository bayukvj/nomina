import { and, asc, desc, eq, gte, ilike, inArray, or, sql } from 'drizzle-orm';
import { db } from '../db';
import {
  categories,
  comments,
  media,
  menuItems,
  menus,
  pages,
  postCategories,
  postTags,
  postViews,
  posts,
  tags,
  users,
} from '../db/schema';

export const postWithRelations = {
  category: true,
  author: true,
  cover: true,
  tags: { with: { tag: true } },
} as const;

export type PostWithRelations = Awaited<ReturnType<typeof getPostById>>;

/* ---------------- categories ---------------- */

export async function getAllCategories() {
  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      description: categories.description,
      parentId: categories.parentId,
      position: categories.position,
      seoTitle: categories.seoTitle,
      seoDescription: categories.seoDescription,
      count: sql<number>`(
        select count(*)::int from "posts"
        where (
          "posts"."category_id" = "categories"."id"
          or "posts"."id" in (
            select "post_categories"."post_id" from "post_categories"
            where "post_categories"."category_id" = "categories"."id"
          )
        )
        and "posts"."status" = 'published'
      )`,
    })
    .from(categories)
    .orderBy(asc(categories.position), asc(categories.name));

  return rows;
}

export async function getCategoriesForPost(postId: number) {
  const rows = await db
    .select({
      id: postCategories.categoryId,
      name: categories.name,
      slug: categories.slug,
    })
    .from(postCategories)
    .innerJoin(categories, eq(postCategories.categoryId, categories.id))
    .where(eq(postCategories.postId, postId))
    .orderBy(asc(categories.name));
  return rows;
}

export async function getCategoryBySlug(slug: string) {
  const rows = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  return rows[0] ?? null;
}

export async function getCategoryById(id: number) {
  const rows = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  return rows[0] ?? null;
}

/* ---------------- tags ---------------- */

export async function getAllTags() {
  return db
    .select({
      id: tags.id,
      name: tags.name,
      slug: tags.slug,
      count: sql<number>`(
        select count(*)::int from "post_tags"
        inner join "posts" on "posts"."id" = "post_tags"."post_id"
        where "post_tags"."tag_id" = "tags"."id"
          and "posts"."status" = 'published'
      )`,
    })
    .from(tags)
    .orderBy(desc(sql`count`));
}

export async function getTagBySlug(slug: string) {
  const rows = await db.select().from(tags).where(eq(tags.slug, slug)).limit(1);
  return rows[0] ?? null;
}

/* ---------------- posts ---------------- */

export type PopularRange = 'all' | 'day' | 'week' | 'month' | 'year';

export const popularRangeDays: Record<Exclude<PopularRange, 'all'>, number> = {
  day: 1,
  week: 7,
  month: 30,
  year: 365,
};

export const popularRangeLabels: Record<PopularRange, string> = {
  all: 'Semua',
  day: '24 Jam',
  week: 'Minggu',
  month: 'Bulan',
  year: 'Tahun',
};

export type PostQuery = {
  page?: number;
  perPage?: number;
  categorySlug?: string;
  tagSlug?: string;
  authorId?: number;
  type?: string;
  search?: string;
  status?: 'published' | 'draft' | 'scheduled' | 'archived';
  includeAll?: boolean;
  featured?: boolean;
  limit?: number;
  sort?: 'terbaru' | 'terlama' | 'populer';
  popularRange?: PopularRange;
};

/** Total tayangan dalam periode tertentu (menggunakan tabel post_views) */
function viewsInRange(range: PopularRange) {
  const days = popularRangeDays[range as Exclude<PopularRange, 'all'>];
  if (!days) return null;
  const since = new Date(Date.now() - (days - 1) * 86400000).toISOString().slice(0, 10);
  return sql<number>`(
    select coalesce(sum(pv."count"), 0)
    from "post_views" pv
    where pv."post_id" = ${posts.id} and pv."day" >= ${since}
  )`;
}

export async function getPosts(query: PostQuery = {}) {
  const page = Math.max(1, query.page ?? 1);
  const perPage = query.perPage ?? 10;

  const conditions = [];
  if (!query.includeAll) {
    conditions.push(eq(posts.status, query.status ?? 'published'));
  } else if (query.status) {
    conditions.push(eq(posts.status, query.status));
  }
  if (query.type) conditions.push(eq(posts.type, query.type as never));
  if (query.featured) conditions.push(eq(posts.isFeatured, true));
  if (query.authorId) conditions.push(eq(posts.authorId, query.authorId));

  if (query.categorySlug) {
    const cat = await getCategoryBySlug(query.categorySlug);
    if (!cat) return { rows: [], total: 0, page, perPage, totalPages: 0 };
    conditions.push(
      or(
        eq(posts.categoryId, cat.id),
        sql`(${posts.id} in (
          select "post_categories"."post_id" from "post_categories"
          where "post_categories"."category_id" = ${cat.id}
        ))`,
      )!,
    );
  }

  if (query.tagSlug) {
    const tag = await getTagBySlug(query.tagSlug);
    if (!tag) return { rows: [], total: 0, page, perPage, totalPages: 0 };
    const tagged = await db
      .select({ postId: postTags.postId })
      .from(postTags)
      .where(eq(postTags.tagId, tag.id));
    const ids = tagged.map((t) => t.postId);
    if (ids.length === 0) return { rows: [], total: 0, page, perPage, totalPages: 0 };
    conditions.push(inArray(posts.id, ids));
  }

  if (query.search) {
    const term = `%${query.search}%`;
    conditions.push(
      or(ilike(posts.title, term), ilike(posts.excerpt, term), ilike(posts.content, term))!,
    );
  }

  /* popular per periode: hanya tampilkan post yang punya tayangan pada rentang itu */
  const range = query.popularRange ?? 'all';
  const rangeSql = range !== 'all' ? viewsInRange(range) : null;
  if (rangeSql) {
    conditions.push(sql`${rangeSql} > 0`);
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const totalRows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(posts)
    .where(where);
  const total = totalRows[0]?.count ?? 0;

  const order = rangeSql
    ? [desc(rangeSql), desc(posts.publishedAt)]
    : query.sort === 'terlama'
      ? [asc(posts.publishedAt)]
      : query.sort === 'populer'
        ? [desc(posts.views)]
        : [desc(posts.publishedAt), desc(posts.createdAt)];

  const rows = await db
    .select({ post: posts, category: categories, author: users, cover: media })
    .from(posts)
    .leftJoin(categories, eq(posts.categoryId, categories.id))
    .leftJoin(users, eq(posts.authorId, users.id))
    .leftJoin(media, eq(posts.coverMediaId, media.id))
    .where(where)
    .orderBy(...order)
    .limit(query.limit ?? perPage)
    .offset((page - 1) * perPage);

  const withTags = await attachTags(rows.map((r) => r.post));
  const withCats = await attachCategories(withTags);

  return {
    rows: rows.map((r, i) => ({ ...r, post: { ...withCats[i], cover: r.cover } })),
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
  };
}

export async function attachTags<T extends { id: number }>(list: T[]) {
  if (list.length === 0) return list;
  const ids = list.map((p) => p.id);
  const links = await db
    .select({ postId: postTags.postId, tag: tags })
    .from(postTags)
    .innerJoin(tags, eq(postTags.tagId, tags.id))
    .where(inArray(postTags.postId, ids));

  return list.map((p) => ({
    ...p,
    tags: links.filter((l) => l.postId === p.id).map((l) => l.tag),
  }));
}

export async function attachCategories<T extends { id: number }>(list: T[]) {
  if (list.length === 0) return list;
  const ids = list.map((p) => p.id);
  const links = await db
    .select({ postId: postCategories.postId, category: categories })
    .from(postCategories)
    .innerJoin(categories, eq(postCategories.categoryId, categories.id))
    .where(inArray(postCategories.postId, ids));

  return list.map((p) => ({
    ...p,
    categories: links.filter((l) => l.postId === p.id).map((l) => l.category),
  }));
}

export async function getPostBySlug(slug: string, includeAll = false) {
  const conditions = [eq(posts.slug, slug)];
  if (!includeAll) conditions.push(eq(posts.status, 'published'));

  const rows = await db
    .select({ post: posts, category: categories, author: users, cover: media })
    .from(posts)
    .leftJoin(categories, eq(posts.categoryId, categories.id))
    .leftJoin(users, eq(posts.authorId, users.id))
    .leftJoin(media, eq(posts.coverMediaId, media.id))
    .where(and(...conditions))
    .limit(1);

  if (rows.length === 0) return null;
  const [withTags] = await attachTags([rows[0].post]);
  const [withCats] = await attachCategories([withTags]);
  return { ...rows[0], post: { ...withCats, cover: rows[0].cover } };
}

export async function getPostById(id: number) {
  const rows = await db
    .select({ post: posts, category: categories, author: users, cover: media })
    .from(posts)
    .leftJoin(categories, eq(posts.categoryId, categories.id))
    .leftJoin(users, eq(posts.authorId, users.id))
    .leftJoin(media, eq(posts.coverMediaId, media.id))
    .where(eq(posts.id, id))
    .limit(1);

  if (rows.length === 0) return null;
  const [withTags] = await attachTags([rows[0].post]);
  const [withCats] = await attachCategories([withTags]);
  return { ...rows[0], post: { ...withCats, cover: rows[0].cover } };
}

export async function getRelatedPosts(postId: number, categoryId: number | null, limit = 4) {
  if (!categoryId) return [];
  const rows = await db
    .select({ post: posts, category: categories, author: users, cover: media })
    .from(posts)
    .leftJoin(categories, eq(posts.categoryId, categories.id))
    .leftJoin(users, eq(posts.authorId, users.id))
    .leftJoin(media, eq(posts.coverMediaId, media.id))
    .where(
      and(
        eq(posts.status, 'published'),
        eq(posts.categoryId, categoryId),
        sql`${posts.id} <> ${postId}`,
      ),
    )
    .orderBy(desc(posts.publishedAt))
    .limit(limit);
  return rows.map((r) => ({ ...r, post: { ...r.post, cover: r.cover } }));
}

export async function incrementViews(postId: number) {
  const day = new Date().toISOString().slice(0, 10);
  await db
    .insert(postViews)
    .values({ postId, day, count: 1 })
    .onConflictDoUpdate({
      target: [postViews.postId, postViews.day],
      set: { count: sql`${postViews.count} + 1` },
    });
  await db.update(posts).set({ views: sql`${posts.views} + 1` }).where(eq(posts.id, postId));
}

/* ---------------- pages ---------------- */

export async function getAllPages() {
  return db.select().from(pages).orderBy(asc(pages.title));
}

export async function getPageBySlug(slug: string, includeAll = false) {
  const conditions = [eq(pages.slug, slug)];
  if (!includeAll) conditions.push(eq(pages.status, 'published'));
  const rows = await db.select().from(pages).where(and(...conditions)).limit(1);
  return rows[0] ?? null;
}

export async function getPageById(id: number) {
  const rows = await db.select().from(pages).where(eq(pages.id, id)).limit(1);
  return rows[0] ?? null;
}

/* ---------------- menus ---------------- */

export async function getMenu(location: string) {
  const menuRows = await db.select().from(menus).where(eq(menus.location, location)).limit(1);
  if (menuRows.length === 0) return null;
  const menu = menuRows[0];

  const items = await db
    .select()
    .from(menuItems)
    .where(eq(menuItems.menuId, menu.id))
    .orderBy(asc(menuItems.position));

  const visible = items.filter((i) => i.isVisible);
  type MenuNode = (typeof items)[number] & { children: MenuNode[] };
  const byParent = (parentId: number | null): MenuNode[] =>
    visible
      .filter((i) => i.parentId === parentId)
      .map((i) => ({ ...i, children: byParent(i.id) }));

  return { menu, items: byParent(null) };
}

export async function getMenusWithItems() {
  const allMenus = await db.select().from(menus).orderBy(asc(menus.location));
  const allItems = await db.select().from(menuItems).orderBy(asc(menuItems.position));
  return allMenus.map((menu) => ({
    ...menu,
    items: allItems.filter((i) => i.menuId === menu.id),
  }));
}

export async function getMenuById(id: number) {
  const rows = await db.select().from(menus).where(eq(menus.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getMenuItems(menuId: number) {
  return db.select().from(menuItems).where(eq(menuItems.menuId, menuId)).orderBy(asc(menuItems.position));
}

/* ---------------- comments ---------------- */

export async function getComments(postId: number, status: 'approved' | 'pending' | 'all' = 'approved') {
  const conditions = [eq(comments.postId, postId)];
  if (status !== 'all') conditions.push(eq(comments.status, status));
  return db
    .select()
    .from(comments)
    .where(and(...conditions))
    .orderBy(desc(comments.createdAt));
}

export async function getPendingComments(limit = 50) {
  return db
    .select({ comment: comments, post: posts })
    .from(comments)
    .innerJoin(posts, eq(comments.postId, posts.id))
    .where(eq(comments.status, 'pending'))
    .orderBy(desc(comments.createdAt))
    .limit(limit);
}

export async function getRecentComments(limit = 6) {
  return db
    .select({ comment: comments, post: posts })
    .from(comments)
    .innerJoin(posts, eq(comments.postId, posts.id))
    .orderBy(desc(comments.createdAt))
    .limit(limit);
}

/* ---------------- analitik tayangan ---------------- */

export type ViewsPoint = { day: string; count: number };

/** Deret tayangan harian untuk N hari terakhir (hari kosong diisi 0) */
export async function getViewsSeries(days = 30): Promise<ViewsPoint[]> {
  const since = new Date(Date.now() - (days - 1) * 86400000).toISOString().slice(0, 10);

  const rows = await db
    .select({
      day: postViews.day,
      count: sql<number>`coalesce(sum(${postViews.count}), 0)::int`,
    })
    .from(postViews)
    .where(gte(postViews.day, since))
    .groupBy(postViews.day)
    .orderBy(asc(postViews.day));

  const map = new Map(rows.map((r) => [r.day, r.count]));
  const series: ViewsPoint[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    series.push({ day, count: map.get(day) ?? 0 });
  }

  return series;
}

/** Ringkasan tayaan: hari ini, 7 hari, 30 hari, dan total */
export async function getViewTotals() {
  const iso = (offsetDays: number) =>
    new Date(Date.now() - offsetDays * 86400000).toISOString().slice(0, 10);

  const [total] = await db
    .select({ c: sql<number>`coalesce(sum(${postViews.count}), 0)::int` })
    .from(postViews);

  const sumSince = async (from: string) => {
    const [row] = await db
      .select({ c: sql<number>`coalesce(sum(${postViews.count}), 0)::int` })
      .from(postViews)
      .where(gte(postViews.day, from));
    return row?.c ?? 0;
  };

  const [today, week, month] = await Promise.all([
    sumSince(iso(0)),
    sumSince(iso(6)),
    sumSince(iso(29)),
  ]);

  return { today, week, month, total: total?.c ?? 0 };
}

/** Kategori paling banyak dibaca (berdasarkan jumlah artikel terbit) */
export async function getTopCategories(limit = 6) {
  const rows = await getAllCategories();
  return rows.sort((a, b) => b.count - a.count).slice(0, limit);
}

/* ---------------- media ---------------- */

export async function getAllMedia(folder?: string) {
  if (folder) {
    return db.select().from(media).where(eq(media.folder, folder)).orderBy(desc(media.createdAt));
  }
  return db.select().from(media).orderBy(desc(media.createdAt));
}

export async function getMediaById(id: number) {
  const rows = await db.select().from(media).where(eq(media.id, id)).limit(1);
  return rows[0] ?? null;
}

/* ---------------- users ---------------- */

export async function getAllUsers() {
  return db.select().from(users).orderBy(asc(users.name));
}

export async function getUserById(id: number) {
  const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getAuthorBySlug(slug: string) {
  const rows = await db.select().from(users).where(eq(users.email, slug)).limit(1);
  return rows[0] ?? null;
}

export async function getStats() {
  const [postCount] = await db.select({ c: sql<number>`count(*)::int` }).from(posts);
  const [published] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(posts)
    .where(eq(posts.status, 'published'));
  const [draft] = await db.select({ c: sql<number>`count(*)::int` }).from(posts).where(eq(posts.status, 'draft'));
  const [catCount] = await db.select({ c: sql<number>`count(*)::int` }).from(categories);
  const [tagCount] = await db.select({ c: sql<number>`count(*)::int` }).from(tags);
  const [pageCount] = await db.select({ c: sql<number>`count(*)::int` }).from(pages);
  const [mediaCount] = await db.select({ c: sql<number>`count(*)::int` }).from(media);
  const [commentCount] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(comments)
    .where(eq(comments.status, 'pending'));
  const [viewRows] = await db.select({ c: sql<number>`coalesce(sum(${posts.views}), 0)::int` }).from(posts);

  return {
    posts: postCount?.c ?? 0,
    published: published?.c ?? 0,
    drafts: draft?.c ?? 0,
    categories: catCount?.c ?? 0,
    tags: tagCount?.c ?? 0,
    pages: pageCount?.c ?? 0,
    media: mediaCount?.c ?? 0,
    pendingComments: commentCount?.c ?? 0,
    views: viewRows?.c ?? 0,
  };
}
