import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validateBody } from '../middleware/validate.js';
import { HttpError } from '../middleware/errorHandler.js';
import { patchUnitSchema, woundSchema } from '../validation/units.schema.js';
import * as unitsRepo from '../repositories/units.repo.js';
import * as minionsRepo from '../repositories/minions.repo.js';
import { clampWound, distributeMob } from '../services/wounds.service.js';
import { serializeUnit } from '../services/serialize.js';

export const unitsRouter = Router();

unitsRouter.use(requireAuth);

async function loadOwnedUnit(req) {
  const unit = await unitsRepo.findByIdWithOwner(req.params.id);
  if (!unit || unit.ownerId !== req.session.userId) {
    throw new HttpError(404, 'Unit not found');
  }
  return unit;
}

unitsRouter.patch(
  '/:id',
  validateBody(patchUnitSchema),
  asyncHandler(async (req, res) => {
    await loadOwnedUnit(req);
    const unit = await unitsRepo.update(req.params.id, req.body);
    const minions = unit.kind === 'mob' ? await minionsRepo.listByUnit(unit.id) : [];
    res.json(serializeUnit(unit, minions));
  }),
);

unitsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await loadOwnedUnit(req);
    await unitsRepo.remove(req.params.id);
    res.status(204).end();
  }),
);

unitsRouter.post(
  '/:id/wound',
  validateBody(woundSchema),
  asyncHandler(async (req, res) => {
    const unit = await loadOwnedUnit(req);
    const { amount, mode } = req.body;

    if (unit.kind === 'mob') {
      const minions = await minionsRepo.listByUnit(unit.id);
      const members = [
        ...minions.map((m) => ({ id: m.id, wounds: m.wounds, isLeader: false })),
        { id: 'leader', wounds: unit.leaderWounds, isLeader: true },
      ];
      const changed = distributeMob(members, unit.healthMax, amount, mode);
      for (const [id, wounds] of changed) {
        if (id === 'leader') await unitsRepo.updateLeaderWounds(unit.id, wounds);
        else await minionsRepo.updateWounds(id, wounds);
      }
      const freshUnit = await unitsRepo.findById(unit.id);
      const freshMinions = await minionsRepo.listByUnit(unit.id);
      return res.json(serializeUnit(freshUnit, freshMinions));
    }

    const wounds = clampWound(unit.wounds, unit.healthMax, amount, mode);
    const updated = await unitsRepo.updateWounds(unit.id, wounds);
    res.json(serializeUnit(updated));
  }),
);

unitsRouter.post(
  '/:id/leader/wound',
  validateBody(woundSchema),
  asyncHandler(async (req, res) => {
    const unit = await loadOwnedUnit(req);
    if (unit.kind !== 'mob') {
      throw new HttpError(400, 'Only mob units have a leader');
    }
    const { amount, mode } = req.body;
    const wounds = clampWound(unit.leaderWounds, unit.healthMax, amount, mode);
    const updated = await unitsRepo.updateLeaderWounds(unit.id, wounds);
    const minions = await minionsRepo.listByUnit(unit.id);
    res.json(serializeUnit(updated, minions));
  }),
);

unitsRouter.post(
  '/:id/minions',
  asyncHandler(async (req, res) => {
    const unit = await loadOwnedUnit(req);
    if (unit.kind !== 'mob') {
      throw new HttpError(400, 'Only mob units have minions');
    }
    await minionsRepo.create(unit.id, 0);
    const minions = await minionsRepo.listByUnit(unit.id);
    res.status(201).json(serializeUnit(unit, minions));
  }),
);
