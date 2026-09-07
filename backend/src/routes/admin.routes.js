import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validateBody } from '../middleware/validate.js';
import { HttpError } from '../middleware/errorHandler.js';
import { createUserSchema, patchUserSchema } from '../validation/admin.schema.js';
import * as usersRepo from '../repositories/users.repo.js';
import * as authService from '../services/auth.service.js';

export const adminRouter = Router();

adminRouter.use(requireAuth, asyncHandler(requireAdmin));

function publicUser(user) {
  return { id: user.id, username: user.username, isAdmin: user.isAdmin, createdAt: user.createdAt };
}

adminRouter.get(
  '/users',
  asyncHandler(async (req, res) => {
    const users = await usersRepo.listAll();
    res.json(users.map(publicUser));
  }),
);

adminRouter.post(
  '/users',
  validateBody(createUserSchema),
  asyncHandler(async (req, res) => {
    const { username, password, isAdmin } = req.body;
    const user = await authService.createUserWithPassword({ username, password, isAdmin });
    res.status(201).json(publicUser(user));
  }),
);

adminRouter.patch(
  '/users/:id',
  validateBody(patchUserSchema),
  asyncHandler(async (req, res) => {
    if (req.params.id === req.session.userId) {
      throw new HttpError(400, 'Manage your own account from your profile instead');
    }
    let user = await usersRepo.findById(req.params.id);
    if (!user) throw new HttpError(404, 'User not found');

    if (req.body.isAdmin !== undefined) {
      user = await usersRepo.updateIsAdmin(user.id, req.body.isAdmin);
    }
    if (req.body.password !== undefined) {
      const passwordHash = await authService.hashPassword(req.body.password);
      user = await usersRepo.updatePassword(user.id, passwordHash);
    }
    res.json(publicUser(user));
  }),
);

adminRouter.delete(
  '/users/:id',
  asyncHandler(async (req, res) => {
    if (req.params.id === req.session.userId) {
      throw new HttpError(400, 'Manage your own account from your profile instead');
    }
    const user = await usersRepo.findById(req.params.id);
    if (!user) throw new HttpError(404, 'User not found');
    await usersRepo.remove(user.id);
    res.status(204).end();
  }),
);
