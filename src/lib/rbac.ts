export type UserRole = 'admin' | 'editor' | 'author';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
}

/**
 * Role-based access control for admin panel.
 * Admin: full access
 * Editor: full access except user management
 * Author: only content they own
 */
export const rolePermissions: Record<UserRole, string[]> = {
  admin: ['*'],
  editor: ['posts', 'pages', 'categories', 'tags', 'comments', 'media', 'ads', 'menus', 'settings'],
  author: ['my-posts'],
};

/**
 * Check if user can access admin panel at all.
 */
export function canAccessAdmin(user: AuthUser | null | undefined): boolean {
  if (!user) return false;
  return user.active && ['admin', 'editor', 'author'].includes(user.role);
}

/**
 * Check if user can manage media (admin + editor only).
 * Authors should NOT be able to upload/delete media.
 */
export function canManageMedia(user: AuthUser | null | undefined): boolean {
  if (!user || !user.active) return false;
  return user.role === 'admin' || user.role === 'editor';
}

/**
 * Check if user can manage users (admin only).
 */
export function canManageUsers(user: AuthUser | null | undefined): boolean {
  if (!user || !user.active) return false;
  return user.role === 'admin';
}

/**
 * Check if user can manage settings (admin + editor).
 */
export function canManageSettings(user: AuthUser | null | undefined): boolean {
  if (!user || !user.active) return false;
  return user.role === 'admin' || user.role === 'editor';
}

/**
 * Check if user can author posts (admin + editor can choose author;
 * authors can only author their own).
 */
export function canChooseAuthor(user: AuthUser | null | undefined): boolean {
  if (!user || !user.active) return false;
  return user.role === 'admin' || user.role === 'editor';
}

/**
 * Check if user can manage categories (admin only).
 * Editors can use existing categories but cannot create new ones.
 */
export function canManageCategories(user: AuthUser | null | undefined): boolean {
  if (!user || !user.active) return false;
  return user.role === 'admin';
}
