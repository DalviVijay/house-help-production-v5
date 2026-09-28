import { describe, expect, it } from 'vitest';

type Candidate={verified:boolean;service:boolean;area:boolean;available:boolean;overlap:boolean;rating:number;jobs:number};
const eligible=(x:Candidate)=>x.verified&&x.service&&x.area&&x.available&&!x.overlap;
const rank=(a:Candidate,b:Candidate)=>b.rating-a.rating||b.jobs-a.jobs;

describe('provider assignment policy',()=>{
  it('excludes unverified and overlapping providers',()=>{expect(eligible({verified:false,service:true,area:true,available:true,overlap:false,rating:5,jobs:10})).toBe(false);expect(eligible({verified:true,service:true,area:true,available:true,overlap:true,rating:5,jobs:10})).toBe(false)});
  it('prefers rating then completed-job experience',()=>{const candidates=[{verified:true,service:true,area:true,available:true,overlap:false,rating:4.6,jobs:80},{verified:true,service:true,area:true,available:true,overlap:false,rating:4.9,jobs:20}];expect(candidates.sort(rank)[0]?.rating).toBe(4.9)});
});
