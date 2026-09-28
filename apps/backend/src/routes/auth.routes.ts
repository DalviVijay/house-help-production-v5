import { Router } from 'express';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import {
  loginSchema,
  otpSchema,
  registerSchema,
  verifyOtpSchema,
  refreshSchema,
  resetPasswordSchema,
} from '../validators/auth.js';
import * as auth from '../services/auth.service.js';
import { ok, fail } from '../utils/api.js';

export const authRouter = Router();

const otpLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
});

const run =
  (schema: z.ZodTypeAny, fn: (v: unknown) => Promise<unknown>, status = 200) =>
  async (req: any, res: any) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return fail(res, 400, 'Invalid request', 'VALIDATION_ERROR');
    try {
      return ok(res, 'Success', await fn(parsed.data), status);
    } catch (e) {
      const code = e instanceof Error ? e.message : 'AUTH_ERROR';
      const httpStatus = code.startsWith('INVALID') ? 401 : 500;
      return fail(res, httpStatus, 'Authentication failed', code);
    }
  };

const forgotSchema = z.union([
  z.object({ mobile: z.string().regex(/^\+91[6-9]\d{9}$/) }),
  z.object({ email: z.string().email() }),
]);

authRouter.post('/register', run(registerSchema, (v: any) => auth.register(v), 201));
authRouter.post('/login', run(loginSchema, (v: any) => auth.login(v.identity, v.password)));
authRouter.post('/send-otp', otpLimiter, run(otpSchema, (v: any) => auth.requestOtp(v.mobile)));
authRouter.post('/verify-otp', otpLimiter, run(verifyOtpSchema, (v: any) => auth.verifyOtp(v.mobile, v.otp)));
authRouter.post('/forgot-password', run(forgotSchema, (v: any) =>
  'email' in v ? auth.requestPasswordReset(v.email) : Promise.resolve({ accepted: true })
));
authRouter.post('/refresh', run(refreshSchema, (v: any) => auth.refreshSession(v.refreshToken)));
authRouter.post('/logout', run(refreshSchema, (v: any) => auth.logout(v.refreshToken)));
authRouter.post('/reset-password', run(resetPasswordSchema, (v: any) => auth.resetPassword(v.token, v.password)));
