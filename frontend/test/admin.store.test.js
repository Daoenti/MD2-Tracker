import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';

vi.mock('../src/api/admin.js', () => ({
  adminApi: {
    listUsers: vi.fn(),
    createUser: vi.fn(),
    patchUser: vi.fn(),
    removeUser: vi.fn(),
  },
}));
vi.mock('../src/api/enemyTemplates.js', () => ({
  enemyTemplatesApi: {
    list: vi.fn(),
    create: vi.fn(),
    patch: vi.fn(),
    remove: vi.fn(),
  },
}));

const { useAdminStore } = await import('../src/stores/admin.store.js');
const { adminApi } = await import('../src/api/admin.js');
const { enemyTemplatesApi } = await import('../src/api/enemyTemplates.js');

beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
});

describe('admin store: users', () => {
  it('loads users from the API', async () => {
    adminApi.listUsers.mockResolvedValue([{ id: '1', username: 'boss', isAdmin: true }]);
    const store = useAdminStore();
    await store.fetchUsers();
    expect(store.users).toEqual([{ id: '1', username: 'boss', isAdmin: true }]);
    expect(store.usersLoaded).toBe(true);
  });

  it('replaces the matching user in place after a patch', async () => {
    const store = useAdminStore();
    store.users = [{ id: '1', username: 'a', isAdmin: false }, { id: '2', username: 'b', isAdmin: false }];
    adminApi.patchUser.mockResolvedValue({ id: '2', username: 'b', isAdmin: true });
    await store.patchUser('2', { isAdmin: true });
    expect(store.users).toEqual([
      { id: '1', username: 'a', isAdmin: false },
      { id: '2', username: 'b', isAdmin: true },
    ]);
  });

  it('removes a user by id', async () => {
    const store = useAdminStore();
    store.users = [{ id: '1' }, { id: '2' }];
    adminApi.removeUser.mockResolvedValue(null);
    await store.removeUser('1');
    expect(store.users).toEqual([{ id: '2' }]);
  });
});

describe('admin store: enemy templates', () => {
  it('loads templates from the API', async () => {
    enemyTemplatesApi.list.mockResolvedValue([{ id: 't1', kind: 'mob', name: 'Skeletons' }]);
    const store = useAdminStore();
    await store.fetchTemplates();
    expect(store.templates).toEqual([{ id: 't1', kind: 'mob', name: 'Skeletons' }]);
    expect(store.templatesLoaded).toBe(true);
  });

  it('appends a newly created template', async () => {
    const created = { id: 't2', kind: 'boss', name: 'New Boss' };
    enemyTemplatesApi.create.mockResolvedValue(created);
    const store = useAdminStore();
    const result = await store.createTemplate({ kind: 'boss', name: 'New Boss', healthMax: 20, bossTrackMax: 8 });
    expect(result).toEqual(created);
    expect(store.templates).toContainEqual(created);
  });

  it('removes a template by id', async () => {
    const store = useAdminStore();
    store.templates = [{ id: 't1' }, { id: 't2' }];
    enemyTemplatesApi.remove.mockResolvedValue(null);
    await store.removeTemplate('t1');
    expect(store.templates).toEqual([{ id: 't2' }]);
  });
});
