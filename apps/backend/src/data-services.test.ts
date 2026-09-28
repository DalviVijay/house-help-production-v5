import {beforeEach,describe,expect,it,vi} from 'vitest';

const {prisma,env}=vi.hoisted(()=>{
 const fn=()=>vi.fn();
 const prisma:any={
  user:{findUnique:fn(),update:fn()},customer:{findUnique:fn()},booking:{count:fn(),findFirst:fn()},refreshToken:{updateMany:fn()},deviceToken:{deleteMany:fn()},notification:{deleteMany:fn(),create:fn()},provider:{updateMany:fn(),findMany:fn(),findUnique:fn()},auditLog:{create:fn()},
  address:{findMany:fn(),updateMany:fn(),count:fn(),create:fn(),findFirst:fn(),update:fn(),delete:fn()},
  idempotencyRecord:{findUnique:fn(),create:fn(),update:fn()},outboxMessage:{create:fn()},supportTicket:{create:fn(),findMany:fn(),findUnique:fn()},supportMessage:{create:fn()},
  serviceCategory:{findMany:fn()},service:{findMany:fn(),findFirst:fn(),count:fn()},subscriptionPlan:{findMany:fn(),findUnique:fn()},customerSubscription:{updateMany:fn(),create:fn(),findMany:fn()},recurringBooking:{create:fn(),findFirst:fn(),update:fn(),findMany:fn()},referral:{findFirst:fn(),create:fn(),findUnique:fn(),update:fn(),findMany:fn()},walletAccount:{upsert:fn()},loyaltyAccount:{upsert:fn()},providerIncentive:{findMany:fn()},
 };
 prisma.$transaction=vi.fn(async(cb:any)=>cb(prisma));
 return {prisma,env:{JWT_SECRET:'a'.repeat(40)} as any};
});
vi.mock('./config/prisma.js',()=>({prisma}));
vi.mock('./config/env.js',()=>({env}));

import {deleteAccount} from './services/account.service.js';
import * as address from './services/address.service.js';
import {findProvider} from './services/assignment.service.js';
import {notify} from './services/notification.service.js';
import * as support from './services/support.service.js';
import * as services from './services/service.service.js';
import * as growth from './services/growth.service.js';
import {hashToken,issueAccessToken,newRefreshToken} from './services/token.service.js';

beforeEach(()=>{for(const group of Object.values(prisma)){if(group&&typeof group==='object')for(const v of Object.values(group as any))if(typeof v==='function'&&'mockReset'in v)(v as any).mockReset()} prisma.$transaction.mockImplementation(async(cb:any)=>cb(prisma)); prisma.customer.findUnique.mockResolvedValue({id:'c1',userId:'u1'});});

describe('database-backed core services',()=>{
 it('deletes an eligible account transactionally',async()=>{
  prisma.user.findUnique.mockResolvedValue({id:'u1',status:'ACTIVE'});prisma.booking.count.mockResolvedValue(0);
  await expect(deleteAccount('u1')).resolves.toEqual({deleted:true});
  expect(prisma.refreshToken.updateMany).toHaveBeenCalled();expect(prisma.user.update).toHaveBeenCalledWith(expect.objectContaining({data:expect.objectContaining({status:'DELETED'})}));
  prisma.user.findUnique.mockResolvedValue(null);await expect(deleteAccount('x')).rejects.toThrow('USER_NOT_FOUND');
  prisma.user.findUnique.mockResolvedValue({id:'u1',status:'DELETED'});await expect(deleteAccount('u1')).resolves.toEqual({deleted:true});
  prisma.user.findUnique.mockResolvedValue({id:'u1',status:'ACTIVE'});prisma.booking.count.mockResolvedValue(1);await expect(deleteAccount('u1')).rejects.toThrow('ACTIVE_BOOKINGS_EXIST');
 });
 it('lists, creates, updates and removes owned addresses',async()=>{
  prisma.address.findMany.mockResolvedValue([{id:'a1'}]);await expect(address.list('u1')).resolves.toHaveLength(1);
  prisma.address.count.mockResolvedValue(0);prisma.address.create.mockResolvedValue({id:'a1'});
  await address.create('u1',{area:'Kopar Khairane',isDefault:true});expect(prisma.address.updateMany).toHaveBeenCalled();expect(prisma.address.create).toHaveBeenCalled();
  await expect(address.create('u1',{area:'outside'})).rejects.toThrow('OUTSIDE_SERVICE_AREA');
  prisma.address.findFirst.mockResolvedValue({id:'a1',area:'Kopar Khairane'});prisma.address.update.mockResolvedValue({id:'a1'});await address.update('u1','a1',{line1:'New'});
  await address.remove('u1','a1');expect(prisma.address.delete).toHaveBeenCalledWith({where:{id:'a1'}});
  prisma.address.findFirst.mockResolvedValue(null);await expect(address.remove('u1','missing')).rejects.toThrow('ADDRESS_NOT_FOUND');
 });
 it('finds the best available provider',async()=>{
  prisma.provider.findMany.mockResolvedValue([{id:'p1'}]);await expect(findProvider({serviceId:'s1',area:'Kopar Khairane',startTime:new Date('2026-09-26T10:00:00Z'),endTime:new Date('2026-09-26T11:00:00Z')})).resolves.toEqual({id:'p1'});
  prisma.provider.findMany.mockResolvedValue([]);await expect(findProvider({serviceId:'s1',area:'x',startTime:new Date(),endTime:new Date()})).resolves.toBeNull();
 });
 it('creates notification and outbox messages atomically',async()=>{
  prisma.notification.create.mockResolvedValue({id:'n1'});
  await expect(notify({userId:'u1',type:'booking',title:'T',body:'B',channels:['SMS','IN_APP']})).resolves.toEqual({id:'n1'});
  expect(prisma.outboxMessage.create).toHaveBeenCalledTimes(2);
 });
 it('handles customer support ownership and replies',async()=>{
  prisma.supportTicket.create.mockResolvedValue({id:'t1'});await support.create('u1',{type:'HELP',subject:'S',description:'D'});expect(prisma.supportTicket.create).toHaveBeenCalled();
  prisma.supportTicket.findMany.mockResolvedValue([]);await expect(support.mine('u1')).resolves.toEqual([]);
  prisma.supportTicket.findUnique.mockResolvedValue({id:'t1',customer:{userId:'u1'}});prisma.supportMessage.create.mockResolvedValue({id:'m1'});await expect(support.reply('u1','CUSTOMER','t1','hello',true)).resolves.toEqual({id:'m1'});
  prisma.supportTicket.findUnique.mockResolvedValue(null);await expect(support.reply('u1','CUSTOMER','x','h')).rejects.toThrow('TICKET_NOT_FOUND');
  prisma.supportTicket.findUnique.mockResolvedValue({id:'t1',customer:{userId:'owner'}});await expect(support.reply('other','CUSTOMER','t1','h')).rejects.toThrow('FORBIDDEN');
 });
 it('queries public services',async()=>{
  prisma.serviceCategory.findMany.mockResolvedValue([]);prisma.service.findMany.mockResolvedValue([]);prisma.service.findFirst.mockResolvedValue({id:'s1'});
  await services.categories();await services.list('clean');await services.list();await expect(services.one('s1')).resolves.toEqual({id:'s1'});
  expect(prisma.service.findMany).toHaveBeenCalledTimes(2);
 });
 it('executes growth flows',async()=>{
  prisma.subscriptionPlan.findMany.mockResolvedValue([]);await growth.plans();
  prisma.subscriptionPlan.findUnique.mockResolvedValue({id:'plan',active:true,durationDays:30,bookingCredits:2});prisma.customerSubscription.create.mockResolvedValue({id:'sub'});await expect(growth.subscribe('u1','plan')).resolves.toEqual({id:'sub'});
  prisma.subscriptionPlan.findUnique.mockResolvedValue(null);await expect(growth.subscribe('u1','missing')).rejects.toThrow('PLAN_NOT_FOUND');
  prisma.recurringBooking.create.mockResolvedValue({id:'r1'});await growth.createRecurring('u1',{frequency:'WEEKLY',preferredDay:1,preferredTime:'10:00'});
  prisma.recurringBooking.findFirst.mockResolvedValue({id:'r1'});prisma.recurringBooking.update.mockResolvedValue({id:'r1'});await growth.updateRecurring('u1','r1',{active:false});
  prisma.referral.findFirst.mockResolvedValue(null);prisma.referral.create.mockResolvedValue({id:'ref'});await growth.referralCode('u1');
  prisma.referral.findUnique.mockResolvedValue({id:'ref',status:'PENDING',expiresAt:new Date(Date.now()+10000),referrerCustomerId:'other'});prisma.referral.update.mockResolvedValue({status:'QUALIFIED'});await growth.applyReferral('u1','CODE');
  prisma.referral.findUnique.mockResolvedValue({id:'ref',status:'PENDING',expiresAt:new Date(Date.now()+10000),referrerCustomerId:'c1'});await expect(growth.applyReferral('u1','SELF')).rejects.toThrow('SELF_REFERRAL');
  prisma.walletAccount.upsert.mockResolvedValue({});prisma.loyaltyAccount.upsert.mockResolvedValue({});prisma.customerSubscription.findMany.mockResolvedValue([]);prisma.recurringBooking.findMany.mockResolvedValue([]);prisma.referral.findMany.mockResolvedValue([]);await expect(growth.dashboard('u1')).resolves.toHaveProperty('wallet');
  prisma.provider.findUnique.mockResolvedValue({id:'p1'});prisma.providerIncentive.findMany.mockResolvedValue([]);await expect(growth.incentives('u1')).resolves.toEqual([]);
 });
 it('issues and hashes secure tokens',async()=>{
  const token=await issueAccessToken('u1','CUSTOMER');expect(token.split('.')).toHaveLength(3);expect(hashToken('x')).toHaveLength(64);expect(newRefreshToken().length).toBeGreaterThan(40);
 });
});
