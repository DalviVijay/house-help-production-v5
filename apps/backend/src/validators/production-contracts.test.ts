import {describe,expect,it} from 'vitest';
import {payoutSchema,availabilitySchema,documentSchema} from './provider.js';
import {couponSchema,couponUpdateSchema} from './admin.js';

describe('production validation contracts',()=>{
  it('requires a valid payout destination',()=>{
    expect(payoutSchema.safeParse({upiId:'worker@upi'}).success).toBe(true);
    expect(payoutSchema.safeParse({}).success).toBe(false);
    expect(payoutSchema.safeParse({upiId:'invalid'}).success).toBe(false);
  });
  it('validates provider slots and documents',()=>{
    expect(availabilitySchema.safeParse({slots:[{dayOfWeek:1,startTime:'09:00',endTime:'18:00'}]}).success).toBe(true);
    expect(availabilitySchema.safeParse({slots:[{dayOfWeek:7,startTime:'99:00',endTime:'18:00'}]}).success).toBe(false);
    expect(documentSchema.safeParse({type:'AADHAAR',objectKey:'providers/p1/id.png',mimeType:'image/png',sizeBytes:100}).success).toBe(true);
  });
  it('rejects coupons whose expiry precedes start',()=>{
    const base={code:'SAVE10',discountType:'PERCENTAGE',discountValue:10,startDate:'2026-09-26',expiryDate:'2026-10-01'};
    expect(couponSchema.safeParse(base).success).toBe(true);
    expect(couponSchema.safeParse({...base,expiryDate:'2026-09-01'}).success).toBe(false);
    expect(couponUpdateSchema.safeParse({active:false}).success).toBe(true);
  });
});
