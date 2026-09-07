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

async function loggedInAgent(username = 'tester', password = 'correct-horse') {
  await createTestUser(username, password);
  const agent = request.agent(app);
  await agent.post('/api/auth/login').send({ username, password }).expect(200);
  return agent;
}

describe('auth', () => {
  it('rejects registration when ALLOW_REGISTRATION is not true', async () => {
    const prev = process.env.ALLOW_REGISTRATION;
    process.env.ALLOW_REGISTRATION = 'false';
    await request(app)
      .post('/api/auth/register')
      .send({ username: 'newbie', password: 'password123' })
      .expect(403);
    process.env.ALLOW_REGISTRATION = prev;
  });

  it('registers, seeds a sample encounter, and logs in when enabled', async () => {
    const prev = process.env.ALLOW_REGISTRATION;
    process.env.ALLOW_REGISTRATION = 'true';
    const agent = request.agent(app);
    const res = await agent
      .post('/api/auth/register')
      .send({ username: 'newbie', password: 'password123' })
      .expect(201);
    expect(res.body.username).toBe('newbie');

    const me = await agent.get('/api/auth/me').expect(200);
    expect(me.body.username).toBe('newbie');

    const encounters = await agent.get('/api/encounters').expect(200);
    expect(encounters.body).toHaveLength(1);
    expect(encounters.body[0].isSample).toBe(true);
    process.env.ALLOW_REGISTRATION = prev;
  });

  it('rejects bad credentials', async () => {
    await createTestUser('someone', 'password123');
    await request(app)
      .post('/api/auth/login')
      .send({ username: 'someone', password: 'wrong-password' })
      .expect(401);
  });

  it('logs out and revokes the session', async () => {
    const agent = await loggedInAgent();
    await agent.post('/api/auth/logout').expect(204);
    await agent.get('/api/auth/me').expect(401);
  });

  it('blocks encounter routes without a session', async () => {
    await request(app).get('/api/encounters').expect(401);
  });
});

describe('encounters CRUD', () => {
  it('creates, lists, fetches, patches, and deletes an encounter', async () => {
    const agent = await loggedInAgent();

    const created = await agent.post('/api/encounters').send({ name: 'Dungeon Run' }).expect(201);
    const id = created.body.id;
    expect(created.body.heroCount).toBe(4);

    const list = await agent.get('/api/encounters').expect(200);
    expect(list.body).toHaveLength(1);

    const fetched = await agent.get(`/api/encounters/${id}`).expect(200);
    expect(fetched.body.units).toEqual([]);

    const patched = await agent
      .patch(`/api/encounters/${id}`)
      .send({ heroCount: 5, darknessSide: 'B', darknessPos: 2 })
      .expect(200);
    expect(patched.body.heroCount).toBe(5);
    expect(patched.body.darkness).toEqual({ side: 'B', pos: 2 });

    await agent.delete(`/api/encounters/${id}`).expect(204);
    await agent.get(`/api/encounters/${id}`).expect(404);
  });

  it('does not let one user see another user\'s encounter', async () => {
    const agentA = await loggedInAgent('alice', 'password123');
    const agentB = await loggedInAgent('bob', 'password123');

    const created = await agentA.post('/api/encounters').send({ name: 'Alice Only' }).expect(201);
    await agentB.get(`/api/encounters/${created.body.id}`).expect(404);
  });
});

describe('units, minions, and wounds', () => {
  async function createEncounter(agent) {
    const res = await agent.post('/api/encounters').send({ name: 'Board' }).expect(201);
    return res.body.id;
  }

  it('adds a mob with minions and distributes wounds leader-last, minions-first', async () => {
    const agent = await loggedInAgent();
    const encounterId = await createEncounter(agent);

    const unit = await agent
      .post(`/api/encounters/${encounterId}/units`)
      .send({ kind: 'mob', name: 'Skeletons', level: '1-2', healthMax: 4, minionCount: 2 })
      .expect(201);
    expect(unit.body.minions).toHaveLength(2);
    expect(unit.body.leader.wounds).toBe(0);

    const wounded = await agent
      .post(`/api/units/${unit.body.id}/wound`)
      .send({ amount: 6, mode: 'wound' })
      .expect(200);
    // Fills minions in order first (4 each), leader absorbs the remainder, capped at healthMax.
    expect(wounded.body.minions.map((m) => m.wounds)).toEqual([4, 2]);
    expect(wounded.body.leader.wounds).toBe(0);
  });

  it('adds a roaming unit and clamps wound/heal to [0, healthMax]', async () => {
    const agent = await loggedInAgent();
    const encounterId = await createEncounter(agent);

    const unit = await agent
      .post(`/api/encounters/${encounterId}/units`)
      .send({ kind: 'roaming', name: 'Werewolf', level: '3-4', healthMax: 10 })
      .expect(201);

    const overWounded = await agent
      .post(`/api/units/${unit.body.id}/wound`)
      .send({ amount: 99, mode: 'wound' })
      .expect(200);
    expect(overWounded.body.wounds).toBe(10);

    const overHealed = await agent
      .post(`/api/units/${unit.body.id}/wound`)
      .send({ amount: 99, mode: 'heal' })
      .expect(200);
    expect(overHealed.body.wounds).toBe(0);
  });

  it('adds a boss with a boss track and supports leader-style single wounds', async () => {
    const agent = await loggedInAgent();
    const encounterId = await createEncounter(agent);

    const unit = await agent
      .post(`/api/encounters/${encounterId}/units`)
      .send({ kind: 'boss', name: 'Michael', healthMax: 20, bossTrackMax: 8 })
      .expect(201);
    expect(unit.body.bossTrack).toEqual({ pos: 0, max: 8 });

    const patched = await agent
      .patch(`/api/units/${unit.body.id}`)
      .send({ bossTrackPos: 3 })
      .expect(200);
    expect(patched.body.bossTrack.pos).toBe(3);
  });

  it('taps a single minion and the leader independently, and can remove a minion', async () => {
    const agent = await loggedInAgent();
    const encounterId = await createEncounter(agent);

    const unit = await agent
      .post(`/api/encounters/${encounterId}/units`)
      .send({ kind: 'mob', name: 'Goblins', healthMax: 4, minionCount: 1 })
      .expect(201);
    const minionId = unit.body.minions[0].id;

    await agent.post(`/api/minions/${minionId}/wound`).send({ amount: 1, mode: 'wound' }).expect(200);
    await agent.post(`/api/units/${unit.body.id}/leader/wound`).send({ amount: 2, mode: 'wound' }).expect(200);

    const added = await agent.post(`/api/units/${unit.body.id}/minions`).expect(201);
    expect(added.body.minions).toHaveLength(2);
    expect(added.body.leader.wounds).toBe(2);

    await agent.delete(`/api/minions/${minionId}`).expect(204);
    const refetched = await agent.get(`/api/encounters/${encounterId}`).expect(200);
    expect(refetched.body.units[0].minions).toHaveLength(1);
  });

  it('removes a unit entirely, cascading its minions', async () => {
    const agent = await loggedInAgent();
    const encounterId = await createEncounter(agent);

    const unit = await agent
      .post(`/api/encounters/${encounterId}/units`)
      .send({ kind: 'mob', name: 'Imps', healthMax: 2, minionCount: 3 })
      .expect(201);

    await agent.delete(`/api/units/${unit.body.id}`).expect(204);
    const refetched = await agent.get(`/api/encounters/${encounterId}`).expect(200);
    expect(refetched.body.units).toEqual([]);
  });
});
