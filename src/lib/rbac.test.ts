import { describe, it, expect } from 'vitest';
import { canManageMedia, canManageUsers, canAccessAdmin, canManageSettings, canChooseAuthor, canManageCategories } from './rbac';

const admin = { id: 1, name: 'Admin', email: 'admin@test.com', role: 'admin' as const, active: true };
const editor = { id: 2, name: 'Editor', email: 'editor@test.com', role: 'editor' as const, active: true };
const author = { id: 3, name: 'Author', email: 'author@test.com', role: 'author' as const, active: true };
const inactive = { id: 4, name: 'Inactive', email: 'inactive@test.com', role: 'admin' as const, active: false };

describe('RBAC - canAccessAdmin', () => {
  it('should allow admin', () => {
    expect(canAccessAdmin(admin)).toBe(true);
  });

  it('should allow editor', () => {
    expect(canAccessAdmin(editor)).toBe(true);
  });

  it('should allow author', () => {
    expect(canAccessAdmin(author)).toBe(true);
  });

  it('should deny null/undefined user', () => {
    expect(canAccessAdmin(null)).toBe(false);
    expect(canAccessAdmin(undefined)).toBe(false);
  });

  it('should deny inactive user', () => {
    expect(canAccessAdmin(inactive)).toBe(false);
  });
});

describe('RBAC - canManageMedia (role check fix)', () => {
  it('should allow admin to manage media', () => {
    expect(canManageMedia(admin)).toBe(true);
  });

  it('should allow editor to manage media', () => {
    expect(canManageMedia(editor)).toBe(true);
  });

  it('should deny author from managing media', () => {
    expect(canManageMedia(author)).toBe(false);
  });

  it('should deny null/undefined user', () => {
    expect(canManageMedia(null)).toBe(false);
    expect(canManageMedia(undefined)).toBe(false);
  });

  it('should deny inactive admin', () => {
    expect(canManageMedia(inactive)).toBe(false);
  });
});

describe('RBAC - canManageUsers', () => {
  it('should allow admin', () => {
    expect(canManageUsers(admin)).toBe(true);
  });

  it('should deny editor', () => {
    expect(canManageUsers(editor)).toBe(false);
  });

  it('should deny author', () => {
    expect(canManageUsers(author)).toBe(false);
  });

  it('should deny null/undefined user', () => {
    expect(canManageUsers(null)).toBe(false);
    expect(canManageUsers(undefined)).toBe(false);
  });

  it('should deny inactive admin', () => {
    expect(canManageUsers(inactive)).toBe(false);
  });
});

describe('RBAC - canManageSettings', () => {
  it('should allow admin', () => {
    expect(canManageSettings(admin)).toBe(true);
  });

  it('should allow editor', () => {
    expect(canManageSettings(editor)).toBe(true);
  });

  it('should deny author', () => {
    expect(canManageSettings(author)).toBe(false);
  });

  it('should deny null/undefined user', () => {
    expect(canManageSettings(null)).toBe(false);
    expect(canManageSettings(undefined)).toBe(false);
  });

  it('should deny inactive editor', () => {
    expect(canManageSettings({ ...editor, active: false })).toBe(false);
  });
});

describe('RBAC - canChooseAuthor', () => {
  it('should allow admin', () => {
    expect(canChooseAuthor(admin)).toBe(true);
  });

  it('should allow editor', () => {
    expect(canChooseAuthor(editor)).toBe(true);
  });

  it('should deny author', () => {
    expect(canChooseAuthor(author)).toBe(false);
  });

  it('should deny null/undefined user', () => {
    expect(canChooseAuthor(null)).toBe(false);
    expect(canChooseAuthor(undefined)).toBe(false);
  });

  it('should deny inactive admin', () => {
    expect(canChooseAuthor(inactive)).toBe(false);
  });
});

describe('RBAC - canManageCategories', () => {
  it('should allow admin', () => {
    expect(canManageCategories(admin)).toBe(true);
  });

  it('should deny editor', () => {
    expect(canManageCategories(editor)).toBe(false);
  });

  it('should deny author', () => {
    expect(canManageCategories(author)).toBe(false);
  });

  it('should deny null/undefined user', () => {
    expect(canManageCategories(null)).toBe(false);
    expect(canManageCategories(undefined)).toBe(false);
  });

  it('should deny inactive admin', () => {
    expect(canManageCategories(inactive)).toBe(false);
  });
});
