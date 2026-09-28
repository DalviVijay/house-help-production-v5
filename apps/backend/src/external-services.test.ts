import {beforeEach,describe,expect,it,vi} from 'vitest';

const {env,signed}=vi.hoisted(()=>({
  env:{
    NODE_ENV:'test', GOOGLE_MAPS_SERVER_API_KEY:'maps-key', SMS_PROVIDER:'console',
    MSG91_AUTH_KEY:'msg-key', MSG91_TEMPLATE_ID:'template', DATA_ENCRYPTION_KEY:'encrypt-key',
    PAYMENT_API_KEY:'pay-key', PAYMENT_SECRET:'pay-secret', PAYMENT_WEBHOOK_SECRET:'hook-secret',
    S3_BUCKET:'bucket',S3_ACCESS_KEY:'access',S3_SECRET_KEY:'secret',S3_REGION:'ap-south-1',S3_ENDPOINT:undefined,
  } as any,
  signed:vi.fn(async()=> 'https://signed.example/upload'),
}));
vi.mock('./config/env.js',()=>({env}));
vi.mock('@aws-sdk/client-s3',()=>({S3Client:class{constructor(public config:any){}},PutObjectCommand:class{constructor(public input:any){}}}));
vi.mock('@aws-sdk/s3-request-presigner',()=>({getSignedUrl:signed}));

import {autocomplete,eta,place} from './maps/google-maps.service.js';
import {sendOtp} from './notifications/sms.sender.js';
import {decrypt,encrypt} from './security/encryption.js';
import {RazorpayGateway} from './payments/razorpay.gateway.js';
import {presign,validateProviderKey} from './storage/s3.service.js';
import {createHmac} from 'node:crypto';

beforeEach(()=>{vi.restoreAllMocks(); env.NODE_ENV='test';env.GOOGLE_MAPS_SERVER_API_KEY='maps-key';env.SMS_PROVIDER='console';env.DATA_ENCRYPTION_KEY='encrypt-key';env.PAYMENT_API_KEY='pay-key';env.PAYMENT_SECRET='pay-secret';env.PAYMENT_WEBHOOK_SECRET='hook-secret';env.S3_BUCKET='bucket';env.S3_ACCESS_KEY='access';env.S3_SECRET_KEY='secret';});

describe('external service adapters',()=>{
  it('maps autocomplete, details and eta map successful responses',async()=>{
    const fetchMock=vi.spyOn(globalThis,'fetch') as any;
    fetchMock.mockResolvedValueOnce({ok:true,json:async()=>({status:'OK',predictions:[{place_id:'p1',description:'Home',structured_formatting:{main_text:'Main'}}]})});
    await expect(autocomplete('hom','s1')).resolves.toEqual([{placeId:'p1',description:'Home',mainText:'Main'}]);
    fetchMock.mockResolvedValueOnce({ok:true,json:async()=>({status:'OK',result:{formatted_address:'Address',geometry:{location:{lat:19,lng:73}},address_components:[]}})});
    await expect(place('p1','s1')).resolves.toMatchObject({address:'Address',latitude:19,longitude:73});
    fetchMock.mockResolvedValueOnce({ok:true,json:async()=>({status:'OK',rows:[{elements:[{status:'OK',distance:{value:100,text:'100 m'},duration:{value:30,text:'30 sec'}}]}]})});
    await expect(eta({lat:1,lng:2},{lat:3,lng:4})).resolves.toMatchObject({distanceMeters:100,durationSeconds:30});
    fetchMock.mockResolvedValueOnce({ok:true,json:async()=>({status:'ZERO_RESULTS',rows:[]})});
    await expect(eta({lat:1,lng:2},{lat:3,lng:4})).resolves.toBeNull();
  });
  it('maps rejects missing config and provider failures',async()=>{
    env.GOOGLE_MAPS_SERVER_API_KEY='';
    await expect(autocomplete('x','s')).rejects.toThrow('GOOGLE_MAPS_NOT_CONFIGURED');
    env.GOOGLE_MAPS_SERVER_API_KEY='key';
    vi.spyOn(globalThis,'fetch').mockResolvedValueOnce({ok:false} as any);
    await expect(place('p','s')).rejects.toThrow('GOOGLE_MAPS_REQUEST_FAILED');
    vi.spyOn(globalThis,'fetch').mockResolvedValueOnce({ok:true,json:async()=>({status:'DENIED'})} as any);
    await expect(place('p','s')).rejects.toThrow('GOOGLE_MAPS_DENIED');
  });
  it('sends development and MSG91 OTP safely',async()=>{
    const log=vi.spyOn(console,'info').mockImplementation(()=>{});
    await sendOtp('+919999999999','123456'); expect(log).toHaveBeenCalled();
    env.NODE_ENV='production'; await expect(sendOtp('+919','1')).rejects.toThrow('SMS_PROVIDER_REQUIRED');
    env.SMS_PROVIDER='msg91'; env.NODE_ENV='test';
    const f=vi.spyOn(globalThis,'fetch').mockResolvedValueOnce({ok:true} as any);
    await sendOtp('+919999999999','123456'); expect(f).toHaveBeenCalledWith(expect.stringContaining('msg91'),expect.objectContaining({method:'POST'}));
    f.mockResolvedValueOnce({ok:false} as any); await expect(sendOtp('+919','1')).rejects.toThrow('OTP_DELIVERY_FAILED');
  });
  it('encrypts and decrypts authenticated data',()=>{
    const value=encrypt('sensitive'); expect(value).not.toContain('sensitive'); expect(decrypt(value)).toBe('sensitive');
    env.DATA_ENCRYPTION_KEY=''; expect(()=>encrypt('x')).toThrow('ENCRYPTION_NOT_CONFIGURED');
  });
  it('creates and verifies Razorpay orders and signatures',async()=>{
    const gateway=new RazorpayGateway();
    vi.spyOn(globalThis,'fetch').mockResolvedValueOnce({ok:true,json:async()=>({id:'order_1',amount:100,currency:'INR'})} as any);
    await expect(gateway.createOrder({amountPaise:100,currency:'INR',receipt:'r',notes:{}})).resolves.toMatchObject({id:'order_1'});
    const sig=createHmac('sha256','pay-secret').update('order_1|pay_1').digest('hex');
    expect(gateway.verifyCheckout({orderId:'order_1',paymentId:'pay_1',signature:sig})).toBe(true);
    expect(gateway.verifyCheckout({orderId:'order_1',paymentId:'pay_1',signature:'bad'})).toBe(false);
    const raw=Buffer.from('{}'),hook=createHmac('sha256','hook-secret').update(raw).digest('hex');
    expect(gateway.verifyWebhook(raw,hook)).toBe(true); expect(gateway.verifyWebhook(raw,'bad')).toBe(false);
  });
  it('presigns constrained uploads and validates ownership',async()=>{
    await expect(presign('p1','documents','image/png',100)).resolves.toMatchObject({uploadUrl:'https://signed.example/upload',expiresIn:300});
    await expect(presign('p1','jobs','text/plain',10)).rejects.toThrow('INVALID_UPLOAD');
    await expect(presign('p1','jobs','image/jpeg',8_000_001)).rejects.toThrow('INVALID_UPLOAD');
    expect(validateProviderKey('p1','providers/p1/jobs/a.jpg')).toContain('providers/p1');
    expect(()=>validateProviderKey('p1','providers/p2/jobs/a.jpg')).toThrow('INVALID_OBJECT_KEY');
  });
});
