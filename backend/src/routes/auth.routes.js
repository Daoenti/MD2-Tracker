import { Router } from 'express';
import { credentialsSchema } from '../validation/auth.schema.js';
import { validateBody } from '../middleware/validate.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { HttpError } from '../middleware/errorHandler.js';
import * as usersRepo from '../repositories/users.repo.js';
import * as authService from '../services/auth.service.js';

export const authRouter = Router();

function publicUser(user) {
  return { id: user.id, username: user.username };
}

authRouter.post(
  '/register',
  validateBody(credentialsSchema),
  asyncHandler(async (req, res) => {
    if (process.env.ALLOW_REGISTRATION !== 'true') {
      throw new HttpError(403, 'Registration is disabled');
    }
    const user = await authService.registerUser(req.body);
    req.session.userId = user.id;
    res.status(201).json(publicUser(user));
  }),
);

authRouter.post(
  '/login',
  validateBody(credentialsSchema),
  asyncHandler(async (req, res) => {
    const user = await authService.verifyLogin(req.body);
    if (!user) {
      throw new HttpError(401, 'Invalid username or password');
    }
    req.session.userId = user.id;
    res.json(publicUser(user));
  }),
);

authRouter.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.status(204).end();
  });
});

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await usersRepo.findById(req.session.userId);
    if (!user) throw new HttpError(401, 'Not authenticated');
    res.json(publicUser(user));
  }),
);
