export const shorthands = undefined;

export const up = (pgm) => {
  pgm.createTable('minions', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    unit_id: {
      type: 'uuid',
      notNull: true,
      references: '"units"',
      onDelete: 'CASCADE',
    },
    wounds: { type: 'integer', notNull: true, default: 0 },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.createIndex('minions', 'unit_id');
};

export const down = (pgm) => {
  pgm.dropTable('minions');
};
