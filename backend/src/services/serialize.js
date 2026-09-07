export function serializeUnit(unit, minions = []) {
  const base = {
    id: unit.id,
    kind: unit.kind,
    name: unit.name,
    level: unit.level || undefined,
    healthMax: unit.healthMax,
    notes: unit.notes,
    showNotes: unit.showNotes,
  };

  if (unit.kind === 'mob') {
    return {
      ...base,
      leader: { wounds: unit.leaderWounds },
      minions: minions.map((m) => ({ id: m.id, wounds: m.wounds })),
    };
  }

  if (unit.kind === 'boss') {
    return {
      ...base,
      wounds: unit.wounds,
      bossTrack: { pos: unit.bossTrackPos, max: unit.bossTrackMax },
    };
  }

  return { ...base, wounds: unit.wounds };
}

export function serializeEncounterSummary(encounter) {
  return {
    id: encounter.id,
    name: encounter.name,
    heroCount: encounter.heroCount,
    darkness: { side: encounter.darknessSide, pos: encounter.darknessPos },
    isSample: encounter.isSample,
    createdAt: encounter.createdAt,
    updatedAt: encounter.updatedAt,
  };
}

export function serializeEncounterDetail(encounter, units) {
  return { ...serializeEncounterSummary(encounter), units };
}
