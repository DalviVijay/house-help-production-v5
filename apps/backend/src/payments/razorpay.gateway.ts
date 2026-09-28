import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '../config/env.js';
import type { CreateOrderInput, GatewayOrder, PaymentGateway } from './gateway.js';

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export class RazorpayGateway implements PaymentGateway {
  name = 'razorpay';
  private secret() {
    if (!env.PAYMENT_SECRET) throw new Error('PAYMENT_GATEWAY_NOT_CONFIGURED');
    return env.PAYMENT_SECRET;
  }
  async createOrder(input: CreateOrderInput): Promise<GatewayOrder> {
    if (!env.PAYMENT_API_KEY) throw new Error('PAYMENT_GATEWAY_NOT_CONFIGURED');
    const auth = Buffer.from(`${env.PAYMENT_API_KEY}:${this.secret()}`).toString('base64');
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: { authorization: `Basic ${auth}`, 'content-type': 'application/json' },
      body: JSON.stringify({ amount: input.amountPaise, currency: input.currency, receipt: input.receipt, notes: input.notes }),
    });
    if (!response.ok) throw new Error('PAYMENT_ORDER_FAILED');
    return await response.json() as GatewayOrder;
  }
  verifyCheckout(input: { orderId: string; paymentId: string; signature: string }) {
    const expected = createHmac('sha256', this.secret()).update(`${input.orderId}|${input.paymentId}`).digest('hex');
    return safeEqual(expected, input.signature);
  }
  verifyWebhook(raw: Buffer, signature: string) {
    if (!env.PAYMENT_WEBHOOK_SECRET) throw new Error('PAYMENT_WEBHOOK_NOT_CONFIGURED');
    const expected = createHmac('sha256', env.PAYMENT_WEBHOOK_SECRET).update(raw).digest('hex');
    return safeEqual(expected, signature);
  }
}
