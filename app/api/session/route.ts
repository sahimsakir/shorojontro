import {rawDb} from '@/db/raw';
import {session,json,cleanName,originCheck,rateLimit,digest} from '@/lib/server';
import {guest,currentRoom,guestName,cookieToken} from '@/lib/accounts';
export async function GET(req:Request){try{
 const s=await session(req);if(!s)return guest(req);
 if(!s.username&&s.name==='Guest'){s.name=guestName();await rawDb().prepare('UPDATE sessions SET name=? WHERE id=?').bind(s.name,s.id).run();}
 const token=cookieToken(req);
 const remembered=token?await rawDb().prepare('SELECT expires FROM login_tokens WHERE token_hash=? AND expires>?').bind(await digest(token),Date.now()+400*86400000).first<{expires:number}>():null;
 const extra:Record<string,string>={};
 if(remembered)extra['Set-Cookie']=`sj_session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${Math.floor((Number(remembered.expires)-Date.now())/1000)}${new URL(req.url).protocol==='https:'?'; Secure':''}`;
 return json({id:s.id,name:s.name,username:s.username,room:await currentRoom(s.id)},200,extra);
}catch{ return json({error:'সংযোগ করা যায়নি। আবার চেষ্টা করুন।'},503)}}
export async function POST(req:Request){try{
 originCheck(req);const s=await session(req);if(!s)return json({error:'পাতা রিলোড করে আবার চেষ্টা করুন।'},401);
 await rateLimit(s.id);const b=await req.json() as {name?:unknown};
 const name=cleanName(b.name,20);await rawDb().prepare('UPDATE sessions SET name=? WHERE id=?').bind(name,s.id).run();
 return json({id:s.id,name,username:s.username});
}catch(e){return json({error:e instanceof Error?e.message:'নাম সংরক্ষণ করা যায়নি।'},400)}}
