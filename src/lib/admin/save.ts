import { and, eq, inArray, sql } from 'drizzle-orm';
import { db } from '../../db';
import {
  ads,
  categories,
  comments,
  menuItems,
  menus,
  pages,
  postCategories,
  postTags,
  posts,
  tags,
  users,
} from '../../db/schema';
import { slugify } from '../utils';

const str = (form: FormData, key: string, fallback = '') => {
  const v = form.get(key);
  return typeof v === 'string' ? v.trim() : fallback;
};

const num = (form: FormData, key: string) => {
  const v = form.get(key);
  if (v === null || String(v).trim() === '') return null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
};

const bool = (form: FormData, key: string) => {
  const values = form.getAll(key).map((v) => String(v));
  return values.includes('true');
};

const list = (form: FormData, key: string) =>
  form.getAll(key).map((v) => String(v)).filter((v) => v !== '' && v !== 'false');

const dateOrNull = (value: string) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

async function uniquePostSlug(desired: string, currentId?: number) {
  const base = slugify(desired) || 'tanpa-judul';
  let candidate = base;
  let i = 2;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const rows = await db.select({ id: posts.id }).from(posts).where(eq(posts.slug, candidate)).limit(1);
    if (rows.length === 0 || (currentId && rows[0].id === currentId)) return candidate;
    candidate = `${base}-${i}`;
    i += 1;
  }
}

async function uniqueCategorySlug(desired: string) {
  const base = slugify(desired) || 'tanpa-judul';
  let candidate = base;
  let i = 2;
  while (true) {
    const rows = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, candidate)).limit(1);
    if (rows.length === 0) return candidate;
    candidate = `${base}-${i}`;
    i += 1;
  }
}

/**
 * Tentukan penulis artikel.
 * - bila form memilih penulis lain, pakai itu (dengan validasi ke tabel users)
 * - bila tidak, penulis = pengguna yang sedang login
 */
async function resolveAuthorId(form: FormData, fallbackUserId: number) {
  const requested = num(form, 'authorId');
  if (!requested) return fallbackUserId;

  const exists = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, requested))
    .limit(1);

  return exists.length > 0 ? requested : fallbackUserId;
}

export async function savePost(
  form: FormData,
  userId: number,
  id?: number,
  options: { canChooseAuthor?: boolean; canCreateCategory?: boolean } = {},
) {
  const title = str(form, 'title');
  if (!title) return { error: 'Judul wajib diisi.' };

  const status = str(form, 'status', 'draft');
  const slug = await uniquePostSlug(str(form, 'slug') || title, id);

  /* proses kategori (multiple via multiselect + newCategory) */
  const categoryIds = list(form, 'categoryId').map(Number).filter(Boolean);
  const newCategoryName = str(form, 'newCategory');

  let allCategoryIds = [...categoryIds];
  if (newCategoryName && options.canCreateCategory) {
    const catSlug = await uniqueCategorySlug(newCategoryName);
    const existing = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, catSlug)).limit(1);
    if (existing.length > 0) {
      if (!allCategoryIds.includes(existing[0].id)) allCategoryIds.push(existing[0].id);
    } else {
      const inserted = await db
        .insert(categories)
        .values({ name: newCategoryName, slug: catSlug })
        .returning({ id: categories.id });
      allCategoryIds.push(inserted[0].id);
    }
  }

  const finalCategoryId = allCategoryIds.length > 0 ? allCategoryIds[0] : null;
  const coverMediaId = num(form, 'coverMediaId');
  const ogImageId = num(form, 'ogImageId');
  const publishedAt = dateOrNull(str(form, 'publishedAt'));

  /*
   * Penulis artikel:
   * - Editor/Administrator boleh memilih bebas
   * - role Penulis: artikel baru tercatat atas namanya sendiri,
   *   sedangkan artikel yang sudah ada mempertahankan penulis aslinya
   */
  const canChoose = options.canChooseAuthor !== false;
  let authorId: number | undefined;
  if (canChoose) {
    authorId = await resolveAuthorId(form, userId);
  } else if (!id) {
    authorId = userId;
  }

  const values = {
    title,
    slug,
    excerpt: str(form, 'excerpt') || null,
    content: str(form, 'content'),
    format: (str(form, 'format', 'html') as 'html' | 'markdown'),
    type: (str(form, 'type', 'article') as 'article' | 'news' | 'video' | 'photo' | 'gallery'),
    status: status as 'draft' | 'published' | 'scheduled' | 'archived',
    finalCategoryId,
    coverMediaId,
    coverCaption: str(form, 'coverCaption') || null,
    coverAlt: str(form, 'coverAlt') || null,
    ogImageId,
    videoUrl: str(form, 'videoUrl') || null,
    location: str(form, 'location') || null,
    isFeatured: bool(form, 'isFeatured'),
    isBreaking: bool(form, 'isBreaking'),
    allowComments: bool(form, 'allowComments'),
    metaTitle: str(form, 'metaTitle') || null,
    metaDescription: str(form, 'metaDescription') || null,
    metaKeywords: str(form, 'metaKeywords') || null,
    ...(authorId ? { authorId } : {}),
    publishedAt:
      status === 'published' && !publishedAt
        ? new Date()
        : status === 'published'
          ? publishedAt
          : publishedAt,
    updatedAt: new Date(),
  };

  let postId = id ?? 0;

  if (id) {
    await db.update(posts).set(values).where(eq(posts.id, id));
  } else {
    const inserted = await db.insert(posts).values(values).returning({ id: posts.id });
    postId = inserted[0].id;
  }

  const existingTagIds = list(form, 'tags').map(Number).filter(Boolean);

  /* proses tag baru (comma-separated) */
  const newTagNames = str(form, 'newTags')
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

  const allTagIds = [...existingTagIds];

  for (const name of newTagNames) {
    const slug = slugify(name);
    if (!slug) continue;
    const existing = await db.select({ id: tags.id }).from(tags).where(eq(tags.slug, slug)).limit(1);
    if (existing.length > 0) {
      if (!allTagIds.includes(existing[0].id)) allTagIds.push(existing[0].id);
    } else {
      const inserted = await db
        .insert(tags)
        .values({ name, slug })
        .returning({ id: tags.id });
      allTagIds.push(inserted[0].id);
    }
  }

  await db.delete(postTags).where(eq(postTags.postId, postId));
  if (allTagIds.length > 0) {
    await db.insert(postTags).values(allTagIds.map((tagId) => ({ postId, tagId })));
  }

  await db.delete(postCategories).where(eq(postCategories.postId, postId));
  if (allCategoryIds.length > 0) {
    await db
      .insert(postCategories)
      .values(allCategoryIds.map((catId) => ({ postId, categoryId: catId })));
  }

  return { id: postId, slug };
}

export async function deletePost(id: number) {
  await db.delete(posts).where(eq(posts.id, id));
}

export async function savePage(form: FormData, id?: number) {
  const title = str(form, 'title');
  if (!title) return { error: 'Judul wajib diisi.' };

  const desired = slugify(str(form, 'slug') || title) || 'halaman';
  let slug = desired;
  let i = 2;
  while (true) {
    const rows = await db.select({ id: pages.id }).from(pages).where(eq(pages.slug, slug)).limit(1);
    if (rows.length === 0 || (id && rows[0].id === id)) break;
    slug = `${desired}-${i}`;
    i += 1;
  }

  const values = {
    title,
    slug,
    content: str(form, 'content'),
    format: (str(form, 'format', 'html') as 'html' | 'markdown'),
    template: str(form, 'template', 'default'),
    status: (str(form, 'status', 'published') as 'draft' | 'published' | 'archived'),
    coverMediaId: num(form, 'coverMediaId'),
    ogImageId: num(form, 'ogImageId'),
    metaTitle: str(form, 'metaTitle') || null,
    metaDescription: str(form, 'metaDescription') || null,
    metaKeywords: str(form, 'metaKeywords') || null,
    showInMenu: bool(form, 'showInMenu'),
    publishedAt: dateOrNull(str(form, 'publishedAt')),
    updatedAt: new Date(),
  };

  if (id) {
    await db.update(pages).set(values).where(eq(pages.id, id));
    return { id };
  }
  const inserted = await db.insert(pages).values(values).returning({ id: pages.id });
  return { id: inserted[0].id };
}

export async function deletePage(id: number) {
  await db.delete(pages).where(eq(pages.id, id));
}

export async function saveCategory(form: FormData, id?: number) {
  const name = str(form, 'name');
  if (!name) return { error: 'Nama kategori wajib diisi.' };

  const desired = slugify(str(form, 'slug') || name) || 'kategori';
  let slug = desired;
  let i = 2;
  while (true) {
    const rows = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, slug))
      .limit(1);
    if (rows.length === 0 || (id && rows[0].id === id)) break;
    slug = `${desired}-${i}`;
    i += 1;
  }

  const values = {
    name,
    slug,
    description: str(form, 'description') || null,
    parentId: num(form, 'parentId'),
    position: num(form, 'position') ?? 0,
    seoTitle: str(form, 'seoTitle') || null,
    seoDescription: str(form, 'seoDescription') || null,
    updatedAt: new Date(),
  };

  if (id) {
    await db.update(categories).set(values).where(eq(categories.id, id));
    return { id };
  }
  const inserted = await db.insert(categories).values(values).returning({ id: categories.id });
  return { id: inserted[0].id };
}

export async function deleteCategory(id: number) {
  await db.delete(categories).where(eq(categories.id, id));
}

export async function saveTag(name: string, id?: number) {
  const clean = name.trim();
  if (!clean) return { error: 'Nama tag wajib diisi.' };

  const desired = slugify(clean) || 'tag';
  let slug = desired;
  let i = 2;
  while (true) {
    const rows = await db.select({ id: tags.id }).from(tags).where(eq(tags.slug, slug)).limit(1);
    if (rows.length === 0 || (id && rows[0].id === id)) break;
    slug = `${desired}-${i}`;
    i += 1;
  }

  if (id) {
    await db.update(tags).set({ name: clean, slug }).where(eq(tags.id, id));
    return { id };
  }
  const inserted = await db.insert(tags).values({ name: clean, slug }).returning({ id: tags.id });
  return { id: inserted[0].id };
}

export async function deleteTag(id: number) {
  await db.delete(tags).where(eq(tags.id, id));
}

export async function saveUser(
  form: FormData,
  id?: number,
  hashPassword?: (p: string) => Promise<string>,
) {
  const name = str(form, 'name');
  const email = str(form, 'email').toLowerCase();
  if (!name || !email) return { error: 'Nama dan email wajib diisi.' };

  const role = str(form, 'role', 'author') as 'admin' | 'editor' | 'author';
  const password = str(form, 'password');

  const existing = await db.select().from(users).where(sql`lower(${users.email}) = ${email}`).limit(1);
  if (existing.length > 0 && existing[0].id !== id) {
    return { error: 'Email sudah digunakan pengguna lain.' };
  }

  if (id) {
    const values: Record<string, unknown> = {
      name,
      email,
      role,
      bio: str(form, 'bio') || null,
      avatar: str(form, 'avatar') || null,
      updatedAt: new Date(),
    };
    /* hanya ubah status aktif bila field-nya benar-benar dikirim */
    if (form.has('active')) values.active = bool(form, 'active');
    if (password && hashPassword) values.passwordHash = await hashPassword(password);
    await db.update(users).set(values as never).where(eq(users.id, id));
    return { id };
  }

  if (!password) return { error: 'Kata sandi wajib diisi untuk pengguna baru.' };
  const passwordHash = hashPassword ? await hashPassword(password) : password;

  const inserted = await db
    .insert(users)
    .values({ name, email, role, passwordHash, bio: str(form, 'bio') || null, active: true })
    .returning({ id: users.id });
  return { id: inserted[0].id };
}

export async function deleteUser(id: number) {
  await db.delete(users).where(eq(users.id, id));
}

export async function saveMenu(form: FormData, id?: number) {
  const name = str(form, 'name');
  if (!name) return { error: 'Nama menu wajib diisi.' };
  const location = str(form, 'location', 'primary');

  if (id) {
    await db
      .update(menus)
      .set({ name, location, description: str(form, 'description') || null })
      .where(eq(menus.id, id));
    return { id };
  }

  const existing = await db.select().from(menus).where(eq(menus.location, location)).limit(1);
  if (existing.length > 0) {
    await db
      .update(menus)
      .set({ name, description: str(form, 'description') || null })
      .where(eq(menus.id, existing[0].id));
    return { id: existing[0].id };
  }

  const inserted = await db
    .insert(menus)
    .values({ name, location, description: str(form, 'description') || null })
    .returning({ id: menus.id });
  return { id: inserted[0].id };
}

export async function saveMenuItems(form: FormData, menuId: number) {
  const labels = form.getAll('item_label').map((v) => String(v));
  const urls = form.getAll('item_url').map((v) => String(v));
  const targets = form.getAll('item_target').map((v) => String(v));
  const parents = form.getAll('item_parent').map((v) => String(v));
  const visibles = form.getAll('item_visible').map((v) => String(v));
  const icons = form.getAll('item_icon').map((v) => String(v));

  await db.delete(menuItems).where(eq(menuItems.menuId, menuId));

  const rows = labels.map((label, i) => ({
    menuId,
    label: label.trim(),
    url: (urls[i] ?? '').trim() || '#',
    target: targets[i] ?? '_self',
    icon: (icons[i] ?? '').trim() || null,
    parentId: parents[i] ? Number(parents[i]) : null,
    position: i + 1,
    isVisible: visibles[i] === 'true',
  })).filter((r) => r.label !== '');

  if (rows.length > 0) {
    await db.insert(menuItems).values(rows);
  }

  // repair parent references (parents may point to ids that changed)
  const all = await db.select().from(menuItems).where(eq(menuItems.menuId, menuId));
  for (const item of all) {
    if (item.parentId && !all.some((a) => a.id === item.parentId)) {
      await db.update(menuItems).set({ parentId: null }).where(eq(menuItems.id, item.id));
    }
  }
}

export async function deleteAd(id: number) {
  await db.delete(ads).where(eq(ads.id, id));
}

/** Simpan data iklan (buat baru atau perbarui) */
export async function saveAd(form: FormData, id?: number) {
  const name = str(form, 'name');
  if (!name) return { error: 'Nama iklan wajib diisi.' };

  const type = str(form, 'type', 'image') as 'image' | 'code' | 'adsense';
  const placement = str(form, 'placement', 'sidebar_top') as never;
  const status = str(form, 'status', 'active') as 'active' | 'paused' | 'scheduled';

  const targetCategories = form
    .getAll('targetCategories')
    .map((v) => Number(v))
    .filter((n) => Number.isFinite(n) && n > 0);

  const values = {
    name,
    type,
    placement,
    status,
    mediaId: num(form, 'mediaId'),
    linkUrl: str(form, 'linkUrl') || null,
    altText: str(form, 'altText') || null,
    code: str(form, 'code') || null,
    label: str(form, 'label') || null,
    targetCategories,
    startAt: dateOrNull(str(form, 'startAt')),
    endAt: dateOrNull(str(form, 'endAt')),
    updatedAt: new Date(),
  };

  if (id) {
    await db.update(ads).set(values).where(eq(ads.id, id));
    return { id };
  }

  const inserted = await db.insert(ads).values(values).returning({ id: ads.id });
  return { id: inserted[0].id };
}

export async function deleteMenu(id: number) {
  await db.delete(menus).where(eq(menus.id, id));
}

/**
 * Menyesuaikan URL item menu ketika basis URL (kategori/tag/halaman/penulis) berubah,
 * supaya navigasi situs tidak rusak.
 * Contoh: /kategori/nasional -> /nasional (bila basis dikosongkan).
 */
export async function rebaseMenuUrls(oldBase: string, newBase: string) {
  const oldTrim = (oldBase ?? '').trim();
  const newTrim = (newBase ?? '').trim();
  if (oldTrim === newTrim || !oldTrim) return 0;

  const prefix = `/${oldTrim}/`;
  const items = await db.select().from(menuItems);
  let changed = 0;

  for (const item of items) {
    if (!item.url.startsWith(prefix)) continue;
    const rest = item.url.slice(prefix.length);
    const next = newTrim ? `/${newTrim}/${rest}` : `/${rest}`;
    await db.update(menuItems).set({ url: next }).where(eq(menuItems.id, item.id));
    changed += 1;
  }

  return changed;
}

export async function bulkAction(action: string, ids: number[]) {
  if (ids.length === 0) return;
  if (action === 'delete') {
    await db.delete(posts).where(inArray(posts.id, ids));
  } else if (action === 'publish') {
    await db
      .update(posts)
      .set({ status: 'published', publishedAt: new Date(), updatedAt: new Date() })
      .where(inArray(posts.id, ids));
  } else if (action === 'draft') {
    await db.update(posts).set({ status: 'draft', updatedAt: new Date() }).where(inArray(posts.id, ids));
  } else if (action === 'feature') {
    await db.update(posts).set({ isFeatured: true }).where(inArray(posts.id, ids));
  } else if (action === 'unfeature') {
    await db.update(posts).set({ isFeatured: false }).where(inArray(posts.id, ids));
  }
}

export async function setCommentStatus(id: number, status: 'pending' | 'approved' | 'spam' | 'trash') {
  await db.update(comments).set({ status }).where(eq(comments.id, id));
}

export async function deleteComment(id: number) {
  await db.delete(comments).where(eq(comments.id, id));
}
