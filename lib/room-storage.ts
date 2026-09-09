import {rawDb} from '@/db/raw';
import type {Game} from '@/lib/game/engine';
export const WAITING_TTL=2*3600000,FINISHED_TTL=24*3600000;
export function roomExpired(row:{state:string;updated:number;last_active?:number|null},now=Date.now()){
 const g=JSON.parse(row.state) as Game;
 return g.status!=='playing'&&Number(row.last_active??row.updated)<now-(g.status==='waiting'?WAITING_TTL:FINISHED_TTL);
}
export async function touchRoom(code:string){const now=Date.now();await rawDb().prepare('UPDATE rooms SET last_active=? WHERE code=? AND COALESCE(last_active,updated)<?').bind(now,code,now-60000).run()}
export async function cleanAbandonedRooms(now=Date.now()){
 // Database lease bounds cleanup across instances; playing rooms are never deleted.
 const lease=await rawDb().prepare("UPDATE maintenance SET last_run=? WHERE name='rooms' AND last_run<? RETURNING name").bind(now,now-5*60000).first();if(!lease)return;
 await rawDb().prepare(`DELETE FROM rooms WHERE (state::jsonb->>'status'='waiting' AND COALESCE(last_active,updated)<?) OR (state::jsonb->>'status'='finished' AND COALESCE(last_active,updated)<?)`).bind(now-WAITING_TTL,now-FINISHED_TTL).run();
 await rawDb().prepare('DELETE FROM login_tokens WHERE expires<?').bind(now).run();
 await rawDb().prepare('DELETE FROM auth_limits WHERE window_start<?').bind(now-86400000).run();
}
export async function saveGame(g:Game,rev:number){
 g.revision=rev+1;g.updated=Date.now();
 const results=g.status==='finished'&&g.roundId&&g.roundMetrics?Object.entries(g.roundMetrics).map(([id,m])=>({round_id:g.roundId,player_id:id,room_code:g.code,won:g.winner===id?1:0,bluffs:m.bluffs,challenges:m.challenges,challenge_wins:m.challengeWins,finished:g.updated})):[];
 // Persist the game and its result ledger in ONE statement. A stale move cannot
 // write statistics, and repeat polls/rematches cannot double-count a round.
 const saved=await rawDb().prepare(`WITH saved AS (
 UPDATE rooms SET state=?,revision=?,updated=?,last_active=? WHERE code=? AND revision=? RETURNING code
 ), recorded AS (
 INSERT INTO player_results (round_id,player_id,room_code,won,bluffs,challenges,challenge_wins,finished)
 SELECT r.round_id,r.player_id,r.room_code,r.won,r.bluffs,r.challenges,r.challenge_wins,r.finished
 FROM jsonb_to_recordset(?::jsonb) AS r(round_id text,player_id text,room_code text,won integer,bluffs integer,challenges integer,challenge_wins integer,finished bigint),saved
 ON CONFLICT (round_id,player_id) DO NOTHING RETURNING player_id
 ) SELECT COUNT(*)::int AS changes FROM saved`).bind(JSON.stringify(g),g.revision,g.updated,g.updated,g.code,rev,JSON.stringify(results)).first<{changes:number}>();
 return {meta:{changes:saved?.changes??0}};
}
