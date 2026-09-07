import * as usersRepo from '../repositories/users.repo.js';
import { HttpError } from './errorHandler.js';

// Re-fetches from the DB rather than trusting the session, so a demotion takes effect
// on the admin's very next request instead of lingering until they log back in.
export async function requireAdmin(req, res, next) {
  const user = await usersRepo.findById(req.session.userId);
  if (!user || !user.isAdmin) {
    throw new HttpError(403, 'Admin access required');
  }
  next();
}
