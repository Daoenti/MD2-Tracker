export const shorthands = undefined;

export const up = (pgm) => {
  pgm.addColumn('users', {
    is_admin: { type: 'boolean', notNull: true, default: false },
  });

  // Grandfather in every pre-existing account as admin — today that's just the one
  // owner account created via scripts/seed.js, and nobody should get locked out post-deploy.
  pgm.sql('UPDATE users SET is_admin = true');
};

export const down = (pgm) => {
  pgm.dropColumn('users', 'is_admin');
};
