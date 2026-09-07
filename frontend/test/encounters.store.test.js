import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';

vi.mock('../src/api/encounters.js', () => ({
  encountersApi: {
    list: vi.fn(),
    create: vi.fn(),
    remove: vi.fn(),
  },
}));

const { useEncountersStore } = await import('../src/stores/encounters.store.js');
const { encountersApi } = await import('../src/api/encounters.js');

beforeEach(() => {
  setActivePinia(createPinia());
  vi.clearAllMocks();
});

describe('encounters store', () => {
  it('loads the list from the API', async () => {
    encountersApi.list.mockResolvedValue([{ id: '1', name: 'Sample' }]);
    const store = useEncountersStore();
    await store.fetchList();
    expect(store.list).toEqual([{ id: '1', name: 'Sample' }]);
    expect(store.loaded).toBe(true);
  });

  it('appends a newly created encounter to the list', async () => {
    const created = { id: '2', name: 'New Fight' };
    encountersApi.create.mockResolvedValue(created);
    const store = useEncountersStore();
    store.list = [{ id: '1', name: 'Sample' }];
    const result = await store.create('New Fight');
    expect(result).toEqual(created);
    expect(store.list).toEqual([{ id: '1', name: 'Sample' }, created]);
  });

  it('removes an encounter by id', async () => {
    encountersApi.remove.mockResolvedValue(null);
    const store = useEncountersStore();
    store.list = [{ id: '1' }, { id: '2' }];
    await store.remove('1');
    expect(store.list).toEqual([{ id: '2' }]);
  });
});
