import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validateBody } from '../middleware/validate.js';
import { HttpError } from '../middleware/errorHandler.js';
import { woundSchema } from '../validation/units.schema.js';
import * as minionsRepo from '../repositories/minions.repo.js';
import { clampWound } from '../services/wounds.service.js';

export const minionsRouter = Router();

minionsRouter.use(requireAuth);

async function loadOwnedMinion(req) {
  const minion = await minionsRepo.findByIdWithOwner(req.params.id);
  if (!minion || minion.ownerId !== req.session.userId) {
    throw new HttpError(404, 'Minion not found');
  }
  return minion;
}

minionsRouter.post(
  '/:id/wound',
  validateBody(woundSchema),
  asyncHandler(async (req, res) => {
    const minion = await loadOwnedMinion(req);
    const { amount, mode } = req.body;
    const wounds = clampWound(minion.wounds, minion.unitHealthMax, amount, mode);
    const updated = await minionsRepo.updateWounds(minion.id, wounds);
    res.json({ id: updated.id, wounds: updated.wounds });
  }),
);

minionsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await loadOwnedMinion(req);
    await minionsRepo.remove(req.params.id);
    res.status(204).end();
  }),
);
