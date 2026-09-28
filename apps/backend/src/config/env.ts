import { z } from 'zod';

const booleanFromEnv = z.preprocess((value) => {
  if (typeof value !== 'string') return value;
  const normalized = value.trim().toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
  if (['false', '0', 'no', 'off', ''].includes(normalized)) return false;
  return value;
}, z.boolean());

const optionalEmail = z.preprocess((value) => value === '' ? undefined : value, z.string().email().optional());

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  REFRESH_TOKEN_SECRET: z.string().min(32),
  OTP_PEPPER: z.string().min(8),
  SMS_PROVIDER: z.enum(['console', 'msg91']).default('console'),
  MSG91_AUTH_KEY: z.string().optional(),
  MSG91_TEMPLATE_ID: z.string().optional(),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  PAYMENT_GATEWAY: z.enum(['razorpay']).default('razorpay'),
  PAYMENT_API_KEY: z.string().optional(),
  PAYMENT_SECRET: z.string().optional(),
  PAYMENT_WEBHOOK_SECRET: z.string().optional(),
  INVOICE_PREFIX: z.string().default('HHINV'),
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: optionalEmail,
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  FCM_ENABLED: booleanFromEnv.default(false),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().default('ap-south-1'),
  DATA_ENCRYPTION_KEY: z.string().optional(),
  DEFAULT_PROVIDER_COMMISSION_PERCENT: z.coerce.number().min(1).max(100).default(80),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  GOOGLE_MAPS_SERVER_API_KEY: z.string().optional(),
  LOCATION_UPDATE_MIN_INTERVAL_SECONDS: z.coerce.number().int().min(3).default(5),
  LOCATION_RETENTION_DAYS: z.coerce.number().int().min(1).default(30),
  METRICS_TOKEN: z.string().optional(),
  APP_VERSION: z.string().default('dev'),
  GIT_SHA: z.string().default('unknown'),
}).superRefine((value, ctx) => {
  const requireValue = (key: keyof typeof value, message: string) => {
    if (!value[key]) ctx.addIssue({ code: z.ZodIssueCode.custom, path: [key], message });
  };

  if (value.NODE_ENV === 'production') {
    requireValue('PAYMENT_API_KEY', 'Required in production');
    requireValue('PAYMENT_SECRET', 'Required in production');
    requireValue('PAYMENT_WEBHOOK_SECRET', 'Required in production');
    requireValue('DATA_ENCRYPTION_KEY', 'Required in production');
    requireValue('METRICS_TOKEN', 'Required in production');
    if(value.SMS_PROVIDER!=='msg91')ctx.addIssue({code:z.ZodIssueCode.custom,path:['SMS_PROVIDER'],message:'Production SMS provider required'});
    requireValue('MSG91_AUTH_KEY', 'Required in production');
    requireValue('MSG91_TEMPLATE_ID', 'Required in production');

    for (const origin of value.CORS_ORIGINS.split(',').map((item) => item.trim())) {
      if (!origin.startsWith('https://')) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['CORS_ORIGINS'], message: 'Production origins must use HTTPS' });
      }
    }
  }

  if (value.FCM_ENABLED) {
    requireValue('FIREBASE_PROJECT_ID', 'Required when FCM is enabled');
    requireValue('FIREBASE_CLIENT_EMAIL', 'Required when FCM is enabled');
    requireValue('FIREBASE_PRIVATE_KEY', 'Required when FCM is enabled');
  }
});

export const env = schema.parse(process.env);
