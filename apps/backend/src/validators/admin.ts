import { z } from 'zod';

const couponBaseSchema = z.object({
  code: z.string().regex(/^[A-Z0-9_-]{4,30}$/i),
  discountType: z.enum(['FIXED', 'PERCENTAGE']),
  discountValue: z.number().positive(),
  minimumAmount: z.number().min(0).default(0),
  maximumDiscount: z.number().positive().optional(),
  startDate: z.coerce.date(),
  expiryDate: z.coerce.date(),
  usageLimit: z.number().int().positive().optional(),
  active: z.boolean().default(true),
});
const datesAreValid = (value: { startDate?: Date; expiryDate?: Date }) =>
  !value.startDate || !value.expiryDate || value.expiryDate > value.startDate;
export const couponSchema = couponBaseSchema.refine(datesAreValid, 'Expiry must follow start');
export const couponUpdateSchema = couponBaseSchema.partial().refine(datesAreValid, 'Expiry must follow start');
export const commissionSchema = z.object({ providerPercent: z.number().min(1).max(100), effectiveFrom: z.coerce.date() });
export const ticketSchema = z.object({ bookingId: z.string().optional(), type: z.enum(['BOOKING_ISSUE','PAYMENT_ISSUE','PROVIDER_ISSUE','SERVICE_QUALITY','REFUND','OTHER']), subject: z.string().min(4).max(120), description: z.string().min(10).max(2000) });
export const messageSchema = z.object({ body: z.string().min(1).max(2000), internal: z.boolean().default(false) });
export const ticketStatusSchema = z.object({ status: z.enum(['OPEN','IN_PROGRESS','RESOLVED','CLOSED']), assignedAdminId: z.string().nullable().optional() });
