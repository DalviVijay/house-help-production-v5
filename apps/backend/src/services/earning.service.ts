import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';

export function splitCommission(gross: number, providerPercent: number) {
  if (gross < 0 || providerPercent < 0 || providerPercent > 100)
    throw new Error('INVALID_COMMISSION');
  const provider = Math.round(gross * providerPercent) / 100;
  return {
    providerAmount: provider,
    platformAmount: Math.round((gross - provider) * 100) / 100,
  };
}

export async function createEarning(
  tx: Prisma.TransactionClient,
  bookingId: string,
  providerId: string,
  gross: Prisma.Decimal,
) {
  const config = await tx.commissionConfig.findFirst({
    where: { active: true, effectiveFrom: { lte: new Date() } },
    orderBy: { effectiveFrom: 'desc' },
  });
  const percent = Number(config?.providerPercent ?? env.DEFAULT_PROVIDER_COMMISSION_PERCENT);
  const split = splitCommission(Number(gross), percent);
  return tx.providerEarning.upsert({
    where: { bookingId },
    update: {},
    create: {
      bookingId,
      providerId,
      grossAmount: gross,
      commissionPercent: percent,
      providerAmount: split.providerAmount,
      platformAmount: split.platformAmount,
      status: 'AVAILABLE',
      availableAt: new Date(),
    },
  });
}

export async function summary(providerId: string) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const week = new Date(today);
  week.setDate(today.getDate() - today.getDay());
  const month = new Date(now.getFullYear(), now.getMonth(), 1);

  const sums = await Promise.all(
    [today, week, month].map((from) =>
      prisma.providerEarning.aggregate({
        where: {
          providerId,
          createdAt: { gte: from },
          status: { in: ['AVAILABLE', 'PAID'] },
        },
        _sum: { providerAmount: true },
      }),
    ),
  );
  return {
    today: Number(sums[0]?._sum.providerAmount ?? 0),
    week: Number(sums[1]?._sum.providerAmount ?? 0),
    month: Number(sums[2]?._sum.providerAmount ?? 0),
  };
}
