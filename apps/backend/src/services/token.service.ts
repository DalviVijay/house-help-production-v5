import {SignJWT} from 'jose'; import {createHash,randomBytes} from 'node:crypto'; import {env} from '../config/env.js';
const key=(v:string)=>new TextEncoder().encode(v); export const hashToken=(v:string)=>createHash('sha256').update(v).digest('hex');
export async function issueAccessToken(userId:string,role:string){return new SignJWT({role}).setProtectedHeader({alg:'HS256'}).setSubject(userId).setIssuedAt().setExpirationTime('15m').sign(key(env.JWT_SECRET))}
export const newRefreshToken=()=>randomBytes(48).toString('base64url');
