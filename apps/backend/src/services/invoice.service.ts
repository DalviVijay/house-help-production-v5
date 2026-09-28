import PDFDocument from 'pdfkit';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';

export async function ensureInvoice(bookingId: string) {
  const existing = await prisma.invoice.findUnique({ where: { bookingId } });
  if (existing) return existing;
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking || booking.paymentStatus !== 'PAID') throw new Error('PAID_BOOKING_REQUIRED');
  const subtotal = new Prisma.Decimal(booking.basePrice).add(new Prisma.Decimal(booking.additionalCharges));
  return prisma.invoice.create({
    data: {
      bookingId,
      invoiceNumber: `${env.INVOICE_PREFIX}-${new Date().getUTCFullYear()}-${bookingId.slice(-8).toUpperCase()}`,
      subtotal,
      discount: booking.discount,
      tax: booking.tax,
      total: booking.totalAmount,
    },
  });
}

export async function pdf(bookingId: string, userId: string) {
  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, customer: { userId } },
    include: {
      service: true,
      customer: { include: { user: true } },
      provider: { include: { user: true } },
    },
  });
  if (!booking) throw new Error('BOOKING_NOT_FOUND');
  const invoice = await ensureInvoice(bookingId);

  const doc = new PDFDocument({
    size: 'A4',
    margin: 52,
    info: { Title: `HOUSE HELP Invoice ${invoice.invoiceNumber}` },
  });
  const chunks: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));

  // Header
  doc.fontSize(22).fillColor('#176B5B').text('HOUSE HELP');
  doc.fontSize(10).fillColor('#63716D').text('Trusted Help. Cleaner Homes. Happier Life.');
  doc.moveDown();
  doc.moveTo(52, doc.y).lineTo(543, doc.y).strokeColor('#176B5B').stroke();
  doc.moveDown();

  // Invoice info
  doc.fillColor('#18201E').fontSize(16).text(`Invoice ${invoice.invoiceNumber}`);
  doc.fontSize(11).moveDown(0.5)
    .text(`Booking Number : ${booking.bookingNumber}`)
    .text(`Customer       : ${booking.customer.user.name}`)
    .text(`Provider       : ${booking.provider?.user.name ?? 'To be assigned'}`)
    .text(`Service        : ${booking.service.nameEn}`)
    .text(`Date           : ${booking.startTime.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}`)
    .moveDown();

  // Amounts
  doc.moveTo(52, doc.y).lineTo(543, doc.y).strokeColor('#D0D8D5').stroke().moveDown(0.5);
  doc.text(`Base Amount        : INR ${booking.basePrice}`);
  doc.text(`Additional Charges : INR ${booking.additionalCharges}`);
  doc.text(`Discount           : INR ${booking.discount}`);
  doc.text(`Tax                : INR ${booking.tax}`);
  doc.moveTo(52, doc.y + 4).lineTo(543, doc.y + 4).strokeColor('#176B5B').stroke().moveDown(0.8);
  doc.fontSize(14).fillColor('#176B5B').text(`Total : INR ${booking.totalAmount}`);
  doc.fontSize(11).fillColor('#18201E').text(`Payment Status : ${booking.paymentStatus}`);

  doc.end();
  await new Promise<void>((resolve) => doc.on('end', resolve));
  return { invoice, buffer: Buffer.concat(chunks) };
}
