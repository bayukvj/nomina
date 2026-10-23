import {
  pgTable,
  serial,
  text,
  boolean,
  integer,
  timestamp,
  pgEnum,
  jsonb,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

export const userRole = pgEnum('user_role', ['admin', 'editor', 'author']);
export const postStatus = pgEnum('post_status', ['draft', 'published', 'scheduled', 'archived']);
export const postType = pgEnum('post_type', ['article', 'news', 'video', 'photo', 'gallery']);
export const contentFormat = pgEnum('content_format', ['html', 'markdown']);
export const commentStatus = pgEnum('comment_status', ['pending', 'approved', 'spam', 'trash']);

export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    passwordHash: text('password_hash').notNull(),
    role: userRole('role').notNull().default('author'),
    avatar: text('avatar'),
    bio: text('bio'),
    active: boolean('active').notNull().default(true),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('users_email_idx').on(sql`lower(${t.email})`)],
);

export const members = pgTable(
  'members',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull(),
    passwordHash: text('password_hash'),
    googleId: text('google_id'),
    avatar: text('avatar'),
    phone: text('phone'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  },
  (t) => [
    uniqueIndex('members_email_idx').on(sql`lower(${t.email})`),
    uniqueIndex('members_google_id_idx').on(t.googleId),
  ],
);

export const memberSessions = pgTable(
  'member_sessions',
  {
    id: serial('id').primaryKey(),
    memberId: integer('member_id')
      .notNull()
      .references(() => members.id, { onDelete: 'cascade' }),
    token: text('token').notNull(),
    userAgent: text('user_agent'),
    ip: text('ip'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('member_sessions_token_idx').on(t.token), index('member_sessions_member_idx').on(t.memberId)],
);

export const adType = pgEnum('ad_type', ['image', 'code', 'adsense']);
export const adStatus = pgEnum('ad_status', ['active', 'paused', 'scheduled']);
export const adPlacement = pgEnum('ad_placement', [
  'below_hero',
  'sidebar_top',
  'sidebar_bottom',
  'in_article',
  'after_content',
  'between_posts',
  'footer',
]);

export const ads = pgTable(
  'ads',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    type: adType('type').notNull().default('image'),
    placement: adPlacement('placement').notNull().default('sidebar_top'),
    mediaId: integer('media_id').references(() => media.id, { onDelete: 'set null' }),
    linkUrl: text('link_url'),
    altText: text('alt_text'),
    code: text('code'),
    label: text('label'),
    targetCategories: jsonb('target_categories').$type<number[]>().default(sql`'[]'::jsonb`),
    status: adStatus('status').notNull().default('active'),
    startAt: timestamp('start_at', { withTimezone: true }),
    endAt: timestamp('end_at', { withTimezone: true }),
    impressions: integer('impressions').notNull().default(0),
    clicks: integer('clicks').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('ads_placement_idx').on(t.placement), index('ads_status_idx').on(t.status)],
);

export const sessions = pgTable(
  'sessions',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    token: text('token').notNull(),
    userAgent: text('user_agent'),
    ip: text('ip'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('sessions_token_idx').on(t.token), index('sessions_user_idx').on(t.userId)],
);

export const categories = pgTable(
  'categories',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    description: text('description'),
    parentId: integer('parent_id'),
    mediaId: integer('media_id'),
    position: integer('position').notNull().default(0),
    seoTitle: text('seo_title'),
    seoDescription: text('seo_description'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('categories_slug_idx').on(t.slug), index('categories_parent_idx').on(t.parentId)],
);

export const tags = pgTable(
  'tags',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('tags_slug_idx').on(t.slug)],
);

export const media = pgTable(
  'media',
  {
    id: serial('id').primaryKey(),
    filename: text('filename').notNull(),
    originalName: text('original_name').notNull(),
    url: text('url').notNull(),
    path: text('path'),
    mimeType: text('mime_type').notNull(),
    size: integer('size').notNull().default(0),
    width: integer('width'),
    height: integer('height'),
    sizes: jsonb('sizes').$type<Record<string, { url: string; width: number }>>(),
    alt: text('alt'),
    caption: text('caption'),
    folder: text('folder').notNull().default('umum'),
    uploadedBy: integer('uploaded_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('media_folder_idx').on(t.folder)],
);

export const posts = pgTable(
  'posts',
  {
    id: serial('id').primaryKey(),
    title: text('title').notNull(),
    slug: text('slug').notNull(),
    excerpt: text('excerpt'),
    content: text('content').notNull().default(''),
    format: contentFormat('format').notNull().default('html'),
    type: postType('type').notNull().default('article'),
    status: postStatus('status').notNull().default('draft'),
    coverMediaId: integer('cover_media_id').references(() => media.id, { onDelete: 'set null' }),
    coverCaption: text('cover_caption'),
    coverAlt: text('cover_alt'),
    gallery: jsonb('gallery').$type<number[]>().default(sql`'[]'::jsonb`),
    videoUrl: text('video_url'),
    videoProvider: text('video_provider'),
    categoryId: integer('category_id').references(() => categories.id, { onDelete: 'set null' }),
    authorId: integer('author_id').references(() => users.id, { onDelete: 'set null' }),
    location: text('location'),
    isFeatured: boolean('is_featured').notNull().default(false),
    allowComments: boolean('allow_comments').notNull().default(true),
    views: integer('views').notNull().default(0),
    metaTitle: text('meta_title'),
    metaDescription: text('meta_description'),
    metaKeywords: text('meta_keywords'),
    ogImageId: integer('og_image_id').references(() => media.id, { onDelete: 'set null' }),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('posts_slug_idx').on(t.slug),
    index('posts_status_idx').on(t.status),
    index('posts_category_idx').on(t.categoryId),
    index('posts_published_idx').on(t.publishedAt),
  ],
);

export const postCategories = pgTable(
  'post_categories',
  {
    postId: integer('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    categoryId: integer('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
  },
  (t) => [uniqueIndex('post_categories_unique_idx').on(t.postId, t.categoryId)],
);

export const postTags = pgTable(
  'post_tags',
  {
    postId: integer('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    tagId: integer('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (t) => [uniqueIndex('post_tags_unique_idx').on(t.postId, t.tagId)],
);

export const pages = pgTable(
  'pages',
  {
    id: serial('id').primaryKey(),
    title: text('title').notNull(),
    slug: text('slug').notNull(),
    content: text('content').notNull().default(''),
    format: contentFormat('format').notNull().default('html'),
    template: text('template').notNull().default('default'),
    status: postStatus('status').notNull().default('published'),
    coverMediaId: integer('cover_media_id').references(() => media.id, { onDelete: 'set null' }),
    metaTitle: text('meta_title'),
    metaDescription: text('meta_description'),
    metaKeywords: text('meta_keywords'),
    ogImageId: integer('og_image_id').references(() => media.id, { onDelete: 'set null' }),
    showInMenu: boolean('show_in_menu').notNull().default(false),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('pages_slug_idx').on(t.slug)],
);

export const menus = pgTable(
  'menus',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    location: text('location').notNull().default('primary'),
    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('menus_location_idx').on(t.location)],
);

export const menuItems = pgTable(
  'menu_items',
  {
    id: serial('id').primaryKey(),
    menuId: integer('menu_id')
      .notNull()
      .references(() => menus.id, { onDelete: 'cascade' }),
    parentId: integer('parent_id'),
    label: text('label').notNull(),
    url: text('url').notNull(),
    target: text('target').notNull().default('_self'),
    icon: text('icon'),
    cssClass: text('css_class'),
    position: integer('position').notNull().default(0),
    isVisible: boolean('is_visible').notNull().default(true),
  },
  (t) => [index('menu_items_menu_idx').on(t.menuId), index('menu_items_parent_idx').on(t.parentId)],
);

export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  value: jsonb('value'),
  group: text('group').notNull().default('umum'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const comments = pgTable(
  'comments',
  {
    id: serial('id').primaryKey(),
    postId: integer('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    parentId: integer('parent_id'),
    name: text('name').notNull(),
    email: text('email'),
    website: text('website'),
    body: text('body').notNull(),
    status: commentStatus('status').notNull().default('pending'),
    ip: text('ip'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('comments_post_idx').on(t.postId), index('comments_status_idx').on(t.status)],
);

export const subscribers = pgTable(
  'subscribers',
  {
    id: serial('id').primaryKey(),
    email: text('email').notNull(),
    name: text('name'),
    status: text('status').notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('subscribers_email_idx').on(sql`lower(${t.email})`)],
);

export const postViews = pgTable(
  'post_views',
  {
    id: serial('id').primaryKey(),
    postId: integer('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    day: text('day').notNull(),
    count: integer('count').notNull().default(1),
  },
  (t) => [uniqueIndex('post_views_unique_idx').on(t.postId, t.day)],
);

/* ---------------- relations ---------------- */

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
  sessions: many(sessions),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: 'category_parent',
  }),
  children: many(categories, { relationName: 'category_parent' }),
  posts: many(posts),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  category: one(categories, { fields: [posts.categoryId], references: [categories.id] }),
  author: one(users, { fields: [posts.authorId], references: [users.id] }),
  cover: one(media, { fields: [posts.coverMediaId], references: [media.id], relationName: 'post_cover' }),
  ogImage: one(media, { fields: [posts.ogImageId], references: [media.id], relationName: 'post_og' }),
  postCategories: many(postCategories),
  tags: many(postTags),
  comments: many(comments),
}));

export const postCategoriesRelations = relations(postCategories, ({ one }) => ({
  post: one(posts, { fields: [postCategories.postId], references: [posts.id] }),
  category: one(categories, { fields: [postCategories.categoryId], references: [categories.id] }),
}));

export const postTagsRelations = relations(postTags, ({ one }) => ({
  post: one(posts, { fields: [postTags.postId], references: [posts.id] }),
  tag: one(tags, { fields: [postTags.tagId], references: [tags.id] }),
}));

export const pagesRelations = relations(pages, ({ one }) => ({
  cover: one(media, { fields: [pages.coverMediaId], references: [media.id], relationName: 'page_cover' }),
  ogImage: one(media, { fields: [pages.ogImageId], references: [media.id], relationName: 'page_og' }),
}));

export const mediaRelations = relations(media, ({ one }) => ({
  uploader: one(users, { fields: [media.uploadedBy], references: [users.id] }),
}));

export const menusRelations = relations(menus, ({ many }) => ({
  items: many(menuItems),
}));

export const menuItemsRelations = relations(menuItems, ({ one, many }) => ({
  menu: one(menus, { fields: [menuItems.menuId], references: [menus.id] }),
  parent: one(menuItems, {
    fields: [menuItems.parentId],
    references: [menuItems.id],
    relationName: 'menu_item_parent',
  }),
  children: many(menuItems, { relationName: 'menu_item_parent' }),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  post: one(posts, { fields: [comments.postId], references: [posts.id] }),
  parent: one(comments, {
    fields: [comments.parentId],
    references: [comments.id],
    relationName: 'comment_parent',
  }),
  replies: many(comments, { relationName: 'comment_parent' }),
}));

export type User = typeof users.$inferSelect;
export type Member = typeof members.$inferSelect;
export type Ad = typeof ads.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type Page = typeof pages.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type Tag = typeof tags.$inferSelect;
export type Media = typeof media.$inferSelect;
export type Menu = typeof menus.$inferSelect;
export type MenuItem = typeof menuItems.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type Setting = typeof settings.$inferSelect;
