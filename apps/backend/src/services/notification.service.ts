import type { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma.js';

type NotificationData = Prisma.InputJsonObject;
type NotificationChannel = 'PUSH' | 'EMAIL' | 'SMS' | 'IN_APP';

export async function notify(input: {
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: NotificationData;
  channels?: NotificationChannel[];
}) {
  return prisma.$transaction(async (transaction) => {
    const data: NotificationData = input.data ?? {};
    const notification = await transaction.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body,
        data,
      },
    });

    const payload: Prisma.InputJsonObject = {
      title: input.title,
      body: input.body,
      data,
    };

    for (const channel of input.channels ?? ['IN_APP', 'PUSH']) {
      await transaction.outboxMessage.create({
        data: {
          notificationId: notification.id,
          channel,
          recipient: input.userId,
          templateKey: input.type,
          payload,
        },
      });
    }

    return notification;
  });
}
