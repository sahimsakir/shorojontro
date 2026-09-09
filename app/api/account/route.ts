import {rawDb} from '@/db/raw';
import {session,json,originCheck,cleanName,digest} from '@/lib/server';
import {accountPassword,sameHash,authLimit,issueLogin,cookieToken,guest,currentRoom} from '@/lib/accounts';
export async function POST(req:Request){try{
 originCheck(req);
 const text=await req.text();if(text.length>2000)throw Error('অনুরোধটি অতিরিক্ত বড়।');
 const b=JSON.parse(text),s=await session(req);if(!s)return json({error:'পাতা রিলোড করে আবার চেষ্টা করুন।'},401);
 if(b.op==='logout'){
  const room=await currentRoom(s.id);if(room)throw Error('লগআউটের আগে রুম থেকে বের হন।');
  const token=cookieToken(req);if(token)await rawDb().prepare('DELETE FROM login_tokens WHERE token_hash=?').bind(await digest(token)).run();
  return guest(req);
 }
 if(!['login','register'].includes(b.op))throw Error('সঠিক কাজ বেছে নিন।');
 if(s.username)throw Error('আগে বর্তমান অ্যাকাউন্ট থেকে লগআউট করুন।');
 const username=typeof b.username==='string'?b.username.trim().toLowerCase():'';
 if(!/^[a-z][a-z0-9_]{2,23}$/.test(username)||username.startsWith('guest_'))throw Error('Username: ৩–২৪টি ইংরেজি ছোট অক্ষর, সংখ্যা বা _ দিন; শুরুতে অক্ষর দিন। Guest_ দিয়ে শুরু করা যাবে না।');
 await authLimit('session:'+s.id);await authLimit('username:'+username);
 if(typeof b.password!=='string'||b.password.length<8||b.password.length>128)throw Error('পাসওয়ার্ড ৮–১২৮ অক্ষরের হতে হবে।');
 if(await currentRoom(s.id))throw Error('অন্য অ্যাকাউন্টে ঢোকার আগে রুম থেকে বের হন।');
 const found=await rawDb().prepare('SELECT player_id,password_hash,salt FROM accounts WHERE username=?').bind(username).first<{player_id:string;password_hash:string;salt:string}>();
 let id=s.id;
 if(b.op==='register'){
  const name=cleanName(b.name,20),salt=crypto.randomUUID();
  if(found)throw Error('এই username ব্যবহার করা যাচ্ছে না। অন্যটি বেছে নিন।');
  const hash=await accountPassword(b.password,salt);
  const created=await rawDb().prepare('INSERT INTO accounts (username,player_id,password_hash,salt,created) VALUES (?,?,?,?,?) ON CONFLICT DO NOTHING RETURNING player_id').bind(username,id,hash,salt,Date.now()).first();
  if(!created)throw Error('অ্যাকাউন্ট তৈরি হয়নি। অন্য username দিয়ে চেষ্টা করুন।');
  await rawDb().prepare('UPDATE sessions SET name=? WHERE id=?').bind(name,id).run();
 }else{
  const computed=await accountPassword(b.password,found?.salt??'shorojontro-dummy-salt');
  if(!found||!sameHash(computed,found.password_hash))throw Error('Username অথবা password সঠিক নয়।');
  id=found.player_id;
 }
 const person=await rawDb().prepare('SELECT name FROM sessions WHERE id=?').bind(id).first<{name:string}>();
 return json({id,name:person!.name,username,room:await currentRoom(id)},200,{'Set-Cookie':await issueLogin(req,id,b.remember===true)});
}catch(e){return json({error:e instanceof Error&&!('code' in e)?e.message:'অ্যাকাউন্টে সংযোগ করা যায়নি। আবার চেষ্টা করুন।'},400)}}
