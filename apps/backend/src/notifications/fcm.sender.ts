import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { env } from '../config/env.js';
import { prisma } from '../config/prisma.js';
import type { ChannelSender } from '../jobs/notification.worker.js';

function messaging() {
  if (!env.FCM_ENABLED || !env.FIREBASE_PROJECT_ID || !env.FIREBASE_CLIENT_EMAIL || !env.FIREBASE_PRIVATE_KEY) throw new Error('FCM_NOT_CONFIGURED');
  const app = getApps()[0] ?? initializeApp({ credential: cert({ projectId: env.FIREBASE_PROJECT_ID, clientEmail: env.FIREBASE_CLIENT_EMAIL, privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') }) });
  return getMessaging(app);
}

export const fcmSender: ChannelSender = {
  async send(userId, payload) {
    const devices = await prisma.deviceToken.findMany({ where: { userId, active: true }, select: { token: true } });
    if (!devices.length) return;
    const result = await messaging().sendEachForMulticast({ tokens: devices.map(device => device.token), notification: { title: String(payload.title ?? 'HOUSE HELP'), body: String(payload.body ?? '') }, data: Object.fromEntries(Object.entries((payload.data as Record<string, unknown>) ?? {}).map(([key, value]) => [key, String(value)])) });
    await Promise.all(result.responses.map((response, index) => response.success ? Promise.resolve() : prisma.deviceToken.update({ where: { token: devices[index]!.token }, data: { active: false } })));
  },
};
