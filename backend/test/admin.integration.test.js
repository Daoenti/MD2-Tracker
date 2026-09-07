import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { resetDb, buildApp, createTestUser, closeDb } from './helpers.js';

const app = buildApp();

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await closeDb();
});

async function loggedInAgent(username, password = 'correct-horse', isAdmin = false) {
  await createTestUser(username, password, isAdmin);
  const agent = request.agent(app);
  await agent.post('/api/auth/login').send({ username, password }).expect(200);
  return agent;
}

describe('admin access control', () => {
  it('rejects a non-admin on every admin/mutation route', async () => {
    const nonAdmin = await loggedInAgent('regular', 'password123', false);

    await nonAdmin.get('/api/admin/users').expect(403);
    await nonAdmin.post('/api/admin/users').send({ username: 'x', password: 'password123' }).expect(403);
    await nonAdmin
      .post('/api/enemy-templates')
      .send({ kind: 'roaming', name: 'Test Denied', healthMax: 10 })
      .expect(403);
  });

  it('lets any authenticated user read the enemy template catalog', async () => {
    const nonAdmin = await loggedInAgent('regular2', 'password123', false);
    const res = await nonAdmin.get('/api/enemy-templates').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0); // seeded by migration
  });
});

describe('admin user management', () => {
  it('creates a user bypassing ALLOW_REGISTRATION, then lists and deletes them', async () => {
    const prev = process.env.ALLOW_REGISTRATION;
    process.env.ALLOW_REGISTRATION = 'false';
    const admin = await loggedInAgent('boss', 'password123', true);

    const created = await admin
      .post('/api/admin/users')
      .send({ username: 'sidekick', password: 'password123' })
      .expect(201);
    expect(created.body.isAdmin).toBe(false);

    const list = await admin.get('/api/admin/users').expect(200);
    expect(list.body.map((u) => u.username)).toEqual(expect.arrayContaining(['boss', 'sidekick']));

    await admin.delete(`/api/admin/users/${created.body.id}`).expect(204);
    const afterDelete = await admin.get('/api/admin/users').expect(200);
    expect(afterDelete.body.map((u) => u.username)).not.toContain('sidekick');

    process.env.ALLOW_REGISTRATION = prev;
  });

  it('promotes a user to admin and resets their password via PATCH', async () => {
    const admin = await loggedInAgent('boss2', 'password123', true);
    const created = await admin
      .post('/api/admin/users')
      .send({ username: 'sidekick2', password: 'password123' })
      .expect(201);

    const patched = await admin
      .patch(`/api/admin/users/${created.body.id}`)
      .send({ isAdmin: true, password: 'new-password-1' })
      .expect(200);
    expect(patched.body.isAdmin).toBe(true);

    const otherAgent = request.agent(app);
    await otherAgent.post('/api/auth/login').send({ username: 'sidekick2', password: 'new-password-1' }).expect(200);
  });

  it('refuses to let an admin patch or delete their own account via the admin routes', async () => {
    const admin = await loggedInAgent('boss3', 'password123', true);
    const me = await admin.get('/api/auth/me').expect(200);

    await admin.patch(`/api/admin/users/${me.body.id}`).send({ isAdmin: false }).expect(400);
    await admin.delete(`/api/admin/users/${me.body.id}`).expect(400);
  });
});

describe('enemy template management', () => {
  it('creates, patches, and deletes a template as admin', async () => {
    const admin = await loggedInAgent('curator', 'password123', true);

    const created = await admin
      .post('/api/enemy-templates')
      .send({ kind: 'roaming', name: 'Integration Test Wolf', level: '3-4', healthMax: 12 })
      .expect(201);
    expect(created.body.healthMax).toBe(12);

    const patched = await admin
      .patch(`/api/enemy-templates/${created.body.id}`)
      .send({ healthMax: 15 })
      .expect(200);
    expect(patched.body.healthMax).toBe(15);

    await admin.delete(`/api/enemy-templates/${created.body.id}`).expect(204);
  });

  it('requires bossTrackMax for boss templates', async () => {
    const admin = await loggedInAgent('curator2', 'password123', true);
    await admin
      .post('/api/enemy-templates')
      .send({ kind: 'boss', name: 'Incomplete Boss', healthMax: 20 })
      .expect(400);
  });

  it('rejects a duplicate (kind, name) with a clean 409', async () => {
    const admin = await loggedInAgent('curator3', 'password123', true);
    const payload = { kind: 'mob', name: 'Integration Test Duplicate Mob', healthMax: 4 };
    const created = await admin.post('/api/enemy-templates').send(payload).expect(201);
    const res = await admin.post('/api/enemy-templates').send(payload).expect(409);
    expect(res.body.error).toMatch(/already exists/);
    // enemy_templates is global reference data (see helpers.js) and not reset between tests,
    // so clean up explicitly to keep repeated local runs against a persistent DB idempotent.
    await admin.delete(`/api/enemy-templates/${created.body.id}`).expect(204);
  });
});

describe('self-service password change', () => {
  it('rejects the wrong current password', async () => {
    const agent = await loggedInAgent('changer1', 'password123');
    await agent
      .patch('/api/auth/me/password')
      .send({ currentPassword: 'wrong-password', newPassword: 'brand-new-pass' })
      .expect(400);
  });

  it('accepts the right current password and the new one works on next login', async () => {
    const agent = await loggedInAgent('changer2', 'password123');
    await agent
      .patch('/api/auth/me/password')
      .send({ currentPassword: 'password123', newPassword: 'brand-new-pass' })
      .expect(204);

    const freshAgent = request.agent(app);
    await freshAgent
      .post('/api/auth/login')
      .send({ username: 'changer2', password: 'brand-new-pass' })
      .expect(200);
  });
});
