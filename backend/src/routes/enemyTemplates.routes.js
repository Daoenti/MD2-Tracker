import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validateBody } from '../middleware/validate.js';
import { HttpError } from '../middleware/errorHandler.js';
import { createTemplateSchema, patchTemplateSchema } from '../validation/enemyTemplates.schema.js';
import * as enemyTemplatesRepo from '../repositories/enemyTemplates.repo.js';

export const enemyTemplatesRouter = Router();

enemyTemplatesRouter.use(requireAuth);

function serializeTemplate(t) {
  return {
    id: t.id,
    kind: t.kind,
    name: t.name,
    level: t.level || undefined,
    healthMax: t.healthMax,
    minionCount: t.minionCount ?? undefined,
    bossTrackMax: t.bossTrackMax ?? undefined,
  };
}

enemyTemplatesRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const templates = await enemyTemplatesRepo.listAll();
    res.json(templates.map(serializeTemplate));
  }),
);

enemyTemplatesRouter.post(
  '/',
  asyncHandler(requireAdmin),
  validateBody(createTemplateSchema),
  asyncHandler(async (req, res) => {
    const template = await enemyTemplatesRepo.create(req.body);
    res.status(201).json(serializeTemplate(template));
  }),
);

enemyTemplatesRouter.patch(
  '/:id',
  asyncHandler(requireAdmin),
  validateBody(patchTemplateSchema),
  asyncHandler(async (req, res) => {
    const existing = await enemyTemplatesRepo.findById(req.params.id);
    if (!existing) throw new HttpError(404, 'Enemy template not found');
    const template = await enemyTemplatesRepo.update(req.params.id, req.body);
    res.json(serializeTemplate(template));
  }),
);

enemyTemplatesRouter.delete(
  '/:id',
  asyncHandler(requireAdmin),
  asyncHandler(async (req, res) => {
    const existing = await enemyTemplatesRepo.findById(req.params.id);
    if (!existing) throw new HttpError(404, 'Enemy template not found');
    await enemyTemplatesRepo.remove(req.params.id);
    res.status(204).end();
  }),
);
