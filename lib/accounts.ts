import {rawDb} from '@/db/raw';
import {digest,json} from '@/lib/server';

export interface Identity {id:string;name:string;created:number;username:string|null}
export function cookieToken(req:Request){return req.headers.get('cookie')?.split(';').map(x=>x.trim()).find(x=>x.startsWith('sj_session='))?.slice(11)}
export async function accountPassword(password:string,salt:string){
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveBits']);
 const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt:new TextEncoder().encode(salt),iterations:600000,hash:'SHA-256'},key,256);
 return Array.from(new Uint8Array(bits),x=>x.toString(16).padStart(2,'0')).join('');
}
export function sameHash(a:string,b:string){if(a.length!==b.length)return false;let difference=0;for(let i=0;i<a.length;i++)difference|=a.charCodeAt(i)^b.charCodeAt(i);return difference===0}
export async function authLimit(key:string){
 const now=Date.now(),cutoff=now-15*60000;
 const row=await rawDb().prepare(`INSERT INTO auth_limits (key,attempts,window_start) VALUES (?,1,?) ON CONFLICT (key) DO UPDATE SET attempts=CASE WHEN auth_limits.window_start < ? THEN 1 ELSE auth_limits.attempts+1 END,window_start=CASE WHEN auth_limits.window_start < ? THEN ? ELSE auth_limits.window_start END RETURNING attempts`).bind(await digest(key),now,cutoff,cutoff,now).first<{attempts:number}>();
 if(!row||row.attempts>8)throw Error('অনেকবার চেষ্টা হয়েছে। ১৫ মিনিট পরে আবার চেষ্টা করুন।');
}
export async function issueLogin(req:Request,id:string,remember:boolean){
 const token=crypto.randomUUID()+crypto.randomUUID(),now=Date.now();
 await rawDb().prepare('INSERT INTO login_tokens (token_hash,player_id,expires) VALUES (?,?,?)').bind(await digest(token),id,now+(remember?30*86400000:12*3600000)).run();
 const old=cookieToken(req);if(old)await rawDb().prepare('DELETE FROM login_tokens WHERE token_hash=?').bind(await digest(old)).run();
 return `sj_session=${token}; Path=/; HttpOnly; SameSite=Strict${remember?'; Max-Age=2592000':''}${new URL(req.url).protocol==='https:'?'; Secure':''}`;
}
export const guestName=()=> 'Guest_'+crypto.getRandomValues(new Uint32Array(1))[0].toString().padStart(6,'0');
export async function guest(req:Request){
 const id=crypto.randomUUID(),name=guestName();
 await rawDb().prepare('INSERT INTO sessions (id,name,created) VALUES (?,?,?)').bind(id,name,Date.now()).run();
 return json({id,name,username:null,room:null},200,{'Set-Cookie':await issueLogin(req,id,true)});
}
export async function currentRoom(id:string){
 const row=await rawDb().prepare(`SELECT code FROM rooms WHERE (state::jsonb->>'status'='playing' OR (state::jsonb->>'status'='waiting' AND COALESCE(last_active,updated)>?) OR (state::jsonb->>'status'='finished' AND COALESCE(last_active,updated)>?)) AND EXISTS (SELECT 1 FROM jsonb_array_elements(state::jsonb->'players') p WHERE p.value->>'id'=? AND COALESCE((p.value->>'left')::boolean,false)=false) ORDER BY COALESCE(last_active,updated) DESC LIMIT 1`).bind(Date.now()-2*3600000,Date.now()-86400000,id).first<{code:string}>();
 return row?.code??null;
}
