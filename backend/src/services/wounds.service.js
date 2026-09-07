// Server-authoritative port of the original client's distributeMob() and wound clamping,
// so the DB can never end up in a state the client-side rules wouldn't have allowed.

export function clampWound(current, healthMax, amount, mode) {
  if (mode === 'wound') return Math.min(healthMax, current + amount);
  return Math.max(0, current - amount);
}

// members: array of { id, wounds }, pre-ordered minions-first with the leader last
// (matches the original: minions in insertion order, leader appended at the end).
// Returns a Map of id -> new wounds for every member whose value changed.
export function distributeMob(members, healthMax, amount, mode) {
  const order = mode === 'heal' ? [...members].sort((a, b) => b.wounds - a.wounds) : members;

  let remaining = amount;
  const changed = new Map();

  for (const member of order) {
    if (remaining <= 0) break;

    if (mode === 'wound') {
      const capacity = healthMax - member.wounds;
      if (capacity <= 0) continue;
      const apply = Math.min(capacity, remaining);
      member.wounds += apply;
      remaining -= apply;
    } else {
      const healable = member.wounds;
      if (healable <= 0) continue;
      const apply = Math.min(healable, remaining);
      member.wounds -= apply;
      remaining -= apply;
    }

    changed.set(member.id, member.wounds);
  }

  return changed;
}
