import {rawDb} from '@/db/raw';
import {session,json} from '@/lib/server';
export async function GET(req:Request){try{
 const s=await session(req);if(!s)return json({error:'আগে সংযোগ করুন।'},401);
 const stats=await rawDb().prepare('SELECT COUNT(*)::int AS games,COALESCE(SUM(won),0)::int AS wins,COALESCE(SUM(bluffs),0)::int AS bluffs,COALESCE(SUM(challenges),0)::int AS challenges,COALESCE(SUM(challenge_wins),0)::int AS "challengeWins" FROM player_results WHERE player_id=?').bind(s.id).first();
 return json({id:s.id,name:s.name,username:s.username,created:Number(s.created),stats});
}catch{return json({error:'পরিসংখ্যান আনা যায়নি। আবার চেষ্টা করুন।'},503)}}
