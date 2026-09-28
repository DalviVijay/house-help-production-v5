import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { deleteAccount } from '../services/account.service.js';
import { ok, fail } from '../utils/api.js';
export const accountRouter = Router();
accountRouter.use(authenticate, authorize('CUSTOMER', 'PROVIDER'));
accountRouter.delete('/', async (req, res) => {
  try { return ok(res, 'Account deleted', await deleteAccount(req.actor!.userId)); }
  catch (error) {
    const code = error instanceof Error ? error.message : 'ACCOUNT_DELETE_FAILED';
    return fail(res, code === 'ACTIVE_BOOKINGS_EXIST' ? 409 : 400, code === 'ACTIVE_BOOKINGS_EXIST' ? 'Complete or cancel active bookings first' : 'Unable to delete account', code);
  }
});
