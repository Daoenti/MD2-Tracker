export const shorthands = undefined;

export const up = (pgm) => {
  pgm.createTable('enemy_templates', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    kind: { type: 'text', notNull: true },
    name: { type: 'text', notNull: true },
    level: { type: 'text' },
    health_max: { type: 'integer', notNull: true },
    minion_count: { type: 'integer' },
    boss_track_max: { type: 'integer' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.addConstraint('enemy_templates', 'enemy_templates_kind_valid', "CHECK (kind IN ('mob', 'roaming', 'boss'))");
  pgm.addConstraint('enemy_templates', 'enemy_templates_kind_name_unique', 'UNIQUE (kind, name)');
};

export const down = (pgm) => {
  pgm.dropTable('enemy_templates');
};
