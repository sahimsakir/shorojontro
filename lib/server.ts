import { rawDb } from '@/db/raw';
export const headers={'Cache-Control':'no-store, private','X-Content-Type-Options':'nosniff'};
export function json(data:unknown,status=200,extra:Record<string,string>={}){return Response.json(data,{status,headers:{...headers,...extra}})}
export async function digest(s:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))).map(x=>x.toString(16).padStart(2,'0')).join('')}
export async function session(req:Request){
 const token=req.headers.get('cookie')?.split(';').map(x=>x.trim()).find(x=>x.startsWith('sj_session='))?.slice(11);if(!token||token.length>200)return null;
 const hash=await digest(token);
 const identity=await rawDb().prepare('SELECT s.id,s.name,s.created,a.username FROM login_tokens t JOIN sessions s ON s.id=t.player_id LEFT JOIN accounts a ON a.player_id=s.id WHERE t.token_hash=? AND t.expires>?').bind(hash,Date.now()).first<{id:string;name:string;created:number;username:string|null}>();
 if(identity)return identity;
 // Keep pre-account guest cookies working, but never use them to access an account.
 return rawDb().prepare('SELECT id,name,created,NULL AS username FROM sessions WHERE id=? AND created>? AND NOT EXISTS (SELECT 1 FROM accounts WHERE player_id=sessions.id)').bind(hash,Date.now()-30*86400000).first<{id:string;name:string;created:number;username:string|null}>();
}
export function originCheck(req:Request){const origin=req.headers.get('origin');const requestOrigin=new URL(req.url).origin;const allowedProxy=origin==='https://shorojontro-nine.vercel.app';if(origin&&origin!==requestOrigin&&!allowedProxy)throw Error('অনুরোধটি খেলার পাতা থেকে আসেনি।');if(!req.headers.get('content-type')?.includes('application/json'))throw Error('সঠিক খেলার অনুরোধ প্রয়োজন।');}
export async function rateLimit(id:string){const now=Date.now();const row=await rawDb().prepare('UPDATE sessions SET attempts = CASE WHEN window_start < ? THEN 1 ELSE attempts + 1 END, window_start = CASE WHEN window_start < ? THEN ? ELSE window_start END WHERE id = ? RETURNING attempts').bind(now-60000,now-60000,now,id).first<{attempts:number}>();if(!row||row.attempts>60)throw Error('অনেক অনুরোধ হয়েছে। এক মিনিট অপেক্ষা করুন।');}
export function cleanName(v:unknown,max=28){if(typeof v!=='string')throw Error('একটি নাম লিখুন।');const s=v.trim().replace(/[\u0000-\u001f\u007f]/g,'').slice(0,max);if(s.length<2)throw Error('নামে অন্তত ২টি অক্ষর লিখুন।');return s;}
export async function passwordHash(password:string,salt:string){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt:new TextEncoder().encode(salt),iterations:100000,hash:'SHA-256'},key,256);return Array.from(new Uint8Array(bits)).map(x=>x.toString(16).padStart(2,'0')).join('')}
