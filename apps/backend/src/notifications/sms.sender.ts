import { env } from '../config/env.js';

export async function sendOtp(mobile: string, otp: string) {
  if (env.SMS_PROVIDER === 'console') {
    if (env.NODE_ENV === 'production') throw Error('SMS_PROVIDER_REQUIRED');
    console.info(`[dev-only] OTP for ${mobile}: ${otp}`);
    return;
  }
  const authkey = env.MSG91_AUTH_KEY;
  const templateId = env.MSG91_TEMPLATE_ID;
  if (!authkey || !templateId) throw Error('SMS_CONFIGURATION_REQUIRED');
  const endpoint = 'https:' + '//control.msg91.com/api/v5/otp';
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authkey },
    body: JSON.stringify({ template_id: templateId, mobile: mobile.replace(/^\+/, ''), otp }),
  });
  if (!response.ok) throw Error('OTP_DELIVERY_FAILED');
}
