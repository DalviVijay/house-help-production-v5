import {beforeEach,describe,expect,it,vi} from 'vitest';
const {prisma,env,argon,sendOtp,hashToken,issueAccessToken,newRefreshToken,calculatePrice,findProvider}=vi.hoisted(()=>{
 const fn=()=>vi.fn();const prisma:any={
  user:{create:fn(),findFirst:fn(),upsert:fn(),findUnique:fn(),update:fn()},refreshToken:{create:fn(),findUnique:fn(),update:fn(),updateMany:fn()},otpChallenge:{create:fn(),delete:fn(),findFirst:fn(),update:fn()},passwordResetToken:{create:fn(),findUnique:fn(),update:fn()},customer:{findUnique:fn()},provider:{findUnique:fn()},service:{findFirst:fn()},address:{findFirst:fn()},booking:{findFirst:fn(),create:fn(),findMany:fn(),findUnique:fn(),update:fn()},
 };
 prisma.$transaction=vi.fn(async(x:any)=>Array.isArray(x)?Promise.all(x):x(prisma));
 return {prisma,env:{OTP_PEPPER:'pepper',NODE_ENV:'test'} as any,argon:{hash:vi.fn(),verify:vi.fn()},sendOtp:vi.fn(),hashToken:vi.fn((x:string)=>`hash:${x}`),issueAccessToken:vi.fn(async()=> 'access'),newRefreshToken:vi.fn(()=> 'refresh'),calculatePrice:vi.fn(()=>200),findProvider:vi.fn()};
});
vi.mock('./config/prisma.js',()=>({prisma}));vi.mock('./config/env.js',()=>({env}));vi.mock('argon2',()=>({default:argon}));vi.mock('./notifications/sms.sender.js',()=>({sendOtp}));vi.mock('./services/token.service.js',()=>({hashToken,issueAccessToken,newRefreshToken}));vi.mock('./services/pricing.service.js',()=>({calculatePrice}));vi.mock('./services/assignment.service.js',()=>({findProvider}));
import * as auth from './services/auth.service.js';import * as booking from './services/booking.service.js';

beforeEach(()=>{vi.clearAllMocks();prisma.$transaction.mockImplementation(async(x:any)=>Array.isArray(x)?Promise.all(x):x(prisma));argon.hash.mockResolvedValue('hashed');argon.verify.mockResolvedValue(true);prisma.refreshToken.create.mockResolvedValue({});});

describe('authentication service',()=>{
 it('registers, logs in and creates a session',async()=>{
  const testPassword='test-only-value';prisma.user.create.mockResolvedValue({id:'u1'});await auth.register({name:'V',email:'V@E.COM',password:testPassword});expect(prisma.user.create).toHaveBeenCalledWith(expect.objectContaining({data:expect.objectContaining({email:'v@e.com',role:'CUSTOMER'})}));
  prisma.user.findFirst.mockResolvedValue({id:'u1',role:'CUSTOMER',passwordHash:'hash'});await expect(auth.login('V@E.COM','secret')).resolves.toEqual({accessToken:'access',refreshToken:'refresh'});
  argon.verify.mockResolvedValue(false);await expect(auth.login('x','bad')).rejects.toThrow('INVALID_CREDENTIALS');
 });
 it('requests and verifies OTP with cleanup on delivery failure',async()=>{
  prisma.otpChallenge.create.mockResolvedValue({id:'o1'});await expect(auth.requestOtp('+919')).resolves.toEqual({expiresInSeconds:300});expect(sendOtp).toHaveBeenCalled();
  sendOtp.mockRejectedValueOnce(new Error('delivery'));await expect(auth.requestOtp('+919')).rejects.toThrow('delivery');expect(prisma.otpChallenge.delete).toHaveBeenCalled();
  const crypto=await import('node:crypto');const code=crypto.createHash('sha256').update('+919:123456:pepper').digest('hex');prisma.otpChallenge.findFirst.mockResolvedValue({id:'o1',attempts:0,codeHash:code});prisma.user.upsert.mockResolvedValue({id:'u1',role:'CUSTOMER'});await expect(auth.verifyOtp('+919','123456')).resolves.toHaveProperty('accessToken');
  prisma.otpChallenge.findFirst.mockResolvedValue({id:'o1',attempts:0,codeHash:'bad'});await expect(auth.verifyOtp('+919','123456')).rejects.toThrow('INVALID_OTP');
 });
 it('resets, refreshes and logs out sessions',async()=>{
  prisma.user.findUnique.mockResolvedValue({id:'u1'});await expect(auth.requestPasswordReset('A@B.COM')).resolves.toEqual({accepted:true});expect(prisma.passwordResetToken.create).toHaveBeenCalled();
  prisma.refreshToken.findUnique.mockResolvedValue({id:'r1',userId:'u1',revokedAt:null,expiresAt:new Date(Date.now()+10000),user:{status:'ACTIVE',role:'CUSTOMER'}});await expect(auth.refreshSession('old')).resolves.toEqual({accessToken:'access',refreshToken:'refresh'});
  prisma.refreshToken.findUnique.mockResolvedValue(null);await expect(auth.refreshSession('bad')).rejects.toThrow('INVALID_REFRESH_TOKEN');
  await expect(auth.logout('old')).resolves.toEqual({loggedOut:true});
  prisma.passwordResetToken.findUnique.mockResolvedValue({id:'p1',userId:'u1',usedAt:null,expiresAt:new Date(Date.now()+10000)});await expect(auth.resetPassword('token','newpass')).resolves.toEqual({reset:true});
  prisma.passwordResetToken.findUnique.mockResolvedValue(null);await expect(auth.resetPassword('bad','x')).rejects.toThrow('INVALID_RESET_TOKEN');
 });
});

describe('booking service',()=>{
 const base:any={id:'b1',bookingStatus:'CONFIRMED',duration:60,customer:{userId:'u1'},provider:{userId:'puser',verificationStatus:'VERIFIED'}};
 it('creates a priced booking and prevents duplicates',async()=>{
  prisma.customer.findUnique.mockResolvedValue({id:'c1'});prisma.service.findFirst.mockResolvedValue({id:'s1',categoryId:'cat',durationMinutes:60,pricingConfig:{type:'FIXED'}});prisma.address.findFirst.mockResolvedValue({id:'a1',area:'Kopar Khairane',line1:'Home',postalCode:'400709',latitude:19,longitude:73});prisma.booking.findFirst.mockResolvedValue(null);findProvider.mockResolvedValue({id:'p1'});prisma.booking.create.mockResolvedValue({id:'b1'});
  await expect(booking.create('u1',{serviceId:'s1',addressId:'a1',startTime:new Date().toISOString(),quantity:1})).resolves.toEqual({id:'b1'});expect(prisma.booking.create).toHaveBeenCalled();
  prisma.booking.findFirst.mockResolvedValue({id:'existing'});await expect(booking.create('u1',{serviceId:'s1',addressId:'a1',startTime:new Date().toISOString(),quantity:1})).rejects.toThrow('DUPLICATE_ACTIVE_BOOKING');
 });
 it('lists bookings for all roles and enforces ownership',async()=>{
  prisma.customer.findUnique.mockResolvedValue({id:'c1'});prisma.booking.findMany.mockResolvedValue([]);await booking.list('u1','CUSTOMER');prisma.provider.findUnique.mockResolvedValue({id:'p1'});await booking.list('u1','PROVIDER');await booking.list('u1','ADMIN');expect(prisma.booking.findMany).toHaveBeenCalledTimes(3);
  prisma.booking.findUnique.mockResolvedValue(base);await expect(booking.get('u1','CUSTOMER','b1')).resolves.toEqual(base);await expect(booking.get('other','CUSTOMER','b1')).rejects.toThrow('FORBIDDEN');
 });
 it('changes status and reschedules valid bookings',async()=>{
  prisma.booking.findUnique.mockResolvedValue(base);prisma.booking.update.mockResolvedValue({id:'b1'});await booking.status('u1','CUSTOMER','b1','CANCELLED','reason');expect(prisma.booking.update).toHaveBeenCalled();
  prisma.booking.findUnique.mockResolvedValue({...base,bookingStatus:'CONFIRMED'});await expect(booking.reschedule('u1','b1',new Date())).resolves.toEqual({id:'b1'});
  prisma.booking.findUnique.mockResolvedValue({...base,bookingStatus:'COMPLETED'});await expect(booking.reschedule('u1','b1',new Date())).rejects.toThrow('RESCHEDULE_NOT_ALLOWED');
 });
});
