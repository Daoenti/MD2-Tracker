import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';

vi.mock('../src/api/encounters.js', () => ({
  encountersApi: { patch: vi.fn().mockResolvedValue({}) },
}));

const { useBoardStore } = await import('../src/stores/board.store.js');
const { encountersApi } = await import('../src/api/encounters.js');

beforeEach(() => {
  setActivePinia(createPinia());
  encountersApi.patch.mockClear();
});

function boardWith(darkness) {
  const board = useBoardStore();
  board.encounter = { id: 'e1', heroCount: 4, darkness };
  return board;
}

describe('board store darkness track', () => {
  it('advances within track A', async () => {
    const board = boardWith({ side: 'A', pos: 3 });
    await board.moveDarkness(1);
    expect(board.encounter.darkness).toEqual({ side: 'A', pos: 4 });
    expect(encountersApi.patch).toHaveBeenCalledWith('e1', { darknessSide: 'A', darknessPos: 4 });
  });

  it('flips from track A to track B once past 9', async () => {
    const board = boardWith({ side: 'A', pos: 9 });
    await board.moveDarkness(1);
    expect(board.encounter.darkness).toEqual({ side: 'B', pos: 1 });
  });

  it('loops within track B instead of flipping again', async () => {
    const board = boardWith({ side: 'B', pos: 4 });
    await board.moveDarkness(1);
    expect(board.encounter.darkness).toEqual({ side: 'B', pos: 1 });
  });

  it('never moves below phase 1', async () => {
    const board = boardWith({ side: 'A', pos: 1 });
    await board.moveDarkness(-1);
    expect(board.encounter.darkness).toEqual({ side: 'A', pos: 1 });
  });

  it('clamps hero count to [1, 6]', async () => {
    const board = boardWith({ side: 'A', pos: 1 });
    board.encounter.heroCount = 6;
    await board.setHeroCount(1);
    expect(board.encounter.heroCount).toBe(6);
  });
});
