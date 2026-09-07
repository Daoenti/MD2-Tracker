import { describe, it, expect } from 'vitest';
import { clampWound, distributeMob } from '../src/services/wounds.service.js';

function members(...wounds) {
  return wounds.map((w, i) => ({ id: `m${i}`, wounds: w }));
}

describe('clampWound', () => {
  it('clamps wound at healthMax', () => {
    expect(clampWound(3, 4, 5, 'wound')).toBe(4);
  });
  it('clamps heal at zero', () => {
    expect(clampWound(2, 10, 5, 'heal')).toBe(0);
  });
});

describe('distributeMob wound mode', () => {
  it('fills members in order up to their remaining capacity', () => {
    const group = members(0, 0, 0);
    const changed = distributeMob(group, 4, 6, 'wound');
    expect(group.map((m) => m.wounds)).toEqual([4, 2, 0]);
    expect(changed.get('m0')).toBe(4);
    expect(changed.get('m1')).toBe(2);
    expect(changed.has('m2')).toBe(false);
  });

  it('drops overkill spillover once every member is at max', () => {
    const group = members(3, 3); // healthMax 4, 1 capacity left each
    const changed = distributeMob(group, 4, 10, 'wound');
    expect(group.map((m) => m.wounds)).toEqual([4, 4]);
    expect([...changed.values()]).toEqual([4, 4]);
  });

  it('is a no-op on an all-dead group', () => {
    const group = members(4, 4);
    const changed = distributeMob(group, 4, 5, 'wound');
    expect(group.map((m) => m.wounds)).toEqual([4, 4]);
    expect(changed.size).toBe(0);
  });

  it('handles a leader-only group with zero minions', () => {
    const group = [{ id: 'leader', wounds: 0 }];
    const changed = distributeMob(group, 10, 3, 'wound');
    expect(group[0].wounds).toBe(3);
    expect(changed.get('leader')).toBe(3);
  });
});

describe('distributeMob heal mode', () => {
  it('heals the most-wounded member first', () => {
    const group = members(5, 2, 0);
    const changed = distributeMob(group, 10, 3, 'heal');
    expect(group.map((m) => m.wounds)).toEqual([2, 2, 0]);
    expect(changed.get('m0')).toBe(2);
    expect(changed.has('m1')).toBe(false);
  });

  it('clamps over-heal at zero and skips already-healthy members', () => {
    const group = members(1, 0);
    const changed = distributeMob(group, 10, 5, 'heal');
    expect(group.map((m) => m.wounds)).toEqual([0, 0]);
    expect(changed.get('m0')).toBe(0);
    expect(changed.has('m1')).toBe(false);
  });

  it('is a no-op when nobody has wounds', () => {
    const group = members(0, 0);
    const changed = distributeMob(group, 10, 5, 'heal');
    expect(changed.size).toBe(0);
  });
});
