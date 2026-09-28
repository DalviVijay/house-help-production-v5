import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');const bad=[];
const exists=p=>fs.existsSync(path.join(root,p));
for(const p of ['package-lock.json','apps/backend/prisma/migrations','apps/backend/src/routes/account.routes.ts','apps/admin-panel/app/delete-account/page.tsx','docs/legal/PRIVACY_POLICY.md','docs/legal/TERMS.md'])if(!exists(p))bad.push(`missing ${p}`);
for(const app of ['customer-app','provider-app']){const pkg=JSON.parse(fs.readFileSync(path.join(root,'apps',app,'package.json'),'utf8'));if(/^[~^]?52\./.test(pkg.dependencies?.expo??''))bad.push(`${app}: Expo SDK 52 must be upgraded and verified for current stores`);const cfg=fs.readFileSync(path.join(root,'apps',app,'app.config.ts'),'utf8');if(cfg.includes('{{https://'))bad.push(`${app}: invalid OTA URL`)}
const env=fs.readFileSync(path.join(root,'.env.production.example'),'utf8');if(/SMS_PROVIDER=console/.test(env))bad.push('production console SMS');if(!/FCM_ENABLED=true/.test(env))bad.push('production push disabled');
if(bad.length){console.error('STORE READINESS: FAIL\n'+bad.map(x=>'- '+x).join('\n'));process.exit(1)}console.log('STORE READINESS STATIC GATE: PASS — continue with signed builds, real-device QA and store review');
