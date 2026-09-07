export const shorthands = undefined;

export const up = (pgm) => {
  pgm.createTable('encounters', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    user_id: {
      type: 'uuid',
      notNull: true,
      references: '"users"',
      onDelete: 'CASCADE',
    },
    name: { type: 'text', notNull: true },
    hero_count: { type: 'integer', notNull: true, default: 4 },
    darkness_side: { type: 'text', notNull: true, default: 'A' },
    darkness_pos: { type: 'integer', notNull: true, default: 1 },
    is_sample: { type: 'boolean', notNull: true, default: false },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.addConstraint('encounters', 'encounters_hero_count_range', 'CHECK (hero_count BETWEEN 1 AND 6)');
  pgm.addConstraint('encounters', 'encounters_darkness_side_valid', "CHECK (darkness_side IN ('A', 'B'))");
  pgm.createIndex('encounters', 'user_id');
};

export const down = (pgm) => {
  pgm.dropTable('encounters');
};
