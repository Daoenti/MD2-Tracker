export const shorthands = undefined;

export const up = (pgm) => {
  pgm.createTable('units', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    encounter_id: {
      type: 'uuid',
      notNull: true,
      references: '"encounters"',
      onDelete: 'CASCADE',
    },
    kind: { type: 'text', notNull: true },
    name: { type: 'text', notNull: true },
    level: { type: 'text' },
    health_max: { type: 'integer', notNull: true },
    wounds: { type: 'integer', notNull: true, default: 0 },
    leader_wounds: { type: 'integer' },
    boss_track_pos: { type: 'integer' },
    boss_track_max: { type: 'integer' },
    notes: { type: 'text', notNull: true, default: '' },
    show_notes: { type: 'boolean', notNull: true, default: false },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.addConstraint('units', 'units_kind_valid', "CHECK (kind IN ('mob', 'roaming', 'boss'))");
  pgm.createIndex('units', 'encounter_id');
};

export const down = (pgm) => {
  pgm.dropTable('units');
};
