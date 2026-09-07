import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validateBody } from '../middleware/validate.js';
import { HttpError } from '../middleware/errorHandler.js';
import { createEncounterSchema, patchEncounterSchema } from '../validation/encounters.schema.js';
import { createUnitSchema } from '../validation/units.schema.js';
import * as encountersRepo from '../repositories/encounters.repo.js';
import * as unitsRepo from '../repositories/units.repo.js';
import * as minionsRepo from '../repositories/minions.repo.js';
import { serializeEncounterSummary, serializeEncounterDetail, serializeUnit } from '../services/serialize.js';

export const encountersRouter = Router();

encountersRouter.use(requireAuth);

async function loadOwnedEncounter(req) {
  const encounter = await encountersRepo.findByIdAndUser(req.params.id, req.session.userId);
  if (!encounter) throw new HttpError(404, 'Encounter not found');
  return encounter;
}

encountersRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const encounters = await encountersRepo.listByUser(req.session.userId);
    res.json(encounters.map(serializeEncounterSummary));
  }),
);

encountersRouter.post(
  '/',
  validateBody(createEncounterSchema),
  asyncHandler(async (req, res) => {
    const encounter = await encountersRepo.create({ userId: req.session.userId, name: req.body.name });
    res.status(201).json(serializeEncounterSummary(encounter));
  }),
);

encountersRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const encounter = await loadOwnedEncounter(req);
    const units = await unitsRepo.listByEncounter(encounter.id);
    const serializedUnits = await Promise.all(
      units.map(async (unit) => {
        const minions = unit.kind === 'mob' ? await minionsRepo.listByUnit(unit.id) : [];
        return serializeUnit(unit, minions);
      }),
    );
    res.json(serializeEncounterDetail(encounter, serializedUnits));
  }),
);

encountersRouter.patch(
  '/:id',
  validateBody(patchEncounterSchema),
  asyncHandler(async (req, res) => {
    await loadOwnedEncounter(req);
    const encounter = await encountersRepo.update(req.params.id, req.body);
    res.json(serializeEncounterSummary(encounter));
  }),
);

encountersRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await loadOwnedEncounter(req);
    await encountersRepo.remove(req.params.id);
    res.status(204).end();
  }),
);

encountersRouter.post(
  '/:id/units',
  validateBody(createUnitSchema),
  asyncHandler(async (req, res) => {
    const encounter = await loadOwnedEncounter(req);
    const { kind, name, level, healthMax, minionCount, bossTrackMax } = req.body;

    const unit = await unitsRepo.create({
      encounterId: encounter.id,
      kind,
      name,
      level: kind === 'boss' ? null : level,
      healthMax,
      wounds: 0,
      leaderWounds: kind === 'mob' ? 0 : null,
      bossTrackPos: kind === 'boss' ? 0 : null,
      bossTrackMax: kind === 'boss' ? bossTrackMax : null,
    });

    let minions = [];
    if (kind === 'mob') {
      const count = minionCount ?? 0;
      minions = await Promise.all(Array.from({ length: count }, () => minionsRepo.create(unit.id, 0)));
    }

    res.status(201).json(serializeUnit(unit, minions));
  }),
);
