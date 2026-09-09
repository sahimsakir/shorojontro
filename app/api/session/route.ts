import {rawDb} from '@/db/raw';
import {session,json,cleanName,originCheck,rateLimit} from '@/lib/server';
import {guest,currentRoom,guestName} from '@/lib/accounts';
export async function GET(req:Request){try{
 const s=await session(req);if(!s)return guest(req);
 if(!s.username&&s.name==='Guest'){s.name=guestName();await rawDb().prepare('UPDATE sessions SET name=? WHERE id=?').bind(s.name,s.id).run();}
 return json({id:s.id,name:s.name,username:s.username,room:await currentRoom(s.id)});
}catch{ return json({error:'সংযোগ করা যায়নি। আবার চেষ্টা করুন।'},503)}}
export async function POST(req:Request){try{
 originCheck(req);const s=await session(req);if(!s)return json({error:'পাতা রিলোড করে আবার চেষ্টা করুন।'},401);
 await rateLimit(s.id);const b=await req.json() as {name?:unknown};
 const name=cleanName(b.name,20);await rawDb().prepare('UPDATE sessions SET name=? WHERE id=?').bind(name,s.id).run();
 return json({id:s.id,name,username:s.username});
}catch(e){return json({error:e instanceof Error?e.message:'নাম সংরক্ষণ করা যায়নি।'},400)}}
