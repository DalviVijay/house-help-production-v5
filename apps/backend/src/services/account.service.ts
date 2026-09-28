import { prisma } from '../config/prisma.js';

const activeStatuses = ['PENDING','CONFIRMED','PROVIDER_ASSIGNED','PROVIDER_ON_THE_WAY','ARRIVED','IN_PROGRESS'] as const;

export async function deleteAccount(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, status: true } });
  if (!user) throw Error('USER_NOT_FOUND');
  if (user.status === 'DELETED') return { deleted: true };
  const activeBookings = await prisma.booking.count({
    where: {
      bookingStatus: { in: [...activeStatuses] },
      OR: [{ customer: { is: { userId } } }, { provider: { is: { userId } } }],
    },
  });
  if (activeBookings > 0) throw Error('ACTIVE_BOOKINGS_EXIST');
  await prisma.$transaction(async (tx) => {
    await tx.refreshToken.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
    await tx.deviceToken.deleteMany({ where: { userId } });
    await tx.notification.deleteMany({ where: { userId } });
    await tx.provider.updateMany({ where: { userId }, data: { verificationStatus: 'SUSPENDED', workingAreas: [] } });
    await tx.user.update({
      where: { id: userId },
      data: {
        name: 'Deleted user',
        email: `deleted-${userId}@deleted.invalid`,
        mobile: null,
        passwordHash: null,
        profilePhoto: null,
        status: 'DELETED',
      },
    });
    await tx.auditLog.create({ data: { actorId: userId, action: 'ACCOUNT_DELETED', entityType: 'User', entityId: userId } });
  });
  return { deleted: true };
}
