import {beforeEach,describe,expect,it,vi} from 'vitest';
const {prisma,env,gateway,notify,ensureInvoice,createEarning,summary,presign,validateProviderKey,encrypt,eta,publish}=vi.hoisted(()=>{
 const fn=()=>vi.fn();
 const prisma:any={
  provider:{findUnique:fn(),update:fn()},user:{update:fn()},service:{count:fn()},providerService:{deleteMany:fn(),createMany:fn()},providerAvailability:{deleteMany:fn(),createMany:fn()},document:{create:fn()},booking:{count:fn(),findUnique:fn(),findFirst:fn(),update:fn()},providerEarning:{findMany:fn()},bookingOffer:{upsert:fn()},payment:{upsert:fn(),findFirst:fn(),update:fn(),findUnique:fn()},paymentWebhookEvent:{findUnique:fn(),create:fn()},trackingSession:{findFirst:fn(),create:fn(),updateMany:fn()},providerLocation:{findFirst:fn(),create:fn(),deleteMany:fn()},invoice:{findUnique:fn(),create:fn()},
 };
 prisma.$transaction=vi.fn(async(cb:any)=>cb(prisma));
 return {
  prisma,env:{LOCATION_UPDATE_MIN_INTERVAL_SECONDS:5,LOCATION_RETENTION_DAYS:30,INVOICE_PREFIX:'HHINV'} as any,
  gateway:{name:'razorpay',createOrder:vi.fn(),verifyCheckout:vi.fn(),verifyWebhook:vi.fn()},
  notify:vi.fn(),ensureInvoice:vi.fn(),createEarning:vi.fn(),summary:vi.fn(),presign:vi.fn(),
  validateProviderKey:vi.fn((_:string,k:string)=>k),encrypt:vi.fn((x:string)=>`enc:${x}`),eta:vi.fn(),publish:vi.fn(),
 };
});
vi.mock('./config/prisma.js',()=>({prisma}));
vi.mock('./config/env.js',()=>({env}));
vi.mock('./payments/index.js',()=>({paymentGateway:gateway}));
vi.mock('./services/notification.service.js',()=>({notify}));vi.mock('./services/invoice.service.js',()=>({ensureInvoice}));vi.mock('./services/earning.service.js',()=>({createEarning,summary}));vi.mock('./storage/s3.service.js',()=>({presign,validateProviderKey}));vi.mock('./security/encryption.js',()=>({encrypt}));vi.mock('./maps/google-maps.service.js',()=>({eta}));vi.mock('./realtime/hub.js',()=>({publishBookingEvent:publish}));

import * as payment from './services/payment.service.js';
import * as jobs from './services/provider-job.service.js';
import * as providers from './services/provider.service.js';
import * as tracking from './services/tracking.service.js';
import {afterProviderTransition,publishAssignment} from './realtime/lifecycle.js';

beforeEach(()=>{vi.clearAllMocks();prisma.$transaction.mockImplementation(async(cb:any)=>cb(prisma));prisma.provider.findUnique.mockResolvedValue({id:'p1',userId:'u1',verificationStatus:'VERIFIED',rating:4.8,completedJobs:4});});

describe('payment workflows',()=>{
 const booking:any={id:'b1',bookingNumber:'HH1',paymentStatus:'PENDING',totalAmount:100,customer:{userId:'u1',user:{id:'u1'}}};
 it('creates a gateway order and records it',async()=>{
  prisma.booking.findFirst.mockResolvedValue(booking);gateway.createOrder.mockResolvedValue({id:'o1'});prisma.payment.upsert.mockResolvedValue({id:'pay1'});process.env.PAYMENT_API_KEY='public';
  await expect(payment.createOrder('u1','b1')).resolves.toMatchObject({orderId:'o1',amountPaise:10000});
  prisma.booking.findFirst.mockResolvedValue({...booking,paymentStatus:'PAID'});await expect(payment.createOrder('u1','b1')).rejects.toThrow('ALREADY_PAID');
 });
 it('verifies checkout and finalizes booking',async()=>{
  prisma.booking.findFirst.mockResolvedValue(booking);gateway.verifyCheckout.mockReturnValue(true);prisma.payment.findFirst.mockResolvedValue({id:'pay1',amount:100});prisma.payment.update.mockResolvedValue({id:'pay1',status:'PAID'});
  await expect(payment.verify('u1',{bookingId:'b1',gatewayOrderId:'o1',gatewayPaymentId:'p1',signature:'s'})).resolves.toMatchObject({status:'PAID'});expect(ensureInvoice).toHaveBeenCalledWith('b1');expect(notify).toHaveBeenCalled();
  gateway.verifyCheckout.mockReturnValue(false);await expect(payment.verify('u1',{bookingId:'b1'})).rejects.toThrow('INVALID_PAYMENT_SIGNATURE');
  gateway.verifyCheckout.mockReturnValue(true);prisma.payment.findFirst.mockResolvedValue(null);await expect(payment.verify('u1',{bookingId:'b1',gatewayOrderId:'o1',gatewayPaymentId:'p1',signature:'s'})).rejects.toThrow('PAYMENT_AMOUNT_MISMATCH');
 });
 it('handles signed and duplicate webhooks idempotently',async()=>{
  gateway.verifyWebhook.mockReturnValue(true);prisma.paymentWebhookEvent.findUnique.mockResolvedValueOnce(null);prisma.payment.findUnique.mockResolvedValue({id:'pay1',bookingId:'b1',amount:100});
  const raw=Buffer.from(JSON.stringify({event:'payment.captured',payload:{payment:{entity:{order_id:'o1',id:'p1',amount:10000}}}}));
  await expect(payment.webhook(raw,'sig','evt1')).resolves.toEqual({duplicate:false});expect(prisma.booking.update).toHaveBeenCalled();
  prisma.paymentWebhookEvent.findUnique.mockResolvedValue({id:'old'});await expect(payment.webhook(raw,'sig','evt1')).resolves.toEqual({duplicate:true});
  gateway.verifyWebhook.mockReturnValue(false);await expect(payment.webhook(raw,'bad',undefined)).rejects.toThrow('INVALID_WEBHOOK_SIGNATURE');
 });
});

describe('provider profile and job workflows',()=>{
 it('updates profile, services and availability',async()=>{
  prisma.provider.update.mockResolvedValue({id:'p1'});await providers.update('u1',{name:'V',workingAreas:['Kopar Khairane']});expect(prisma.user.update).toHaveBeenCalled();
  prisma.service.count.mockResolvedValue(2);await expect(providers.setServices('u1',['s1','s2'])).resolves.toEqual({serviceIds:['s1','s2']});
  await expect(providers.setAvailability('u1',[{dayOfWeek:1,startTime:'09:00',endTime:'18:00'}])).resolves.toHaveLength(1);
  await expect(providers.setAvailability('u1',[{startTime:'18:00',endTime:'09:00'}])).rejects.toThrow('INVALID_AVAILABILITY');
  await expect(providers.update('u1',{workingAreas:['Outside']})).rejects.toThrow('OUTSIDE_SERVICE_AREA');
  prisma.service.count.mockResolvedValue(0);await expect(providers.setServices('u1',['missing'])).rejects.toThrow('SERVICE_NOT_FOUND');
 });
 it('handles provider uploads, payout and dashboards',async()=>{
  presign.mockResolvedValue({uploadUrl:'url'});await expect(providers.upload('u1','documents','image/png',10)).resolves.toEqual({uploadUrl:'url'});
  prisma.document.create.mockResolvedValue({id:'d1'});await providers.addDocument('u1',{type:'ID',objectKey:'providers/p1/a',mimeType:'image/png',sizeBytes:10});
  prisma.provider.update.mockResolvedValue({id:'p1'});await providers.payout('u1',{bankAccount:'123',upiId:'a@upi'});expect(encrypt).toHaveBeenCalledTimes(2);
  summary.mockResolvedValue({total:100});prisma.booking.count.mockResolvedValue(2);await expect(providers.dashboard('u1')).resolves.toMatchObject({todayJobs:2});
  prisma.providerEarning.findMany.mockResolvedValue([]);await expect(providers.earnings('u1')).resolves.toHaveProperty('history');
 });
 it('accepts, rejects and transitions assigned jobs',async()=>{
  const b:any={id:'b1',providerId:'p1',bookingStatus:'CONFIRMED',startTime:new Date(),endTime:new Date(Date.now()+1000),totalAmount:100};prisma.booking.findUnique.mockResolvedValue(b);prisma.booking.findFirst.mockResolvedValue(null);prisma.booking.update.mockResolvedValue({id:'b1'});
  await jobs.accept('u1','b1');expect(prisma.bookingOffer.upsert).toHaveBeenCalled();await jobs.reject('u1','b1');
  prisma.booking.findUnique.mockResolvedValue({...b,bookingStatus:'IN_PROGRESS'});await jobs.transition('u1','b1','COMPLETED');expect(createEarning).toHaveBeenCalled();
  prisma.booking.findUnique.mockResolvedValue({...b,bookingStatus:'CONFIRMED'});await expect(jobs.transition('u1','b1','COMPLETED')).rejects.toThrow('INVALID_STATUS_TRANSITION');
 });
});

describe('tracking and realtime lifecycle',()=>{
 it('starts, stops, updates and views tracking',async()=>{
  prisma.trackingSession.findFirst.mockResolvedValue(null);prisma.trackingSession.create.mockResolvedValue({id:'t1'});await tracking.start('b1','p1',true);await expect(tracking.start('b1','p1',false)).rejects.toThrow('LOCATION_CONSENT_REQUIRED');await tracking.stop('b1','COMPLETED');expect(publish).toHaveBeenCalled();
  prisma.booking.findUnique.mockResolvedValue({id:'b1',providerId:'p1',bookingStatus:'PROVIDER_ON_THE_WAY',customer:{userId:'c1'},provider:{userId:'u1',user:{name:'P',profilePhoto:null},rating:4.8},latitude:19,longitude:73});prisma.trackingSession.findFirst.mockResolvedValue({id:'t1'});prisma.providerLocation.findFirst.mockResolvedValueOnce(null);prisma.providerLocation.create.mockResolvedValue({recordedAt:new Date(),latitude:19,longitude:73});
  await expect(tracking.update('u1',{bookingId:'b1',latitude:19,longitude:73})).resolves.toHaveProperty('recordedAt');
  prisma.providerLocation.findFirst.mockResolvedValue({recordedAt:new Date(),latitude:19,longitude:73,accuracy:5});eta.mockResolvedValue({durationSeconds:60});await expect(tracking.view('u1','PROVIDER','b1')).resolves.toMatchObject({trackingActive:true,eta:{durationSeconds:60}});
  prisma.providerLocation.deleteMany.mockResolvedValue({count:1});await tracking.purgeExpired();
  prisma.booking.findUnique.mockResolvedValue(null);await expect(tracking.update('u1',{bookingId:'missing',latitude:19,longitude:73})).rejects.toThrow('BOOKING_NOT_FOUND');
  prisma.booking.findUnique.mockResolvedValue({id:'b1',providerId:'p1',bookingStatus:'COMPLETED'});await expect(tracking.update('u1',{bookingId:'b1',latitude:19,longitude:73})).rejects.toThrow('TRACKING_NOT_ALLOWED');
 });
 it('publishes lifecycle transitions and assignments',async()=>{
  await afterProviderTransition({id:'b1',providerId:'p1',bookingStatus:'PROVIDER_ON_THE_WAY'},true);expect(publish).toHaveBeenCalled();
  await afterProviderTransition({id:'b1',providerId:'p1',bookingStatus:'COMPLETED'});expect(publish).toHaveBeenCalled();
  await afterProviderTransition({id:'b2',providerId:null,bookingStatus:'COMPLETED'});
  prisma.booking.findUnique.mockResolvedValue({providerId:'p1'});await publishAssignment('b1');expect(publish).toHaveBeenCalledWith('b1','provider.assigned',{providerId:'p1'});
 });
});
